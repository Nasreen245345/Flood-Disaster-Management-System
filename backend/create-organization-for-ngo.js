require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

const createOrganization = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ MongoDB Connected');

        // Find the NGO user (Akhuwat Foundation based on your screenshot)
        const ngoUser = await User.findOne({ role: 'ngo' });
        
        if (!ngoUser) {
            console.log('❌ No NGO user found in database');
            process.exit(1);
        }

        console.log(`✅ Found NGO user: ${ngoUser.name} (${ngoUser.email})`);

        // Check if organization already exists for this user
        const existingOrg = await Organization.findOne({ adminUser: ngoUser._id });
        if (existingOrg) {
            console.log(`ℹ️  Organization already exists: ${existingOrg.name}`);
            console.log(`   Status: ${existingOrg.status}`);
            
            // Update to approved if not already
            if (existingOrg.status !== 'approved') {
                existingOrg.status = 'approved';
                await existingOrg.save();
                console.log('✅ Updated organization status to approved');
            }
            
            process.exit(0);
        }

        // Create organization for this NGO user
        const organization = await Organization.create({
            name: ngoUser.name || 'Akhuwat Foundation',
            type: 'ngo',
            contact: {
                email: ngoUser.email,
                phone: ngoUser.phone || '+92 300 0000000',
                address: ngoUser.region || 'Pakistan'
            },
            adminUser: ngoUser._id,
            operationalLimit: {
                maxDailyDistributions: 3000,
                maxConcurrentRegions: 8
            },
            serviceRateConfig: {
                defaultRate: 20,
                categoryRates: {
                    medical: 40,
                    food_distribution: 25,
                    shelter_management: 15,
                    logistics: 30,
                    general_support: 20
                }
            },
            inventory: {
                food: 30000,
                medical: 5000,
                shelter: 1000,
                clothing: 3000,
                other: 2000
            },
            status: 'approved',  // Automatically approve
            verificationStatus: 'verified',
            registrationNumber: 'NGO-001',
            description: 'Providing relief and welfare services',
            activeDistributions: 0,
            assignedRegions: []
        });

        console.log('\n✅ Organization created successfully!');
        console.log('─────────────────────────────────────');
        console.log(`Name: ${organization.name}`);
        console.log(`Type: ${organization.type}`);
        console.log(`Status: ${organization.status}`);
        console.log(`Email: ${organization.contact.email}`);
        console.log(`Phone: ${organization.contact.phone}`);
        console.log('─────────────────────────────────────');
        console.log('\n✅ This organization will now appear in the volunteer registration dropdown!');
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating organization:', error);
        process.exit(1);
    }
};

createOrganization();
