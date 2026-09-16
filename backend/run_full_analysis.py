import sys
import os
import json
import pandas as pd
import numpy as np

# Ensure backend directory is in path
sys.path.append(os.path.abspath("p:/ml project/waterguard-ai/backend"))

from app.ml.pipeline import load_and_prepare, get_feature_columns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

DATA_PATH = "p:/ml project/waterguard-ai/data/dataset.csv"

def run_analysis():
    print("=" * 70)
    print("AQUORA SCIENTIFIC ANALYSIS: 9-STAGE EMPIRICAL INVESTIGATION")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. IDENTIFY MISSING VALUES
    # -------------------------------------------------------------
    df_raw = pd.read_csv(DATA_PATH, sep="\t", dtype=str, encoding="utf-8")
    df_raw.columns = [c.strip() for c in df_raw.columns]
    
    print("\n--- STAGE 1: IDENTIFY MISSING VALUES IN RAW DATASET ---")
    print(f"Total Raw Rows: {len(df_raw)}, Total Columns: {len(df_raw.columns)}")
    
    raw_missing = {}
    for c in df_raw.columns:
        n = df_raw[c].apply(lambda x: str(x).strip().upper() in ("", "NAN", "BDL", "-", "NA") or pd.isna(x)).sum()
        raw_missing[c] = int(n)
        pct = (n / len(df_raw)) * 100
        print(f"  - {c:40s}: {n:3d} missing ({pct:5.1f}%)")
        
    total_raw_missing = sum(raw_missing.values())
    print(f"Total Missing Field Values: {total_raw_missing}")

    # Load engineered dataset
    df = load_and_prepare(DATA_PATH)
    features = get_feature_columns(df)
    target = "Water_Quality"
    
    print("\n--- ENGINEERED DATASET PROFILE ---")
    print(f"Engineered Rows: {len(df)}")
    print(f"Features ({len(features)}): {features}")
    class_counts = df[target].value_counts().to_dict()
    print(f"Class Distribution: Good Quality (1): {class_counts.get(1, 0)} ({class_counts.get(1, 0)/len(df)*100:.1f}%), Poor Quality (0): {class_counts.get(0, 0)} ({class_counts.get(0, 0)/len(df)*100:.1f}%)")

    # -------------------------------------------------------------
    # 2. ESTABLISH BASELINE MODEL
    # -------------------------------------------------------------
    print("\n--- STAGE 2: BASELINE MODEL (GridSearchCV Decision Tree) ---")
    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    # Baseline imputer for training data
    base_imputer = SimpleImputer(strategy="median")
    X_train_imp = base_imputer.fit_transform(X_train)
    X_test_imp = base_imputer.transform(X_test)

    param_grid = {
        "criterion": ["gini", "entropy"],
        "max_depth": [None, 3, 5, 8],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
    }

    cv = StratifiedKFold(n_splits=min(5, y_train.value_counts().min()), shuffle=True, random_state=42)
    grid = GridSearchCV(DecisionTreeClassifier(random_state=42), param_grid, cv=cv, scoring="f1", n_jobs=-1)
    grid.fit(X_train_imp, y_train)

    best_dt = grid.best_estimator_
    y_pred_baseline = best_dt.predict(X_test_imp)

    def compute_metrics(y_true, y_pred):
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "unsafe_recall": float(recall_score(y_true, y_pred, pos_label=0, zero_division=0)),
            "cm": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)}
        }

    base_metrics = compute_metrics(y_test, y_pred_baseline)
    print(f"Best Hyperparameters: {grid.best_params_}")
    print(f"CV F1-Score: {grid.best_score_:.4f}")
    print(f"Baseline Test Accuracy: {base_metrics['accuracy']:.4f}")
    print(f"Baseline Test F1: {base_metrics['f1']:.4f}")
    print(f"Baseline Poor/Unsafe Recall: {base_metrics['unsafe_recall']:.4f}")
    print(f"Confusion Matrix: {base_metrics['cm']}")

    # -------------------------------------------------------------
    # 3, 4, 5, 6: SIMULATE MISSINGNESS, APPLY TREATMENTS, EVALUATE
    # -------------------------------------------------------------
    print("\n--- STAGES 3, 4, 5, 6: MISSING DATA SIMULATION & COMPARISON ---")
    missing_levels = [0.10, 0.20, 0.30]
    methods = ["Median", "KNN", "Deletion"]
    all_results = {}
    prediction_records = {i: {"actual": int(y_test.iloc[i]), "baseline": int(y_pred_baseline[i])} for i in range(len(y_test))}

    for lvl in missing_levels:
        lvl_str = f"{int(lvl*100)}%"
        print(f"\n>>> Simulating {lvl_str} Missing Data (random_state=42) <<<")
        
        # Inject missingness only into features of X_train and X_test
        np.random.seed(42)
        X_train_miss = X_train.copy()
        mask_train = np.random.rand(*X_train.shape) < lvl
        X_train_miss = X_train_miss.mask(mask_train)

        X_test_miss = X_test.copy()
        mask_test = np.random.rand(*X_test.shape) < lvl
        X_test_miss = X_test_miss.mask(mask_test)

        lvl_res = {}

        # Method 1: Median
        imp_med = SimpleImputer(strategy="median")
        Xtr_m = imp_med.fit_transform(X_train_miss)
        Xte_m = imp_med.transform(X_test_miss)
        m_dt = DecisionTreeClassifier(random_state=42, **grid.best_params_)
        m_dt.fit(Xtr_m, y_train)
        pred_med = m_dt.predict(Xte_m)
        m_metrics = compute_metrics(y_test, pred_med)
        m_metrics["retention"] = len(X_train)
        m_metrics["retention_pct"] = 100.0
        lvl_res["Median"] = m_metrics

        # Method 2: KNN
        imp_knn = KNNImputer(n_neighbors=5)
        Xtr_k = imp_knn.fit_transform(X_train_miss)
        Xte_k = imp_knn.transform(X_test_miss)
        k_dt = DecisionTreeClassifier(random_state=42, **grid.best_params_)
        k_dt.fit(Xtr_k, y_train)
        pred_knn = k_dt.predict(Xte_k)
        k_metrics = compute_metrics(y_test, pred_knn)
        k_metrics["retention"] = len(X_train)
        k_metrics["retention_pct"] = 100.0
        lvl_res["KNN"] = k_metrics

        # Method 3: Listwise Deletion
        train_clean = pd.concat([X_train_miss, y_train], axis=1).dropna()
        if len(train_clean) > 5:
            Xtr_d = train_clean[features]
            ytr_d = train_clean[target]
            d_dt = DecisionTreeClassifier(random_state=42, **grid.best_params_)
            d_dt.fit(Xtr_d, ytr_d)
            
            # For testing, evaluate on the full test set using median imputation as fallback or evaluate on complete test cases
            # To evaluate prediction changes on the identical test set, we test with median-filled test data
            pred_del = d_dt.predict(Xte_m)
            d_metrics = compute_metrics(y_test, pred_del)
            d_metrics["retention"] = len(train_clean)
            d_metrics["retention_pct"] = round(100 * len(train_clean) / len(X_train), 1)
            lvl_res["Deletion"] = d_metrics
        else:
            pred_del = np.zeros(len(y_test))
            lvl_res["Deletion"] = None

        all_results[lvl_str] = lvl_res

        # Store predictions for flip analysis at 20%
        if lvl == 0.20:
            for i in range(len(y_test)):
                prediction_records[i]["Median_20"] = int(pred_med[i])
                prediction_records[i]["KNN_20"] = int(pred_knn[i])
                prediction_records[i]["Deletion_20"] = int(pred_del[i])

        print(f"{'Method':<12} | {'Retention':<12} | {'Accuracy':<10} | {'F1':<10} | {'Unsafe Recall':<14} | {'Confusion Matrix'}")
        print("-" * 75)
        for meth in ["Median", "KNN", "Deletion"]:
            res = lvl_res[meth]
            if res:
                print(f"{meth:<12} | {res['retention']:<3d} ({res['retention_pct']:5.1f}%) | {res['accuracy']:<10.4f} | {res['f1']:<10.4f} | {res['unsafe_recall']:<14.4f} | {res['cm']}")

    # -------------------------------------------------------------
    # 7. IDENTIFY SAMPLES WHOSE PREDICTIONS CHANGE
    # -------------------------------------------------------------
    print("\n--- STAGE 7: SAMPLES WHOSE PREDICTIONS CHANGED (At 20% Missingness) ---")
    flips = []
    for i, rec in prediction_records.items():
        base = rec["baseline"]
        med = rec["Median_20"]
        knn = rec["KNN_20"]
        del_p = rec["Deletion_20"]
        changed = (med != base) or (knn != base) or (del_p != base)
        if changed:
            flips.append({
                "index": i,
                "actual": rec["actual"],
                "baseline": base,
                "Median": med,
                "KNN": knn,
                "Deletion": del_p
            })

    print(f"Total Test Samples: {len(y_test)}")
    print(f"Samples with Changed Prediction: {len(flips)} ({(len(flips)/len(y_test))*100:.1f}% Flip Rate)")
    print(f"{'Sample #':<10} | {'Actual':<10} | {'Baseline':<10} | {'Median':<10} | {'KNN':<10} | {'Deletion'}")
    print("-" * 65)
    for f in flips:
        print(f"{f['index']:<10} | {f['actual']:<10} | {f['baseline']:<10} | {f['Median']:<10} | {f['KNN']:<10} | {f['Deletion']}")

    return {
        "raw_missing": raw_missing,
        "total_raw_missing": total_raw_missing,
        "base_metrics": base_metrics,
        "all_results": all_results,
        "flips": flips,
        "total_test": len(y_test)
    }

if __name__ == "__main__":
    out = run_analysis()
