require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // Find admin/ngo users
    const users = await User.find({ role: { $in: ['admin', 'ngo'] } }).select('name email role');
    console.log('\n=== ADMIN/NGO USERS ===');
    users.forEach(u => console.log(`${u.role} | ${u.email} | ${u.name}`));

    // Find Akhuwat org
    const orgs = await Organization.find({ name: /akhuwat/i }).select('_id name status');
    console.log('\n=== AKHUWAT ORGS ===');
    orgs.forEach(o => console.log(`ID: ${o._id} | ${o.name} | ${o.status}`));

    process.exit(0);
});
