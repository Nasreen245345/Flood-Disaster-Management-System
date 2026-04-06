require('dotenv').config();
const mongoose = require('mongoose');
const AidRequest = require('./src/models/AidRequest');
const Organization = require('./src/models/Organization');
const RegionAssignment = require('./src/models/RegionAssignment');
const DistributionShift = require('./src/models/DistributionShift');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // Latest 3 aid requests
    const requests = await AidRequest.find().sort('-createdAt').limit(3).populate('assignedNGO', 'name');
    console.log('=== RECENT AID REQUESTS ===');
    requests.forEach(r => {
        console.log(`Name: ${r.victimName}`);
        console.log(`Location: ${r.location}`);
        console.log(`Coordinates: ${JSON.stringify(r.coordinates)}`);
        console.log(`Assigned NGO: ${r.assignedNGO?.name || 'NONE'}`);
        console.log('---');
    });

    // Active region assignments
    const assignments = await RegionAssignment.find({ status: { $in: ['assigned', 'in-progress'] } }).populate('assignedNGOs', 'name');
    console.log('\n=== ACTIVE REGION ASSIGNMENTS ===');
    assignments.forEach(a => {
        console.log(`Region: ${a.region}`);
        console.log(`Coordinates: ${JSON.stringify(a.coordinates)}`);
        console.log(`NGOs: ${a.assignedNGOs.map(n => n.name).join(', ')}`);
        console.log('---');
    });

    // Active shifts with coordinates
    const shifts = await DistributionShift.find({ status: 'active' }).populate('organization', 'name');
    console.log('\n=== ACTIVE DISTRIBUTION SHIFTS ===');
    shifts.forEach(s => {
        console.log(`Location: ${s.location}`);
        console.log(`Coordinates: ${JSON.stringify(s.coordinates)}`);
        console.log(`Organization: ${s.organization?.name}`);
        console.log('---');
    });

    process.exit(0);
});
