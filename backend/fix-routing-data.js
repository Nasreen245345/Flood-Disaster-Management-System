require('dotenv').config();
const mongoose = require('mongoose');
const Disaster = require('./src/models/Disaster');
const RegionAssignment = require('./src/models/RegionAssignment');
const Organization = require('./src/models/Organization');
const DistributionShift = require('./src/models/DistributionShift');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✅ Connected');

    const admin = await User.findOne({ role: 'admin' });
    const akhuwat = await Organization.findOne({ name: /Akhuwat/i });

    if (!akhuwat) { console.log('❌ Akhuwat not found'); process.exit(1); }

    // 1. Create disaster near victim location (32.68, 71.79 = Mianwali, Punjab)
    const disaster = await Disaster.create({
        location: 'Mianwali, Punjab',
        coordinates: { latitude: 32.5839, longitude: 71.5437 },
        disasterType: 'flood',
        severity: 'high',
        peopleAffected: 5000,
        needs: { food: true, water: true, shelter: true, medical: false, rescue: false, other: false },
        comments: 'Flash floods in Mianwali district affecting multiple villages.',
        status: 'active',
        reportedBy: admin._id
    });
    console.log('✅ Created disaster at Mianwali:', disaster._id);

    // 2. Assign Akhuwat Foundation to this disaster
    const assignment = await RegionAssignment.create({
        disaster: disaster._id,
        disasterName: 'Mianwali Flood 2026',
        region: 'Mianwali',
        coordinates: { latitude: 32.5839, longitude: 71.5437 },
        assignedNGOs: [akhuwat._id],
        resourceRequirements: { food: 5000, medical: 1000, shelter: 2000 },
        affectedPopulation: 5000,
        status: 'assigned',
        assignedBy: admin._id
    });
    console.log('✅ Assigned Akhuwat to Mianwali region');

    // 3. Create a distribution shift near victim location
    const future = new Date();
    future.setDate(future.getDate() + 3);

    const shift = await DistributionShift.create({
        organization: akhuwat._id,
        location: 'Mianwali Relief Camp - Main Gate',
        coordinates: { latitude: 32.5839, longitude: 71.5437 },
        shiftStart: new Date(),
        shiftEnd: future,
        status: 'active',
        notes: 'Food and shelter distribution for flood victims',
        createdBy: admin._id
    });
    console.log('✅ Created distribution shift at Mianwali:', shift._id);
    console.log('\n📍 Distribution point coordinates: 32.5839, 71.5437');
    console.log('📍 Victim location: ~32.68, 71.79');
    console.log('📏 Distance: ~25km — should now be assigned correctly');

    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
