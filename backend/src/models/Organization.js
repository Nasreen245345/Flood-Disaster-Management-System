const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide organization name'],
        trim: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['ngo', 'government', 'private'],
        required: true
    },
    
    // Contact Information
    contact: {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true
        }
    },

    // Linked User Account (NGO admin)
    adminUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    // Operational Capacity (Self-declared by NGO)
    operationalLimit: {
        maxDailyDistributions: {
            type: Number,
            default: 1000,
            min: 0
        },
        maxConcurrentRegions: {
            type: Number,
            default: 5,
            min: 1
        }
    },

    // Service Rate Configuration
    serviceRateConfig: {
        defaultRate: {
            type: Number,
            default: 20 // victims per volunteer per day
        },
        categoryRates: {
            medical: { type: Number, default: 40 },
            food_distribution: { type: Number, default: 25 },
            shelter_management: { type: Number, default: 15 },
            logistics: { type: Number, default: 30 },
            general_support: { type: Number, default: 20 }
        }
    },

    // Inventory (Package-based system)
    inventory: [{
        packageName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['food', 'medical', 'shelter', 'clothing'],
            required: true
        },
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        description: {
            type: String
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],

    // Current Active Operations
    activeDistributions: {
        type: Number,
        default: 0
    },
    assignedRegions: [{
        type: String
    }],

    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'disabled', 'suspended'],
        default: 'pending'
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'verified', 'rejected'],
        default: 'unverified'
    },

    // Registration Documents
    registrationNumber: {
        type: String,
        trim: true
    },
    documents: [{
        type: String // URLs to uploaded documents
    }],

    // Metadata
    description: {
        type: String,
        maxlength: 1000
    },
    website: {
        type: String
    },
    logo: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for volunteer count
organizationSchema.virtual('volunteers', {
    ref: 'Volunteer',
    localField: '_id',
    foreignField: 'assignedNGO'
});

// Method to calculate effective capacity
organizationSchema.methods.calculateEffectiveCapacity = async function() {
    const Volunteer = mongoose.model('Volunteer');
    
    // 1. Calculate Human Capacity
    const humanCapacity = await Volunteer.calculateNGOHumanCapacity(this._id);
    
    // 2. Calculate Resource Capacity (sum of all package quantities)
    const resourceCapacity = this.inventory.reduce((total, item) => total + item.quantity, 0);
    
    // 3. Get Operational Limit
    const operationalCapacity = this.operationalLimit.maxDailyDistributions;
    
    // 4. Effective Capacity = MIN of all three
    const effectiveCapacity = Math.min(
        humanCapacity.totalCapacity,
        resourceCapacity,
        operationalCapacity
    );
    
    return {
        humanCapacity: humanCapacity.totalCapacity,
        resourceCapacity,
        operationalCapacity,
        effectiveCapacity,
        volunteers: humanCapacity.totalVolunteers,
        limitingFactor: this.getLimitingFactor(humanCapacity.totalCapacity, resourceCapacity, operationalCapacity)
    };
};

// Method to calculate category-specific capacity
organizationSchema.methods.calculateCategoryCapacity = async function(category) {
    const Volunteer = mongoose.model('Volunteer');
    
    // Human capacity for this category
    const humanCapacity = await Volunteer.calculateNGOHumanCapacity(this._id, category);
    
    // Resource capacity for this category (sum packages in this category)
    const resourceCapacity = this.inventory
        .filter(item => item.category === category)
        .reduce((total, item) => total + item.quantity, 0);
    
    // Effective capacity
    const effectiveCapacity = Math.min(humanCapacity.totalCapacity, resourceCapacity);
    
    return {
        category,
        humanCapacity: humanCapacity.totalCapacity,
        resourceCapacity,
        effectiveCapacity,
        volunteers: humanCapacity.totalVolunteers
    };
};

// Method to calculate workload percentage
organizationSchema.methods.calculateWorkload = async function() {
    const capacity = await this.calculateEffectiveCapacity();
    
    if (capacity.effectiveCapacity === 0) {
        return 0;
    }
    
    const workloadPercentage = (this.activeDistributions / capacity.effectiveCapacity) * 100;
    return Math.min(Math.round(workloadPercentage), 100);
};

// Helper method to determine limiting factor
organizationSchema.methods.getLimitingFactor = function(human, resource, operational) {
    const min = Math.min(human, resource, operational);
    if (min === human) return 'volunteers';
    if (min === resource) return 'resources';
    return 'operational_limit';
};

// Index for efficient queries
organizationSchema.index({ status: 1, type: 1 });
organizationSchema.index({ adminUser: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
