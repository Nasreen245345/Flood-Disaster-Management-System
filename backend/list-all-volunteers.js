require('dotenv').config();
const mongoose = require('mongoose');
const Volunteer = require('./src/models/Volunteer');
const User = require('./src/models/User');

async function listAllVolunteers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Find all volunteers
        const volunteers = await Volunteer.find().populate('userId', 'email role');
        
        if (volunteers.length === 0) {
            console.log('❌ No volunteers found in database');
            process.exit(1);
        }

        console.log(`📋 FOUND ${volunteers.length} VOLUNTEERS:\n`);
        console.log('=====================================');
        
        volunteers.forEach((v, index) => {
            console.log(`\n${index + 1}. ${v.fullName}`);
            console.log('   Phone:', v.phone);
            console.log('   Category:', v.category);
            console.log('   Status:', v.verificationStatus);
            console.log('   Email:', v.userId?.email || 'No user account');
            console.log('   Role:', v.userId?.role || 'N/A');
            console.log('   Password: password123 (default)');
        });
        
        console.log('\n=====================================');
        console.log('\n💡 TIP: Look for volunteers with role "volunteer"');
        console.log('   Those are the ones you can login with as volunteer.');

        // Find volunteers with correct role
        const correctVolunteers = volunteers.filter(v => v.userId?.role === 'volunteer');
        if (correctVolunteers.length > 0) {
            console.log('\n✅ VOLUNTEERS WITH CORRECT ROLE:');
            correctVolunteers.forEach(v => {
                console.log(`   - ${v.fullName}: ${v.userId.email}`);
            });
        } else {
            console.log('\n⚠️  WARNING: No volunteers have role "volunteer"');
            console.log('   You may need to create a volunteer user account.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAllVolunteers();
