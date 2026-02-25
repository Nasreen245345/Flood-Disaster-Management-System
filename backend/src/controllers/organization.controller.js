const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Register new organization
// @route   POST /api/organizations
// @access  Private (NGO user)
exports.registerOrganization = async (req, res) => {
    try {
        console.log('=== REGISTER ORGANIZATION ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));

        // Check if user already has an organization
        const existingOrg = await Organization.findOne({ adminUser: req.user.id });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'You already have a registered organization'
            });
        }

        // Create organization
        req.body.adminUser = req.user.id;
        const organization = await Organization.create(req.body);

        console.log('✅ Organization Registered:', organization._id);

        res.status(201).json({
            success: true,
            data: organization,
            message: 'Organization registered successfully. Awaiting admin approval.'
        });
    } catch (error) {
        console.error('❌ Register Organization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering organization',
            error: error.message
        });
    }
};

// @desc    Get all organizations
// @route   GET /api/organizations
// @access  Private (Admin)
exports.getAllOrganizations = async (req, res) => {
    try {
        const { type, status } = req.query;
        
        let query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const organizations = await Organization.find(query)
            .populate('adminUser', 'name email phone')
            .populate('volunteers')
            .sort('-createdAt');

        // Calculate capacity for each organization
        const orgsWithCapacity = await Promise.all(
            organizations.map(async (org) => {
                const capacity = await org.calculateEffectiveCapacity();
                const workload = await org.calculateWorkload();
                
                return {
                    ...org.toObject(),
                    capacity,
                    workload
                };
            })
        );

        res.status(200).json({
            success: true,
            count: orgsWithCapacity.length,
            data: orgsWithCapacity
        });
    } catch (error) {
        console.error('Get All Organizations Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching organizations',
            error: error.message
        });
    }
};

// @desc    Get my organization
// @route   GET /api/organizations/me
// @access  Private (NGO user)
exports.getMyOrganization = async (req, res) => {
    try {
        const organization = await Organization.findOne({ adminUser: req.user.id })
            .populate('volunteers');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Calculate capacity
        const capacity = await organization.calculateEffectiveCapacity();
        const workload = await organization.calculateWorkload();

        res.status(200).json({
            success: true,
            data: {
                ...organization.toObject(),
                capacity,
                workload
            }
        });
    } catch (error) {
        console.error('Get My Organization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching organization',
            error: error.message
        });
    }
};

// @desc    Get single organization
// @route   GET /api/organizations/:id
// @access  Private
exports.getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id)
            .populate('adminUser', 'name email phone')
            .populate('volunteers');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Calculate capacity
        const capacity = await organization.calculateEffectiveCapacity();
        const workload = await organization.calculateWorkload();

        res.status(200).json({
            success: true,
            data: {
                ...organization.toObject(),
                capacity,
                workload
            }
        });
    } catch (error) {
        console.error('Get Organization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching organization',
            error: error.message
        });
    }
};

// @desc    Update organization status
// @route   PUT /api/organizations/:id/status
// @access  Private (Admin only)
exports.updateOrganizationStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'disabled', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        organization.status = status;
        await organization.save();

        console.log(`✅ Organization ${organization.name} status updated to: ${status}`);

        res.status(200).json({
            success: true,
            data: organization,
            message: `Organization status updated to ${status}`
        });
    } catch (error) {
        console.error('Update Organization Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating organization status',
            error: error.message
        });
    }
};

// @desc    Update organization inventory
// @route   PUT /api/organizations/:id/inventory
// @access  Private (NGO or Admin)
exports.updateInventory = async (req, res) => {
    try {
        console.log('=== UPDATE INVENTORY ===');
        console.log('Organization ID:', req.params.id);
        console.log('User ID:', req.user.id);
        console.log('Request Body Keys:', Object.keys(req.body));

        // First, find the organization to check authorization
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            console.log('❌ Organization not found');
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Check authorization
        if (organization.adminUser.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('❌ Not authorized');
            console.log('Admin User:', organization.adminUser.toString());
            console.log('Current User:', req.user.id);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this organization'
            });
        }

        // Validate and clean inventory data
        if (!req.body.inventory || !Array.isArray(req.body.inventory)) {
            console.log('❌ Invalid inventory data');
            return res.status(400).json({
                success: false,
                message: 'Inventory must be an array'
            });
        }

        console.log('✅ Received', req.body.inventory.length, 'packages');

        // Clean and validate each item
        const cleanInventory = req.body.inventory.map((item, index) => {
            if (!item.packageName || !item.category) {
                console.error(`❌ Item ${index} missing required fields:`, item);
                throw new Error(`Item ${index} is missing packageName or category`);
            }

            return {
                packageName: String(item.packageName),
                category: String(item.category),
                quantity: Number(item.quantity) || 0,
                description: String(item.description || ''),
                lastUpdated: new Date()
            };
        });

        console.log('✅ Clean inventory prepared:', cleanInventory.length, 'items');

        // Use findByIdAndUpdate with $set to replace the entire inventory array
        const updatedOrg = await Organization.findByIdAndUpdate(
            req.params.id,
            { $set: { inventory: cleanInventory } },
            { 
                new: true, // Return the updated document
                runValidators: true // Run schema validators
            }
        );

        if (!updatedOrg) {
            console.log('❌ Failed to update organization');
            return res.status(500).json({
                success: false,
                message: 'Failed to update organization'
            });
        }

        console.log(`✅ Inventory updated successfully for ${updatedOrg.name}`);
        console.log(`✅ New inventory count: ${updatedOrg.inventory.length} items`);

        res.status(200).json({
            success: true,
            data: updatedOrg,
            message: 'Inventory updated successfully'
        });
    } catch (error) {
        console.error('❌ Update Inventory Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error updating inventory',
            error: error.message
        });
    }
};

// @desc    Update active distributions count
// @route   PUT /api/organizations/:id/distributions
// @access  Private (NGO or Admin)
exports.updateActiveDistributions = async (req, res) => {
    try {
        const { activeDistributions } = req.body;

        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        organization.activeDistributions = activeDistributions;
        await organization.save();

        // Calculate new workload
        const workload = await organization.calculateWorkload();

        res.status(200).json({
            success: true,
            data: {
                activeDistributions: organization.activeDistributions,
                workload
            },
            message: 'Active distributions updated'
        });
    } catch (error) {
        console.error('Update Distributions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating distributions',
            error: error.message
        });
    }
};

// @desc    Update organization details
// @route   PUT /api/organizations/:id
// @access  Private (NGO or Admin)
exports.updateOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Check authorization
        if (organization.adminUser.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this organization'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'name', 'contact', 'operationalLimit', 'serviceRateConfig',
            'description', 'website', 'logo'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                organization[field] = req.body[field];
            }
        });

        await organization.save();

        res.status(200).json({
            success: true,
            data: organization,
            message: 'Organization updated successfully'
        });
    } catch (error) {
        console.error('Update Organization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating organization',
            error: error.message
        });
    }
};

// @desc    Delete organization
// @route   DELETE /api/organizations/:id
// @access  Private (Admin only)
exports.deleteOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        await organization.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Organization deleted successfully'
        });
    } catch (error) {
        console.error('Delete Organization Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting organization',
            error: error.message
        });
    }
};

// @desc    Get approved NGOs list (for volunteer registration)
// @route   GET /api/organizations/approved/list
// @access  Public or Private
exports.getApprovedNGOs = async (req, res) => {
    try {
        const ngos = await Organization.find({
            type: 'ngo',
            status: 'approved'
        }).select('name type contact logo');

        res.status(200).json({
            success: true,
            count: ngos.length,
            data: ngos
        });
    } catch (error) {
        console.error('Get Approved NGOs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approved NGOs',
            error: error.message
        });
    }
};
