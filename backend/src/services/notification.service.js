const Notification = require('../models/Notification');

// Create a broadcast notification (all users)
exports.broadcast = async (title, message, type, options = {}) => {
    return Notification.create({
        title, message, type,
        scope: 'broadcast',
        icon: options.icon || 'notifications',
        priority: options.priority || 'medium',
        link: options.link || null
    });
};

// Create a role-targeted notification (all users of a role)
exports.notifyRole = async (role, title, message, type, options = {}) => {
    return Notification.create({
        title, message, type,
        scope: 'role',
        targetRole: role,
        icon: options.icon || 'notifications',
        priority: options.priority || 'medium',
        link: options.link || null
    });
};

// Create a user-specific notification
exports.notifyUser = async (userId, title, message, type, options = {}) => {
    return Notification.create({
        title, message, type,
        scope: 'user',
        targetUser: userId,
        icon: options.icon || 'notifications',
        priority: options.priority || 'medium',
        link: options.link || null
    });
};
