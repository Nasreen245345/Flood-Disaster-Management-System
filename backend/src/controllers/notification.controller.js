const Notification = require('../models/Notification');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        const notifications = await Notification.find({
            $or: [
                { scope: 'broadcast' },
                { scope: 'role', targetRole: userRole },
                { scope: 'user', targetUser: userId }
            ]
        }).sort('-createdAt').limit(50);

        // Add isRead flag per notification
        const withReadStatus = notifications.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.some(id => id.toString() === userId.toString())
        }));

        const unreadCount = withReadStatus.filter(n => !n.isRead).length;

        res.status(200).json({
            success: true,
            unreadCount,
            data: withReadStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ success: false, message: 'Not found' });

        if (!notification.readBy.includes(req.user._id)) {
            notification.readBy.push(req.user._id);
            await notification.save();
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        const notifications = await Notification.find({
            readBy: { $ne: userId },
            $or: [
                { scope: 'broadcast' },
                { scope: 'role', targetRole: userRole },
                { scope: 'user', targetUser: userId }
            ]
        });

        await Promise.all(notifications.map(n => {
            n.readBy.push(userId);
            return n.save();
        }));

        res.status(200).json({ success: true, message: `Marked ${notifications.length} as read` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
