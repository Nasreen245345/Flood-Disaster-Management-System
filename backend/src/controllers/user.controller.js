const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        
        let query = {};
        
        // Filter by role
        if (role) query.role = role;
        
        // Filter by status
        if (status) query.status = status;
        
        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
};

// @desc    Update user status (active/inactive/blocked)
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validate status
        if (!['active', 'inactive', 'blocked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, inactive, or blocked'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (user._id.toString() === req.user.id && status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        user.status = status;
        await user.save();

        console.log(`✅ User ${user.email} status updated to: ${status}`);

        res.status(200).json({
            success: true,
            data: user,
            message: `User status updated to ${status}`
        });
    } catch (error) {
        console.error('Update User Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, region, role } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (region) user.region = region;
        if (role) user.role = role;

        await user.save();

        res.status(200).json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        await user.deleteOne();

        console.log(`✅ User ${user.email} deleted`);

        res.status(200).json({
            success: true,
            data: {},
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        const byRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const byStatus = await User.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentUsers = await User.find()
            .select('name email role createdAt')
            .sort('-createdAt')
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                total: totalUsers,
                byRole,
                byStatus,
                recentUsers
            }
        });
    } catch (error) {
        console.error('Get User Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

// @desc    Update own profile
// @route   PUT /api/users/me
// @access  Private
exports.updateMyProfile = async (req, res) => {
    try {
        const { name, phone, region } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (region) user.region = region;

        // Password change
        if (req.body.newPassword && req.body.currentPassword) {
            const User2 = require('../models/User');
            const userWithPw = await User2.findById(req.user.id).select('+password');
            const match = await userWithPw.comparePassword(req.body.currentPassword);
            if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            user.password = req.body.newPassword;
        }

        await user.save();
        res.status(200).json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
};

// @desc    Get admin dashboard stats (real data)
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
    try {
        const Disaster = require('../models/Disaster');
        const Organization = require('../models/Organization');
        const Volunteer = require('../models/Volunteer');
        const RegionAssignment = require('../models/RegionAssignment');

        const [totalUsers, totalNGOs, totalVolunteers, activeDisasters, pendingAssignments, affectedRegions] = await Promise.all([
            User.countDocuments(),
            Organization.countDocuments({ type: 'ngo' }),
            Volunteer.countDocuments({ status: 'active' }),
            Disaster.countDocuments({ status: { $in: ['active', 'verified'] } }),
            RegionAssignment.countDocuments({ status: 'assigned' }),
            RegionAssignment.countDocuments({ status: { $in: ['assigned', 'in-progress'] } })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalNGOs,
                totalVolunteers,
                activeDisasters,
                affectedRegions,
                pendingAssignments,
                userGrowth: 0,
                ngoGrowth: 0,
                volunteerGrowth: 0,
                disasterGrowth: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
    }
};
