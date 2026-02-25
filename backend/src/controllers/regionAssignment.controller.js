const RegionAssignment = require('../models/RegionAssignment');
const Disaster = require('../models/Disaster');
const Organization = require('../models/Organization');

// @desc    Create new region assignment
// @route   POST /api/region-assignments
// @access  Private (Admin only)
exports.createAssignment = async (req, res) => {
    try {
        console.log('=== CREATE REGION ASSIGNMENT ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('Admin User:', req.user.id);

        const {
            disasterId,
            disasterName,
            region,
            assignedNGOs,
            resourceRequirements,
            resourceCoverage,
            affectedPopulation,
            notes
        } = req.body;

        // Validate disaster exists
        const disaster = await Disaster.findById(disasterId);
        if (!disaster) {
            return res.status(404).json({
                success: false,
                message: 'Disaster not found'
            });
        }

        // Validate NGOs exist and are approved
        if (assignedNGOs && assignedNGOs.length > 0) {
            const ngos = await Organization.find({
                _id: { $in: assignedNGOs },
                status: 'approved'
            });

            if (ngos.length !== assignedNGOs.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some NGOs are not found or not approved'
                });
            }
        }

        // Create assignment
        const assignment = await RegionAssignment.create({
            disaster: disasterId,
            disasterName,
            region,
            assignedNGOs: assignedNGOs || [],
            resourceRequirements: resourceRequirements || { food: 0, medical: 0, shelter: 0 },
            resourceCoverage: resourceCoverage || 0,
            affectedPopulation: affectedPopulation || 0,
            assignedBy: req.user.id,
            notes,
            status: 'assigned'
        });

        // Populate references
        await assignment.populate([
            { path: 'disaster', select: 'location disasterType severity status' },
            { path: 'assignedNGOs', select: 'name type contact' },
            { path: 'assignedBy', select: 'name email' }
        ]);

        console.log('✅ Assignment Created:', assignment._id);

        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Region assignment created successfully'
        });
    } catch (error) {
        console.error('❌ Create Assignment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating assignment',
            error: error.message
        });
    }
};

// @desc    Get all region assignments
// @route   GET /api/region-assignments
// @access  Private (Admin, NGO)
exports.getAllAssignments = async (req, res) => {
    try {
        const { status, disasterId, ngoId } = req.query;
        
        let query = {};
        
        if (status) query.status = status;
        if (disasterId) query.disaster = disasterId;
        if (ngoId) query.assignedNGOs = ngoId;

        const assignments = await RegionAssignment.find(query)
            .populate('disaster', 'location disasterType severity status peopleAffected')
            .populate('assignedNGOs', 'name type contact capacity')
            .populate('assignedBy', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        console.error('Get All Assignments Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments',
            error: error.message
        });
    }
};

// @desc    Get single assignment
// @route   GET /api/region-assignments/:id
// @access  Private
exports.getAssignmentById = async (req, res) => {
    try {
        const assignment = await RegionAssignment.findById(req.params.id)
            .populate('disaster', 'location disasterType severity status peopleAffected comments')
            .populate('assignedNGOs', 'name type contact capacity inventory')
            .populate('assignedBy', 'name email');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error('Get Assignment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assignment',
            error: error.message
        });
    }
};

// @desc    Update assignment status
// @route   PUT /api/region-assignments/:id/status
// @access  Private (Admin, assigned NGO)
exports.updateAssignmentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['assigned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const assignment = await RegionAssignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Update status
        assignment.status = status;

        // If completed, set completion date
        if (status === 'completed' && !assignment.completedAt) {
            assignment.completedAt = Date.now();
        }

        await assignment.save();

        await assignment.populate([
            { path: 'disaster', select: 'location disasterType severity' },
            { path: 'assignedNGOs', select: 'name type' },
            { path: 'assignedBy', select: 'name email' }
        ]);

        console.log(`✅ Assignment ${assignment._id} status updated to: ${status}`);

        res.status(200).json({
            success: true,
            data: assignment,
            message: `Assignment status updated to ${status}`
        });
    } catch (error) {
        console.error('Update Assignment Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating assignment status',
            error: error.message
        });
    }
};

// @desc    Update assignment details
// @route   PUT /api/region-assignments/:id
// @access  Private (Admin only)
exports.updateAssignment = async (req, res) => {
    try {
        let assignment = await RegionAssignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'assignedNGOs',
            'resourceRequirements',
            'resourceCoverage',
            'affectedPopulation',
            'notes',
            'status'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                assignment[field] = req.body[field];
            }
        });

        await assignment.save();

        await assignment.populate([
            { path: 'disaster', select: 'location disasterType severity' },
            { path: 'assignedNGOs', select: 'name type contact' },
            { path: 'assignedBy', select: 'name email' }
        ]);

        res.status(200).json({
            success: true,
            data: assignment,
            message: 'Assignment updated successfully'
        });
    } catch (error) {
        console.error('Update Assignment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating assignment',
            error: error.message
        });
    }
};

// @desc    Delete assignment
// @route   DELETE /api/region-assignments/:id
// @access  Private (Admin only)
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await RegionAssignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        await assignment.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Assignment deleted successfully'
        });
    } catch (error) {
        console.error('Delete Assignment Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting assignment',
            error: error.message
        });
    }
};

// @desc    Get assignments for a specific NGO
// @route   GET /api/region-assignments/ngo/:ngoId
// @access  Private (NGO, Admin)
exports.getNGOAssignments = async (req, res) => {
    try {
        const assignments = await RegionAssignment.find({
            assignedNGOs: req.params.ngoId
        })
            .populate('disaster', 'location disasterType severity status peopleAffected')
            .populate('assignedBy', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        console.error('Get NGO Assignments Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching NGO assignments',
            error: error.message
        });
    }
};

// @desc    Get assignment statistics
// @route   GET /api/region-assignments/stats
// @access  Private (Admin)
exports.getAssignmentStats = async (req, res) => {
    try {
        const stats = await RegionAssignment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalPopulation: { $sum: '$affectedPopulation' },
                    avgCoverage: { $avg: '$resourceCoverage' }
                }
            }
        ]);

        const totalAssignments = await RegionAssignment.countDocuments();
        const activeAssignments = await RegionAssignment.countDocuments({
            status: { $in: ['assigned', 'in-progress'] }
        });

        res.status(200).json({
            success: true,
            data: {
                byStatus: stats,
                totalAssignments,
                activeAssignments
            }
        });
    } catch (error) {
        console.error('Get Assignment Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
