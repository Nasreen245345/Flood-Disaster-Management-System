# Aid Request Routing Flow Diagram

## Complete Flow: Victim to NGO Assignment

```
┌─────────────────────────────────────────────────────────────────────┐
│              INTELLIGENT AID REQUEST ROUTING SYSTEM                 │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: VICTIM SUBMITS REQUEST
──────────────────────────────
Victim (Mobile/Web)
    │
    ├─ Fills Form:
    │  ├─ Name: "Ahmed Khan"
    │  ├─ CNIC: "42101-1234567-1"
    │  ├─ Phone: "+92-300-1234567"
    │  ├─ Location: "24.8607, 67.0011" ◄── GPS Auto-captured
    │  ├─ Packages: [food, medical]
    │  ├─ People Count: 5
    │  └─ Urgency: "high"
    │
    ▼
POST /api/aid-requests
    │
    ▼


STEP 2: SYSTEM PARSES LOCATION
───────────────────────────────
Backend Controller
    │
    ├─ Parse Location String
    │  "24.8607, 67.0011"
    │       │
    │       ▼
    │  coordinates: {
    │    latitude: 24.8607,
    │    longitude: 67.0011
    │  }
    │
    ▼


STEP 3: FIND APPROVED NGOs
───────────────────────────
Query Database
    │
    ├─ Filter:
    │  ├─ status: "approved"
    │  └─ verificationStatus: "verified"
    │
    ▼
Found 3 NGOs:
├─ Akhuwat Foundation
├─ Red Crescent
└─ Local Relief Org


STEP 4: GET REGION ASSIGNMENTS
───────────────────────────────
Query RegionAssignments
    │
    ├─ Filter:
    │  └─ status: ["assigned", "in-progress"]
    │
    ▼
Found 5 Assignments:
├─ Karachi → [Akhuwat, Red Crescent]
├─ Lahore → [Local Relief]
├─ Islamabad → [Akhuwat]
└─ ...


STEP 5: SCORE EACH NGO
──────────────────────

┌─────────────────────────────────────────────────────────┐
│ NGO 1: AKHUWAT FOUNDATION                               │
├─────────────────────────────────────────────────────────┤
│ ✅ Region Assignment                                     │
│    Assigned to Karachi region ..................... +30 │
│                                                          │
│ ✅ Capacity Check                                        │
│    Effective Capacity: 100 people                       │
│    Active Distributions: 0                              │
│    Available: 100 people                                │
│    Can serve 5 people ............................ +40 │
│                                                          │
│ ✅ Inventory Check                                       │
│    Has food packages ............................. +10 │
│    Has medical kits .............................. +10 │
│                                                          │
│ ✅ Workload                                              │
│    Current workload: 0%                                 │
│    Low workload .................................. +15 │
│                                                          │
│ ✅ Regional Capacity                                     │
│    Current regions: 0 / Max: 5                          │
│    Can handle more regions ....................... +5  │
│                                                          │
│ TOTAL SCORE: 110 points ⭐⭐⭐                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NGO 2: RED CRESCENT                                     │
├─────────────────────────────────────────────────────────┤
│ ✅ Region Assignment                                     │
│    Assigned to Karachi region ..................... +30 │
│                                                          │
│ ⚠️  Capacity Check                                       │
│    Effective Capacity: 50 people                        │
│    Active Distributions: 45                             │
│    Available: 5 people                                  │
│    Partial capacity .............................. +20 │
│                                                          │
│ ❌ Inventory Check                                       │
│    No food packages .............................. +0  │
│    Has medical kits .............................. +10 │
│                                                          │
│ ⚠️  Workload                                             │
│    Current workload: 90%                                │
│    High workload ................................. +0  │
│                                                          │
│ ✅ Regional Capacity                                     │
│    Current regions: 2 / Max: 5                          │
│    Can handle more regions ....................... +5  │
│                                                          │
│ TOTAL SCORE: 65 points ⭐                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NGO 3: LOCAL RELIEF ORG                                 │
├─────────────────────────────────────────────────────────┤
│ ❌ Region Assignment                                     │
│    Not assigned to Karachi ....................... +0  │
│                                                          │
│ ✅ Capacity Check                                        │
│    Effective Capacity: 80 people                        │
│    Active Distributions: 60                             │
│    Available: 20 people                                 │
│    Can serve 5 people ............................ +40 │
│                                                          │
│ ✅ Inventory Check                                       │
│    Has food packages ............................. +10 │
│    Has medical kits .............................. +10 │
│                                                          │
│ ✅ Workload                                              │
│    Current workload: 75%                                │
│    Moderate workload ............................. +5  │
│                                                          │
│ ✅ Regional Capacity                                     │
│    Current regions: 1 / Max: 3                          │
│    Can handle more regions ....................... +5  │
│                                                          │
│ TOTAL SCORE: 70 points ⭐⭐                              │
└─────────────────────────────────────────────────────────┘


STEP 6: RANK NGOs BY SCORE
───────────────────────────
Sorted Results:
1. Akhuwat Foundation ........ 110 points ⭐⭐⭐
2. Local Relief Org .......... 70 points  ⭐⭐
3. Red Crescent .............. 65 points  ⭐


STEP 7: AUTO-ASSIGN TO BEST NGO
────────────────────────────────
Selected: Akhuwat Foundation (Highest Score)
    │
    ├─ Update Request:
    │  ├─ assignedNGO: "akhuwat_id"
    │  └─ status: "approved"
    │
    ▼
Save to Database
    │
    ▼


STEP 8: SEND RESPONSE
─────────────────────
Response to Victim:
{
  "success": true,
  "data": {
    "victimName": "Ahmed Khan",
    "location": "24.8607, 67.0011",
    "assignedNGO": {
      "name": "Akhuwat Foundation",
      "contact": {
        "email": "akhuwat@example.com",
        "phone": "+92-300-1234567"
      }
    },
    "status": "approved",
    "peopleCount": 5
  },
  "message": "Request auto-assigned to Akhuwat Foundation"
}


STEP 9: NGO NOTIFICATION
────────────────────────
Akhuwat Foundation Dashboard
    │
    ├─ New Request Appears:
    │  ├─ Victim: Ahmed Khan
    │  ├─ Location: Karachi (24.8607, 67.0011)
    │  ├─ Needs: Food + Medical
    │  ├─ People: 5
    │  └─ Urgency: High
    │
    ▼
NGO Can:
├─ View on Map
├─ Check Inventory
├─ Assign Volunteer
├─ Mark In Progress
└─ Fulfill Request
```

---

## Alternative Flow: No Suitable NGO

```
STEP 5: SCORE EACH NGO
──────────────────────

All NGOs Score 0 or Very Low:
├─ NGO 1: No capacity ................ 0 points
├─ NGO 2: No inventory ............... 0 points
└─ NGO 3: Not in region .............. 0 points


STEP 6: NO NGO SELECTED
────────────────────────
No NGO with score > 0
    │
    ├─ Update Request:
    │  ├─ assignedNGO: null
    │  └─ status: "pending"
    │
    ▼


STEP 7: ADMIN NOTIFICATION
──────────────────────────
Admin Dashboard
    │
    ├─ Pending Request Alert:
    │  ├─ Victim: Ahmed Khan
    │  ├─ Location: Karachi
    │  ├─ Reason: No suitable NGO found
    │  └─ Action Required: Manual Assignment
    │
    ▼
Admin Can:
├─ Manually assign to NGO
├─ Request more resources
├─ Coordinate with multiple NGOs
└─ Escalate to higher authority
```

---

## Scoring Breakdown Visual

```
┌────────────────────────────────────────────────────────────┐
│                    SCORING FACTORS                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Region Assignment          [████████████████] 30 points  │
│  (NGO assigned to region)                                 │
│                                                            │
│  Capacity Match             [█████████████████████] 40    │
│  (Can serve all people)                                   │
│                                                            │
│  Inventory - Food           [█████] 10 points             │
│  (Has food packages)                                      │
│                                                            │
│  Inventory - Medical        [█████] 10 points             │
│  (Has medical supplies)                                   │
│                                                            │
│  Inventory - Shelter        [█████] 10 points             │
│  (Has shelter items)                                      │
│                                                            │
│  Inventory - Clothing       [█████] 10 points             │
│  (Has clothing)                                           │
│                                                            │
│  Low Workload               [███████████] 15 points       │
│  (< 50% busy)                                             │
│                                                            │
│  Regional Capacity          [███] 5 points                │
│  (Can handle more regions)                                │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  MAXIMUM POSSIBLE SCORE: 130 points                       │
└────────────────────────────────────────────────────────────┘
```

---

## Location Capture Flow

```
┌─────────────────────────────────────────────────────────┐
│              LOCATION CAPTURE PROCESS                   │
└─────────────────────────────────────────────────────────┘

OPTION 1: AUTOMATIC (Recommended)
──────────────────────────────────
Victim Opens Form
    │
    ▼
Browser Requests Permission
"Allow location access?"
    │
    ├─ User Clicks "Allow"
    │       │
    │       ▼
    │  navigator.geolocation.getCurrentPosition()
    │       │
    │       ▼
    │  GPS Coordinates Retrieved:
    │  ├─ Latitude: 24.8607
    │  └─ Longitude: 67.0011
    │       │
    │       ▼
    │  Format: "24.8607, 67.0011"
    │       │
    │       ▼
    │  Auto-fill Location Field ✅
    │
    └─ User Clicks "Deny"
            │
            ▼
       Manual Entry Required


OPTION 2: MANUAL ENTRY
──────────────────────
Victim Types Coordinates
    │
    ├─ Format: "latitude, longitude"
    ├─ Example: "24.8607, 67.0011"
    │
    ▼
Validation:
├─ Check format (comma-separated)
├─ Check latitude range (-90 to +90)
├─ Check longitude range (-180 to +180)
└─ Parse to numbers
    │
    ▼
Valid ✅ → Submit Request
Invalid ❌ → Show Error


OPTION 3: MAP PICKER (Future)
──────────────────────────────
Victim Clicks Map
    │
    ▼
Interactive Map Opens
    │
    ├─ Shows current location
    ├─ User can drag marker
    └─ User clicks "Confirm Location"
        │
        ▼
    Coordinates Captured
        │
        ▼
    Auto-fill Location Field ✅
```

---

## NGO Dashboard View

```
┌─────────────────────────────────────────────────────────┐
│         AKHUWAT FOUNDATION - AID REQUESTS               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📍 NEW REQUEST - HIGH URGENCY                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Victim: Ahmed Khan                                │ │
│  │ CNIC: 42101-1234567-1                             │ │
│  │ Phone: +92-300-1234567                            │ │
│  │                                                   │ │
│  │ 📍 Location: Karachi (24.8607, 67.0011)           │ │
│  │ [View on Map]                                     │ │
│  │                                                   │ │
│  │ 👥 People Affected: 5                             │ │
│  │ ⚠️  Urgency: HIGH                                  │ │
│  │                                                   │ │
│  │ 📦 Packages Needed:                               │ │
│  │   • Food Package x5                               │ │
│  │   • Medical Kit x2                                │ │
│  │                                                   │ │
│  │ 📝 Notes: "Urgent - family stranded"              │ │
│  │                                                   │ │
│  │ ✅ Status: Approved (Auto-assigned)               │ │
│  │ 🕐 Received: 2 minutes ago                        │ │
│  │                                                   │ │
│  │ [Assign Volunteer] [Mark In Progress] [Fulfill]  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  📍 REQUEST - MEDIUM URGENCY                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Victim: Fatima Ali                                │ │
│  │ Location: Karachi (24.8701, 67.0301)              │ │
│  │ People: 3 | Urgency: MEDIUM                       │ │
│  │ Needs: Food x3, Shelter x1                        │ │
│  │ Status: In Progress                               │ │
│  │ [View Details]                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SYSTEM COMPONENTS                     │
└─────────────────────────────────────────────────────────┘

Frontend (Angular)
    │
    ├─ Help Request Dialog
    │  ├─ Captures GPS location
    │  ├─ Collects victim info
    │  └─ Submits to API
    │
    ▼
Backend API (Node.js/Express)
    │
    ├─ Aid Request Controller
    │  ├─ Receives request
    │  ├─ Parses location
    │  ├─ Calls findBestNGO()
    │  └─ Saves to database
    │
    ├─ findBestNGO() Function
    │  ├─ Queries Organizations
    │  ├─ Queries RegionAssignments
    │  ├─ Calculates scores
    │  └─ Returns best match
    │
    ▼
Database (MongoDB)
    │
    ├─ AidRequests Collection
    │  ├─ Stores request details
    │  ├─ Stores coordinates
    │  └─ Links to assigned NGO
    │
    ├─ Organizations Collection
    │  ├─ NGO details
    │  ├─ Capacity info
    │  └─ Inventory
    │
    └─ RegionAssignments Collection
       ├─ Disaster info
       ├─ Region details
       └─ Assigned NGOs
```

---

## Key Features

✅ **Automatic Location Capture**
   - Uses browser GPS
   - Accurate to ~10 meters
   - Fallback to manual entry

✅ **Intelligent Scoring**
   - Multiple factors considered
   - Weighted scoring system
   - Best match selected

✅ **Capacity Aware**
   - Checks NGO workload
   - Verifies inventory
   - Prevents overload

✅ **Region Based**
   - Respects admin assignments
   - Prioritizes local NGOs
   - Ensures coverage

✅ **Real-time Assignment**
   - Instant routing
   - No manual intervention
   - Faster response

✅ **Fallback Handling**
   - Pending if no match
   - Admin can override
   - Manual assignment option
