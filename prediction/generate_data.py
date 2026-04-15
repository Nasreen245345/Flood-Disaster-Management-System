"""
Enhanced training data generator for aid package demand prediction.
Features:
  - Disaster type & severity
  - People affected
  - Days since disaster start (with realistic decay)
  - Day of week (weekend surge)
  - Pending requests
  - NGO load percentage
  - Avg daily distributions
  - request_rate_per_hour  (NEW: real-time demand velocity)
  - rate_trend             (NEW: accelerating/stable/decelerating)
  - dominant_category_enc  (NEW: which resource is most requested)
  - cumulative_fulfilled   (NEW: how much has already been distributed)
  - population_density_enc (NEW: urban/rural/remote)
  - season_enc             (NEW: monsoon/winter/summer/spring)
"""
import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

DISASTER_TYPES = ['flood', 'earthquake', 'fire', 'landslide', 'cyclone', 'accident']
SEVERITIES     = ['low', 'medium', 'high', 'critical']
CATEGORIES     = ['food', 'medical', 'shelter', 'clothing', 'water']
CATEGORY_ENC   = {c: i for i, c in enumerate(CATEGORIES)}

# Realistic disaster-resource multipliers (based on humanitarian response data)
DISASTER_MULTIPLIERS = {
    'flood':      {'food': 1.9, 'medical': 1.3, 'shelter': 2.2, 'clothing': 1.6, 'water': 2.8},
    'earthquake': {'food': 1.6, 'medical': 2.8, 'shelter': 3.2, 'clothing': 1.3, 'water': 1.9},
    'fire':       {'food': 1.2, 'medical': 2.0, 'shelter': 2.6, 'clothing': 2.2, 'water': 1.6},
    'landslide':  {'food': 1.5, 'medical': 1.8, 'shelter': 2.4, 'clothing': 1.4, 'water': 1.7},
    'cyclone':    {'food': 1.8, 'medical': 1.5, 'shelter': 3.0, 'clothing': 1.7, 'water': 2.4},
    'accident':   {'food': 1.0, 'medical': 3.5, 'shelter': 1.1, 'clothing': 1.1, 'water': 1.3},
}

SEVERITY_MULTIPLIERS = {'low': 0.4, 'medium': 1.0, 'high': 2.0, 'critical': 3.5}

# Dominant category per disaster type
DOMINANT_CATEGORY = {
    'flood':      'water',
    'earthquake': 'shelter',
    'fire':       'shelter',
    'landslide':  'shelter',
    'cyclone':    'shelter',
    'accident':   'medical',
}

# Population density encoding
DENSITY_ENC = {'urban': 0, 'suburban': 1, 'rural': 2, 'remote': 3}
DENSITY_MULTIPLIERS = {'urban': 1.4, 'suburban': 1.1, 'rural': 0.9, 'remote': 0.7}

# Season encoding (affects demand patterns)
SEASON_ENC = {'spring': 0, 'summer': 1, 'monsoon': 2, 'winter': 3}
SEASON_MULTIPLIERS = {
    'spring':  {'food': 1.0, 'medical': 1.0, 'shelter': 1.0, 'clothing': 1.0, 'water': 1.0},
    'summer':  {'food': 1.1, 'medical': 1.1, 'shelter': 0.9, 'clothing': 0.9, 'water': 1.4},
    'monsoon': {'food': 1.3, 'medical': 1.2, 'shelter': 1.4, 'clothing': 1.2, 'water': 0.8},
    'winter':  {'food': 1.2, 'medical': 1.3, 'shelter': 1.5, 'clothing': 1.8, 'water': 0.9},
}


def generate_record():
    disaster_type = random.choice(DISASTER_TYPES)
    severity      = random.choice(SEVERITIES)
    people_affected = random.randint(50, 15000)
    day_of_week   = random.randint(0, 6)
    days_since_start = random.randint(0, 45)
    pending_requests = random.randint(0, 300)
    ngo_load_pct  = round(random.uniform(0.05, 1.0), 2)
    avg_daily_distributions = random.randint(2, 200)

    # Population density
    density = random.choices(
        ['urban', 'suburban', 'rural', 'remote'],
        weights=[0.25, 0.30, 0.30, 0.15]
    )[0]

    # Season
    season = random.choice(['spring', 'summer', 'monsoon', 'winter'])

    # Cumulative fulfilled (as % of people_affected — how saturated the response is)
    # Early disaster: low fulfillment; later: higher
    max_fulfillment_pct = min(0.95, days_since_start * 0.025 + random.uniform(0, 0.15))
    cumulative_fulfilled_pct = round(max_fulfillment_pct, 3)

    # ── Request rate per hour ──────────────────────────────────────────────────
    # Peaks in first 3 days, then decays exponentially
    peak_rate = SEVERITY_MULTIPLIERS[severity] * (people_affected / 500) * DENSITY_MULTIPLIERS[density]
    decay_factor = np.exp(-0.08 * days_since_start)
    base_rate = peak_rate * decay_factor
    request_rate_per_hour = max(0.05, round(base_rate * random.uniform(0.6, 1.6), 2))

    # ── Rate trend ─────────────────────────────────────────────────────────────
    # 0-3 days: accelerating (1.2-3.0)
    # 4-10 days: mixed (0.7-1.5)
    # 11-20 days: decelerating (0.4-1.0)
    # 21+ days: strongly decelerating (0.2-0.7)
    if days_since_start <= 3:
        rate_trend = round(random.uniform(1.2, 3.0), 2)
    elif days_since_start <= 10:
        rate_trend = round(random.uniform(0.7, 1.5), 2)
    elif days_since_start <= 20:
        rate_trend = round(random.uniform(0.4, 1.0), 2)
    else:
        rate_trend = round(random.uniform(0.2, 0.7), 2)

    # ── Dominant category ──────────────────────────────────────────────────────
    # Mostly follows disaster type, but shifts over time
    # Early: shelter/rescue; later: food/water/medical
    dom_cat = DOMINANT_CATEGORY[disaster_type]
    if days_since_start > 7 and random.random() < 0.4:
        # After first week, food/water become more dominant
        dom_cat = random.choices(['food', 'water', 'medical'], weights=[0.4, 0.35, 0.25])[0]
    elif random.random() < 0.15:
        dom_cat = random.choice(CATEGORIES)
    dominant_category_enc = CATEGORY_ENC[dom_cat]

    # ── Compute targets ────────────────────────────────────────────────────────
    sev_mult = SEVERITY_MULTIPLIERS[severity]
    dis_mult = DISASTER_MULTIPLIERS[disaster_type]
    den_mult = DENSITY_MULTIPLIERS[density]
    sea_mult = SEASON_MULTIPLIERS[season]

    # Decay: demand decreases as disaster ages and fulfillment increases
    time_decay = max(0.15, np.exp(-0.04 * days_since_start))
    fulfillment_decay = max(0.1, 1.0 - cumulative_fulfilled_pct * 0.8)

    # Weekend surge (volunteers/distributions peak on weekends)
    weekend_boost = 1.15 if day_of_week >= 5 else 1.0

    # NGO capacity constraint
    capacity_factor = max(0.3, 1.0 - ngo_load_pct * 0.4)

    # Velocity boost: high rate + accelerating = more packages needed NOW
    velocity_boost = min(2.5, max(0.3, (request_rate_per_hour / 4.0) * rate_trend))

    # Base demand
    base = (people_affected / 80) * sev_mult * den_mult * time_decay * fulfillment_decay

    def calc(category):
        dom_boost = 1.4 if category == dom_cat else 1.0
        val = (base
               * dis_mult[category]
               * sea_mult[category]
               * weekend_boost
               * capacity_factor
               * velocity_boost
               * dom_boost)
        noise = np.random.normal(1.0, 0.07)
        return max(1, round(val * noise))

    return {
        # Core features
        'disaster_type':           disaster_type,
        'severity':                severity,
        'people_affected':         people_affected,
        'day_of_week':             day_of_week,
        'days_since_start':        days_since_start,
        'pending_requests':        pending_requests,
        'ngo_load_pct':            ngo_load_pct,
        'avg_daily_distributions': avg_daily_distributions,
        # Velocity features
        'request_rate_per_hour':   request_rate_per_hour,
        'rate_trend':              rate_trend,
        'dominant_category_enc':   dominant_category_enc,
        # New enriched features
        'cumulative_fulfilled_pct': cumulative_fulfilled_pct,
        'population_density_enc':  DENSITY_ENC[density],
        'season_enc':              SEASON_ENC[season],
        # Targets
        'food_packages':           calc('food'),
        'medical_packages':        calc('medical'),
        'shelter_packages':        calc('shelter'),
        'clothing_packages':       calc('clothing'),
        'water_packages':          calc('water'),
    }


if __name__ == '__main__':
    N = 8000  # larger dataset for better generalization
    records = [generate_record() for _ in range(N)]
    df = pd.DataFrame(records)
    df.to_csv('training_data.csv', index=False)
    print(f"Generated {len(df)} records -> training_data.csv")

    features = [c for c in df.columns if not c.endswith('_packages')]
    targets  = [c for c in df.columns if c.endswith('_packages')]
    print(f"\nFeatures ({len(features)}): {features}")
    print(f"Targets  ({len(targets)}):  {targets}")
    print("\nTarget stats:")
    print(df[targets].describe().round(1))
    print("\nCorrelation of rate_trend with targets:")
    print(df[['rate_trend'] + targets].corr()['rate_trend'][targets].round(3))
