const Organization = require('../models/Organization');
const Disaster = require('../models/Disaster');
const AidRequest = require('../models/AidRequest');
const RegionAssignment = require('../models/RegionAssignment');
const https = require('https');
const http = require('http');

const PREDICTION_API_URL = process.env.PREDICTION_API_URL || 'http://localhost:8000';

function callPredictionAPI(payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const url = new URL(`${PREDICTION_API_URL}/predict`);
        const lib = url.protocol === 'https:' ? https : http;
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { reject(new Error('Invalid JSON from prediction service')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('Prediction service timeout')); });
        req.write(data); req.end();
    });
}

// Sum forecasts from multiple disaster predictions
function sumForecasts(forecastList) {
    if (!forecastList.length) return [];
    const days = forecastList[0].length; // 3 days
    const result = [];
    for (let d = 0; d < days; d++) {
        const combined = {
            day: forecastList[0][d].day,
            label: forecastList[0][d].label,
            predictions: { food_packages: 0, medical_packages: 0, shelter_packages: 0, clothing_packages: 0, water_packages: 0 },
            total: 0
        };
        forecastList.forEach(forecast => {
            const day = forecast[d];
            Object.keys(combined.predictions).forEach(k => {
                combined.predictions[k] += day.predictions[k] || 0;
            });
        });
        combined.total = Object.values(combined.predictions).reduce((a, b) => a + b, 0);
        result.push(combined);
    }
    return result;
}

// @desc  Get resource demand forecast for an NGO
// @route GET /api/predictions/:orgId
// @access Private (NGO)
exports.getPrediction = async (req, res) => {
    try {
        const { orgId } = req.params;

        const org = await Organization.findById(orgId);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        const Volunteer = require('../models/Volunteer');
        const volunteerCount = await Volunteer.countDocuments({ assignedNGO: org._id });
        const inventoryTotal = org.inventory.reduce((sum, item) => sum + item.quantity, 0);

        // All active region assignments for this NGO
        const regionAssignments = await RegionAssignment.find({
            assignedNGOs: org._id,
            status: { $in: ['assigned', 'in-progress'] }
        }).populate('disaster');

        // Total pending requests for this NGO
        const allPendingRequests = await AidRequest.find({
            assignedNGO: org._id,
            status: { $in: ['pending', 'approved', 'in_progress'] }
        }).select('assignedDisaster peopleCount');

        const totalFulfilled = await AidRequest.countDocuments({ assignedNGO: org._id, status: 'fulfilled' });
        const orgAgeDays = Math.max(1, Math.floor((Date.now() - new Date(org.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentFulfilled = await AidRequest.countDocuments({
            assignedNGO: org._id, status: 'fulfilled', updatedAt: { $gte: sevenDaysAgo }
        });
        const avgDailyDistributions = recentFulfilled > 0
            ? Math.max(1, Math.round(recentFulfilled / 7))
            : Math.max(1, Math.round(totalFulfilled / orgAgeDays));

        // NGO load
        const estimatedCapacity = Math.max(10, volunteerCount * 10, inventoryTotal / 10);
        const ngoLoadPct = Math.min(1, (allPendingRequests.length + org.activeDistributions) / estimatedCapacity);

        // Determine season from current month
        const month = new Date().getMonth(); // 0-11
        let season = 'summer';
        if (month >= 2 && month <= 4) season = 'spring';
        else if (month >= 5 && month <= 6) season = 'summer';
        else if (month >= 7 && month <= 9) season = 'monsoon';
        else season = 'winter';

        // Build list of active disasters with their region-specific data
        let disasterContexts = [];

        for (const ra of regionAssignments) {
            const disaster = ra.disaster;
            if (!disaster) continue;

            // Pending requests directly associated with this disaster
            const disasterPending = allPendingRequests.filter(r =>
                r.assignedDisaster && r.assignedDisaster.toString() === disaster._id.toString()
            ).length;

            // People affected: from disaster.peopleAffected (reported at disaster time)
            const peopleAffected = Math.max(50, disaster.peopleAffected || 500);

            const daysSinceStart = Math.max(0, Math.floor(
                (Date.now() - new Date(disaster.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ));

            // --- Adaptive velocity window based on disaster age ---
            // Early (0-3 days): 6h window — fast-moving situation
            // Active (4-14 days): 24h window — daily rhythm
            // Late (15+ days): 48h window — sparse requests
            let windowHours;
            if (daysSinceStart <= 3) windowHours = 6;
            else if (daysSinceStart <= 14) windowHours = 24;
            else windowHours = 48;

            const windowMs = windowHours * 60 * 60 * 1000;
            const windowStart = new Date(Date.now() - windowMs);
            const prevWindowStart = new Date(Date.now() - 2 * windowMs);

            // Requests in current window vs previous window
            const recentRequests = await AidRequest.countDocuments({
                assignedDisaster: disaster._id,
                createdAt: { $gte: windowStart }
            });
            const previousRequests = await AidRequest.countDocuments({
                assignedDisaster: disaster._id,
                createdAt: { $gte: prevWindowStart, $lt: windowStart }
            });

            const requestRatePerHour = parseFloat((recentRequests / windowHours).toFixed(2));
            const rateTrend = previousRequests > 0
                ? parseFloat((recentRequests / previousRequests).toFixed(2))
                : (recentRequests > 0 ? 2.0 : 1.0);

            // Dominant category from requests in current window
            const recentCategoryRequests = await AidRequest.find({
                assignedDisaster: disaster._id,
                createdAt: { $gte: windowStart }
            }).select('packagesNeeded');

            const categoryCounts = { food: 0, medical: 0, shelter: 0, clothing: 0, water: 0 };
            recentCategoryRequests.forEach(r => {
                r.packagesNeeded?.forEach(p => {
                    if (categoryCounts[p.category] !== undefined) categoryCounts[p.category]++;
                });
            });
            const dominantCategory = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])[0][0];

            disasterContexts.push({
                disaster_type: disaster.disasterType,
                severity: disaster.severity,
                people_affected: peopleAffected,
                days_since_start: daysSinceStart,
                pending_requests: disasterPending,
                request_rate_per_hour: requestRatePerHour,
                rate_trend: rateTrend,
                dominant_category: dominantCategory,
                cumulative_fulfilled_pct: Math.min(0.9, daysSinceStart * 0.02),
                population_density: 'suburban',
                season,
                region: ra.region,
                disasterName: ra.disasterName
            });
        }

        // Fallback: if no valid region assignments, use most severe active disaster
        if (disasterContexts.length === 0) {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const disasters = await Disaster.find({ status: { $in: ['active', 'verified', 'reported'] } });
            const topDisaster = disasters.sort((a, b) =>
                (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
            )[0];

            if (topDisaster) {
                const fallbackPending = allPendingRequests.filter(r =>
                    r.assignedDisaster && r.assignedDisaster.toString() === topDisaster._id.toString()
                ).length;
                disasterContexts.push({
                    disaster_type: topDisaster.disasterType,
                    severity: topDisaster.severity,
                    people_affected: Math.max(50, topDisaster.peopleAffected || 500),
                    days_since_start: Math.max(0, Math.floor(
                        (Date.now() - new Date(topDisaster.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    )),
                    pending_requests: fallbackPending || allPendingRequests.length,
                    request_rate_per_hour: 1.0,
                    rate_trend: 1.0,
                    dominant_category: 'food',
                    cumulative_fulfilled_pct: 0.1,
                    population_density: 'suburban',
                    season,
                    region: topDisaster.location,
                    disasterName: topDisaster.disasterType
                });
            }
        }

        if (disasterContexts.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    forecast: [],
                    context: { message: 'No active disasters assigned to this NGO', pendingRequests, volunteerCount, inventoryTotal }
                }
            });
        }

        // Run all disaster predictions in PARALLEL, then sum
        const allForecasts = await Promise.all(
            disasterContexts.map(async (ctx) => {
                const payload = {
                    disaster_type: ctx.disaster_type,
                    severity: ctx.severity,
                    people_affected: ctx.people_affected,
                    days_since_start: ctx.days_since_start,
                    pending_requests: ctx.pending_requests,
                    ngo_load_pct: parseFloat(ngoLoadPct.toFixed(2)),
                    avg_daily_distributions: avgDailyDistributions,
                    request_rate_per_hour: ctx.request_rate_per_hour,
                    rate_trend: ctx.rate_trend,
                    dominant_category: ctx.dominant_category
                };
                const result = await callPredictionAPI(payload);
                return result.forecast || [];
            })
        );

        const combinedForecast = sumForecasts(allForecasts);

        // ── Smart decay based on actual request trend ──────────────────────────
        // Compute average rateTrend across all active disasters
        const avgRateTrend = disasterContexts.length > 0
            ? disasterContexts.reduce((sum, d) => sum + (d.rate_trend || 1.0), 0) / disasterContexts.length
            : 1.0;

        // Compute dominant category across all disasters (weighted by pending requests)
        const catTotals = { food: 0, medical: 0, shelter: 0, clothing: 0, water: 0 };
        disasterContexts.forEach(d => {
            if (d.dominant_category && catTotals[d.dominant_category] !== undefined) {
                catTotals[d.dominant_category] += (d.pending_requests || 1);
            }
        });
        const dominantCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0][0];
        const catKeyMap = {
            food: 'food_packages', medical: 'medical_packages',
            shelter: 'shelter_packages', clothing: 'clothing_packages', water: 'water_packages'
        };
        const dominantKey = catKeyMap[dominantCat];

        // Decay factor per day:
        // - rateTrend > 1.2 (accelerating): slow decay (0.95/day) — demand still rising
        // - rateTrend 0.8-1.2 (stable): moderate decay (0.88/day)
        // - rateTrend < 0.8 (decelerating): fast decay (0.80/day) — demand falling
        let decayPerDay;
        if (avgRateTrend > 1.2) {
            decayPerDay = 0.95; // accelerating — demand still growing, slow decay
        } else if (avgRateTrend >= 0.8) {
            decayPerDay = 0.88; // stable
        } else {
            decayPerDay = 0.80; // decelerating — demand falling fast
        }

        // Apply dynamic decay to Day+2 and Day+3
        // Also boost the dominant resource category by 10% to reflect real demand
        combinedForecast.forEach((day, i) => {
            if (i > 0) {
                const factor = Math.pow(decayPerDay, i);
                Object.keys(day.predictions).forEach(k => {
                    let val = Math.max(1, Math.round(combinedForecast[0].predictions[k] * factor));
                    // Dominant resource gets a slight boost (stays higher relative to others)
                    if (k === dominantKey) {
                        val = Math.max(1, Math.round(val * 1.08));
                    }
                    day.predictions[k] = val;
                });
                day.total = Object.values(day.predictions).reduce((a, b) => a + b, 0);
            }
        });

        // Attach trend metadata to context for the frontend
        combinedForecast._meta = {
            avgRateTrend,
            decayPerDay,
            dominantCategory: dominantCat,
            trendLabel: avgRateTrend > 1.2 ? 'Accelerating' : avgRateTrend < 0.8 ? 'Decelerating' : 'Stable'
        };

        res.status(200).json({
            success: true,
            data: {
                forecast: combinedForecast,
                context: {
                    disasters: disasterContexts.map(d => ({
                        type: d.disaster_type,
                        severity: d.severity,
                        region: d.region,
                        peopleAffected: d.people_affected,
                        pendingRequests: d.pending_requests,
                        requestRatePerHour: d.request_rate_per_hour,
                        rateTrend: d.rate_trend,
                        dominantCategory: d.dominant_category
                    })),
                    totalDisasters: disasterContexts.length,
                    pendingRequests: allPendingRequests.length,
                    avgDailyDistributions,
                    ngoLoadPct: Math.round(ngoLoadPct * 100),
                    volunteerCount,
                    inventoryTotal,
                    trendSummary: combinedForecast._meta
                }
            }
        });

    } catch (error) {
        console.error('Prediction error:', error.message);
        if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
            return res.status(503).json({ success: false, message: 'Prediction service unavailable. Please try again later.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
