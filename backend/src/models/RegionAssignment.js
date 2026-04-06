const mongoose = require('mongoose');

const regionAssignmentSchema = new mongoose.Schema({
    disaster: {
        type: mongoose.Schema.ObjectId,
        ref: 'Disaster',
        required: [true, 'Please provide disaster reference']
    },
    disasterName: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: [true, 'Please provide region name'],
        trim: true
    },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    assignedNGOs: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Organization'
    }],
    resourceRequirements: {
        food: {
            type: Number,
            default: 0,
            min: 0
        },
        medical: {
            type: Number,
            default: 0,
            min: 0
        },
        shelter: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    resourceCoverage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    affectedPopulation: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['assigned', 'in-progress', 'completed', 'cancelled'],
        default: 'assigned'
    },
    assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String,
        maxlength: 1000
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
regionAssignmentSchema.index({ disaster: 1, region: 1 });
regionAssignmentSchema.index({ status: 1 });
regionAssignmentSchema.index({ assignedNGOs: 1 });

// Virtual for assignment duration
regionAssignmentSchema.virtual('duration').get(function() {
    if (this.completedAt) {
        return Math.floor((this.completedAt - this.createdAt) / (1000 * 60 * 60 * 24)); // days
    }
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

module.exports = mongoose.model('RegionAssignment', regionAssignmentSchema);
