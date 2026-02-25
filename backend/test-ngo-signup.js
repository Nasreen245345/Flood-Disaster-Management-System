/**
 * Test Script: NGO Signup with Auto-Organization Creation
 * 
 * This script tests the new auto-create organization feature
 * Run: node test-ngo-signup.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testNGOSignup() {
    console.log('🧪 Testing NGO Signup with Auto-Organization Creation\n');
    
    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `testngo${timestamp}@example.com`;
    
    const signupData = {
        name: `Test NGO ${timestamp}`,
        email: testEmail,
        phone: `+123456${timestamp.toString().slice(-4)}`,
        role: 'ngo',
        password: 'password123',
        region: 'Test Region'
    };
    
    try {
        // Step 1: Sign up as NGO
        console.log('📝 Step 1: Signing up as NGO...');
        console.log('Data:', JSON.stringify(signupData, null, 2));
        
        const signupResponse = await axios.post(`${API_URL}/auth/signup`, signupData);
        
        if (signupResponse.data.success) {
            console.log('✅ Signup successful!');
            console.log('User ID:', signupResponse.data.user.id);
            console.log('Token received:', signupResponse.data.token ? 'Yes' : 'No');
            
            const token = signupResponse.data.token;
            const userId = signupResponse.data.user.id;
            
            // Step 2: Check if organization was created
            console.log('\n📊 Step 2: Checking if organization was auto-created...');
            
            // Wait a moment for database to sync
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get all organizations (admin endpoint - for testing only)
            try {
                const orgsResponse = await axios.get(`${API_URL}/organizations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Find the organization for this user
                const userOrg = orgsResponse.data.data.find(org => 
                    org.adminUser === userId || org.adminUser._id === userId
                );
                
                if (userOrg) {
                    console.log('✅ Organization auto-created successfully!');
                    console.log('\nOrganization Details:');
                    console.log('  - ID:', userOrg._id);
                    console.log('  - Name:', userOrg.name);
                    console.log('  - Type:', userOrg.type);
                    console.log('  - Email:', userOrg.contact.email);
                    console.log('  - Phone:', userOrg.contact.phone);
                    console.log('  - Status:', userOrg.status);
                    console.log('  - Verification:', userOrg.verificationStatus);
                    console.log('  - Admin User ID:', userOrg.adminUser);
                    
                    console.log('\n✅ TEST PASSED: NGO signup auto-creates organization!');
                } else {
                    console.log('❌ Organization NOT found for user');
                    console.log('Available organizations:', orgsResponse.data.data.length);
                    console.log('\n❌ TEST FAILED: Organization was not auto-created');
                }
            } catch (orgError) {
                console.log('⚠️  Could not fetch organizations (may need admin access)');
                console.log('Error:', orgError.response?.data?.message || orgError.message);
                console.log('\n⚠️  TEST INCONCLUSIVE: Cannot verify organization creation');
                console.log('Please check manually in admin dashboard');
            }
            
        } else {
            console.log('❌ Signup failed:', signupResponse.data.message);
            console.log('\n❌ TEST FAILED');
        }
        
    } catch (error) {
        console.error('❌ Error during test:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
            console.error('Details:', error.response.data);
        } else {
            console.error(error.message);
        }
        console.log('\n❌ TEST FAILED');
    }
}

// Run the test
console.log('='.repeat(60));
console.log('NGO AUTO-ORGANIZATION CREATION TEST');
console.log('='.repeat(60));
console.log();

testNGOSignup().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('Test completed');
    console.log('='.repeat(60));
}).catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
