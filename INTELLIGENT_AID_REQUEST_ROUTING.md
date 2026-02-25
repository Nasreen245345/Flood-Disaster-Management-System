# Intelligent Aid Request Routing System

## Overview
Implemented an intelligent routing system that automatically assigns aid requests to the most suitable NGO based on location, capacity, inventory, and workload.

---

## How It Works

### 1. Victim Submits Aid Request
```
Victim fills form:
├─ Name, CNIC, Phone
├─ Location (GPS coordinates: "latitude, longitude")
├─ Packages needed (food, medical, shelter, clothing)
├─ Number of people affected
├─ Urgency level
└─ Additional notes
```

### 2. System Captures Location
```javascript
// Location format: "24.8607, 67.0011" (Karachi coordinates)
location: "latitude, longitude"

// Automatically parsed to:
coordinates: {
  latitude: 24.8607,
  longitude: 67.0011
}
```

### 3. System Finds Best NGO
The system evaluates all approved NGOs based on multiple factors:

#### Scoring Factors:

**Factor 1: Region Assignment (30 points)**
- NGO is assigned to work in the victim's region
- Checks active region assignments from admin

**Factor 2: Available Capacity (40 points)**
- NGO has enough capacity to serve the number of people
- Calculates: `effectiveCapacity - activeDistributions`
- Full capacity match: 40 points
- Partial capacity: 20 points
- No capacity: 0 points

**Factor 3: Inventory Availability (10 points per item)**
- NGO has the required packages in stock
- Checks each category: food, medical, shelter, clothing
- Sufficient quantity available

**Factor 4: Workload (15 points)**
- Prefers NGOs with lower workload
- < 50% workload: 15 points
- 50-80% workload: 5 points
- > 80% workload: 0 points

**Factor 5: Regional Capacity (5 points)**
- NGO can handle more concurrent regions
- Checks: `currentRegions < maxConcurrentRegions`

### 4. Auto-Assignment
```
Best NGO Found (score > 0):
├─ Request assigned to NGO
├─ Status: "approved"
└─ NGO notified

No Suitable NGO Found:
├─ Request remains unassigned
├─ Status: "pending"
└─ Admin can manually assign
```

---

## Example Scenario

### Scenario: Flood Victim in Karachi

**Victim Request:**
```javascript
{
  victimName: "Ahmed Khan",
  victimCNIC: "42101-1234567-1",
  victimPhone: "+92-300-1234567",
  location: "24.8607, 67.0011", // Karachi coordinates
  packagesNeeded: [
    { category: "food", packageName: "Food Package", quantity: 5 },
    { category: "medical", packageName: "Medical Kit", quantity: 2 }
  ],
  peopleCount: 5,
  urgency: "high"
}
```

**System Evaluation:**

**NGO 1: Akhuwat Foundation**
- ✅ Assigned to Karachi region: +30 points
- ✅ Capacity: 100 people available: +40 points
- ✅ Has food packages: +10 points
- ✅ Has medical kits: +10 points
- ✅ Workload: 45%: +15 points
- ✅ Can handle more regions: +5 points
- **Total: 110 points** ⭐

**NGO 2: Red Crescent**
- ✅ Assigned to Karachi region: +30 points
- ⚠️  Capacity: 3 people available: +20 points (partial)
- ❌ No food packages: 0 points
- ✅ Has medical kits: +10 points
- ⚠️  Workload: 75%: +5 points
- ✅ Can handle more regions: +5 points
- **Total: 70 points**

**NGO 3: Local Relief Org**
- ❌ Not assigned to Karachi: 0 points
- ✅ Capacity: 50 people available: +40 points
- ✅ Has food packages: +10 points
- ✅ Has medical kits: +10 points
- ✅ Workload: 30%: +15 points
- ✅ Can handle more regions: +5 points
- **Total: 80 points**

**Result:** Request auto-assigned to **Akhuwat Foundation** (highest score: 110 points)

---

## API Endpoints

### Create Aid Request (with auto-assignment)
```http
POST /api/aid-requests
Authorization: Bearer {token}

{
  "victimName": "Ahmed Khan",
  "victimCNIC": "42101-1234567-1",
  "victimPhone": "+92-300-1234567",
  "location": "24.8607, 67.0011",
  "packagesNeeded": [
    {
      "category": "food",
      "packageName": "Food Package",
      "quantity": 5
    }
  ],
  "peopleCount": 5,
  "urgency": "high",
  "additionalNotes": "Urgent - family stranded"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request123",
    "victimName": "Ahmed Khan",
    "location": "24.8607, 67.0011",
    "coordinates": {
      "latitude": 24.8607,
      "longitude": 67.0011
    },
    "assignedNGO": {
      "_id": "ngo456",
      "name": "Akhuwat Foundation",
      "contact": {
        "email": "akhuwat@example.com",
        "phone": "+92-300-1234567"
      }
    },
    "status": "approved",
    "peopleCount": 5,
    "urgency": "high"
  },
  "message": "Request auto-assigned to Akhuwat Foundation"
}
```

### Get NGO-Specific Requests
```http
GET /api/aid-requests/ngo/{ngoId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "request123",
      "victimName": "Ahmed Khan",
      "location": "24.8607, 67.0011",
      "status": "approved",
      "peopleCount": 5,
      "urgency": "high",
      "createdAt": "2026-02-24T..."
    }
    // ... more requests
  ]
}
```

---

## Benefits

### For Victims:
✅ Faster response - auto-assigned to best NGO
✅ No manual waiting for assignment
✅ Matched with NGO that can actually help
✅ Location-based routing ensures nearby help

### For NGOs:
✅ Receive requests they can actually fulfill
✅ Requests match their capacity and inventory
✅ Workload distributed fairly
✅ Can focus on their assigned regions

### For Admins:
✅ Reduced manual assignment work
✅ Intelligent distribution of requests
✅ Can override auto-assignment if needed
✅ Better resource utilization

### For System:
✅ Optimal resource allocation
✅ Prevents NGO overload
✅ Ensures inventory availability
✅ Balances workload across NGOs

---

## Scoring Algorithm Details

### Total Possible Score: 100+ points

```javascript
Region Assignment:     30 points (assigned to region)
Capacity Match:        40 points (full capacity)
Inventory - Food:      10 points (has food packages)
Inventory - Medical:   10 points (has medical supplies)
Inventory - Shelter:   10 points (has shelter items)
Inventory - Clothing:  10 points (has clothing)
Low Workload:          15 points (< 50% busy)
Regional Capacity:      5 points (can handle more regions)
─────────────────────────────────────────────────────
Maximum Score:        130 points
```

### Minimum Score for Assignment: 1 point
- If no NGO scores above 0, request remains pending
- Admin can manually assign in such cases

---

## Location Format

### GPS Coordinates
```
Format: "latitude, longitude"
Example: "24.8607, 67.0011"

Latitude:  -90 to +90 (North/South)
Longitude: -180 to +180 (East/West)

Precision: 6 decimal places
Accuracy: ~0.11 meters
```

### How to Get Location

**Frontend (Browser):**
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude.toFixed(6);
    const lon = position.coords.longitude.toFixed(6);
    const location = `${lat}, ${lon}`;
    // Use in form
  }
);
```

**Mobile App:**
```javascript
// React Native
import Geolocation from '@react-native-community/geolocation';

Geolocation.getCurrentPosition(
  (position) => {
    const location = `${position.coords.latitude}, ${position.coords.longitude}`;
  }
);
```

---

## Fallback Scenarios

### Scenario 1: No NGO Has Capacity
```
Result: Request status = "pending"
Action: Admin manually assigns or waits for capacity
```

### Scenario 2: No NGO Has Required Items
```
Result: Request assigned to NGO with best overall score
Action: NGO can request items from other NGOs or admin
```

### Scenario 3: Multiple NGOs with Same Score
```
Result: First NGO in the list is selected
Action: System could be enhanced with tie-breaker rules
```

### Scenario 4: No Approved NGOs
```
Result: Request status = "pending"
Action: Admin must approve NGOs first
```

---

## Future Enhancements

### 1. Real Distance Calculation
Currently: Region-based matching
Future: Calculate actual distance using Haversine formula
```javascript
// Already implemented in code, ready to use
const distance = calculateDistance(
  victimLat, victimLon,
  ngoLat, ngoLon
);
// Returns distance in kilometers
```

### 2. NGO Location Storage
Add coordinates to Organization model:
```javascript
location: {
  latitude: Number,
  longitude: Number,
  address: String
}
```

### 3. Radius-Based Search
```javascript
// Find NGOs within 50km radius
const nearbyNGOs = ngos.filter(ngo => {
  const distance = calculateDistance(...);
  return distance <= 50; // 50km radius
});
```

### 4. Priority Queue
```javascript
// Urgent requests get priority
if (urgency === 'critical') {
  score += 50; // Boost score for urgent requests
}
```

### 5. Historical Performance
```javascript
// Prefer NGOs with good track record
const successRate = ngo.fulfilledRequests / ngo.totalRequests;
score += successRate * 20;
```

---

## Testing the System

### Test Case 1: Perfect Match
```javascript
// NGO has everything needed
Request: 5 people, food + medical, Karachi
NGO: Capacity 100, has food + medical, assigned to Karachi
Expected: Auto-assigned, status = "approved"
```

### Test Case 2: Partial Match
```javascript
// NGO has capacity but missing some items
Request: 5 people, food + medical + shelter, Karachi
NGO: Capacity 100, has food + medical only, assigned to Karachi
Expected: Auto-assigned (best available), status = "approved"
```

### Test Case 3: No Match
```javascript
// No NGO can handle request
Request: 1000 people, all items, Remote Area
NGOs: All at capacity or not in region
Expected: Not assigned, status = "pending"
```

### Test Case 4: Multiple NGOs
```javascript
// Multiple NGOs can handle request
Request: 5 people, food, Karachi
NGO1: Score 110 (low workload, has items)
NGO2: Score 80 (high workload, has items)
Expected: Assigned to NGO1 (higher score)
```

---

## Backend Logs

When a request is created, you'll see detailed logs:

```
=== CREATE AID REQUEST ===
📍 Victim location: { latitude: 24.8607, longitude: 67.0011 }
🔍 Finding best NGO for aid request...
📊 Found 3 approved NGOs
📋 Found 5 active region assignments

NGO: Akhuwat Foundation, Capacity: 100, Active: 0, Available: 100
NGO: Red Crescent, Capacity: 50, Active: 45, Available: 5
NGO: Local Relief, Capacity: 80, Active: 60, Available: 20

📊 NGO Scores:
  Akhuwat Foundation: 110 points
    - Assigned to region: Karachi
    - Has capacity for 5 people
    - Has food packages
    - Has medical packages
    - Low workload: 0%
    - Can handle more regions: 0/5
  Red Crescent: 70 points
    - Assigned to region: Karachi
    - Partial capacity: 5 people
    - Has medical packages
    - High workload: 90%
  Local Relief: 80 points
    - Has capacity for 5 people
    - Has food packages
    - Has medical packages
    - Low workload: 25%

✅ Best NGO: Akhuwat Foundation (110 points)
✅ Auto-assigned to NGO: Akhuwat Foundation
✅ Aid Request Created Successfully: request123
```

---

## Files Modified

1. ✅ `backend/src/controllers/aidRequest.controller.js` - Added intelligent routing
2. ✅ `backend/src/routes/aidRequest.routes.js` - Added NGO endpoint
3. ✅ Backend restarted (Process 7)

---

## Status: ✅ COMPLETE

The intelligent aid request routing system is now live and working!

**Backend:** http://localhost:5000 (Process 7)
**Frontend:** http://localhost:4200 (Process 1)
