require('dotenv').config();
const mongoose = require('mongoose');
const Disaster = require('./src/models/Disaster');

const disasters = [
    {
        location: 'Karachi, Hyderabad, Thatta',
        disasterType: 'flood',
        severity: 'high',
        peopleAffected: 25000,
        needs: {
            food: true,
            water: true,
            shelter: true,
            medical: true,
            rescue: false,
            other: false
        },
        comments: 'Heavy torrential rains causing urban flooding in DHA and Clifton areas. Multiple roads submerged.',
        contactName: 'Ahmed Khan',
        contactPhone: '+92 300 1234567',
        status: 'active'
    },
    {
        location: 'Murree, Galyat',
        disasterType: 'landslide',
        severity: 'critical',
        peopleAffected: 1000,
        needs: {
            food: true,
            water: false,
            shelter: true,
            medical: true,
            rescue: true,
            other: false
        },
        comments: 'Major landslide blocking Murree Expressway. Multiple tourists stranded. Immediate rescue required.',
        contactName: 'Bilal Ahmed',
        contactPhone: '+92 321 9876543',
        status: 'active'
    },
    {
        location: 'Rawalpindi',
        disasterType: 'fire',
        severity: 'medium',
        peopleAffected: 500,
        needs: {
            food: true,
            water: false,
            shelter: true,
            medical: true,
            rescue: false,
            other: false
        },
        comments: 'Short circuit caused fire in Raja Bazaar commercial market. Fire now extinguished but many shops destroyed.',
        contactName: 'Usman Ali',
        contactPhone: '+92 333 4567890',
        status: 'resolved'
    },
    {
        location: 'Gwadar, Pasni, Ormara',
        disasterType: 'cyclone',
        severity: 'high',
        peopleAffected: 15000,
        needs: {
            food: true,
            water: true,
            shelter: true,
            medical: true,
            rescue: false,
            other: true
        },
        comments: 'Cyclone approaching Makran coastal belt. Section 144 imposed. Evacuation in progress.',
        contactName: 'Rashid Minhas',
        contactPhone: '+92 300 7654321',
        status: 'active'
    },
    {
        location: 'Quetta',
        disasterType: 'earthquake',
        severity: 'critical',
        peopleAffected: 5000,
        needs: {
            food: true,
            water: true,
            shelter: true,
            medical: true,
            rescue: true,
            other: false
        },
        comments: 'Magnitude 6.2 earthquake hit Quetta and surrounding areas. Multiple buildings damaged. Rescue operations ongoing.',
        contactName: 'Hamza Malik',
        contactPhone: '+92 301 2345678',
        status: 'active'
    },
    {
        location: 'Lahore',
        disasterType: 'accident',
        severity: 'medium',
        peopleAffected: 200,
        needs: {
            food: false,
            water: false,
            shelter: false,
            medical: true,
            rescue: false,
            other: false
        },
        comments: 'Major traffic accident on Lahore-Islamabad Motorway involving multiple vehicles. Medical assistance required.',
        contactName: 'Ayesha Khan',
        contactPhone: '+92 321 8765432',
        status: 'contained'
    }
];

async function seedDisasters() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Clear existing disasters (optional - comment out if you want to keep existing data)
        // await Disaster.deleteMany({});
        // console.log('🗑️  Cleared existing disasters');

        // Insert disasters
        const createdDisasters = await Disaster.insertMany(disasters);
        console.log(`✅ Successfully added ${createdDisasters.length} disasters`);

        // Display created disasters
        createdDisasters.forEach(disaster => {
            console.log(`\n📍 ${disaster.location} - ${disaster.disasterType.toUpperCase()}`);
            console.log(`   Severity: ${disaster.severity}`);
            console.log(`   Status: ${disaster.status}`);
            console.log(`   People Affected: ${disaster.peopleAffected}`);
            console.log(`   ID: ${disaster._id}`);
        });

        console.log('\n✅ Disaster seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding disasters:', error);
        process.exit(1);
    }
}

seedDisasters();
