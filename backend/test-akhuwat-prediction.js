/**
 * End-to-end prediction test for Akhuwat Foundation
 * Uses actual data from the database via the live API
 */
require('dotenv').config();
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
const ORG_ID   = '69956ee5fc279ce9b2ab9e92';

function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const url  = new URL(`${BASE_URL}${path}`);
        const lib  = url.protocol === 'https:' ? https : http;
        const opts = {
            hostname: url.hostname,
            port:     url.port || 80,
            path:     url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(data   ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const req = lib.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); }
                catch { resolve({ raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  AKHUWAT FOUNDATION — PREDICTION MODEL TEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Login
    console.log('1. Authenticating as Akhuwat Foundation...');
    const loginRes = await apiCall('POST', '/auth/login', {
        email: 'akhuwat@gmail.com',
        password: 'test1234'
    });

    if (!loginRes.token) {
        console.error('❌ Login failed:', loginRes.message);
        process.exit(1);
    }

    const token = loginRes.token;
    console.log(`   ✅ Logged in as: ${loginRes.user?.name || 'Akhuwat Foundation'}\n`);

    // 2. Fetch org context
    console.log('2. Fetching organization context...');
    const orgRes = await apiCall('GET', '/organizations/me', null, token);
    if (orgRes.success) {
        const org = orgRes.data;
        const invTotal = (org.inventory || []).reduce((s, i) => s + i.quantity, 0);
        console.log(`   Name:      ${org.name}`);
        console.log(`   Status:    ${org.status}`);
        console.log(`   Inventory: ${invTotal} total units`);
        console.log(`   Active distributions: ${org.activeDistributions || 0}\n`);
    }

    // 3. Fetch assigned regions
    console.log('3. Fetching assigned regions...');
    const regRes = await apiCall('GET', `/region-assignments/ngo/${ORG_ID}`, null, token);
    const regions = regRes.data || [];
    console.log(`   Assigned regions: ${regions.length}`);
    regions.forEach(r => {
        console.log(`   • ${r.disasterName} | Region: ${r.region} | Status: ${r.status}`);
    });
    console.log();

    // 4. Fetch pending aid requests
    console.log('4. Fetching aid requests...');
    const aidRes = await apiCall('GET', `/aid-requests/ngo/${ORG_ID}`, null, token);
    const aidRequests = aidRes.data || [];
    const pending = aidRequests.filter(r => ['pending','approved','in_progress'].includes(r.status));
    console.log(`   Total requests: ${aidRequests.length}`);
    console.log(`   Pending/Active: ${pending.length}`);

    // Category breakdown
    const catCounts = {};
    aidRequests.forEach(r => {
        (r.packagesNeeded || []).forEach(p => {
            catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        });
    });
    if (Object.keys(catCounts).length > 0) {
        const sorted = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
        console.log(`   Category breakdown: ${sorted.map(([k,v]) => `${k}(${v})`).join(', ')}`);
        console.log(`   Most demanded: ${sorted[0][0].toUpperCase()}`);
    }
    console.log();

    // 5. Call prediction API
    console.log('5. Calling prediction API with actual Akhuwat data...');
    const predRes = await apiCall('GET', `/predictions/${ORG_ID}`, null, token);

    if (!predRes.success) {
        console.error('❌ Prediction failed:', predRes.message || JSON.stringify(predRes));
        process.exit(1);
    }

    const { forecast, context } = predRes.data;

    // 6. Print context used
    console.log('\n── Context used by model ───────────────────────────────────');
    console.log(`   Active disasters:      ${context.totalDisasters}`);
    console.log(`   Pending requests:      ${context.pendingRequests}`);
    console.log(`   Avg daily distrib:     ${context.avgDailyDistributions}/day`);
    console.log(`   NGO load:              ${context.ngoLoadPct}%`);
    console.log(`   Volunteers:            ${context.volunteerCount}`);
    console.log(`   Inventory stock:       ${context.inventoryTotal} units`);

    if (context.disasters?.length) {
        console.log('\n   Per-disaster signals:');
        context.disasters.forEach(d => {
            const trend = d.rateTrend > 1.2 ? '↑ Accelerating' :
                          d.rateTrend < 0.8 ? '↓ Slowing' : '→ Stable';
            console.log(`   • ${d.type} (${d.severity}) | Rate: ${d.requestRatePerHour}/hr | Trend: ${trend} | Dominant: ${d.dominantCategory}`);
        });
    }

    // 7. Print forecast
    console.log('\n── 3-Day Resource Forecast ─────────────────────────────────');
    forecast.forEach(day => {
        const p = day.predictions;
        console.log(`\n   ${day.label} — TOTAL: ${day.total} packages`);
        console.log(`   ┌─────────────┬────────┐`);
        console.log(`   │ Food        │  ${String(p.food_packages).padStart(4)}  │`);
        console.log(`   │ Medical     │  ${String(p.medical_packages).padStart(4)}  │`);
        console.log(`   │ Shelter     │  ${String(p.shelter_packages).padStart(4)}  │`);
        console.log(`   │ Clothing    │  ${String(p.clothing_packages).padStart(4)}  │`);
        console.log(`   │ Water       │  ${String(p.water_packages).padStart(4)}  │`);
        console.log(`   └─────────────┴────────┘`);
    });

    // 8. Decay check
    if (forecast.length >= 2) {
        const d1 = forecast[0].total;
        const d2 = forecast[1].total;
        const d3 = forecast[2]?.total;
        const decaying = d1 >= d2 && (!d3 || d2 >= d3);
        console.log(`\n── Decay check ─────────────────────────────────────────────`);
        console.log(`   Day+1: ${d1} → Day+2: ${d2} → Day+3: ${d3 || 'N/A'}`);
        console.log(`   ${decaying ? '✅ Correct decay (demand decreasing over time)' : '⚠️  Non-monotonic (may reflect changing conditions)'}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
}

run().catch(err => {
    console.error('Test error:', err.message);
    process.exit(1);
});
