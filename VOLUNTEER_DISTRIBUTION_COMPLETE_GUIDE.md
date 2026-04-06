# 📋 Complete Guide: How Volunteers Can Check Victim Details

## Overview

This guide explains the complete process for volunteers to verify victims and distribute aid at distribution points using the shift-based system.

---

## 🎯 Prerequisites

Before a volunteer can check victim details, these things must be set up:

### 1. Volunteer Must Be Registered
- Volunteer account created
- Volunteer profile completed
- Assigned to an NGO

### 2. NGO Must Create Distribution Shift
- NGO creates a shift with location and time
- Shift assigned to the volunteer
- Shift must be currently active (within time range)

### 3. Victim Must Have Aid Request
- Victim submitted aid request
- Request approved by system
- Request assigned to the NGO

---

## 🔄 Complete Step-by-Step Process

### PART 1: Setup (Done by NGO)

#### Step 1: NGO Creates Distribution Shift

**Using Postman or API:**
```http
POST http://localhost:5000/api/distribution/shifts
Headers: {
  "Authorization": "Bearer <NGO_TOKEN>"
}
Body: {
  "organization": "69956ee5fc279ce9b2ab9e92",
  "location": "Distribution Point - F-10 Markaz",
  "shiftStart": "2026-03-04T08:00:00Z",
  "shiftEnd": "2026-03-04T16:00:00Z",
  "notes": "Morning shift for food distribution"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "shift123",
    "organization": "69956ee5fc279ce9b2ab9e92",
    "location": "Distribution Point - F-10 Markaz",
    "shiftStart": "2026-03-04T08:00:00Z",
    "shiftEnd": "2026-03-04T16:00:00Z",
    "status": "scheduled",
    "totalDistributions": 0
  }
}
```

#### Step 2: NGO Assigns Volunteer to Shift

```http
PUT http://localhost:5000/api/distribution/shifts/shift123/assign
Headers: {
  "Authorization": "Bearer <NGO_TOKEN>"
}
Body: {
  "volunteerId": "volunteer456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "shift123",
    "assignedVolunteer": {
      "_id": "volunteer456",
      "fullName": "Ahmed Khan",
      "phone": "0300-1234567"
    },
    "status": "scheduled"
  },
  "message": "Shift assigned to Ahmed Khan"
}
```

#### Step 3: Shift Becomes Active

When current time reaches `shiftStart`, the shift automatically becomes "active".

---

### PART 2: Volunteer Workflow

#### Step 1: Volunteer Logs In

1. Open browser: http://localhost:4200
2. Click "Login"
3. Enter credentials:
   - Email: volunteer@example.com
   - Password: password123
4. Click "Login"

**What Happens:**
- System authenticates user
- Returns JWT token
- Includes `volunteerId` in response
- Redirects to volunteer dashboard

#### Step 2: Navigate to Distribution Point

1. In the sidebar, click **"Distribution Point"**
2. URL changes to: `/dashboard/volunteer/distribution`
3. Page loads and checks for active shift

**What Happens Behind the Scenes:**
```typescript
// Component calls API
GET http://localhost:5000/api/distribution/my-active-shift

// Backend checks:
1. Gets volunteer from user ID
2. Finds shift where:
   - assignedVolunteer = this volunteer
   - status = 'active'
   - current time >= shiftStart
   - current time <= shiftEnd
3. Returns shift if found
```

#### Step 3: View Active Shift (If Assigned)

**If Volunteer Has Active Shift:**

You'll see a card showing:
```
┌─────────────────────────────────────┐
│  ✅ Active Shift    ⏰ 6h 30m       │
│                                     │
│  📍 Distribution Point - F-10 Markaz│
│  🏢 Red Crescent Society            │
│  👥 Distributions Today: 0          │
└─────────────────────────────────────┘
```

**If No Active Shift:**

You'll see:
```
┌─────────────────────────────────────┐
│         🕐 (Large Icon)             │
│                                     │
│      No Active Shift                │
│                                     │
│  You do not have an active          │
│  distribution shift at this time.   │
│                                     │
│  Contact your NGO to get assigned   │
│  to a distribution shift.           │
│                                     │
│      [🔄 Refresh Status]            │
└─────────────────────────────────────┘
```

#### Step 4: Victim Arrives at Distribution Point

**Victim brings:**
- CNIC card (National ID)
- May have reference number from aid request

**Volunteer asks for:**
- CNIC number (13 digits)

#### Step 5: Enter CNIC and Verify

1. In the "Verify Victim" section
2. Enter CNIC in the input field
   - Example: `1234512345671` (13 digits)
   - Or formatted: `12345-1234567-1`
3. Click **"Verify"** button (or press Enter)

**What Happens:**
```typescript
// Frontend calls API
POST http://localhost:5000/api/distribution/verify-victim
Body: {
  "cnic": "1234512345671"
}

// Backend verifies:
1. ✅ Volunteer has active shift?
2. ✅ Current time within shift hours?
3. ✅ Aid request exists for this CNIC?
4. ✅ Request assigned to same NGO?
5. ✅ Request status is approved/in_progress?

// If ALL pass → Returns victim details
// If ANY fail → Returns error
```

#### Step 6: View Victim Details

**If Verification Successful:**

A card appears showing:

```
┌─────────────────────────────────────┐
│  👤 Victim Details        🔴 HIGH   │
├─────────────────────────────────────┤
│  Personal Information               │
│  ├─ Full Name: Muhammad Ali Khan    │
│  ├─ CNIC: 12345-1234567-1          │
│  ├─ Phone: 0300-1234567            │
│  └─ People Count: 5 people         │
│                                     │
│  Packages to Distribute             │
│  ├─ 📦 Food Package Basic           │
│  │   Quantity: 2                    │
│  │   Category: FOOD                 │
│  │                                  │
│  └─ 📦 Medical Kit Standard         │
│      Quantity: 1                    │
│      Category: MEDICAL              │
│                                     │
│  Location                           │
│  └─ 📍 33.123456, 73.654321        │
│                                     │
│  ⚠️ Please verify victim identity   │
│     before distributing aid         │
│                                     │
│  [✅ Mark as Distributed]           │
└─────────────────────────────────────┘
```

**If Verification Failed:**

Error message appears:
- "No pending aid request found for this CNIC"
- "Access denied: You do not have an active distribution shift"
- "Victim may have already received aid"

#### Step 7: Verify Victim Identity

**Volunteer must:**
1. Check victim's CNIC card
2. Match name on card with name on screen
3. Match CNIC number
4. Confirm victim is the actual person

**Security Check:**
- Ask victim to show CNIC card
- Compare photo on CNIC with person
- Verify CNIC number matches

#### Step 8: Distribute Aid Packages

**Volunteer gives:**
- 2x Food Package Basic
- 1x Medical Kit Standard
- (As shown in the packages list)

**Confirm with victim:**
- Count packages together
- Explain contents if needed
- Answer any questions

#### Step 9: Mark as Distributed

1. Click **"Mark as Distributed"** button
2. Confirm in the dialog that appears
3. Wait for success message

**What Happens:**
```typescript
// Frontend calls API
POST http://localhost:5000/api/distribution/mark-distributed
Body: {
  "aidRequestId": "aid789",
  "cnic": "1234512345671"
}

// Backend updates:
1. Aid request status → "fulfilled"
2. fulfilledBy → volunteer user ID
3. fulfilledDate → current timestamp
4. Shift totalDistributions → +1
5. Adds to shift's aidRequestsHandled array

// Returns success
```

**Success Message:**
```
✅ Aid marked as distributed successfully!
```

**What Updates:**
- Form clears automatically
- Shift statistics update (Distributions Today: 1)
- Ready for next victim

#### Step 10: Repeat for Next Victim

1. Form is now clear
2. Enter next victim's CNIC
3. Repeat process

---

## 🔒 Security & Access Control

### When Volunteer CAN Access Victim Data:

✅ Has active shift assigned  
✅ Current time is between shiftStart and shiftEnd  
✅ Shift status is "active"  
✅ Aid request exists for the CNIC  
✅ Aid request assigned to same NGO  

### When Volunteer CANNOT Access:

❌ No shift assigned  
❌ Shift not started yet  
❌ Shift already ended  
❌ Shift cancelled  
❌ CNIC not found  
❌ Aid request from different NGO  
❌ Aid request already fulfilled  

---

## 🧪 Testing Scenarios

### Scenario 1: Happy Path (Everything Works)

**Setup:**
1. NGO creates shift for today 8 AM - 4 PM
2. NGO assigns volunteer to shift
3. Current time is 10 AM (within shift)
4. Victim has approved aid request

**Test:**
1. Volunteer logs in ✅
2. Goes to Distribution Point ✅
3. Sees active shift card ✅
4. Enters victim CNIC ✅
5. Sees victim details ✅
6. Marks as distributed ✅
7. Success! ✅

### Scenario 2: No Active Shift

**Setup:**
1. Volunteer not assigned to any shift
2. Or shift time hasn't started yet
3. Or shift already ended

**Test:**
1. Volunteer logs in ✅
2. Goes to Distribution Point ✅
3. Sees "No Active Shift" message ✅
4. Cannot verify victims ✅

### Scenario 3: Victim Not Found

**Setup:**
1. Volunteer has active shift
2. CNIC entered doesn't match any aid request

**Test:**
1. Volunteer enters CNIC ✅
2. Clicks Verify ✅
3. Error: "No pending aid request found" ✅
4. No victim details shown ✅

### Scenario 4: Shift Expires During Work

**Setup:**
1. Volunteer working at 3:55 PM
2. Shift ends at 4:00 PM
3. Volunteer tries to verify at 4:01 PM

**Test:**
1. At 3:55 PM - Can verify ✅
2. At 4:00 PM - Shift ends ✅
3. At 4:01 PM - Access denied ✅
4. Error: "No active shift" ✅

---

## 📊 API Endpoints Reference

### Check Active Shift
```http
GET /api/distribution/my-active-shift
Headers: Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "data": {
    "_id": "shift123",
    "location": "Distribution Point A",
    "shiftStart": "2026-03-04T08:00:00Z",
    "shiftEnd": "2026-03-04T16:00:00Z",
    "totalDistributions": 5,
    "organization": {
      "name": "Red Crescent",
      "contact": {...}
    }
  },
  "hasActiveShift": true
}
```

### Verify Victim
```http
POST /api/distribution/verify-victim
Headers: Authorization: Bearer <TOKEN>
Body: {
  "cnic": "1234512345671"
}

Response (Success):
{
  "success": true,
  "data": {
    "aidRequest": {
      "_id": "aid789",
      "victimName": "Muhammad Ali Khan",
      "victimCNIC": "1234512345671",
      "victimPhone": "0300-1234567",
      "packagesNeeded": [...],
      "urgency": "high",
      "peopleCount": 5
    },
    "shift": {
      "_id": "shift123",
      "location": "Distribution Point A"
    }
  }
}

Response (Error):
{
  "success": false,
  "message": "Access denied: You do not have an active distribution shift",
  "hint": "Contact your NGO to assign you to a shift"
}
```

### Mark Distributed
```http
POST /api/distribution/mark-distributed
Headers: Authorization: Bearer <TOKEN>
Body: {
  "aidRequestId": "aid789",
  "cnic": "1234512345671"
}

Response:
{
  "success": true,
  "data": {
    "_id": "aid789",
    "status": "fulfilled",
    "fulfilledBy": "user123",
    "fulfilledDate": "2026-03-04T10:30:00Z"
  },
  "message": "Aid marked as distributed successfully"
}
```

---

## 🐛 Troubleshooting

### Problem: "No Active Shift" Message

**Possible Causes:**
1. NGO hasn't created shift
2. NGO hasn't assigned volunteer to shift
3. Shift time hasn't started yet
4. Shift already ended
5. Shift was cancelled

**Solution:**
- Contact NGO to create/assign shift
- Check shift timing
- Wait for shift to start
- Refresh page after shift is assigned

### Problem: "Victim Not Found"

**Possible Causes:**
1. CNIC entered incorrectly
2. Victim hasn't submitted aid request
3. Aid request not approved yet
4. Aid request assigned to different NGO
5. Aid already distributed

**Solution:**
- Double-check CNIC number
- Ask victim to submit aid request first
- Wait for admin/system approval
- Verify victim is at correct NGO location
- Check if aid already received

### Problem: Can't Click "Mark as Distributed"

**Possible Causes:**
1. Button disabled during API call
2. Network error
3. Session expired

**Solution:**
- Wait for loading to complete
- Check internet connection
- Refresh page and try again
- Re-login if session expired

---

## 📱 Mobile/Tablet Usage

The interface is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets (recommended for distribution points)
- ✅ Mobile phones

**Recommended:**
- Use tablet at distribution point
- Larger screen for better visibility
- Touch-friendly buttons

---

## 🎯 Best Practices

### For Volunteers:

1. **Arrive Early** - Check shift status before victims arrive
2. **Verify Identity** - Always check CNIC card
3. **Count Packages** - Verify quantities with victim
4. **Mark Immediately** - Mark as distributed right after giving aid
5. **Stay Professional** - Be courteous and helpful

### For NGOs:

1. **Create Shifts in Advance** - Don't wait until last minute
2. **Assign Reliable Volunteers** - Choose experienced volunteers
3. **Set Realistic Times** - Don't make shifts too long
4. **Monitor Progress** - Check distribution statistics
5. **Have Backup** - Assign backup volunteer if possible

---

## ✅ Quick Checklist

Before starting distribution:
- [ ] Volunteer logged in
- [ ] Active shift assigned
- [ ] Shift time is current
- [ ] Distribution point set up
- [ ] Aid packages ready
- [ ] Internet connection working
- [ ] Device charged/plugged in

During distribution:
- [ ] Check victim CNIC card
- [ ] Enter CNIC correctly
- [ ] Verify details match
- [ ] Give correct packages
- [ ] Mark as distributed
- [ ] Confirm success message

---

## 🚀 Summary

**For Volunteers to Check Victim Details:**

1. **NGO creates shift** and assigns volunteer
2. **Volunteer logs in** during shift time
3. **Goes to "Distribution Point"** page
4. **Enters victim CNIC** number
5. **Clicks "Verify"** button
6. **System shows full details** (if authorized)
7. **Distributes aid** packages
8. **Marks as distributed**
9. **Repeats** for next victim

**Key Point:** Volunteers can ONLY see victim details during their active shift hours. Access is automatically granted when shift starts and revoked when shift ends.

---

**System Status:** ✅ Fully Operational  
**Servers:** Backend (Port 5000) + Frontend (Port 4200)  
**Access:** http://localhost:4200/dashboard/volunteer/distribution

---

Need help? Check the error messages - they provide clear guidance on what to do next!
