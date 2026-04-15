"""
Flask prediction API — enhanced model with 14 features.
POST /predict  -> returns package demand forecast for next 1-3 days
GET  /health   -> health check
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(MODEL_PATH, 'rb') as f:
    artifact = pickle.load(f)

model       = artifact['model']
le_disaster = artifact['le_disaster']
le_severity = artifact['le_severity']
FEATURES    = artifact['features']
TARGETS     = artifact['targets']

CATEGORIES   = ['food', 'medical', 'shelter', 'clothing', 'water']
CATEGORY_ENC = {c: i for i, c in enumerate(CATEGORIES)}

DENSITY_ENC = {'urban': 0, 'suburban': 1, 'rural': 2, 'remote': 3}
SEASON_ENC  = {'spring': 0, 'summer': 1, 'monsoon': 2, 'winter': 3}


def safe_encode(encoder, value, fallback=0):
    try:
        return int(encoder.transform([value])[0])
    except (ValueError, KeyError):
        return fallback


def predict_for_day(data, days_ahead):
    """Build feature vector with temporal decay and predict for a specific day offset."""
    from datetime import datetime, timedelta
    target_date = datetime.now() + timedelta(days=days_ahead)
    day_of_week = target_date.weekday()

    days_since_start = int(data.get('days_since_start', 1)) + days_ahead

    # ── Temporal decay of velocity features ───────────────────────────────────
    # Each day further out: rate slows, trend decelerates, more is fulfilled
    base_rate  = float(data.get('request_rate_per_hour', 2.0))
    base_trend = float(data.get('rate_trend', 1.0))
    base_fulfilled = float(data.get('cumulative_fulfilled_pct', 0.0))

    # When rate is 0 (no recent requests), derive a baseline from pending requests
    # and days_since_start so decay still applies meaningfully
    if base_rate <= 0:
        pending = int(data.get('pending_requests', 0))
        days = int(data.get('days_since_start', 1))
        # Estimate: pending requests spread over a 24h window, decayed by age
        base_rate = max(0.05, (pending / 24.0) * max(0.1, 1.0 - days * 0.03))

    # Exponential decay of request rate
    decayed_rate  = max(0.05, base_rate  * (0.80 ** (days_ahead - 1)))
    # Trend converges toward 0.5 (slowing) over time
    decayed_trend = max(0.2,  base_trend * (0.75 ** (days_ahead - 1)))
    # Fulfillment increases each day
    decayed_fulfilled = min(0.95, base_fulfilled + (days_ahead - 1) * 0.08)

    dom_cat     = data.get('dominant_category', 'food')
    dom_cat_enc = CATEGORY_ENC.get(dom_cat, 0)

    density = data.get('population_density', 'suburban')
    density_enc = DENSITY_ENC.get(density, 1)

    season = data.get('season', 'summer')
    season_enc = SEASON_ENC.get(season, 1)

    features = [
        safe_encode(le_disaster, data.get('disaster_type', 'flood')),
        safe_encode(le_severity,  data.get('severity', 'medium')),
        int(data.get('people_affected', 500)),
        day_of_week,
        days_since_start,
        int(data.get('pending_requests', 10)),
        float(data.get('ngo_load_pct', 0.5)),
        int(data.get('avg_daily_distributions', 30)),
        decayed_rate,
        decayed_trend,
        dom_cat_enc,
        decayed_fulfilled,
        density_enc,
        season_enc,
    ]

    pred = model.predict([features])[0]

    result = {}
    for i, target in enumerate(TARGETS):
        result[target] = max(1, int(round(float(pred[i]))))
    return result


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'loaded', 'features': len(FEATURES)})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data'}), 400

    try:
        forecast = []
        for day in range(1, 4):
            day_pred = predict_for_day(data, day)
            forecast.append({
                'day':         day,
                'label':       f'Day +{day}',
                'predictions': day_pred,
                'total':       sum(day_pred.values())
            })

        return jsonify({
            'success':  True,
            'input':    data,
            'forecast': forecast
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
