# Organization Auto-Creation - Complete Field Structure

## Overview
When an NGO user signs up, the system automatically creates an Organization record with ALL necessary fields, matching the structure of manually created organizations.

---

## Complete Organization Record Structure

### Example: Akhuwat Foundation (Manual)
```javascript
{
  _id: "69956ee5fc279ce9b2ab9e92",
  name: "Akhuwat Foundation",
  type: "ngo",
  contact: {
    email: "akhuwat@example.com",
    phone: "+92-300-1234567",
    address: "Lahore, Pakistan"
  },
  adminUser: "696494ee4ce1eb3066776bd0",
  operationalLimit: {
    maxDailyDistributions: 1000,
    maxConcurrentRegions: 5
  },
  serviceRateConfig: {
    defaultRate: 20,
    categoryRates: {
      medical: 40,
      food_distribution: 25,
      shelter_management: 15,
      logistics: 30,
      general_support: 20
    }
  },
  inventory: [
    {
      packageName: "Food Package",
      category: "food",
      quantity: 100,
      description: "Basic food supplies",
      lastUpdated: "2026-02-24T07:14:08.225Z"
    }
    // ... more items
  ],
  activeDistributions: 0,
  assignedRegions: [],
  status: "approved",
  verificationStatus: "verified",
  registrationNumber: "NGO-001",
  documents: [],
  description: "Providing relief and welfare services",
  createdAt: "2026-02-18T07:48:53.947Z",
  updatedAt: "2026-02-24T07:14:08.225Z",
  __v: 1
}
```

### Example: Auto-Created Organization (New NGO Signup)
```javascript
{
  _id: "auto-generated-id",
  name: "New Relief Organization",  // From signup form
  type: "ngo",
  contact: {
    email: "newrelief@example.com",  // From signup form
    phone: "+92-300-9876543",        // From signup form
    address: "Karachi"               // From signup form (region field)
  },
  adminUser: "user-id-from-signup",  // Linked to User record
  
  // DEFAULT VALUES - Same as manual creation
  operationalLimit: {
    maxDailyDistributions: 1000,
    maxConcurrentRegions: 5
  },
  serviceRateConfig: {
    defaultRate: 20,
    categoryRates: {
      medical: 40,
      food_distribution: 25,
      shelter_management: 15,
      logistics: 30,
      general_support: 20
    }
  },
  inventory: [],                     // Empty initially
  activeDistributions: 0,
  assignedRegions: [],               // Empty initially
  status: "pending",                 // Awaits admin approval
  verificationStatus: "unverified",  // Awaits admin verification
  registrationNumber: "",            // Can be assigned by admin
  documents: [],                     // Can be uploaded later
  description: "New Relief Organization - Disaster relief organization",
  createdAt: "auto-generated",
  updatedAt: "auto-generated",
  __v: 0
}
```

---

## Field-by-Field Comparison

| Field | Manual Creation | Auto-Creation | Notes |
|-------|----------------|---------------|-------|
| `_id` | MongoDB generated | MongoDB generated | Automatic |
| `name` | Admin enters | From signup form | User's name |
| `type` | Admin selects | "ngo" (fixed) | Always NGO |
| `contact.email` | Admin enters | From signup form | User's email |
| `contact.phone` | Admin enters | From signup form | User's phone |
| `contact.address` | Admin enters | From signup form | User's region |
| `adminUser` | Admin selects | Auto-linked | User ID |
| `operationalLimit.maxDailyDistributions` | Admin sets | 1000 (default) | Can be changed later |
| `operationalLimit.maxConcurrentRegions` | Admin sets | 5 (default) | Can be changed later |
| `serviceRateConfig.defaultRate` | Admin sets | 20 (default) | Standard rate |
| `serviceRateConfig.categoryRates.medical` | Admin sets | 40 (default) | Medical rate |
| `serviceRateConfig.categoryRates.food_distribution` | Admin sets | 25 (default) | Food rate |
| `serviceRateConfig.categoryRates.shelter_management` | Admin sets | 15 (default) | Shelter rate |
| `serviceRateConfig.categoryRates.logistics` | Admin sets | 30 (default) | Logistics rate |
| `serviceRateConfig.categoryRates.general_support` | Admin sets | 20 (default) | General rate |
| `inventory` | Empty or pre-filled | [] (empty) | NGO adds items later |
| `activeDistributions` | 0 | 0 | No active operations |
| `assignedRegions` | [] | [] | No assignments yet |
| `status` | Admin sets | "pending" | Requires approval |
| `verificationStatus` | Admin sets | "unverified" | Requires verification |
| `registrationNumber` | Admin assigns | "" (empty) | Admin can assign later |
| `documents` | Admin uploads | [] (empty) | NGO can upload later |
| `description` | Admin enters | Auto-generated | Can be edited later |
| `createdAt` | MongoDB timestamp | MongoDB timestamp | Automatic |
| `updatedAt` | MongoDB timestamp | MongoDB timestamp | Automatic |
| `__v` | MongoDB version | MongoDB version | Automatic |

---

## Key Differences

### Status Fields
- **Manual Creation:** Admin can set any status (pending/approved/disabled)
- **Auto-Creation:** Always starts as "pending" (requires admin approval)

### Verification
- **Manual Creation:** Admin can set verification status
- **Auto-Creation:** Always starts as "unverified"

### Registration Number
- **Manual Creation:** Admin assigns (e.g., "NGO-001")
- **Auto-Creation:** Empty string (admin can assign later)

### Description
- **Manual Creation:** Admin writes custom description
- **Auto-Creation:** Auto-generated: "{name} - Disaster relief organization"

### Inventory
- **Manual Creation:** Can be pre-filled
- **Auto-Creation:** Empty array (NGO adds items via dashboard)

---

## Admin Workflow After Auto-Creation

1. **Review Organization:**
   - Check contact information
   - Verify organization legitimacy
   - Request additional documents if needed

2. **Assign Registration Number:**
   - Edit organization
   - Add registration number (e.g., "NGO-002")
   - Save changes

3. **Update Description:**
   - Edit organization
   - Add detailed description
   - Save changes

4. **Approve Organization:**
   - Change status from "pending" to "approved"
   - Change verification from "unverified" to "verified"
   - Organization can now operate fully

5. **Set Custom Limits (Optional):**
   - Adjust `maxDailyDistributions` if needed
   - Adjust `maxConcurrentRegions` if needed
   - Modify service rates if needed

---

## NGO Workflow After Signup

1. **Sign Up:**
   - Fill signup form
   - Organization auto-created
   - Receive confirmation

2. **Login:**
   - Access NGO dashboard
   - See "Pending Approval" status

3. **Complete Profile:**
   - Upload documents
   - Add detailed description
   - Update contact information

4. **Add Inventory:**
   - Go to Inventory page
   - Add packages (food, medical, shelter, clothing)
   - Set quantities

5. **Register Volunteers:**
   - Volunteers sign up and select this NGO
   - NGO verifies volunteers
   - Volunteers count toward capacity

6. **Wait for Approval:**
   - Admin reviews organization
   - Admin approves organization
   - NGO can now participate in disaster response

---

## Benefits of Complete Field Structure

### For System Consistency:
✅ All organizations have same field structure
✅ No missing fields cause errors
✅ Capacity calculations work immediately
✅ Service rate configurations ready

### For NGOs:
✅ Can start using dashboard immediately
✅ Can add inventory right away
✅ Can register volunteers immediately
✅ All features available (after approval)

### For Admins:
✅ Easy to review new organizations
✅ All fields present for editing
✅ Can approve with confidence
✅ No need to manually add missing fields

### For Developers:
✅ No null/undefined field errors
✅ Consistent data structure
✅ Easier to maintain code
✅ Predictable behavior

---

## Default Values Explained

### Operational Limits
```javascript
maxDailyDistributions: 1000  // Can serve 1000 victims per day
maxConcurrentRegions: 5      // Can operate in 5 regions simultaneously
```
These are reasonable defaults that work for most NGOs. Admin can adjust based on organization size.

### Service Rate Configuration
```javascript
defaultRate: 20              // General volunteers serve 20 victims/day
categoryRates: {
  medical: 40,               // Medical staff serve 40 victims/day
  food_distribution: 25,     // Food distributors serve 25 victims/day
  shelter_management: 15,    // Shelter managers serve 15 victims/day
  logistics: 30,             // Logistics staff serve 30 victims/day
  general_support: 20        // General support serves 20 victims/day
}
```
These rates are based on typical volunteer productivity. NGO can adjust based on their experience.

---

## Testing the Complete Structure

### Test Script
```bash
cd backend
node test-ngo-signup.js
```

### Manual Test
1. Sign up as NGO
2. Login as admin
3. Go to Organizations page
4. Click on the new organization
5. Verify all fields are present:
   - ✅ operationalLimit
   - ✅ serviceRateConfig
   - ✅ inventory (empty array)
   - ✅ activeDistributions (0)
   - ✅ assignedRegions (empty array)
   - ✅ status (pending)
   - ✅ verificationStatus (unverified)

---

## Database Query Examples

### Find all auto-created organizations (pending approval)
```javascript
db.organizations.find({ 
  status: "pending",
  verificationStatus: "unverified"
})
```

### Find organizations ready for approval
```javascript
db.organizations.find({ 
  status: "pending",
  "contact.email": { $exists: true },
  "contact.phone": { $exists: true }
})
```

### Update organization after review
```javascript
db.organizations.updateOne(
  { _id: ObjectId("org-id") },
  { 
    $set: { 
      status: "approved",
      verificationStatus: "verified",
      registrationNumber: "NGO-002",
      description: "Updated description"
    }
  }
)
```

---

## Status: ✅ COMPLETE

All organizations created via signup now have the complete field structure matching manually created organizations.

Backend restarted with updated code (Process ID: 6)
Frontend running (Process ID: 1)
