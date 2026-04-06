require('dotenv').config();
const mongoose = require('mongoose');
const DistributionShift = require('./src/models/DistributionShift');
const Volunteer = require('./src/models/Volunteer');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

async function createTestShift() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Find first volunteer with role "volunteer"
        const volunteer = await Volunteer.findOne().populate('userId', 'role email');
        if (!volunteer) {
            console.log('❌ No volunteer found. Please create a volunteer first.');
            process.exit(1);
        }
        
        // Check if user has correct role
        if (volunteer.userId?.role !== 'volunteer') {
            console.log(`⚠️  Warning: ${volunteer.fullName} has role "${volunteer.userId?.role}" instead of "volunteer"`);
            console.log('   Looking for a volunteer with correct role...');
            
            // Find all volunteers and check their roles
            const allVolunteers = await Volunteer.find().populate('userId', 'role email');
            const correctVolunteer = allVolunteers.find(v => v.userId?.role === 'volunteer');
            
            if (correctVolunteer) {
                console.log(`✅ Found volunteer with correct role: ${correctVolunteer.fullName} (${correctVolunteer.userId.email})`);
                volunteer._id = correctVolunteer._id;
                volunteer.fullName = correctVolunteer.fullName;
                volunteer.assignedNGO = correctVolunteer.assignedNGO;
                volunteer.userId = correctVolunteer.userId;
            } else {
                console.log('❌ No volunteer with role "volunteer" found');
                process.exit(1);
            }
        } else {
            console.log(`✅ Found volunteer: ${volunteer.fullName} (${volunteer.userId.email})`);
        }

        // Find volunteer's organization
        const organization = await Organization.findById(volunteer.assignedNGO);
        if (!organization) {
            console.log('❌ No organization found for volunteer');
            process.exit(1);
        }
        console.log(`✅ Found organization: ${organization.name}`);

        // Create shift for TODAY (all day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const shift = await DistributionShift.create({
            organization: organization._id,
            location: 'Test Distribution Point - Main Center',
            shiftStart: today,
            shiftEnd: tomorrow,
            assignedVolunteer: volunteer._id,
            status: 'active', // Set to active immediately
            notes: 'Test shift created by script',
            createdBy: volunteer.userId
        });

        console.log('\n✅ TEST SHIFT CREATED SUCCESSFULLY!');
        console.log('=====================================');
        console.log('Shift ID:', shift._id);
        console.log('Location:', shift.location);
        console.log('Volunteer:', volunteer.fullName);
        console.log('Organization:', organization.name);
        console.log('Start:', shift.shiftStart);
        console.log('End:', shift.shiftEnd);
        console.log('Status:', shift.status);
        console.log('=====================================');
        console.log('\n🔑 LOGIN CREDENTIALS:');
        console.log('Email:', volunteer.userId.email);
        console.log('Password: password123');
        console.log('=====================================');
        console.log('\n🎉 Now login with the credentials above and go to Distribution Point!');
        console.log('   You should see the Active Shift card.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestShift();
