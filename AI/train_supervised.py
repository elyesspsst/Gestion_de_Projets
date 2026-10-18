import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
    confusion_matrix,
    ConfusionMatrixDisplay
)

# 1. Load the data (requires the UPDATED generate_dataset.py with seniority)
DATA_DIR = Path(__file__).parent / "data"

employees = pd.read_csv(DATA_DIR / "employees.csv")
employee_skills = pd.read_csv(DATA_DIR / "employee_skills.csv")
tasks = pd.read_csv(DATA_DIR / "tasks.csv")
task_skills = pd.read_csv(DATA_DIR / "task_skills.csv")

LOOKUP = {
    (r.employee_id, r.skill): r.level
    for r in employee_skills.itertuples(index=False)
}

SENIORITY_NUM = {"junior": 0, "mid": 1, "senior": 2}
SENIORITY_BONUS = {"junior": -0.05, "mid": 0.0, "senior": 0.05}

# 2. Build one row per (task, employee) pair
rng = np.random.default_rng(42)
rows = []

for task in tasks.itertuples(index=False):
    reqs = task_skills[task_skills["task_id"] == task.task_id]
    if reqs.empty:
        continue

    for emp in employees.itertuples(index=False):
        ratios, surplus, matched, zeros = [], 0, 0, 0

        for r in reqs.itertuples(index=False):
            lvl = LOOKUP.get((emp.employee_id, r.skill), 0)
            ratios.append(min(lvl / r.required_level, 1))
            zeros += int(lvl == 0)
            if lvl >= r.required_level:
                matched += 1
                surplus += min(lvl - r.required_level, 2)

        avg = float(np.mean(ratios))
        weakest = min(ratios)

        # Simulated "real-world" outcome: more than the average match alone
        outcome = (
            0.6 * avg
            + 0.3 * weakest
            + SENIORITY_BONUS[emp.seniority]
            + rng.normal(0, 0.07)
        )

        rows.append({
            "employee_id": emp.employee_id,
            "task_id": task.task_id,
            "average_match": avg,
            "weakest_ratio": weakest,
            "matched_skills": matched,
            "missing_skills": len(reqs) - matched,
            "zero_skills": zeros,
            "surplus": surplus,
            "seniority": SENIORITY_NUM[emp.seniority],
            "good_fit": int(outcome >= 0.75),
        })

df = pd.DataFrame(rows)
df.to_csv(DATA_DIR / "assignments.csv", index=False)

FEATURES = [
    "average_match", "weakest_ratio", "matched_skills",
    "missing_skills", "zero_skills", "surplus", "seniority",
]
X, y = df[FEATURES], df["good_fit"]

print("Dataset shape:", df.shape)
print("Class distribution:\n", y.value_counts(normalize=True).round(3))


# 3. Split by TASK
splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.25,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(X, y, groups=df["task_id"])
)

X_train = X.iloc[train_idx]
X_test = X.iloc[test_idx]

y_train = y.iloc[train_idx]
y_test = y.iloc[test_idx]

print("Training examples:", len(X_train))
print("Testing examples:", len(X_test))
print("Training tasks:", df.iloc[train_idx]["task_id"].nunique())
print("Testing tasks:", df.iloc[test_idx]["task_id"].nunique())

# 4. Train
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=6,
    class_weight="balanced",
    random_state=42,
)
model.fit(X_train, y_train)

pred = model.predict(X_test)


# Confusion Matrix
cm = confusion_matrix(y_test, pred, labels=[0, 1])

print("\nConfusion Matrix:")
print(cm)

print("\nDetailed Classification Report:")
print(classification_report(
    y_test,
    pred,
    target_names=["Not suitable", "Suitable"],
    zero_division=0
))

# Visualisation
ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Not suitable", "Suitable"]
).plot()

import matplotlib.pyplot as plt
plt.title("Random Forest - Confusion Matrix")
plt.tight_layout()
plt.show()


proba = model.predict_proba(X_test)[:, 1]

# 5. Classification metrics vs. baselines
majority = max(y_test.mean(), 1 - y_test.mean())
rule_pred = (X_test["average_match"] >= 0.85).astype(int)

print("\nMajority-class accuracy:", round(majority, 3))
print("Rule baseline accuracy :", round(accuracy_score(y_test, rule_pred), 3))
print("Model accuracy         :", round(accuracy_score(y_test, pred), 3))
if y_test.nunique() == 2:
    print("Model ROC-AUC          :", round(roc_auc_score(y_test, proba), 3))
else:
    print("Model ROC-AUC          : unavailable (one class in test set)")
    print("\n", classification_report(y_test, pred, zero_division=0))

print("Feature importance:")
print(
    pd.Series(model.feature_importances_, index=FEATURES)
    .sort_values(ascending=False)
    .round(3)
)

# 6. Ranking quality: precision@5 per task (what a recommender really needs)
test_df = df.iloc[test_idx].copy()
test_df["model_score"] = proba
test_df["rule_score"] = test_df["average_match"] + 0.001 * test_df["surplus"]


def precision_at_k(frame, score_col, k=5):
    values = [
        g.nlargest(k, score_col)["good_fit"].mean()
        for _, g in frame.groupby("task_id")
    ]
    return float(np.mean(values))


print("\nPrecision@5 on unseen tasks")
print("Rule-based ranking:", round(precision_at_k(test_df, "rule_score"), 3))
print("Model ranking     :", round(precision_at_k(test_df, "model_score"), 3))