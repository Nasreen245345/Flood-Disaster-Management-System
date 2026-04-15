const Disaster = require('../models/Disaster');
const DistributionShift = require('../models/DistributionShift');
const AidRequest = require('../models/AidRequest');
const https = require('https');

// Reverse geocode a coordinate string like "32.681445, 71.791590" to a place name
function reverseGeocode(locationStr) {
    return new Promise((resolve) => {
        if (!locationStr) return resolve(locationStr || '');

        // Check if it looks like coordinates
        const match = locationStr.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (!match) return resolve(locationStr); // Not coordinates, return as-is

        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        // Validate lat/lng ranges
        const validLat = Math.abs(lat) <= 90 ? lat : lng;
        const validLng = Math.abs(lat) <= 90 ? lng : lat;

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&accept-language=en`;
        const options = {
            headers: { 'User-Agent': 'GovDMS-DisasterManagement/1.0' }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const a = json.address || {};
                    const name = a.city || a.town || a.village || a.county || a.state_district || a.state
                        || json.display_name?.split(',')[0] || locationStr;
                    resolve(name);
                } catch {
                    resolve(locationStr);
                }
            });
        }).on('error', () => resolve(locationStr));
    });
}

// @desc    Get all map data (disasters + distribution points)
// @route   GET /api/map/data
// @access  Public
exports.getMapData = async (req, res) => {
    try {
        const disasters = await Disaster.find({
            status: { $in: ['reported', 'verified', 'active'] }
        }).select('location coordinates disasterType severity peopleAffected needs status comments createdAt');

        const now = new Date();
        const shifts = await DistributionShift.find({
            status: 'active',
            shiftEnd: { $gte: now }
        })
        .populate('organization', 'name contact')
        .select('location coordinates shiftStart shiftEnd totalDistributions organization notes status');

        // Geocode all disaster addresses in parallel
        const disasterList = disasters.filter(d => d.coordinates?.latitude && d.coordinates?.longitude);
        const disasterAddresses = await Promise.all(
            disasterList.map(d => reverseGeocode(d.location))
        );

        const disasterMarkers = disasterList.map((d, i) => ({
            id: d._id,
            type: 'disaster',
            disasterType: d.disasterType,
            location: [d.coordinates.latitude, d.coordinates.longitude],
            severity: d.severity,
            status: d.status,
            peopleAffected: d.peopleAffected,
            needs: d.needs,
            description: d.comments || '',
            address: disasterAddresses[i],
            timestamp: d.createdAt
        }));

        // Geocode distribution shift addresses in parallel
        const shiftList = shifts.filter(s => s.coordinates?.latitude && s.coordinates?.longitude);
        const shiftAddresses = await Promise.all(
            shiftList.map(s => reverseGeocode(s.location))
        );

        const distributionMarkers = shiftList.map((s, i) => ({
            id: s._id,
            type: 'distribution',
            location: [s.coordinates.latitude, s.coordinates.longitude],
            address: shiftAddresses[i],
            ngoName: s.organization?.name || 'Unknown NGO',
            ngoContact: s.organization?.contact?.phone,
            shiftStart: s.shiftStart,
            shiftEnd: s.shiftEnd,
            totalDistributions: s.totalDistributions,
            notes: s.notes
        }));

        res.status(200).json({
            success: true,
            data: {
                disasters: disasterMarkers,
                distributionPoints: distributionMarkers
            }
        });
    } catch (error) {
        console.error('Get Map Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching map data',
            error: error.message
        });
    }
};
