const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    // Basic Information
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: [true, 'Please provide full name'],
        trim: true
    },
    cnic: {
        type: String,
        required: [true, 'Please provide CNIC/National ID'],
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    profilePhoto: {
        type: String // URL to photo
    },

    // NGO Assignment
    assignedNGO: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: [true, 'Please select an NGO to work under']
    },

    // Volunteer Classification
    category: {
        type: String,
        enum: ['medical', 'food_distribution', 'shelter_management', 'logistics', 'general_support'],
        required: [true, 'Please select volunteer category']
    },
    skillLevel: {
        type: String,
        enum: ['beginner', 'trained', 'certified_professional', 'doctor', 'nurse', 'paramedic'],
        required: [true, 'Please select skill level']
    },

    // Capacity Parameters
    serviceRate: {
        type: Number,
        default: 20, // victims per day
        min: 1,
        max: 100
    },
    availabilityStatus: {
        type: String,
        enum: ['active', 'on_call', 'inactive'],
        default: 'active'
    },
    shiftType: {
        type: String,
        enum: ['full_day', 'half_day', 'emergency_only'],
        default: 'full_day'
    },

    // Deployment Details
    assignedRegion: {
        type: String,
        trim: true
    },
    preferredWorkingArea: {
        type: String,
        trim: true
    },
    hasMobility: {
        type: Boolean,
        default: false
    },
    hasVehicle: {
        type: Boolean,
        default: false
    },

    // Verification
    idDocument: {
        type: String // URL to uploaded document
    },
    certification: {
        type: String // URL to certification (for medical)
    },
    verifiedByNGO: {
        type: Boolean,
        default: false
    },
    verifiedByAdmin: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationNotes: {
        type: String
    },

    // Activity Tracking
    totalHoursServed: {
        type: Number,
        default: 0
    },
    totalVictimsServed: {
        type: Number,
        default: 0
    },
    lastActiveDate: {
        type: Date
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for efficient queries
volunteerSchema.index({ assignedNGO: 1, availabilityStatus: 1 });
volunteerSchema.index({ category: 1, skillLevel: 1 });
volunteerSchema.index({ verificationStatus: 1 });

// Virtual for effective service rate based on shift type
volunteerSchema.virtual('effectiveServiceRate').get(function() {
    if (this.shiftType === 'half_day') {
        return Math.floor(this.serviceRate * 0.5);
    } else if (this.shiftType === 'emergency_only') {
        return Math.floor(this.serviceRate * 0.3);
    }
    return this.serviceRate;
});

// Method to check if volunteer counts toward capacity
volunteerSchema.methods.countsTowardCapacity = function() {
    return this.availabilityStatus === 'active' && 
           this.verificationStatus === 'verified' &&
           this.status === 'active';
};

// Static method to calculate NGO human capacity
volunteerSchema.statics.calculateNGOHumanCapacity = async function(ngoId, category = null) {
    const query = {
        assignedNGO: ngoId,
        availabilityStatus: 'active',
        verificationStatus: 'verified',
        status: 'active'
    };

    if (category) {
        query.category = category;
    }

    const volunteers = await this.find(query);
    
    let totalCapacity = 0;
    volunteers.forEach(volunteer => {
        // Adjust service rate based on shift type
        let effectiveRate = volunteer.serviceRate;
        if (volunteer.shiftType === 'half_day') {
            effectiveRate = Math.floor(effectiveRate * 0.5);
        } else if (volunteer.shiftType === 'emergency_only') {
            effectiveRate = Math.floor(effectiveRate * 0.3);
        }
        totalCapacity += effectiveRate;
    });

    return {
        totalVolunteers: volunteers.length,
        totalCapacity,
        averageServiceRate: volunteers.length > 0 ? Math.floor(totalCapacity / volunteers.length) : 0
    };
};

module.exports = mongoose.model('Volunteer', volunteerSchema);
