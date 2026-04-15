require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const RegionAssignment = require('./src/models/RegionAssignment');
    const Disaster = require('./src/models/Disaster');

    // Check all region assignments
    const ras = await RegionAssignment.find({}).select('region status disaster assignedNGOs');
    console.log('All region assignments:');
    ras.forEach(r => console.log(' -', r.region, '| status:', r.status, '| disaster:', r.disaster, '| ngos:', r.assignedNGOs.length));

    // Check all disasters
    const disasters = await Disaster.find({}).select('disasterType severity status peopleAffected createdAt');
    console.log('\nAll disasters:');
    disasters.forEach(d => console.log(' -', d._id, d.disasterType, d.severity, d.status, 'people:', d.peopleAffected));

    process.exit(0);
}).catch(e => { console.log('Error:', e.message); process.exit(1); });
