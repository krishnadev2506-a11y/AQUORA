# AQUORA Backend

FastAPI service for the AQUORA water-quality intelligence platform. This document explains **every calculation, formula, and design decision** in the ML pipeline — written for our CPCB river-monitoring dataset and AQUORA's goal of detecting unsafe water even when sensor data is incomplete.

---

## Table of Contents

1. [AQUORA Idea & Dataset](#1-aquora-idea--dataset)
2. [Stage 1 — Raw Data Cleaning](#2-stage-1--raw-data-cleaning)
3. [Stage 2 — Feature Engineering](#3-stage-2--feature-engineering)
4. [Stage 3 — Target Label (Good vs Poor Quality)](#4-stage-3--target-label-good-vs-poor-quality)
5. [Stage 4 — Train/Test Split](#5-stage-4--traintest-split)
6. [Stage 5 — Missing Value Imputation](#6-stage-5--missing-value-imputation)
7. [Stage 6 — Decision Tree Classifier](#7-stage-6--decision-tree-classifier)
8. [Stage 7 — Hyperparameter Tuning (GridSearchCV)](#8-stage-7--hyperparameter-tuning-gridsearchcv)
9. [Stage 8 — Evaluation Metrics](#9-stage-8--evaluation-metrics)
10. [Stage 9 — Missing-Data Experiments](#10-stage-9--missing-data-experiments)
11. [Stage 10 — Recommendation Engine](#11-stage-10--recommendation-engine)
12. [Stage 11 — Live Prediction Flow](#12-stage-11--live-prediction-flow)
13. [Setup & API Reference](#13-setup--api-reference)

---

## 1. AQUORA Idea & Dataset

**Problem:** Real water-monitoring stations (rivers, dams, lakes across India) report readings with gaps — empty cells, `BDL` (Below Detection Limit), `-`, `NA`. If we drop too much data or fill values badly, we may **miss poor-quality (unsafe) water**.

**Our dataset:** `../data/dataset.csv` — CPCB-style tab-separated monitoring records from Indian rivers (Jharkhand, Himachal Pradesh, Uttarakhand, etc.) with columns like:

| Raw column pattern | Example |
|--------------------|---------|
| `Temperature (C) - Min` / `- Max` | 12 / 29 |
| `Dissolved - Min` / `- Max` | 3.3 / 5.2 (Dissolved Oxygen, mg/L) |
| `pH - Min` / `- Max` | 6.5 / 6.6 |
| `BOD (mg/L) - Min` / `- Max` | 2 / 2.9 |
| `Fecal Coliform (MPN/100ml) - Min` / `- Max` | 2 / 33 |

**After engineering:** 162 usable rows, **9 numeric features**, binary target `Water_Quality`:

```
Features: BOD, Conductivity, Dissolved_Oxygen, Fecal_Strep, Fecal_Coliform,
          NitrateN, Temperature, Total_Coliform, pH

Class distribution: Good Quality (1) = 143,  Poor Quality (0) = 19
```

**AQUORA pipeline goal:**

```text
Raw CPCB TSV  →  Clean & engineer features  →  Label Good/Poor
       →  Train Decision Tree  →  Test imputation strategies (Median / KNN / Deletion)
       →  Pick best strategy for safety (high recall on Poor Quality)
       →  Serve predictions via API
```

> **Note on MSE:** This project is **classification** (Good vs Poor), not regression (predicting exact pH or BOD). We therefore use **Accuracy, Precision, Recall, F1, and Confusion Matrix** — not Mean Squared Error (MSE). MSE would apply if we predicted continuous values, e.g. `MSE = (1/n) Σ (y_true - y_pred)²`. KNN imputation internally uses **Euclidean distance** between samples (explained in Section 6), which is related to error geometry but is not the same as reporting MSE.

---

## 2. Stage 1 — Raw Data Cleaning

**Code:** `_clean_numeric()` in `app/ml/pipeline.py`

Each cell is converted as follows:

| Input value | Output |
|-------------|--------|
| `BDL`, `-`, `NA`, empty | `0.0` (Below Detection Limit → treat as zero) |
| Valid number string | `float(value)` |
| Unparseable text | `NaN` |

**Why BDL → 0?** When a pollutant is "below detection limit", the true concentration is very low. For coliform bacteria, `BDL` effectively means "negligible / not detected" — safer to treat as 0 than to discard the entire row.

**Missing count per column** (dashboard stat):

```
missing_count(column) = number of rows where value ∈ {"", "NAN", "BDL", "-", "NA"}
total_missing         = Σ missing_count(column)
```

---

## 3. Stage 2 — Feature Engineering

**Code:** `load_and_prepare()` in `app/ml/pipeline.py`

### 3.1 Min/Max → Single Feature (Average)

Many CPCB parameters are reported as a range. We collapse each pair into one number:

```
feature_value = (Min + Max) / 2
```

**Example from our data** — River Jumar at Bit Mesra:

```
Temperature:  (12 + 29) / 2 = 20.5 °C
Dissolved_Oxygen: (3.3 + 5.2) / 2 = 4.25 mg/L
pH: (6.5 + 6.6) / 2 = 6.55
```

If only Min **or** Max exists, that single value is used.

### 3.2 Column Renaming

Raw names are normalized for the model:

| Raw name | Engineered name |
|----------|-----------------|
| `Temperature (C)` | `Temperature` |
| `Dissolved` | `Dissolved_Oxygen` |
| `Conductivity (µmho/cm)` | `Conductivity` |
| `BOD (mg/L)` | `BOD` |
| `Fecal Coliform (MPN/100ml)` | `Fecal_Coliform` |
| `Total Coliform (MPN/100ml)` | `Total_Coliform` |
| `NitrateN (mg/L)` | `NitrateN` |
| `Fecal` | `Fecal_Strep` |

### 3.3 Features Used vs Excluded

**Used in ML (numeric):** all 9 engineered sensor columns above.

**Kept for context but NOT fed to the model:** `Type Water Body`, `State Name`, `Year`, `Monitoring_Location`.

---

## 4. Stage 3 — Target Label (Good vs Poor Quality)

**Code:** `classify()` inside `load_and_prepare()`

We map CPCB freshwater quality logic to a **binary label** for machine learning:

| Label | Meaning |
|-------|---------|
| `1` | **Good Quality** — meets Class C or better |
| `0` | **Poor Quality** — fails safety thresholds (Class D/E) |

### 4.1 Threshold Rules (per sample)

For each row, four indicators are checked. **Missing values are ignored** (treated as "pass" for that indicator):

```
good_do  = (DO is missing)  OR (Dissolved_Oxygen ≥ 4.0 mg/L)
good_bod = (BOD is missing) OR (BOD ≤ 6.0 mg/L)
good_ph  = (pH is missing)  OR (6.0 ≤ pH ≤ 9.0)
good_fc  = (FC is missing)  OR (Fecal_Coliform ≤ 5000 MPN/100ml)
```

**Decision:**

```
IF good_do AND good_bod AND good_ph AND good_fc:
    IF DO ≥ 5 AND BOD ≤ 3 AND FC ≤ 500 (when present):
        → 1  (Good — Class B or better)
    ELSE:
        → 1  (Acceptable — Class C)
ELSE:
    → 0  (Poor — unsafe / Class D-E)
```

### 4.2 Real Example

| Sample | DO | BOD | pH | Fecal Coliform | Label | Reason |
|--------|-----|-----|-----|----------------|-------|--------|
| River Jumar (row 2) | 4.25 | 2.45 | 6.55 | missing | **1** | DO ≥ 4, BOD ≤ 6, pH in range |
| Heavily polluted | 2.0 | 12 | 6.8 | 50000 | **0** | DO too low, BOD too high, FC too high |

Rows with **no usable indicators at all** are dropped (`NaN` target → removed).

**Why binary?** AQUORA's mission is an early **safe / unsafe** alert for field operators and dashboards — not fine-grained CPCB class letters (A/B/C/D/E).

---

## 5. Stage 4 — Train/Test Split

**Code:** `train_test_split(..., test_size=0.2, stratify=y, random_state=42)`

```
80% → training set (X_train, y_train)
20% → test set      (X_test,  y_test)
```

**Stratified split** keeps the same Good/Poor ratio in both sets:

```
For each class c:  proportion in train ≈ proportion in test ≈ proportion in full data
```

With 162 rows and ~88% Good / ~12% Poor, test set has roughly 32 samples (~28 Good, ~4 Poor).

**Why `random_state=42`?** Reproducibility — same split every run for fair comparison of imputation methods.

---

## 6. Stage 5 — Missing Value Imputation

Real sensors and CPCB reports have gaps. Before training, missing feature values must be filled. AQUORA compares **three strategies**.

### 6.1 Simulated Missingness (Experiments)

To stress-test methods, we **artificially hide** values:

```
For each cell (i, j) in feature matrix X:
    mask[i,j] = True  with probability p   (p = 0.10, 0.20, or 0.30)
    X_miss[i,j] = NaN  if mask[i,j] else original value
```

`np.random.seed(42)` ensures the same missing pattern every run.

---

### 6.2 Method A — Median Imputation

**Code:** `SimpleImputer(strategy="median")`

For each feature column `j`, compute the median on **training data only**:

```
x̃_ij = median({ x_kj : x_kj is not missing, k ∈ training set })
```

**Example:** If training BOD values are `[1.3, 1.8, 2.2, NaN, 3.4]` → imputed NaN = **2.0**.

| Pros | Cons |
|------|------|
| Fast, simple | Ignores relationships between sensors |
| Keeps all rows | Can underestimate extremes (e.g. pollution spikes) |
| Robust to outliers | Same fill regardless of river/state context |

---

### 6.3 Method B — KNN Imputation (k = 5)

**Code:** `KNNImputer(n_neighbors=5)`

For each missing value in row `i`, feature `j`:

**Step 1 — Find 5 nearest neighbor rows** using Euclidean distance on **observed** features:

```
distance(i, k) = √ Σ (x_i,f - x_k,f)²
                 f ∈ features where BOTH rows i and k have observed values
```

**Step 2 — Impute as mean of neighbors' values for feature j:**

```
x̃_ij = (1/5) Σ  x_kj
              k ∈ {5 nearest neighbors of row i}
```

**Intuition for our dataset:** A missing BOD in a Jharkhand river sample might be filled using samples with similar DO, pH, and Temperature — preserving **cross-sensor patterns** that median imputation loses.

| Pros | Cons |
|------|------|
| Uses multivariate structure | Slower on large data |
| Better when sensors correlate | Needs enough complete rows nearby |
| Adapts per sample | Sensitive to feature scale (Conductivity >> pH) |

> **Relation to MSE:** KNN picks neighbors by minimizing **distance** in feature space. It does not minimize MSE directly, but imputation quality could be measured post-hoc with `MSE = mean((x_true - x̃)²)` on artificially masked values — that diagnostic is **not** currently computed in our code.

---

### 6.4 Method C — Listwise Deletion

**Code:** `dropna()` on concatenated `[X_train, y_train]`

```
Keep only rows where ALL features are non-missing
```

**Data retention:**

```
retention_pct = (rows_after_deletion / total_rows) × 100
```

At 30% simulated missingness, many rows lose at least one value → **large data loss**. With only 162 engineered rows, deletion can leave very few Poor Quality samples for training — hurting unsafe-water detection.

---

## 7. Stage 6 — Decision Tree Classifier

**Code:** `DecisionTreeClassifier` in `app/ml/pipeline.py`

A Decision Tree splits data recursively on feature thresholds to classify Good (1) vs Poor (0).

### 7.1 Split Criteria

Each node chooses the feature and threshold that best separates classes.

#### Gini Impurity (criterion = `"gini"`)

```
Gini(S) = 1 - Σ  p_c²
              c ∈ {Good, Poor}

p_c = proportion of class c in node S
```

- Gini = 0 → pure node (all same class)
- Gini = 0.5 → maximum mix (50/50)

**Split goal:** minimize weighted Gini of child nodes.

#### Entropy / Information Gain (criterion = `"entropy"`)

```
Entropy(S) = - Σ  p_c · log₂(p_c)
             c ∈ {Good, Poor}   (0·log 0 treated as 0)

Information Gain = Entropy(parent) - weighted_avg(Entropy(children))
```

**Split goal:** maximize Information Gain.

### 7.2 Tree Constraints (Hyperparameters)

| Parameter | Meaning | Values searched |
|-----------|---------|-----------------|
| `max_depth` | Max levels of splits | `None`, 3, 5, 8, 12 |
| `min_samples_split` | Min rows to split a node | 2, 5, 10 |
| `min_samples_leaf` | Min rows in each leaf | 1, 2, 4 |

**Example split logic (conceptual):**

```
IF Dissolved_Oxygen < 4.5 mg/L  →  likely Poor Quality
ELIF BOD > 5.0 mg/L             →  likely Poor Quality
ELIF Fecal_Coliform > 500       →  check other features
ELSE                            →  likely Good Quality
```

### 7.3 Feature Importance

After training, each feature gets a score summing to 1.0:

```
importance(f) = Σ  (weighted samples reaching node) × (Gini reduction at splits on f)
```

Higher importance → more influential in Good/Poor decisions (e.g. `Dissolved_Oxygen`, `BOD` typically rank high for water quality).

### 7.4 Prediction Probability

For a new sample, the tree walks to a leaf; class probability = fraction of training samples in that leaf:

```
P(Good Quality) = (Good samples in leaf) / (total samples in leaf)
```

---

## 8. Stage 7 — Hyperparameter Tuning (GridSearchCV)

**Code:** `GridSearchCV(..., scoring="f1", cv=StratifiedKFold)`

Tests all combinations in `param_grid` (criterion × max_depth × min_samples_split × min_samples_leaf).

**Cross-validation:** 5-fold stratified (or fewer if minority class is small):

```
Split train set into 5 folds
For each hyperparameter combo:
    For each fold:
        Train on 4 folds → validate on 1 fold → compute F1
    CV score = average F1 across 5 folds
Pick combo with highest CV F1
```

**Best model** is retrained on full `X_train` (after imputation) and evaluated on held-out `X_test`.

---

## 9. Stage 8 — Evaluation Metrics

**Code:** `_get_metrics()` in `app/ml/pipeline.py`

All metrics come from the **Confusion Matrix**:

```
                    Predicted
                 Poor(0)  Good(1)
Actual  Poor(0)    TN       FP
        Good(1)    FN       TP
```

| Symbol | Name | Meaning for AQUORA |
|--------|------|---------------------|
| **TP** | True Positive | Correctly flagged Good water |
| **TN** | True Negative | Correctly flagged Poor water |
| **FP** | False Positive | Safe water called Poor (false alarm) |
| **FN** | False Negative | **Unsafe water called Good (dangerous miss)** |

### 9.1 Accuracy

```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```

Overall fraction correct. **Misleading with imbalanced data** — we have 143 Good vs 19 Poor, so always predicting "Good" gives ~88% accuracy but catches zero unsafe samples.

### 9.2 Precision (for Good Quality, label=1)

```
Precision = TP / (TP + FP)
```

"When we say Good, how often are we right?"

### 9.3 Recall (for Good Quality, label=1)

```
Recall = TP / (TP + FN)
```

"Of all actually Good samples, how many did we find?"

### 9.4 F1 Score (primary tuning metric)

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

Harmonic mean — balances precision and recall. Used as `scoring="f1"` in GridSearchCV.

### 9.5 Poor Quality Recall (`poor_recall` / `unsafe_recall`)

**Most important for AQUORA safety:**

```
Poor_Recall = TN / (TN + FP)   [recall with pos_label=0]
```

"Of all actually **Poor/unsafe** samples, how many did we correctly detect?"

```
Poor_Recall = 1.0  →  never miss unsafe water (ideal for public health)
Poor_Recall = 0.0  →  never detect any unsafe water (worst case)
```

We prioritize this because **missing a polluted river reading is worse than a false alarm**.

### 9.6 Metrics NOT Used (and Why)

| Metric | Formula | Why not used here |
|--------|---------|-------------------|
| **MSE** | `(1/n) Σ(y - ŷ)²` | For **regression** only; we predict classes 0/1 |
| **RMSE** | `√MSE` | Same — continuous prediction |
| **MAE** | `(1/n) Σ\|y - ŷ\|` | Same |
| **R²** | coefficient of determination | Regression goodness-of-fit |

If AQUORA later adds **regression models** (e.g. predict exact BOD), MSE/RMSE would become relevant:

```
MSE_BOD = (1/n) Σ (BOD_actual - BOD_predicted)²
```

---

## 10. Stage 9 — Missing-Data Experiments

**Code:** `simulate_missing_and_evaluate()` and `run_full_analysis.py`

Full 9-stage empirical workflow:

| Stage | Action |
|-------|--------|
| 1 | Count missing values in raw CPCB columns |
| 2 | Train baseline Decision Tree (median impute + GridSearchCV) |
| 3–6 | For 10%, 20%, 30% missingness → apply Median, KNN, Deletion → retrain → measure metrics |
| 7 | Find test samples whose prediction **flips** when imputation changes |
| 8–9 | Compare methods → recommend best |

**Prediction flip analysis (20% missingness):**

```
flip_rate = (samples where Median_pred ≠ baseline OR KNN_pred ≠ baseline OR Deletion_pred ≠ baseline) / total_test
```

Flips matter most when **actual = Poor (0)** but imputation pushes prediction to **Good (1)** — a safety-critical failure mode.

**Data retention tracking:**

```
rows_retained       = training rows after imputation/deletion
data_retention_pct  = (rows_retained / total_engineered_rows) × 100
```

---

## 11. Stage 10 — Recommendation Engine

**Code:** `_recommend()` in `app/ml/pipeline.py`

After comparing Median, KNN, and Deletion at a given missing rate, each method gets a **weighted score**:

```
score = 0.4 × F1  +  0.5 × Poor_Recall  +  0.1 × Retention_Ratio

where:
    Retention_Ratio = rows_retained / total_rows
```

| Weight | Rationale |
|--------|-----------|
| **0.5 → Poor_Recall** | Safety first — must detect unsafe water |
| **0.4 → F1** | Overall balanced classification quality |
| **0.1 → Retention** | Prefer keeping data, but not at cost of safety |

```
best_method = argmax(score) over {Median, KNN, Deletion}
```

**Example output:**

```json
{
  "method": "KNN",
  "reason": "Maintained strong poor-quality recall (0.75) and F1 (0.82) while retaining 129 training samples (79.6% of data).",
  "scores": { "Median": 0.7124, "KNN": 0.7580, "Deletion": 0.6102 }
}
```

---

## 12. Stage 11 — Live Prediction Flow

**Code:** `predict_sample()` + `POST /api/predict`

```
1. Load saved model:     models/baseline_dt.joblib
2. Load saved imputer:   models/baseline_imputer.joblib
3. Load feature order:   models/feature_names.joblib

4. Build input vector:   [BOD, Conductivity, DO, ..., pH]  (NaN for missing sensors)

5. Impute:               x̃ = imputer.transform(x)

6. Predict:              class = tree.predict(x̃)
                         probabilities = tree.predict_proba(x̃)

7. Explain:              feature_importances + decision_path_text (human-readable tree rules)
```

**Example API input** (matches our feature schema):

```json
{
  "features": {
    "Dissolved_Oxygen": 6.0,
    "BOD": 2.5,
    "pH": 7.4,
    "Temperature": 27.0,
    "Conductivity": 350.0,
    "NitrateN": 1.5,
    "Fecal_Coliform": 120.0,
    "Total_Coliform": 450.0
  }
}
```

**WebSocket sensor simulator** (`/ws/sensors`): generates synthetic readings every 2 seconds with small random drift — mocks future ESP32 → MQTT → backend flow. Not used for ML training; dashboard display only.

---

## End-to-End Formula Summary

```text
┌─────────────────────────────────────────────────────────────────┐
│  RAW CPCB ROW                                                   │
│  "Dissolved Min=3.3, Max=5.2, BOD Min=2, Max=2.9, pH ..."     │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
              feature = (Min + Max) / 2
              BDL / "-" → 0.0
                            ▼
              Water_Quality = 1 if DO≥4, BOD≤6, 6≤pH≤9, FC≤5000
                              else 0
                            ▼
              80/20 Stratified Split (random_state=42)
                            ▼
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
     Median x̃_j        KNN x̃_ij          Drop incomplete rows
         └──────────────────┼──────────────────┘
                            ▼
              Decision Tree (Gini or Entropy splits)
              GridSearchCV → maximize CV F1
                            ▼
              Metrics: Accuracy, Precision, Recall, F1,
                       Poor_Recall = TN/(TN+FP)
                            ▼
              Recommend: 0.4·F1 + 0.5·Poor_Recall + 0.1·Retention
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Setup & API Reference

### Prerequisites

- Python 3.11+
- Dataset at `../data/dataset.csv`

### Run

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: **http://localhost:8000**
- Docs: **http://localhost:8000/docs**

### Key Files

| File | Role |
|------|------|
| `app/ml/pipeline.py` | All ML logic documented above |
| `run_full_analysis.py` | Batch 9-stage analysis script |
| `generate_docx_report.py` | Word report generator |
| `../models/*.joblib` | Saved trained model & imputer |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Stats, class distribution, missing counts |
| GET | `/api/datasets/summary` | Raw + engineered dataset profile |
| POST | `/api/models/train` | Train baseline tree + save to `../models/` |
| POST | `/api/experiments/run?missing_rate=0.2` | Run imputation comparison |
| GET | `/api/experiments/all` | Run at 10%, 20%, 30% missingness |
| POST | `/api/predict` | Predict Good/Poor from sensor dict |
| GET | `/api/features` | Feature names for prediction form |
| WS | `/ws/sensors` | Simulated live sensor stream |

### Utility Scripts

```bash
python run_full_analysis.py      # Print full metric tables to console
python generate_docx_report.py   # Generate ../reports/*.docx
```

---

> **Disclaimer:** AQUORA is an AI analytical system, NOT a certified drinking-water safety device. Predictions support research and monitoring dashboards — not regulatory certification or laboratory replacement.
