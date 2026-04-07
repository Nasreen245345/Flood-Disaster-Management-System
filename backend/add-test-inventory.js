const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Organization = require('./src/models/Organization');

async function addTestInventory() {
    try {
        console.log('🔄 Adding test inventory to organizations...');

        // Find all NGO organizations
        const organizations = await Organization.find({ type: 'ngo' });

        if (organizations.length === 0) {
            console.log('No NGO organizations found');
            process.exit(1);
        }

        // Test inventory packages
        const testInventory = [
            {
                packageName: "Food Package - Family Size",
                category: "food",
                quantity: 100,
                description: "Rice, flour, cooking oil, lentils, salt, sugar",
                lastUpdated: new Date()
            },
            {
                packageName: "Medical Kit - Basic",
                category: "medical",
                quantity: 50,
                description: "First aid supplies, bandages, antiseptic, pain relievers",
                lastUpdated: new Date()
            },
            {
                packageName: "Shelter Kit - Emergency",
                category: "shelter",
                quantity: 30,
                description: "Tent, blankets, sleeping mats, tarpaulin",
                lastUpdated: new Date()
            },
            {
                packageName: "Clothing Package - Winter",
                category: "clothing",
                quantity: 75,
                description: "Warm clothes for family of 4-5 people",
                lastUpdated: new Date()
            }
        ];

        // Update each organization using findByIdAndUpdate to bypass validation issues
        for (const org of organizations) {
            await Organization.findByIdAndUpdate(
                org._id,
                { $set: { inventory: testInventory } },
                { new: true, runValidators: false }
            );
            console.log(`✅ Added test inventory to: ${org.name}`);
        }

        console.log('\n✅ Test inventory added successfully!');
        console.log(`📦 Total packages per organization: ${testInventory.reduce((sum, item) => sum + item.quantity, 0)}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addTestInventory();
