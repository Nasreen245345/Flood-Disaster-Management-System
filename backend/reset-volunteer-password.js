require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const newPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const result = await User.updateMany({ role: 'volunteer' }, { password: hashed });
    console.log(`✅ Reset password for ${result.modifiedCount} volunteer accounts`);
    console.log('\nAll volunteers can now login with:');
    console.log('Password: password123');

    process.exit(0);
}

resetPasswords().catch(console.error);
