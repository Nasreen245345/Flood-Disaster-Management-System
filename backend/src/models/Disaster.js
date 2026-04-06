const mongoose = require('mongoose');

const disasterSchema = new mongoose.Schema({
    location: {
        type: String,
        required: [true, 'Please provide the location of the disaster'],
        trim: true
    },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    disasterType: {
        type: String,
        enum: ['flood', 'fire', 'earthquake', 'landslide', 'cyclone', 'accident', 'other'],
        required: [true, 'Please specify the type of disaster']
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        required: true
    },
    peopleAffected: {
        type: Number,
        min: 0,
        default: 0
    },
    needs: {
        food: { type: Boolean, default: false },
        water: { type: Boolean, default: false },
        shelter: { type: Boolean, default: false },
        medical: { type: Boolean, default: false },
        rescue: { type: Boolean, default: false },
        other: { type: Boolean, default: false }
    },
    comments: {
        type: String,
        maxlength: [2000, 'Comments cannot exceed 2000 characters']
    },
    contactName: {
        type: String,
        trim: true
    },
    contactPhone: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['reported', 'verified', 'active', 'contained', 'resolved'],
        default: 'reported'
    },
    reportedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for location-based queries
disasterSchema.index({ location: 'text' });
disasterSchema.index({ status: 1, severity: -1 });
disasterSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

module.exports = mongoose.model('Disaster', disasterSchema);
