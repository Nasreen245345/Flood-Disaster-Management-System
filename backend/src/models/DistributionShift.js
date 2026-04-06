const mongoose = require('mongoose');

const distributionShiftSchema = new mongoose.Schema({
    // Organization
    organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: true
    },
    
    // Distribution Point Details
    location: {
        type: String,
        required: [true, 'Please provide distribution point location'],
        trim: true
    },
    
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    
    // Shift Timing
    shiftStart: {
        type: Date,
        required: [true, 'Please provide shift start time']
    },
    
    shiftEnd: {
        type: Date,
        required: [true, 'Please provide shift end time']
    },
    
    // Assigned Volunteer
    assignedVolunteer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Volunteer',
        default: null
    },
    
    // Shift Status
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    
    // Tracking
    aidRequestsHandled: [{
        aidRequest: {
            type: mongoose.Schema.ObjectId,
            ref: 'AidRequest'
        },
        handledAt: {
            type: Date,
            default: Date.now
        },
        victimCNIC: String
    }],
    
    // Statistics
    totalDistributions: {
        type: Number,
        default: 0
    },
    
    // Notes
    notes: {
        type: String,
        maxlength: 500
    },
    
    // Created by
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
distributionShiftSchema.index({ organization: 1, status: 1 });
distributionShiftSchema.index({ assignedVolunteer: 1, status: 1 });
distributionShiftSchema.index({ shiftStart: 1, shiftEnd: 1 });

// Method to check if shift is currently active
distributionShiftSchema.methods.isCurrentlyActive = function() {
    const now = new Date();
    return this.status === 'active' && 
           now >= this.shiftStart && 
           now <= this.shiftEnd;
};

// Method to auto-update status based on time
distributionShiftSchema.methods.updateStatusByTime = async function() {
    const now = new Date();
    
    if (this.status === 'scheduled' && now >= this.shiftStart && now <= this.shiftEnd) {
        this.status = 'active';
        await this.save();
    } else if (this.status === 'active' && now > this.shiftEnd) {
        this.status = 'completed';
        await this.save();
    }
    
    return this.status;
};

module.exports = mongoose.model('DistributionShift', distributionShiftSchema);
