const Disaster = require('../models/Disaster');
const DistributionShift = require('../models/DistributionShift');
const AidRequest = require('../models/AidRequest');

// @desc    Get all map data (disasters + distribution points)
// @route   GET /api/map/data
// @access  Public
exports.getMapData = async (req, res) => {
    try {
        // Get active/verified disasters that have coordinates
        const disasters = await Disaster.find({
            status: { $in: ['reported', 'verified', 'active'] }
        }).select('location coordinates disasterType severity peopleAffected needs status comments createdAt');

        // Get active distribution shifts with coordinates
        const now = new Date();
        const shifts = await DistributionShift.find({
            status: 'active',
            shiftEnd: { $gte: now }
        })
        .populate('organization', 'name contact')
        .select('location coordinates shiftStart shiftEnd totalDistributions organization notes status');

        // Format disasters for map
        const disasterMarkers = disasters
            .filter(d => d.coordinates?.latitude && d.coordinates?.longitude)
            .map(d => ({
                id: d._id,
                type: 'disaster',
                disasterType: d.disasterType,
                location: [d.coordinates.latitude, d.coordinates.longitude],
                severity: d.severity,
                status: d.status,
                peopleAffected: d.peopleAffected,
                needs: d.needs,
                description: d.comments || '',
                address: d.location,
                timestamp: d.createdAt
            }));

        // Format distribution shifts for map
        const distributionMarkers = shifts
            .filter(s => s.coordinates?.latitude && s.coordinates?.longitude)
            .map(s => ({
                id: s._id,
                type: 'distribution',
                location: [s.coordinates.latitude, s.coordinates.longitude],
                address: s.location,
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
