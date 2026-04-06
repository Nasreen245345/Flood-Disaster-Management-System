# 📊 Volunteer Victim Verification - Visual Flowchart

## Simple Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VOLUNTEER WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

1. LOGIN
   ↓
   Volunteer logs in with credentials
   ↓
   System returns JWT token + volunteerId
   ↓

2. NAVIGATE TO DISTRIBUTION POINT
   ↓
   Click "Distribution Point" in sidebar
   ↓
   Page loads: /dashboard/volunteer/distribution
   ↓

3. CHECK ACTIVE SHIFT
   ↓
   System calls: GET /api/distribution/my-active-shift
   ↓
   ┌─────────────────────────────────────┐
   │  Has Active Shift?                  │
   └─────────────────────────────────────┘
          │                    │
          │ YES                │ NO
          ↓                    ↓
   ┌──────────────┐     ┌──────────────┐
   │ Show Shift   │     │ Show "No     │
   │ Info Card    │     │ Active       │
   │              │     │ Shift"       │
   │ ✅ Active    │     │ Message      │
   │ ⏰ Timer     │     │              │
   │ 📍 Location  │     │ Contact NGO  │
   │ 👥 Stats     │     │              │
   └──────────────┘     └──────────────┘
          │                    │
          ↓                    ↓
   Continue to Step 4      STOP (Cannot verify)

4. VICTIM ARRIVES
   ↓
   Victim shows CNIC card
   ↓
   Volunteer enters CNIC: 1234512345671
   ↓

5. VERIFY VICTIM
   ↓
   Click "Verify" button
   ↓
   System calls: POST /api/distribution/verify-victim
   ↓
   Backend checks:
   ├─ ✅ Active shift?
   ├─ ✅ Within shift hours?
   ├─ ✅ Aid request exists?
   ├─ ✅ Same NGO?
   └─ ✅ Status approved?
   ↓
   ┌─────────────────────────────────────┐
   │  All Checks Pass?                   │
   └─────────────────────────────────────┘
          │                    │
          │ YES                │ NO
          ↓                    ↓
   ┌──────────────┐     ┌──────────────┐
   │ Show Victim  │     │ Show Error   │
   │ Details:     │     │ Message      │
   │              │     │              │
   │ 👤 Name      │     │ "Victim not  │
   │ 🆔 CNIC      │     │ found" or    │
   │ 📱 Phone     │     │ "No active   │
   │ 📦 Packages  │     │ shift"       │
   │ 👥 Count     │     │              │
   └──────────────┘     └──────────────┘
          │                    │
          ↓                    ↓
   Continue to Step 6      Go back to Step 4

6. VERIFY IDENTITY
   ↓
   Volunteer checks:
   ├─ CNIC card matches screen
   ├─ Photo matches person
   └─ Name matches
   ↓
   Identity confirmed? ✅
   ↓

7. DISTRIBUTE AID
   ↓
   Give packages to victim:
   ├─ 2x Food Package
   ├─ 1x Medical Kit
   └─ (As shown on screen)
   ↓
   Victim receives aid ✅
   ↓

8. MARK AS DISTRIBUTED
   ↓
   Click "Mark as Distributed"
   ↓
   Confirm action
   ↓
   System calls: POST /api/distribution/mark-distributed
   ↓
   Backend updates:
   ├─ Aid request → "fulfilled"
   ├─ Shift stats → +1
   └─ Audit log created
   ↓
   ┌──────────────────────────────────┐
   │  ✅ Success!                     │
   │  "Aid marked as distributed"     │
   └──────────────────────────────────┘
   ↓
   Form clears automatically
   ↓

9. NEXT VICTIM
   ↓
   Go back to Step 4
   ↓
   Repeat process

10. SHIFT ENDS
    ↓
    Time reaches shiftEnd
    ↓
    System automatically:
    ├─ Revokes access
    ├─ Changes status to "completed"
    └─ Shows "No Active Shift"
    ↓
    Volunteer can no longer verify victims
    ↓
    END
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│              ACCESS CONTROL DECISION TREE                    │
└─────────────────────────────────────────────────────────────┘

Volunteer tries to verify victim
        ↓
┌───────────────────┐
│ Has active shift? │
└───────────────────┘
    │           │
   YES         NO → ❌ DENIED: "No active shift"
    ↓
┌───────────────────────────┐
│ Current time >= shiftStart?│
└───────────────────────────┘
    │           │
   YES         NO → ❌ DENIED: "Shift not started"
    ↓
┌───────────────────────────┐
│ Current time <= shiftEnd?  │
└───────────────────────────┘
    │           │
   YES         NO → ❌ DENIED: "Shift ended"
    ↓
┌───────────────────────────┐
│ Shift status = 'active'?   │
└───────────────────────────┘
    │           │
   YES         NO → ❌ DENIED: "Shift not active"
    ↓
┌───────────────────────────┐
│ Aid request exists?        │
└───────────────────────────┘
    │           │
   YES         NO → ❌ DENIED: "Victim not found"
    ↓
┌───────────────────────────┐
│ Same NGO?                  │
└───────────────────────────┘
    │           │
   YES         NO → ❌ DENIED: "Wrong NGO"
    ↓
┌───────────────────────────┐
│ Status approved/in_progress?│
└───────────────────────────┘
    │           │
   YES         NO → ❌ DENIED: "Already fulfilled"
    ↓
    ✅ ACCESS GRANTED
    Show full victim details
```

---

## Time-Based Access

```
Timeline View:

07:00 AM ─────────────────────────────────────────────────
         │
         │  Shift Status: scheduled
         │  Volunteer Access: ❌ DENIED
         │
08:00 AM ─────────────────────────────────────────────────
         │  ← Shift Starts (shiftStart)
         │
         │  Shift Status: active
         │  Volunteer Access: ✅ GRANTED
         │
         │  Volunteer can:
         │  ├─ Verify victims
         │  ├─ See full details
         │  └─ Mark as distributed
         │
12:00 PM ─────────────────────────────────────────────────
         │  (Midday - still active)
         │
         │  Shift Status: active
         │  Volunteer Access: ✅ GRANTED
         │
04:00 PM ─────────────────────────────────────────────────
         │  ← Shift Ends (shiftEnd)
         │
         │  Shift Status: completed
         │  Volunteer Access: ❌ DENIED
         │
05:00 PM ─────────────────────────────────────────────────
```

---

## Data Flow Diagram

```
┌─────────────┐
│  VOLUNTEER  │
│   Browser   │
└──────┬──────┘
       │
       │ 1. Login
       ↓
┌─────────────┐
│  Frontend   │
│  Angular    │
└──────┬──────┘
       │
       │ 2. GET /my-active-shift
       ↓
┌─────────────┐
│   Backend   │
│   Node.js   │
└──────┬──────┘
       │
       │ 3. Query database
       ↓
┌─────────────┐
│  MongoDB    │
│  Database   │
└──────┬──────┘
       │
       │ 4. Return shift data
       ↑
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 5. Check time & status
       │    Update if needed
       ↓
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       │ 6. Display shift info
       ↓
┌─────────────┐
│  VOLUNTEER  │
│   Sees UI   │
└─────────────┘

Then for verification:

┌─────────────┐
│  VOLUNTEER  │
│ Enters CNIC │
└──────┬──────┘
       │
       │ 7. POST /verify-victim
       │    Body: { cnic: "..." }
       ↓
┌─────────────┐
│   Backend   │
│  Validates  │
└──────┬──────┘
       │
       │ 8. Check all conditions
       │    ├─ Active shift?
       │    ├─ Within hours?
       │    └─ Aid request exists?
       ↓
┌─────────────┐
│  MongoDB    │
│  Query data │
└──────┬──────┘
       │
       │ 9. Return victim details
       ↑
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 10. Send to frontend
       ↓
┌─────────────┐
│  Frontend   │
│ Display card│
└──────┬──────┘
       │
       │ 11. Show victim info
       ↓
┌─────────────┐
│  VOLUNTEER  │
│  Sees data  │
└─────────────┘
```

---

## Component Interaction

```
┌────────────────────────────────────────────────────────┐
│              FRONTEND COMPONENTS                        │
└────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  Sidebar Component  │
│  - Menu items       │
│  - "Distribution    │
│    Point" link      │
└──────────┬──────────┘
           │
           │ Click
           ↓
┌─────────────────────┐
│  Router             │
│  Navigate to route  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  Distribution Component             │
│  - Check active shift               │
│  - Show shift info                  │
│  - CNIC input form                  │
│  - Victim details card              │
│  - Distribution button              │
└──────────┬──────────────────────────┘
           │
           │ Uses
           ↓
┌─────────────────────────────────────┐
│  Volunteer Service                  │
│  - getMyActiveShift()               │
│  - verifyVictim(cnic)               │
│  - markDistributed(id, cnic)        │
└──────────┬──────────────────────────┘
           │
           │ HTTP Calls
           ↓
┌─────────────────────────────────────┐
│  Backend API                        │
│  - /api/distribution/*              │
└─────────────────────────────────────┘
```

---

## Quick Reference

### ✅ Volunteer CAN See Victim Data When:
```
✓ Has active shift
✓ Current time within shift hours
✓ Shift status = "active"
✓ Aid request exists for CNIC
✓ Request assigned to same NGO
```

### ❌ Volunteer CANNOT See Victim Data When:
```
✗ No shift assigned
✗ Shift not started yet
✗ Shift already ended
✗ Shift cancelled
✗ CNIC not found
✗ Wrong NGO
✗ Already distributed
```

### 🔑 Key URLs:
```
Login:        http://localhost:4200/auth/login
Distribution: http://localhost:4200/dashboard/volunteer/distribution
API Base:     http://localhost:5000/api
```

### 📞 API Endpoints:
```
GET  /api/distribution/my-active-shift
POST /api/distribution/verify-victim
POST /api/distribution/mark-distributed
```

---

This flowchart shows the complete process from login to distribution!
