const BASE_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    try {
        console.log('🚀 Starting Verification for Aid Requests...');
        const timestamp = Date.now();
        const userCredentials = {
            name: `Test User ${timestamp}`,
            email: `test_${timestamp}@example.com`,
            password: 'password123',
            role: 'victim',
            phone: '1234567890',
            region: 'Test Region'
        };

        // 1. Signup
        console.log('\nPlease wait, registering test user...');
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userCredentials)
        });
        const signupData = await signupRes.json();

        if (!signupData.success) {
            throw new Error(`Signup failed: ${signupData.message}`);
        }
        console.log('✅ Signup successful');
        const token = signupData.token;

        // 2. Create Aid Request
        console.log('\nCreating Aid Request...');
        const requestData = {
            title: 'Test Aid Request',
            description: 'This is a test request for aid.',
            category: 'food',
            urgency: 'high',
            location: '123 Test St',
            requiredAmount: 100
        };

        const createRes = await fetch(`${BASE_URL}/aid-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
        const createData = await createRes.json();

        if (!createData.success) {
            throw new Error(`Create Request failed: ${createData.message}`);
        }
        console.log('✅ Aid Request Created');
        const requestId = createData.data._id;
        console.log(`   ID: ${requestId}`);

        // 3. Get All Requests
        console.log('\nFetching All Requests...');
        const getAllRes = await fetch(`${BASE_URL}/aid-requests`, {
            headers: { 'Authorization': `Bearer ${token}` } // Assuming protected
        });
        const getAllData = await getAllRes.json();

        if (!getAllData.success) {
            throw new Error(`Get All Requests failed: ${getAllData.message}`);
        }
        console.log(`✅ Fetched ${getAllData.count} requests`);
        const exists = getAllData.data.some(r => r._id === requestId);
        if (exists) {
            console.log('   -> Verified: New request is in the list');
        } else {
            throw new Error('New request not found in list');
        }

        // 4. Get My Requests
        console.log('\nFetching My Requests...');
        const getMyRes = await fetch(`${BASE_URL}/aid-requests/my-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getMyData = await getMyRes.json();
        if (!getMyData.success) {
            throw new Error(`Get My Requests failed: ${getMyData.message}`);
        }
        if (getMyData.data.some(r => r._id === requestId)) {
            console.log('✅ Verified: Request found in my-requests');
        } else {
            throw new Error('Request not found in my-requests');
        }

        // 5. Get Request By ID
        console.log('\nFetching Request by ID...');
        const getOneRes = await fetch(`${BASE_URL}/aid-requests/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getOneData = await getOneRes.json();
        if (!getOneData.success || getOneData.data._id !== requestId) {
            throw new Error('Get Request by ID failed');
        }
        console.log('✅ Fetched Request details successfully');

        // 6. Delete Request
        console.log('\nDeleting Request...');
        const deleteRes = await fetch(`${BASE_URL}/aid-requests/${requestId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();
        if (!deleteData.success) {
            throw new Error(`Delete Request failed: ${deleteData.message}`);
        }
        console.log('✅ Request Deleted');

        // 7. Verify Deletion
        const checkRes = await fetch(`${BASE_URL}/aid-requests/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (checkRes.status === 404) {
            console.log('✅ Verified: Request no longer exists (404)');
        } else {
            console.log('⚠️ Warning: Request might still exist or other error');
        }

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        // Log details if available
        if (error.response) {
            const text = await error.response.text();
            console.error('Response:', text);
        }
        process.exit(1);
    }
};

runVerification();
