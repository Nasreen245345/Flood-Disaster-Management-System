"""
Train an enhanced multi-output GradientBoosting model for aid package demand prediction.
Uses the enriched dataset with request_rate, rate_trend, dominant_category,
cumulative_fulfilled_pct, population_density, and season features.
"""
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline

# ── Load data ──────────────────────────────────────────────────────────────────
df = pd.read_csv(os.path.join(os.path.dirname(__file__), 'training_data.csv'))
print(f"Loaded {len(df)} records")

FEATURES = [
    'disaster_type',
    'severity',
    'people_affected',
    'day_of_week',
    'days_since_start',
    'pending_requests',
    'ngo_load_pct',
    'avg_daily_distributions',
    'request_rate_per_hour',
    'rate_trend',
    'dominant_category_enc',
    'cumulative_fulfilled_pct',
    'population_density_enc',
    'season_enc',
]

TARGETS = [
    'food_packages',
    'medical_packages',
    'shelter_packages',
    'clothing_packages',
    'water_packages',
]

# ── Encode categorical features ────────────────────────────────────────────────
le_disaster = LabelEncoder()
le_severity = LabelEncoder()

df['disaster_type_enc'] = le_disaster.fit_transform(df['disaster_type'])
df['severity_enc']      = le_severity.fit_transform(df['severity'])

FEATURES_ENC = [
    'disaster_type_enc',
    'severity_enc',
    'people_affected',
    'day_of_week',
    'days_since_start',
    'pending_requests',
    'ngo_load_pct',
    'avg_daily_distributions',
    'request_rate_per_hour',
    'rate_trend',
    'dominant_category_enc',
    'cumulative_fulfilled_pct',
    'population_density_enc',
    'season_enc',
]

X = df[FEATURES_ENC].values
y = df[TARGETS].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

print(f"Train: {len(X_train)}, Test: {len(X_test)}")

# ── Model: GradientBoosting with tuned hyperparameters ─────────────────────────
# GBR is better than RF for this task because:
# 1. Learns residuals — captures the decay pattern explicitly
# 2. Better with correlated features (rate_trend × request_rate)
# 3. Lower variance on small-to-medium datasets
base_gbr = GradientBoostingRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    min_samples_split=8,
    min_samples_leaf=4,
    subsample=0.8,
    max_features='sqrt',
    loss='huber',          # robust to outliers
    alpha=0.9,
    random_state=42
)

model = MultiOutputRegressor(base_gbr, n_jobs=-1)

print("\nTraining model...")
model.fit(X_train, y_train)

# ── Evaluate ───────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
y_pred = np.maximum(1, np.round(y_pred).astype(int))

print("\n── Per-target metrics ──────────────────────────────────────────────────")
for i, target in enumerate(TARGETS):
    mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
    r2  = r2_score(y_test[:, i], y_pred[:, i])
    print(f"  {target:<22} MAE={mae:6.1f}  R²={r2:.3f}")

total_mae = mean_absolute_error(y_test.sum(axis=1), y_pred.sum(axis=1))
total_r2  = r2_score(y_test.sum(axis=1), y_pred.sum(axis=1))
print(f"\n  {'TOTAL packages':<22} MAE={total_mae:6.1f}  R²={total_r2:.3f}")

# ── Feature importance (averaged across targets) ───────────────────────────────
print("\n── Feature importances (avg across targets) ────────────────────────────")
importances = np.mean([est.feature_importances_ for est in model.estimators_], axis=0)
for feat, imp in sorted(zip(FEATURES_ENC, importances), key=lambda x: -x[1]):
    bar = '█' * int(imp * 200)
    print(f"  {feat:<30} {imp:.4f}  {bar}")

# ── Verify decay behaviour ─────────────────────────────────────────────────────
print("\n── Decay check (same disaster, days_since_start 1→30) ─────────────────")
base_input = [
    le_disaster.transform(['flood'])[0],
    le_severity.transform(['high'])[0],
    2000,   # people_affected
    1,      # day_of_week
    1,      # days_since_start (will vary)
    20,     # pending_requests
    0.4,    # ngo_load_pct
    30,     # avg_daily_distributions
    3.0,    # request_rate_per_hour (will vary)
    1.5,    # rate_trend (will vary)
    2,      # dominant_category_enc (shelter)
    0.0,    # cumulative_fulfilled_pct (will vary)
    1,      # population_density_enc (suburban)
    2,      # season_enc (monsoon)
]

for day in [1, 3, 7, 14, 21, 30]:
    inp = base_input.copy()
    inp[4] = day                                    # days_since_start
    inp[8] = max(0.1, 3.0 * np.exp(-0.08 * day))   # decaying rate
    inp[9] = max(0.2, 1.5 * (0.85 ** day))          # decaying trend
    inp[11] = min(0.9, day * 0.025)                  # increasing fulfillment
    pred = model.predict([inp])[0]
    total = int(sum(np.maximum(1, np.round(pred))))
    print(f"  Day {day:2d}: {total:4d} packages  "
          f"food={int(max(1,round(pred[0]))):3d} "
          f"medical={int(max(1,round(pred[1]))):3d} "
          f"shelter={int(max(1,round(pred[2]))):3d} "
          f"clothing={int(max(1,round(pred[3]))):3d} "
          f"water={int(max(1,round(pred[4]))):3d}")

# ── Save model ─────────────────────────────────────────────────────────────────
artifact = {
    'model':       model,
    'le_disaster': le_disaster,
    'le_severity': le_severity,
    'features':    FEATURES_ENC,
    'targets':     TARGETS,
}

model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(artifact, f)

print(f"\n✅ Model saved to {model_path}")
