require('dotenv').config();
const http = require('http');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const opts = { hostname: 'localhost', port: 5000, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
        const req = http.request(opts, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
        });
        req.on('error', reject); req.write(data); req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const opts = { hostname: 'localhost', port: 5000, path, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } };
        const req = http.request(opts, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
        });
        req.on('error', reject); req.end();
    });
}

async function main() {
    // Login
    const login = await post('/api/auth/login', { email: 'akhuwat@gmail.com', password: 'test1234' });
    const orgId = '69956ee5fc279ce9b2ab9e92';    if (!login.token) { console.log('Login failed:', login.message); return; }
    console.log('Logged in as:', login.user?.name || login.user?.email);

    // Get prediction
    const pred = await get(`/api/predictions/${orgId}`, login.token);
    if (!pred.success) { console.log('Prediction failed:', pred.message); return; }

    const ctx = pred.data.context;
    console.log('\n=== CONTEXT ===');
    if (ctx.disasters) {
        ctx.disasters.forEach(d => console.log(`Disaster: ${d.type} | ${d.severity} | region: ${d.region} | people: ${d.peopleAffected}`));
    }
    console.log('Total disasters:', ctx.totalDisasters);
    console.log('Pending requests:', ctx.pendingRequests);
    console.log('Avg daily distributions:', ctx.avgDailyDistributions);
    console.log('NGO load:', ctx.ngoLoadPct + '%');
    console.log('Volunteers:', ctx.volunteerCount, '| Inventory:', ctx.inventoryTotal);

    console.log('\n=== 3-DAY FORECAST ===');
    pred.data.forecast.forEach(day => {
        const p = day.predictions;
        console.log(`${day.label}: Food=${p.food_packages} Medical=${p.medical_packages} Shelter=${p.shelter_packages} Clothing=${p.clothing_packages} Water=${p.water_packages} | TOTAL=${day.total}`);
    });
}

main().catch(console.error);
