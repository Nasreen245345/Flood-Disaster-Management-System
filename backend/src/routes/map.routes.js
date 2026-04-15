const express = require('express');
const router = express.Router();
const https = require('https');
const { getMapData } = require('../controllers/map.controller');

// Public - anyone can see the map
router.get('/data', getMapData);

// Reverse geocode proxy (avoids browser CORS/User-Agent restrictions with Nominatim)
router.get('/reverse-geocode', async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;

    const options = {
        headers: {
            'User-Agent': 'GovDMS-DisasterManagement/1.0 (contact@govdms.local)',
            'Accept': 'application/json'
        }
    };

    https.get(url, options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                const a = json.address || {};
                const placeName = a.city || a.town || a.village || a.county || a.state_district || a.state || json.display_name?.split(',')[0] || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
                res.json({ success: true, placeName });
            } catch (e) {
                res.json({ success: false, placeName: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` });
            }
        });
    }).on('error', () => {
        res.json({ success: false, placeName: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` });
    });
});

module.exports = router;
