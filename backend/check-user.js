require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUsers() {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const users = await User.find({ role: 'volunteer' }).select('email role name createdAt');
    console.log('\n✅ VOLUNTEER USERS IN DATABASE:');
    console.log('=====================================');
    users.forEach(u => {
        console.log(`Name: ${u.name}`);
        console.log(`Email: ${u.email}`);
        console.log(`Role: ${u.role}`);
        console.log('-------------------------------------');
    });

    process.exit(0);
}

checkUsers().catch(console.error);
