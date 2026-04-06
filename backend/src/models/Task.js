const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    // Basic Information
    taskType: {
        type: String,
        enum: [
            'delivery',      // General delivery task
            'warehouse',     // Warehouse operations
            'field_work',    // Field verification/assessment
            'other'          // Other tasks
        ],
        required: true
    },
    
    title: {
        type: String,
        required: [true, 'Please provide task title'],
        trim: true
    },
    
    description: {
        type: String,
        required: [true, 'Please provide task description']
    },
    
    // Relationships
    organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: true
    },
    
    relatedAidRequest: {
        type: mongoose.Schema.ObjectId,
        ref: 'AidRequest',
        default: null
    },
    
    assignedVolunteer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Volunteer',
        default: null
    },
    
    // Task Details
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // Location (optional)
    location: {
        type: String
    },
    
    // Scheduling
    dueDate: {
        type: Date
    },
    
    // Completion tracking
    completedAt: {
        type: Date
    },
    
    completionNotes: {
        type: String
    },
    
    // Created by
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ organization: 1, status: 1 });
taskSchema.index({ assignedVolunteer: 1, status: 1 });
taskSchema.index({ priority: -1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
