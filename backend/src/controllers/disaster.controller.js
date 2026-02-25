const Disaster = require('../models/Disaster');

// @desc    Report new disaster
// @route   POST /api/disasters
// @access  Public (anyone can report) or Private (if you want auth)
exports.reportDisaster = async (req, res) => {
    try {
        console.log('=== REPORT DISASTER ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user?.id);

        // Add reporter if authenticated
        if (req.user) {
            req.body.reportedBy = req.user.id;
        }

        const disaster = await Disaster.create(req.body);

        console.log('✅ Disaster Reported Successfully:', disaster._id);

        res.status(201).json({
            success: true,
            data: disaster,
            message: 'Disaster report submitted successfully. Response teams have been alerted.'
        });
    } catch (error) {
        console.error('❌ Report Disaster Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error reporting disaster',
            error: error.message
        });
    }
};

// @desc    Get all disasters
// @route   GET /api/disasters
// @access  Public or Private
exports.getAllDisasters = async (req, res) => {
    try {
        const { status, severity, type } = req.query;
        
        let query = {};
        
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (type) query.disasterType = type;

        const disasters = await Disaster.find(query)
            .populate('reportedBy', 'name email phone')
            .populate('verifiedBy', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: disasters.length,
            data: disasters
        });
    } catch (error) {
        console.error('Get All Disasters Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching disasters',
            error: error.message
        });
    }
};

// @desc    Get single disaster
// @route   GET /api/disasters/:id
// @access  Public or Private
exports.getDisasterById = async (req, res) => {
    try {
        const disaster = await Disaster.findById(req.params.id)
            .populate('reportedBy', 'name email phone')
            .populate('verifiedBy', 'name email');

        if (!disaster) {
            return res.status(404).json({
                success: false,
                message: 'Disaster not found'
            });
        }

        res.status(200).json({
            success: true,
            data: disaster
        });
    } catch (error) {
        console.error('Get Disaster Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching disaster details',
            error: error.message
        });
    }
};

// @desc    Update disaster status
// @route   PUT /api/disasters/:id/status
// @access  Private (Admin only)
exports.updateDisasterStatus = async (req, res) => {
    try {
        const { status } = req.body;

        let disaster = await Disaster.findById(req.params.id);

        if (!disaster) {
            return res.status(404).json({
                success: false,
                message: 'Disaster not found'
            });
        }

        // Update status
        disaster.status = status;

        // If verifying, add verifier info
        if (status === 'verified' && !disaster.verifiedBy) {
            disaster.verifiedBy = req.user.id;
            disaster.verifiedAt = Date.now();
        }

        await disaster.save();

        res.status(200).json({
            success: true,
            data: disaster
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating disaster status',
            error: error.message
        });
    }
};

// @desc    Update disaster details
// @route   PUT /api/disasters/:id
// @access  Private (Admin only)
exports.updateDisaster = async (req, res) => {
    try {
        let disaster = await Disaster.findById(req.params.id);

        if (!disaster) {
            return res.status(404).json({
                success: false,
                message: 'Disaster not found'
            });
        }

        disaster = await Disaster.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: disaster
        });
    } catch (error) {
        console.error('Update Disaster Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating disaster',
            error: error.message
        });
    }
};

// @desc    Delete disaster
// @route   DELETE /api/disasters/:id
// @access  Private (Admin only)
exports.deleteDisaster = async (req, res) => {
    try {
        const disaster = await Disaster.findById(req.params.id);

        if (!disaster) {
            return res.status(404).json({
                success: false,
                message: 'Disaster not found'
            });
        }

        await disaster.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Disaster report deleted'
        });
    } catch (error) {
        console.error('Delete Disaster Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting disaster',
            error: error.message
        });
    }
};

// @desc    Get disaster statistics
// @route   GET /api/disasters/stats
// @access  Private
exports.getDisasterStats = async (req, res) => {
    try {
        const stats = await Disaster.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalPeopleAffected: { $sum: '$peopleAffected' }
                }
            }
        ]);

        const typeStats = await Disaster.aggregate([
            {
                $group: {
                    _id: '$disasterType',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                byStatus: stats,
                byType: typeStats
            }
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
