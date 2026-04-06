const DistributionShift = require('../models/DistributionShift');
const AidRequest = require('../models/AidRequest');
const Volunteer = require('../models/Volunteer');

// @desc    Get active distribution shifts for an NGO (for victims to see pickup points)
// @route   GET /api/distribution/shifts/public/:orgId
// @access  Public
exports.getPublicShifts = async (req, res) => {
    try {
        const now = new Date();
        const shifts = await DistributionShift.find({
            organization: req.params.orgId,
            status: 'active',
            shiftEnd: { $gte: now }
        }).select('location coordinates shiftStart shiftEnd totalDistributions notes');

        res.status(200).json({
            success: true,
            count: shifts.length,
            data: shifts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching shifts', error: error.message });
    }
};

// @desc    Create distribution shift
// @route   POST /api/distribution/shifts
// @access  Private (NGO/Admin)
exports.createShift = async (req, res) => {
    try {
        console.log('=== CREATE DISTRIBUTION SHIFT ===');
        console.log('Request Body:', req.body);
        
        req.body.createdBy = req.user.id;
        
        const shift = await DistributionShift.create(req.body);
        
        console.log('✅ Distribution Shift Created:', shift._id);
        
        res.status(201).json({
            success: true,
            data: shift,
            message: 'Distribution shift created successfully'
        });
    } catch (error) {
        console.error('Create Shift Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating distribution shift',
            error: error.message
        });
    }
};

// @desc    Get all shifts for organization
// @route   GET /api/distribution/shifts/organization/:orgId
// @access  Private (NGO/Admin)
exports.getOrganizationShifts = async (req, res) => {
    try {
        const { status } = req.query;
        
        const query = { organization: req.params.orgId };
        if (status) query.status = status;
        
        const shifts = await DistributionShift.find(query)
            .populate('assignedVolunteer', 'fullName phone category')
            .sort('-shiftStart');
        
        // Auto-update status based on current time
        for (let shift of shifts) {
            await shift.updateStatusByTime();
        }
        
        res.status(200).json({
            success: true,
            count: shifts.length,
            data: shifts
        });
    } catch (error) {
        console.error('Get Organization Shifts Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shifts',
            error: error.message
        });
    }
};

// @desc    Get volunteer's shifts
// @route   GET /api/distribution/shifts/volunteer/:volunteerId
// @access  Private (Volunteer)
exports.getVolunteerShifts = async (req, res) => {
    try {
        const shifts = await DistributionShift.find({
            assignedVolunteer: req.params.volunteerId
        })
        .populate('organization', 'name contact')
        .sort('-shiftStart');
        
        // Auto-update status
        for (let shift of shifts) {
            await shift.updateStatusByTime();
        }
        
        res.status(200).json({
            success: true,
            count: shifts.length,
            data: shifts
        });
    } catch (error) {
        console.error('Get Volunteer Shifts Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteer shifts',
            error: error.message
        });
    }
};

// @desc    Assign volunteer to shift
// @route   PUT /api/distribution/shifts/:id/assign
// @access  Private (NGO/Admin)
exports.assignVolunteer = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        
        const shift = await DistributionShift.findById(req.params.id);
        
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }
        
        // Verify volunteer exists
        const volunteer = await Volunteer.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }
        
        shift.assignedVolunteer = volunteerId;
        await shift.save();
        
        await shift.populate('assignedVolunteer', 'fullName phone category');
        
        console.log(`✅ Shift ${shift._id} assigned to volunteer ${volunteer.fullName}`);
        
        res.status(200).json({
            success: true,
            data: shift,
            message: `Shift assigned to ${volunteer.fullName}`
        });
    } catch (error) {
        console.error('Assign Volunteer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning volunteer',
            error: error.message
        });
    }
};

// @desc    Get current active shift for volunteer
// @route   GET /api/distribution/my-active-shift
// @access  Private (Volunteer)
exports.getMyActiveShift = async (req, res) => {
    try {
        // Get volunteer ID from user
        const volunteer = await Volunteer.findOne({ userId: req.user.id });
        
        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer profile not found'
            });
        }
        
        const now = new Date();
        
        // Find active shift for this volunteer
        const shift = await DistributionShift.findOne({
            assignedVolunteer: volunteer._id,
            status: 'active',
            shiftStart: { $lte: now },
            shiftEnd: { $gte: now }
        }).populate('organization', 'name contact');
        
        if (!shift) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No active shift found'
            });
        }
        
        // Auto-update status
        await shift.updateStatusByTime();
        
        res.status(200).json({
            success: true,
            data: shift,
            hasActiveShift: shift.isCurrentlyActive()
        });
    } catch (error) {
        console.error('Get Active Shift Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active shift',
            error: error.message
        });
    }
};

// @desc    Verify victim and get details (only during active shift)
// @route   POST /api/distribution/verify-victim
// @access  Private (Volunteer with active shift only)
exports.verifyVictim = async (req, res) => {
    try {
        const { cnic } = req.body;
        
        console.log('=== VERIFY VICTIM ===');
        console.log('CNIC:', cnic);
        console.log('User:', req.user.id);
        
        // Get volunteer
        const volunteer = await Volunteer.findOne({ userId: req.user.id });
        
        if (!volunteer) {
            return res.status(403).json({
                success: false,
                message: 'Volunteer profile not found'
            });
        }
        
        // Check if volunteer has active shift RIGHT NOW
        const now = new Date();
        const activeShift = await DistributionShift.findOne({
            assignedVolunteer: volunteer._id,
            status: 'active',
            shiftStart: { $lte: now },
            shiftEnd: { $gte: now }
        });
        
        if (!activeShift) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You do not have an active distribution shift',
                hint: 'Contact your NGO to assign you to a shift'
            });
        }
        
        console.log('✅ Volunteer has active shift:', activeShift._id);
        
        // Find aid request by CNIC
        const aidRequest = await AidRequest.findOne({
            victimCNIC: cnic,
            assignedNGO: activeShift.organization,
            status: { $in: ['approved', 'in_progress'] }
        }).populate('assignedNGO', 'name contact');
        
        if (!aidRequest) {
            return res.status(404).json({
                success: false,
                message: 'No pending aid request found for this CNIC',
                hint: 'Victim may have already received aid or request not approved'
            });
        }
        
        console.log('✅ Aid Request Found:', aidRequest._id);
        
        // Return full victim details (authorized during active shift)
        res.status(200).json({
            success: true,
            data: {
                aidRequest: {
                    _id: aidRequest._id,
                    victimName: aidRequest.victimName,
                    victimCNIC: aidRequest.victimCNIC,
                    victimPhone: aidRequest.victimPhone,
                    location: aidRequest.location,
                    packagesNeeded: aidRequest.packagesNeeded,
                    urgency: aidRequest.urgency,
                    peopleCount: aidRequest.peopleCount,
                    status: aidRequest.status
                },
                shift: {
                    _id: activeShift._id,
                    location: activeShift.location,
                    shiftEnd: activeShift.shiftEnd
                }
            },
            message: 'Victim verified successfully'
        });
    } catch (error) {
        console.error('Verify Victim Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying victim',
            error: error.message
        });
    }
};

// @desc    Mark aid as distributed
// @route   POST /api/distribution/mark-distributed
// @access  Private (Volunteer with active shift only)
exports.markDistributed = async (req, res) => {
    try {
        const { aidRequestId, cnic } = req.body;
        
        console.log('=== MARK DISTRIBUTED ===');
        console.log('Aid Request:', aidRequestId);
        
        // Get volunteer
        const volunteer = await Volunteer.findOne({ userId: req.user.id });
        
        if (!volunteer) {
            return res.status(403).json({
                success: false,
                message: 'Volunteer profile not found'
            });
        }
        
        // Check active shift
        const now = new Date();
        const activeShift = await DistributionShift.findOne({
            assignedVolunteer: volunteer._id,
            status: 'active',
            shiftStart: { $lte: now },
            shiftEnd: { $gte: now }
        });
        
        if (!activeShift) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: No active shift'
            });
        }
        
        // Update aid request status
        const aidRequest = await AidRequest.findByIdAndUpdate(
            aidRequestId,
            {
                status: 'fulfilled',
                fulfilledBy: req.user.id,
                fulfilledDate: Date.now()
            },
            { new: true }
        );
        
        if (!aidRequest) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }
        
        // Add to shift's handled requests
        activeShift.aidRequestsHandled.push({
            aidRequest: aidRequestId,
            handledAt: Date.now(),
            victimCNIC: cnic
        });
        activeShift.totalDistributions += 1;
        await activeShift.save();
        
        console.log('✅ Aid marked as distributed');
        
        res.status(200).json({
            success: true,
            data: aidRequest,
            message: 'Aid marked as distributed successfully'
        });
    } catch (error) {
        console.error('Mark Distributed Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking aid as distributed',
            error: error.message
        });
    }
};

// @desc    Update shift status
// @route   PUT /api/distribution/shifts/:id/status
// @access  Private (NGO/Admin)
exports.updateShiftStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const shift = await DistributionShift.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: shift,
            message: `Shift status updated to ${status}`
        });
    } catch (error) {
        console.error('Update Shift Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating shift status',
            error: error.message
        });
    }
};

// @desc    Delete shift
// @route   DELETE /api/distribution/shifts/:id
// @access  Private (NGO/Admin)
exports.deleteShift = async (req, res) => {
    try {
        const shift = await DistributionShift.findById(req.params.id);
        
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }
        
        await shift.deleteOne();
        
        res.status(200).json({
            success: true,
            data: {},
            message: 'Shift deleted successfully'
        });
    } catch (error) {
        console.error('Delete Shift Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting shift',
            error: error.message
        });
    }
};
