require('dotenv').config();
const mongoose = require('mongoose');
const RegionAssignment = require('./src/models/RegionAssignment');
const Disaster = require('./src/models/Disaster');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

async function seedAssignments() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Get an admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }
        console.log('✅ Found admin user:', admin.name);

        // Get active disasters
        const disasters = await Disaster.find({ status: { $in: ['active', 'verified'] } }).limit(3);
        if (disasters.length === 0) {
            console.log('❌ No active disasters found. Please add disasters first.');
            process.exit(1);
        }
        console.log(`✅ Found ${disasters.length} active disasters`);

        // Get approved NGOs
        const ngos = await Organization.find({ status: 'approved', type: 'ngo' }).limit(3);
        if (ngos.length === 0) {
            console.log('❌ No approved NGOs found. Please add NGOs first.');
            process.exit(1);
        }
        console.log(`✅ Found ${ngos.length} approved NGOs`);

        // Clear existing assignments (optional)
        // await RegionAssignment.deleteMany({});
        // console.log('🗑️  Cleared existing assignments');

        // Create sample assignments
        const assignments = [];

        // Assignment 1: Karachi flood - assign to first 2 NGOs
        if (disasters[0]) {
            const regions = disasters[0].location.split(',').map(r => r.trim());
            if (regions.length > 0) {
                assignments.push({
                    disaster: disasters[0]._id,
                    disasterName: `${regions[0]} ${disasters[0].disasterType}`,
                    region: regions[0],
                    assignedNGOs: ngos.slice(0, 2).map(ngo => ngo._id),
                    resourceRequirements: {
                        food: 10000,
                        medical: 2000,
                        shelter: 500
                    },
                    resourceCoverage: 85,
                    affectedPopulation: Math.floor(disasters[0].peopleAffected / regions.length),
                    status: 'in-progress',
                    assignedBy: admin._id
                });
            }
        }

        // Assignment 2: Second disaster - assign to NGO 2 and 3
        if (disasters[1] && ngos.length >= 3) {
            const regions = disasters[1].location.split(',').map(r => r.trim());
            if (regions.length > 0) {
                assignments.push({
                    disaster: disasters[1]._id,
                    disasterName: `${regions[0]} ${disasters[1].disasterType}`,
                    region: regions[0],
                    assignedNGOs: ngos.slice(1, 3).map(ngo => ngo._id),
                    resourceRequirements: {
                        food: 500,
                        medical: 100,
                        shelter: 50
                    },
                    resourceCoverage: 60,
                    affectedPopulation: Math.floor(disasters[1].peopleAffected / regions.length),
                    status: 'assigned',
                    assignedBy: admin._id
                });
            }
        }

        // Assignment 3: Third disaster - completed assignment
        if (disasters[2]) {
            const regions = disasters[2].location.split(',').map(r => r.trim());
            if (regions.length > 1) {
                assignments.push({
                    disaster: disasters[2]._id,
                    disasterName: `${regions[1]} ${disasters[2].disasterType}`,
                    region: regions[1] || regions[0],
                    assignedNGOs: [ngos[0]._id],
                    resourceRequirements: {
                        food: 3000,
                        medical: 300,
                        shelter: 200
                    },
                    resourceCoverage: 100,
                    affectedPopulation: Math.floor(disasters[2].peopleAffected / regions.length),
                    status: 'completed',
                    assignedBy: admin._id,
                    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                });
            }
        }

        // Insert assignments
        if (assignments.length > 0) {
            const createdAssignments = await RegionAssignment.insertMany(assignments);
            console.log(`✅ Successfully created ${createdAssignments.length} assignments`);

            // Display created assignments
            for (const assignment of createdAssignments) {
                const populated = await RegionAssignment.findById(assignment._id)
                    .populate('disaster', 'location disasterType')
                    .populate('assignedNGOs', 'name');
                
                console.log(`\n📍 ${populated.region} - ${populated.disasterName}`);
                console.log(`   Status: ${populated.status}`);
                console.log(`   NGOs: ${populated.assignedNGOs.map(n => n.name).join(', ')}`);
                console.log(`   Coverage: ${populated.resourceCoverage}%`);
                console.log(`   Population: ${populated.affectedPopulation}`);
                console.log(`   ID: ${populated._id}`);
            }
        } else {
            console.log('⚠️  No assignments created. Check if disasters have regions.');
        }

        console.log('\n✅ Assignment seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding assignments:', error);
        process.exit(1);
    }
}

seedAssignments();
