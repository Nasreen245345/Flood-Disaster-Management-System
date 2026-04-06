require('dotenv').config();
const mongoose = require('mongoose');
const Disaster = require('./src/models/Disaster');
const DistributionShift = require('./src/models/DistributionShift');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });

    // Seed disasters with real Pakistan coordinates
    const disasters = [
        {
            location: 'Nowshera, KPK',
            coordinates: { latitude: 34.0151, longitude: 71.9747 },
            disasterType: 'flood',
            severity: 'critical',
            peopleAffected: 15000,
            needs: { food: true, water: true, shelter: true, medical: true, rescue: false, other: false },
            comments: 'Severe flooding in Nowshera district. Multiple villages submerged.',
            status: 'active',
            reportedBy: admin._id
        },
        {
            location: 'Dadu, Sindh',
            coordinates: { latitude: 26.7319, longitude: 67.7764 },
            disasterType: 'flood',
            severity: 'high',
            peopleAffected: 8000,
            needs: { food: true, water: true, shelter: true, medical: false, rescue: true, other: false },
            comments: 'Flash floods affecting Dadu district. Roads blocked.',
            status: 'active',
            reportedBy: admin._id
        },
        {
            location: 'Quetta, Balochistan',
            coordinates: { latitude: 30.1798, longitude: 66.9750 },
            disasterType: 'earthquake',
            severity: 'high',
            peopleAffected: 3000,
            needs: { food: true, water: false, shelter: true, medical: true, rescue: true, other: false },
            comments: 'Magnitude 5.2 earthquake. Several buildings collapsed.',
            status: 'active',
            reportedBy: admin._id
        },
        {
            location: 'Karachi, Sindh',
            coordinates: { latitude: 24.8607, longitude: 67.0011 },
            disasterType: 'fire',
            severity: 'medium',
            peopleAffected: 500,
            needs: { food: false, water: false, shelter: true, medical: true, rescue: false, other: false },
            comments: 'Industrial fire in SITE area. Residents evacuated.',
            status: 'verified',
            reportedBy: admin._id
        },
        {
            location: 'Muzaffarabad, AJK',
            coordinates: { latitude: 34.3700, longitude: 73.4710 },
            disasterType: 'landslide',
            severity: 'medium',
            peopleAffected: 200,
            needs: { food: true, water: false, shelter: true, medical: false, rescue: true, other: false },
            comments: 'Landslide blocking Neelum Valley road. Families stranded.',
            status: 'reported',
            reportedBy: admin._id
        }
    ];

    // Clear old disasters without coordinates and insert new ones
    await Disaster.deleteMany({ 'coordinates.latitude': { $exists: false } });
    const inserted = await Disaster.insertMany(disasters);
    console.log(`✅ Seeded ${inserted.length} disasters with coordinates`);

    // Update existing distribution shifts with coordinates
    const shifts = await DistributionShift.find({ 'coordinates.latitude': { $exists: false } });
    for (const shift of shifts) {
        // Assign approximate coordinates based on location string
        shift.coordinates = { latitude: 33.6844, longitude: 73.0479 }; // Default to Islamabad
        await shift.save();
    }
    console.log(`✅ Updated ${shifts.length} distribution shifts with coordinates`);

    // Verify
    const result = await Disaster.find({ 'coordinates.latitude': { $exists: true } });
    console.log(`\n📍 Total disasters with coordinates: ${result.length}`);
    result.forEach(d => console.log(`  - ${d.disasterType} at ${d.location} [${d.coordinates.latitude}, ${d.coordinates.longitude}]`));

    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
