"""
ML Pipeline for CPCB India Water Quality Data.
Handles real-world dataset: Min/Max columns, BDL values, categorical columns.
Engineers a quality target from established water quality standards.
"""
import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../../models")

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _clean_numeric(val):
    """Replace BDL / '-' / empty with NaN; otherwise return float."""
    if pd.isna(val):
        return np.nan
    s = str(val).strip().upper()
    if s in ("BDL", "-", "", "NA", "N/A"):
        return 0.0        # Below Detection Limit → treat as 0
    try:
        return float(s)
    except ValueError:
        return np.nan


# ──────────────────────────────────────────────────────────────────────────────
# Dataset Loader & Feature Engineering
# ──────────────────────────────────────────────────────────────────────────────

def load_and_prepare(path: str) -> pd.DataFrame:
    """Load the CPCB TSV dataset and return a clean, engineered DataFrame."""
    df = pd.read_csv(path, sep="\t", dtype=str, encoding="utf-8")
    df.columns = [c.strip() for c in df.columns]

    # --- Identify numeric min/max column pairs ---
    num_cols = [c for c in df.columns if " - Min" in c or " - Max" in c]
    for c in num_cols:
        df[c] = df[c].apply(_clean_numeric)

    # --- Average Min/Max into single feature ---
    param_names = set()
    for c in num_cols:
        base = c.replace(" - Min", "").replace(" - Max", "").strip()
        param_names.add(base)

    features = {}
    for base in sorted(param_names):
        min_col = f"{base} - Min"
        max_col = f"{base} - Max"
        if min_col in df.columns and max_col in df.columns:
            features[base] = df[[min_col, max_col]].mean(axis=1)
        elif min_col in df.columns:
            features[base] = df[min_col]
        else:
            features[base] = df[max_col]

    feat_df = pd.DataFrame(features)

    # Rename columns to clean names
    rename = {
        "Temperature (C)": "Temperature",
        "Dissolved": "Dissolved_Oxygen",
        "Conductivity (µmho/cm)": "Conductivity",
        "BOD (mg/L)": "BOD",
        "NitrateN (mg/L)": "NitrateN",
        "Fecal Coliform (MPN/100ml)": "Fecal_Coliform",
        "Total Coliform (MPN/100ml)": "Total_Coliform",
        "Fecal": "Fecal_Strep",
    }
    feat_df = feat_df.rename(columns={k: v for k, v in rename.items() if k in feat_df.columns})

    # Keep categorical context
    for cat in ["Type Water Body", "State Name", "Year"]:
        if cat in df.columns:
            feat_df[cat] = df[cat].str.strip()

    feat_df["Monitoring_Location"] = df.get("Monitoring Location", pd.Series()).str.strip()

    # ── Engineer target: Water Quality Class ────────────────────────────────
    # Based on CPCB Class-C freshwater standards (suitable for bathing):
    #   DO >= 4 mg/L, BOD <= 3 mg/L, pH 6.5-8.5, Fecal_Coliform <= 500 MPN/100ml
    #   Class A (excellent) → DO >= 6, BOD <= 2, pH 6.5-8.5, FC <= 50
    #   Class B (good)      → DO >= 5, BOD <= 3, pH 6.5-8.5, FC <= 500
    #   Class C (moderate)  → DO >= 4, BOD <= 6, FC <= 5000
    #   Class D/E (poor)    → below C thresholds

    do  = feat_df.get("Dissolved_Oxygen", pd.Series(np.nan, index=feat_df.index))
    bod = feat_df.get("BOD", pd.Series(np.nan, index=feat_df.index))
    ph  = feat_df.get("pH - Min", pd.Series(np.nan, index=feat_df.index))
    fc  = feat_df.get("Fecal_Coliform", pd.Series(np.nan, index=feat_df.index))

    # Use available pH columns
    if "pH - Min" not in feat_df.columns:
        ph_min_col = "pH - Min"
        ph_max_col = "pH - Max"
        if ph_min_col in df.columns:
            ph = df[ph_min_col].apply(_clean_numeric)
        elif "pH" in feat_df.columns:
            ph = feat_df["pH"]

    def classify(row):
        d   = row.get("Dissolved_Oxygen", np.nan)
        b   = row.get("BOD", np.nan)
        f   = row.get("Fecal_Coliform", np.nan)
        # Get pH from averaged column
        p   = row.get("pH", np.nan)

        # If too many values missing, mark unknown
        known = sum(not np.isnan(v) for v in [d, b, f, p] if isinstance(v, float) or isinstance(v, int))
        if known == 0:
            return np.nan

        good_do  = (np.isnan(d) or d >= 4.0)
        good_bod = (np.isnan(b) or b <= 6.0)
        good_ph  = (np.isnan(p) or (p >= 6.0 and p <= 9.0))
        good_fc  = (np.isnan(f) or f <= 5000)

        if good_do and good_bod and good_ph and good_fc:
            # Distinguish good vs acceptable
            if (np.isnan(d) or d >= 5.0) and (np.isnan(b) or b <= 3.0) and (np.isnan(f) or f <= 500):
                return 1   # Good quality
            return 1       # Acceptable (still class C or better)
        return 0           # Poor quality (class D/E)

    feat_df["Water_Quality"] = feat_df.apply(classify, axis=1)

    # Drop rows with no target
    feat_df = feat_df.dropna(subset=["Water_Quality"])
    feat_df["Water_Quality"] = feat_df["Water_Quality"].astype(int)

    return feat_df


def get_feature_columns(df: pd.DataFrame):
    exclude = {"Water_Quality", "Type Water Body", "State Name", "Year",
               "Monitoring_Location"}
    return [c for c in df.columns if c not in exclude and df[c].dtype != object]


# ──────────────────────────────────────────────────────────────────────────────
# Pipeline Class
# ──────────────────────────────────────────────────────────────────────────────

class MLPipeline:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df_raw = None
        self.df = None
        self.features = []
        self.target = "Water_Quality"

    # ── Public: inspect raw dataset ────────────────────────────────────────

    def load_and_validate(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found: {self.data_path}")

        self.df_raw = pd.read_csv(self.data_path, sep="\t", dtype=str, encoding="utf-8")
        self.df_raw.columns = [c.strip() for c in self.df_raw.columns]

        self.df = load_and_prepare(self.data_path)
        self.features = get_feature_columns(self.df)

        raw_cols = list(self.df_raw.columns)
        missing_per_col = {}
        for c in self.df_raw.columns:
            n = self.df_raw[c].apply(
                lambda x: str(x).strip().upper() in ("", "NAN", "BDL", "-", "NA")
            ).sum()
            missing_per_col[c] = int(n)

        class_dist = self.df[self.target].value_counts().to_dict()

        return {
            "filename": os.path.basename(self.data_path),
            "rows": len(self.df_raw),
            "columns": len(raw_cols),
            "column_names": raw_cols,
            "engineered_features": self.features,
            "target_column": self.target,
            "target_labels": {0: "Poor Quality", 1: "Good Quality"},
            "class_distribution": {str(k): int(v) for k, v in class_dist.items()},
            "missing_values_raw": missing_per_col,
            "total_missing": sum(missing_per_col.values()),
            "engineered_rows": len(self.df),
            "water_body_types": list(self.df_raw["Type Water Body"].dropna().unique()) if "Type Water Body" in self.df_raw.columns else [],
            "states": list(self.df_raw["State Name"].dropna().unique()) if "State Name" in self.df_raw.columns else [],
        }

    # ── Internal: metrics helper ────────────────────────────────────────────

    def _get_metrics(self, y_true, y_pred):
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        return {
            "accuracy":  float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall":    float(recall_score(y_true, y_pred, zero_division=0)),
            "f1":        float(f1_score(y_true, y_pred, zero_division=0)),
            "poor_recall": float(recall_score(y_true, y_pred, pos_label=0, zero_division=0)),
            "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        }

    # ── Train baseline ──────────────────────────────────────────────────────

    def train_baseline(self):
        if self.df is None:
            self.load_and_validate()

        X = self.df[self.features]
        y = self.df[self.target]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        imputer = SimpleImputer(strategy="median")
        X_train_imp = imputer.fit_transform(X_train)
        X_test_imp  = imputer.transform(X_test)

        param_grid = {
            "criterion":          ["gini", "entropy"],
            "max_depth":          [None, 3, 5, 8, 12],
            "min_samples_split":  [2, 5, 10],
            "min_samples_leaf":   [1, 2, 4],
        }

        cv = StratifiedKFold(n_splits=min(5, y_train.value_counts().min()), shuffle=True, random_state=42)
        grid = GridSearchCV(
            DecisionTreeClassifier(random_state=42),
            param_grid, cv=cv, scoring="f1", n_jobs=-1
        )
        grid.fit(X_train_imp, y_train)

        best_model = grid.best_estimator_
        y_pred = best_model.predict(X_test_imp)
        metrics = self._get_metrics(y_test, y_pred)

        # Feature importances
        importances = {
            self.features[i]: float(best_model.feature_importances_[i])
            for i in range(len(self.features))
        }

        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(best_model, os.path.join(MODEL_DIR, "baseline_dt.joblib"))
        joblib.dump(imputer,    os.path.join(MODEL_DIR, "baseline_imputer.joblib"))
        joblib.dump(self.features, os.path.join(MODEL_DIR, "feature_names.joblib"))

        return {
            "best_parameters":     grid.best_params_,
            "cv_score":            float(grid.best_score_),
            "metrics":             metrics,
            "feature_importances": importances,
        }

    # ── Missing-data experiments ────────────────────────────────────────────

    def simulate_missing_and_evaluate(self, missing_rate: float = 0.2):
        if self.df is None:
            self.load_and_validate()

        X = self.df[self.features].copy()
        y = self.df[self.target].copy()

        np.random.seed(42)
        mask = np.random.rand(*X.shape) < missing_rate
        X_miss = X.mask(mask)

        X_train, X_test, y_train, y_test = train_test_split(
            X_miss, y, test_size=0.2, stratify=y, random_state=42
        )

        results = {}

        # 1. Median
        imp_med = SimpleImputer(strategy="median")
        Xtr_m = imp_med.fit_transform(X_train)
        Xte_m = imp_med.transform(X_test)
        m = DecisionTreeClassifier(max_depth=5, random_state=42)
        m.fit(Xtr_m, y_train)
        r = self._get_metrics(y_test, m.predict(Xte_m))
        r["rows_retained"] = int(len(X_train))
        r["data_retention_pct"] = round(100 * len(X_train) / len(X), 1)
        results["Median"] = r

        # 2. KNN
        imp_knn = KNNImputer(n_neighbors=5)
        Xtr_k = imp_knn.fit_transform(X_train)
        Xte_k = imp_knn.transform(X_test)
        k = DecisionTreeClassifier(max_depth=5, random_state=42)
        k.fit(Xtr_k, y_train)
        r = self._get_metrics(y_test, k.predict(Xte_k))
        r["rows_retained"] = int(len(X_train))
        r["data_retention_pct"] = round(100 * len(X_train) / len(X), 1)
        results["KNN"] = r

        # 3. Row Deletion
        train_df = pd.concat([X_train, y_train], axis=1).dropna()
        test_df  = pd.concat([X_test,  y_test],  axis=1).dropna()
        if len(train_df) > 5 and len(test_df) > 2:
            Xtr_d = train_df[self.features]
            ytr_d = train_df[self.target]
            Xte_d = test_df[self.features]
            yte_d = test_df[self.target]
            d = DecisionTreeClassifier(max_depth=5, random_state=42)
            d.fit(Xtr_d, ytr_d)
            r = self._get_metrics(yte_d, d.predict(Xte_d))
            r["rows_retained"] = int(len(train_df))
            r["data_retention_pct"] = round(100 * len(train_df) / len(X), 1)
            results["Deletion"] = r
        else:
            results["Deletion"] = None

        recommendation = self._recommend(results, len(X))

        return {
            "missing_rate": missing_rate,
            "results":      results,
            "recommendation": recommendation,
        }

    # ── Recommendation engine ───────────────────────────────────────────────

    def _recommend(self, results: dict, total_rows: int):
        scores = {}
        for method, res in results.items():
            if res is None:
                continue
            # Weighted: F1 × 0.4 + poor_recall × 0.5 + retention bonus × 0.1
            retention = res["rows_retained"] / total_rows
            score = res["f1"] * 0.4 + res["poor_recall"] * 0.5 + retention * 0.1
            scores[method] = score

        if not scores:
            return {"method": "None", "reason": "Insufficient data for evaluation."}

        best = max(scores, key=scores.get)
        r = results[best]
        reason = (
            f"Maintained strong poor-quality recall ({r['poor_recall']:.2f}) "
            f"and F1 ({r['f1']:.2f}) while retaining {r['rows_retained']} training samples "
            f"({r['data_retention_pct']}% of data)."
        )
        return {"method": best, "reason": reason, "scores": {k: round(v, 4) for k, v in scores.items()}}

    # ── Predict single sample ───────────────────────────────────────────────

    def predict_sample(self, feature_values: dict):
        model_path   = os.path.join(MODEL_DIR, "baseline_dt.joblib")
        imputer_path = os.path.join(MODEL_DIR, "baseline_imputer.joblib")
        feat_path    = os.path.join(MODEL_DIR, "feature_names.joblib")

        if not os.path.exists(model_path):
            raise RuntimeError("Model not trained yet. Call /api/models/train first.")

        model    = joblib.load(model_path)
        imputer  = joblib.load(imputer_path)
        feat_names = joblib.load(feat_path)

        row = [feature_values.get(f, np.nan) for f in feat_names]
        X = np.array(row).reshape(1, -1)
        X_imp = imputer.transform(X)

        pred = int(model.predict(X_imp)[0])
        proba = model.predict_proba(X_imp)[0].tolist()
        label = "Good Quality" if pred == 1 else "Poor Quality"

        # Feature importances
        importances = {
            feat_names[i]: float(model.feature_importances_[i])
            for i in range(len(feat_names))
        }

        # Decision path text
        decision_path = export_text(model, feature_names=feat_names, max_depth=4)

        return {
            "prediction":  pred,
            "label":       label,
            "probability": {
                "Poor Quality": round(proba[0], 4) if len(proba) > 1 else round(1 - proba[0], 4),
                "Good Quality": round(proba[1], 4) if len(proba) > 1 else round(proba[0], 4),
            },
            "feature_importances": importances,
            "decision_path_text": decision_path[:3000],  # limit size
        }


# ──────────────────────────────────────────────────────────────────────────────
# Singleton
# ──────────────────────────────────────────────────────────────────────────────

_pipeline: MLPipeline | None = None


def get_pipeline(data_path: str | None = None) -> MLPipeline:
    global _pipeline
    if _pipeline is None:
        if data_path is None:
            raise RuntimeError("Pipeline not initialized and no data_path provided.")
        _pipeline = MLPipeline(data_path)
    return _pipeline
