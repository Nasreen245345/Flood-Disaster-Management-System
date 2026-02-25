require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

const seedOrganizations = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ MongoDB Connected');

        // Check if organizations already exist
        const existingOrgs = await Organization.countDocuments();
        if (existingOrgs > 0) {
            console.log(`ℹ️  ${existingOrgs} organizations already exist. Skipping seed.`);
            process.exit(0);
        }

        // Find or create NGO users
        const ngoUsers = [];

        // Create Edhi Foundation user if doesn't exist
        let edhiUser = await User.findOne({ email: 'contact@edhi.org.pk' });
        if (!edhiUser) {
            edhiUser = await User.create({
                name: 'Edhi Foundation',
                email: 'contact@edhi.org.pk',
                password: 'edhi123456',
                role: 'ngo',
                phone: '+92 21 3241 3232',
                region: 'National'
            });
            console.log('✅ Created Edhi Foundation user');
        }
        ngoUsers.push(edhiUser);

        // Create Al-Khidmat user if doesn't exist
        let alkhidmatUser = await User.findOne({ email: 'info@alkhidmat.org' });
        if (!alkhidmatUser) {
            alkhidmatUser = await User.create({
                name: 'Al-Khidmat Foundation',
                email: 'info@alkhidmat.org',
                password: 'alkhidmat123456',
                role: 'ngo',
                phone: '+92 42 3755 1212',
                region: 'National'
            });
            console.log('✅ Created Al-Khidmat Foundation user');
        }
        ngoUsers.push(alkhidmatUser);

        // Create Chhipa Welfare user if doesn't exist
        let chhipaUser = await User.findOne({ email: 'info@chhipa.org' });
        if (!chhipaUser) {
            chhipaUser = await User.create({
                name: 'Chhipa Welfare',
                email: 'info@chhipa.org',
                password: 'chhipa123456',
                role: 'ngo',
                phone: '+92 21 111 92 1020',
                region: 'Karachi'
            });
            console.log('✅ Created Chhipa Welfare user');
        }
        ngoUsers.push(chhipaUser);

        // Create organizations
        const organizations = [
            {
                name: 'Edhi Foundation',
                type: 'ngo',
                contact: {
                    email: 'contact@edhi.org.pk',
                    phone: '+92 21 3241 3232',
                    address: 'Boulton Market, Karachi'
                },
                adminUser: edhiUser._id,
                operationalLimit: {
                    maxDailyDistributions: 5000,
                    maxConcurrentRegions: 10
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
                    food: 50000,
                    medical: 10000,
                    shelter: 2000,
                    clothing: 5000,
                    other: 3000
                },
                status: 'approved',
                verificationStatus: 'verified',
                registrationNumber: 'NGO-001-KHI',
                description: 'Pakistan\'s largest welfare organization providing humanitarian services',
                website: 'https://edhi.org'
            },
            {
                name: 'Al-Khidmat Foundation',
                type: 'ngo',
                contact: {
                    email: 'info@alkhidmat.org',
                    phone: '+92 42 3755 1212',
                    address: '56-A, Shadman, Lahore'
                },
                adminUser: alkhidmatUser._id,
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
                status: 'approved',
                verificationStatus: 'verified',
                registrationNumber: 'NGO-002-LHR',
                description: 'Providing relief and welfare services across Pakistan',
                website: 'https://alkhidmat.org'
            },
            {
                name: 'Chhipa Welfare',
                type: 'ngo',
                contact: {
                    email: 'info@chhipa.org',
                    phone: '+92 21 111 92 1020',
                    address: 'FTC Bridge, Shahrah-e-Faisal, Karachi'
                },
                adminUser: chhipaUser._id,
                operationalLimit: {
                    maxDailyDistributions: 1500,
                    maxConcurrentRegions: 5
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
                    food: 20000,
                    medical: 3000,
                    shelter: 500,
                    clothing: 2000,
                    other: 1000
                },
                status: 'approved',
                verificationStatus: 'verified',
                registrationNumber: 'NGO-003-KHI',
                description: 'Emergency ambulance and welfare services',
                website: 'https://chhipa.org'
            }
        ];

        const createdOrgs = await Organization.insertMany(organizations);
        console.log(`✅ Created ${createdOrgs.length} organizations`);

        console.log('\n📋 NGO Login Credentials:');
        console.log('─────────────────────────────────────');
        console.log('1. Edhi Foundation');
        console.log('   Email: contact@edhi.org.pk');
        console.log('   Password: edhi123456');
        console.log('');
        console.log('2. Al-Khidmat Foundation');
        console.log('   Email: info@alkhidmat.org');
        console.log('   Password: alkhidmat123456');
        console.log('');
        console.log('3. Chhipa Welfare');
        console.log('   Email: info@chhipa.org');
        console.log('   Password: chhipa123456');
        console.log('─────────────────────────────────────\n');

        console.log('✅ Database seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedOrganizations();
