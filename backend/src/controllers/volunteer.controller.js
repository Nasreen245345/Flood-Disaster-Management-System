const Volunteer = require('../models/Volunteer');
const Organization = require('../models/Organization');

// @desc    Register new volunteer
// @route   POST /api/volunteers
// @access  Private (User must be logged in)
exports.registerVolunteer = async (req, res) => {
    try {
        console.log('=== REGISTER VOLUNTEER ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user?.id);

        // Check if user already registered as volunteer
        const existingVolunteer = await Volunteer.findOne({ userId: req.user.id });
        if (existingVolunteer) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered as a volunteer'
            });
        }

        // Verify NGO exists and is approved
        const ngo = await Organization.findById(req.body.assignedNGO);
        if (!ngo) {
            return res.status(404).json({
                success: false,
                message: 'Selected NGO not found'
            });
        }
        if (ngo.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Selected NGO is not approved yet'
            });
        }

        // Auto-assign service rate based on skill level if not provided
        if (!req.body.serviceRate) {
            const rateMap = {
                'doctor': 40,
                'nurse': 35,
                'paramedic': 30,
                'certified_professional': 25,
                'trained': 20,
                'beginner': 15
            };
            req.body.serviceRate = rateMap[req.body.skillLevel] || 20;
        }

        // Create volunteer
        req.body.userId = req.user.id;
        req.body.fullName = req.body.fullName || req.user.name;
        req.body.email = req.body.email || req.user.email;
        req.body.phone = req.body.phone || req.user.phone;

        const volunteer = await Volunteer.create(req.body);

        console.log('✅ Volunteer Registered Successfully:', volunteer._id);
        console.log('✅ Assigned to NGO:', ngo.name);

        res.status(201).json({
            success: true,
            data: volunteer,
            message: `Volunteer registration submitted to ${ngo.name}. Awaiting verification.`
        });
    } catch (error) {
        console.error('❌ Register Volunteer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering volunteer',
            error: error.message
        });
    }
};

// @desc    Get all volunteers (Admin view)
// @route   GET /api/volunteers
// @access  Private (Admin only)
exports.getAllVolunteers = async (req, res) => {
    try {
        const { ngo, category, status, verificationStatus } = req.query;
        
        let query = {};
        
        if (ngo) query.assignedNGO = ngo;
        if (category) query.category = category;
        if (status) query.availabilityStatus = status;
        if (verificationStatus) query.verificationStatus = verificationStatus;

        const volunteers = await Volunteer.find(query)
            .populate('userId', 'name email')
            .populate('assignedNGO', 'name type')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: volunteers.length,
            data: volunteers
        });
    } catch (error) {
        console.error('Get All Volunteers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteers',
            error: error.message
        });
    }
};

// @desc    Get volunteers for specific NGO
// @route   GET /api/volunteers/ngo/:ngoId
// @access  Private (NGO or Admin)
exports.getNGOVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find({ assignedNGO: req.params.ngoId })
            .populate('userId', 'name email phone')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: volunteers.length,
            data: volunteers
        });
    } catch (error) {
        console.error('Get NGO Volunteers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching NGO volunteers',
            error: error.message
        });
    }
};

// @desc    Get my volunteer profile
// @route   GET /api/volunteers/me
// @access  Private
exports.getMyVolunteerProfile = async (req, res) => {
    try {
        const volunteer = await Volunteer.findOne({ userId: req.user.id })
            .populate('assignedNGO', 'name type contact');

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: volunteer
        });
    } catch (error) {
        console.error('Get My Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteer profile',
            error: error.message
        });
    }
};

// @desc    Update volunteer verification status
// @route   PUT /api/volunteers/:id/verify
// @access  Private (NGO or Admin)
exports.verifyVolunteer = async (req, res) => {
    try {
        const { verificationStatus, verifiedByNGO, verifiedByAdmin, verificationNotes } = req.body;

        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        // Update verification fields
        if (verificationStatus) volunteer.verificationStatus = verificationStatus;
        if (verifiedByNGO !== undefined) volunteer.verifiedByNGO = verifiedByNGO;
        if (verifiedByAdmin !== undefined) volunteer.verifiedByAdmin = verifiedByAdmin;
        if (verificationNotes) volunteer.verificationNotes = verificationNotes;

        await volunteer.save();

        console.log(`✅ Volunteer ${volunteer.fullName} verification updated`);

        res.status(200).json({
            success: true,
            data: volunteer,
            message: 'Volunteer verification status updated'
        });
    } catch (error) {
        console.error('Verify Volunteer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating verification status',
            error: error.message
        });
    }
};

// @desc    Update volunteer availability status
// @route   PUT /api/volunteers/:id/availability
// @access  Private (Volunteer themselves or NGO/Admin)
exports.updateAvailability = async (req, res) => {
    try {
        const { availabilityStatus, shiftType } = req.body;

        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        // Check authorization
        if (volunteer.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this volunteer'
            });
        }

        if (availabilityStatus) volunteer.availabilityStatus = availabilityStatus;
        if (shiftType) volunteer.shiftType = shiftType;
        
        if (availabilityStatus === 'active') {
            volunteer.lastActiveDate = Date.now();
        }

        await volunteer.save();

        res.status(200).json({
            success: true,
            data: volunteer,
            message: 'Availability status updated'
        });
    } catch (error) {
        console.error('Update Availability Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating availability',
            error: error.message
        });
    }
};

// @desc    Update volunteer details
// @route   PUT /api/volunteers/:id
// @access  Private
exports.updateVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        // Check authorization
        if (volunteer.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this volunteer'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'phone', 'email', 'category', 'skillLevel', 'preferredWorkingArea',
            'hasMobility', 'hasVehicle', 'profilePhoto'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                volunteer[field] = req.body[field];
            }
        });

        await volunteer.save();

        res.status(200).json({
            success: true,
            data: volunteer,
            message: 'Volunteer profile updated'
        });
    } catch (error) {
        console.error('Update Volunteer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating volunteer',
            error: error.message
        });
    }
};

// @desc    Get NGO capacity calculation
// @route   GET /api/volunteers/capacity/:ngoId
// @access  Private (NGO or Admin)
exports.getNGOCapacity = async (req, res) => {
    try {
        const ngo = await Organization.findById(req.params.ngoId);

        if (!ngo) {
            return res.status(404).json({
                success: false,
                message: 'NGO not found'
            });
        }

        // Calculate overall capacity
        const capacity = await ngo.calculateEffectiveCapacity();
        
        // Calculate category-specific capacities
        const categories = ['medical', 'food_distribution', 'shelter_management', 'logistics', 'general_support'];
        const categoryCapacities = await Promise.all(
            categories.map(cat => ngo.calculateCategoryCapacity(cat))
        );

        // Calculate workload
        const workload = await ngo.calculateWorkload();

        res.status(200).json({
            success: true,
            data: {
                overall: capacity,
                byCategory: categoryCapacities,
                workload,
                activeDistributions: ngo.activeDistributions
            }
        });
    } catch (error) {
        console.error('Get NGO Capacity Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating NGO capacity',
            error: error.message
        });
    }
};

// @desc    Delete volunteer
// @route   DELETE /api/volunteers/:id
// @access  Private (Admin only)
exports.deleteVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        await volunteer.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Volunteer deleted successfully'
        });
    } catch (error) {
        console.error('Delete Volunteer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting volunteer',
            error: error.message
        });
    }
};

// @desc    Assign disaster region to volunteer
// @route   PUT /api/volunteers/:id/assign-region
// @access  Private (NGO)
exports.assignRegion = async (req, res) => {
    try {
        const { disasterId, regionName } = req.body;
        const Disaster = require('../models/Disaster');

        const disaster = await Disaster.findById(disasterId);
        if (!disaster) {
            return res.status(404).json({ success: false, message: 'Disaster not found' });
        }

        const volunteer = await Volunteer.findByIdAndUpdate(
            req.params.id,
            {
                assignedDisaster: disasterId,
                assignedRegion: regionName || disaster.location
            },
            { new: true }
        ).populate('assignedDisaster', 'location disasterType severity coordinates status');

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer not found' });
        }

        // Notify volunteer
        const notif = require('../services/notification.service');
        if (volunteer.userId) {
            await notif.notifyUser(
                volunteer.userId,
                'Region Assigned',
                `You have been assigned to the ${disaster.disasterType} disaster area at ${disaster.location}.`,
                'region_assigned',
                { icon: 'location_on', priority: 'high', link: '/dashboard/volunteer/region' }
            );
        }

        res.status(200).json({ success: true, data: volunteer, message: 'Region assigned successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error assigning region', error: error.message });
    }
};

// @desc    Get volunteer's assigned region/disaster
// @route   GET /api/volunteers/my-region
// @access  Private (Volunteer)
exports.getMyRegion = async (req, res) => {
    try {
        const volunteer = await Volunteer.findOne({ userId: req.user.id })
            .populate('assignedDisaster', 'location disasterType severity coordinates status peopleAffected comments');

        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer profile not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                assignedRegion: volunteer.assignedRegion,
                assignedDisaster: volunteer.assignedDisaster || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching region', error: error.message });
    }
};
