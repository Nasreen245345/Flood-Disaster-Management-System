const mongoose = require('mongoose');

const aidRequestSchema = new mongoose.Schema({
    // Victim Information
    victimName: {
        type: String,
        required: [true, 'Please provide victim name'],
        trim: true
    },
    victimCNIC: {
        type: String,
        required: [true, 'Please provide victim CNIC'],
        trim: true
    },
    victimPhone: {
        type: String,
        required: [true, 'Please provide victim phone number'],
        trim: true
    },
    
    // Request Details
    location: {
        type: String,
        required: [true, 'Please provide location coordinates']
    },
    
    // Parsed Coordinates (for easier querying and map display)
    coordinates: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    
    // Package Categories Needed (using packaging model)
    packagesNeeded: [{
        category: {
            type: String,
            enum: ['food', 'medical', 'shelter', 'clothing'],
            required: true
        },
        packageName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        }
    }],
    
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    peopleCount: {
        type: Number,
        required: [true, 'Please specify the number of people affected'],
        min: [1, 'People count must be at least 1']
    },
    
    additionalNotes: {
        type: String,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    },
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'in_progress', 'fulfilled', 'rejected'],
        default: 'pending'
    },
    
    // User who submitted (if logged in)
    requester: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    
    // Assigned NGO
    assignedNGO: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization'
    },

    // Assigned Disaster (set when NGO is assigned via routing)
    assignedDisaster: {
        type: mongoose.Schema.ObjectId,
        ref: 'Disaster'
    },
    
    // Fulfillment tracking
    fulfilledBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    fulfilledDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
aidRequestSchema.index({ status: 1, urgency: -1 });
aidRequestSchema.index({ victimCNIC: 1 });
aidRequestSchema.index({ assignedNGO: 1 });

module.exports = mongoose.model('AidRequest', aidRequestSchema);
