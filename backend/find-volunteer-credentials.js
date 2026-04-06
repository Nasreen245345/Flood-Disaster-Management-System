require('dotenv').config();
const mongoose = require('mongoose');
const Volunteer = require('./src/models/Volunteer');
const User = require('./src/models/User');

async function findVolunteerCredentials() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Find volunteer by name
        const volunteer = await Volunteer.findOne({ fullName: /Niyaz Ali/i })
            .populate('userId', 'email role');
        
        if (!volunteer) {
            console.log('❌ Volunteer "Niyaz Ali" not found');
            console.log('\n📋 Available volunteers:');
            const allVolunteers = await Volunteer.find().populate('userId', 'email');
            allVolunteers.forEach(v => {
                console.log(`   - ${v.fullName} (${v.userId?.email || 'No email'})`);
            });
            process.exit(1);
        }

        console.log('✅ VOLUNTEER FOUND!');
        console.log('=====================================');
        console.log('Name:', volunteer.fullName);
        console.log('Phone:', volunteer.phone);
        console.log('Category:', volunteer.category);
        console.log('Status:', volunteer.verificationStatus);
        console.log('\n📧 LOGIN CREDENTIALS:');
        console.log('Email:', volunteer.userId?.email || 'Not found');
        console.log('Password: password123 (default)');
        console.log('Role:', volunteer.userId?.role || 'volunteer');
        console.log('=====================================');
        console.log('\n🔑 Use these credentials to login at:');
        console.log('   http://localhost:4200/auth/login');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

findVolunteerCredentials();
