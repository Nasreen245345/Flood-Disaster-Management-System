const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: [
            'disaster_reported', 'disaster_updated',
            'aid_request_assigned', 'aid_request_approved', 'aid_request_fulfilled',
            'distribution_point_announced', 'shift_assigned', 'shift_starting', 'shift_ended',
            'task_assigned', 'task_completed',
            'volunteer_registered', 'volunteer_verified',
            'ngo_registered', 'region_assigned',
            'inventory_low', 'general'
        ],
        default: 'general'
    },
    // Targeting
    scope: {
        type: String,
        enum: ['broadcast', 'role', 'user'],
        required: true
    },
    targetRole: {
        type: String,
        enum: ['admin', 'ngo', 'volunteer', 'victim'],
        default: null
    },
    targetUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    // Read tracking per user
    readBy: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    // Optional link to related resource
    link: { type: String, default: null },
    icon: { type: String, default: 'notifications' },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    }
}, { timestamps: true });

notificationSchema.index({ scope: 1, targetRole: 1 });
notificationSchema.index({ targetUser: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
