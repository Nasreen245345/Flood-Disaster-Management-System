# Distribution Shift Debugging Guide

## Issue: Volunteer Can't See Active Shift

### Checklist for Troubleshooting

#### 1. Check if Shift Was Created
Open browser console (F12) and check the Network tab when NGO creates a shift.
- Look for POST request to `/api/distribution/shifts`
- Check response - should have `success: true` and shift data

#### 2. Check if Volunteer Was Assigned
- Look for PUT request to `/api/distribution/shifts/:id/assign`
- Response should show `assignedVolunteer` field populated

#### 3. Check if Shift Status is "active"
The shift must have status "active" for volunteer to see it.

**Important:** When you create a shift, it starts with status "scheduled". You must:
1. Assign a volunteer to the shift
2. Click "Start Shift" button to change status to "active"

#### 4. Check Volunteer Login
Make sure you're logged in as the SAME volunteer that was assigned to the shift.

**To verify:**
- Check browser console logs
- Look for "Active shift response:" log
- Check if volunteer ID matches

#### 5. Check Shift Timing
The shift must be within the current time window:
- `shiftStart` must be <= current time
- `shiftEnd` must be >= current time

### Step-by-Step Testing

#### Step 1: Create Shift (as NGO)
```
1. Login as NGO: ngo@akhuwat.org / password123
2. Go to "Distribution Shifts"
3. Click "Create Shift"
4. Fill in:
   - Location: "Main Distribution Center"
   - Start Date: TODAY
   - Start Time: Current time - 1 hour (e.g., if now is 14:00, use 13:00)
   - End Date: TODAY
   - End Time: Current time + 3 hours (e.g., if now is 14:00, use 17:00)
5. Click "Create Shift"
```

#### Step 2: Assign Volunteer (as NGO)
```
1. Find the shift in "Scheduled" tab
2. Click "Assign Volunteer"
3. Select a verified volunteer (e.g., "Niyaz Ali")
4. Click "Assign"
5. Note the volunteer's name
```

#### Step 3: Start Shift (as NGO)
```
1. The shift should still be in "Scheduled" tab
2. Click "Start Shift" button
3. Shift should move to "Active" tab
4. Status should show "active"
```

#### Step 4: Login as Volunteer
```
1. Logout from NGO account
2. Login as the assigned volunteer
   - Find volunteer email in database or use test volunteer
3. Go to "Distribution Point" page
4. Should see active shift details
```

### Common Issues & Solutions

#### Issue 1: "No Active Shift" Message
**Causes:**
- Shift status is still "scheduled" (not started)
- Shift timing is outside current time window
- Logged in as different volunteer
- Volunteer not assigned to any shift

**Solution:**
- Make sure NGO clicked "Start Shift"
- Check shift start/end times
- Verify you're logged in as the assigned volunteer

#### Issue 2: Data Loads Slowly
**Cause:** Angular change detection issue

**Solution:** Already fixed with ChangeDetectorRef
- Component now forces UI updates
- Added console logs for debugging

#### Issue 3: Shift Created but Not Visible
**Cause:** Frontend not refreshing

**Solution:**
- Check browser console for errors
- Refresh the page
- Check Network tab for API responses

### Backend API Endpoints

#### Get My Active Shift
```
GET /api/distribution/my-active-shift
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "location": "Main Distribution Center",
    "shiftStart": "2026-03-03T08:00:00.000Z",
    "shiftEnd": "2026-03-03T16:00:00.000Z",
    "status": "active",
    "assignedVolunteer": "...",
    "totalDistributions": 0,
    "organization": {
      "name": "Akhuwat Foundation",
      "contact": {...}
    }
  },
  "hasActiveShift": true
}
```

### Console Debugging Commands

Open browser console and run:

```javascript
// Check current user
console.log(localStorage.getItem('dms_token'));

// Check volunteer service
// (In component, add this to ngOnInit)
console.log('Checking active shift...');
this.volunteerService.getMyActiveShift().subscribe(
  response => console.log('Shift response:', response),
  error => console.error('Shift error:', error)
);
```

### Database Queries (MongoDB)

If you have access to MongoDB, run these queries:

```javascript
// Find all shifts
db.distributionshifts.find().pretty()

// Find active shifts
db.distributionshifts.find({ status: 'active' }).pretty()

// Find shifts for specific volunteer
db.distributionshifts.find({ 
  assignedVolunteer: ObjectId("VOLUNTEER_ID") 
}).pretty()

// Check volunteer profile
db.volunteers.find({ fullName: "Niyaz Ali" }).pretty()
```

### Quick Test Script

You can also use the existing test script:

```bash
cd backend
node create-test-shift.js
```

This creates an active shift for the first volunteer found.

### Expected Console Logs

When volunteer loads distribution page, you should see:

```
Checking active shift...
Active shift response: {success: true, data: {...}, hasActiveShift: true}
Active shift found: {_id: "...", location: "...", ...}
Has active shift: true
```

If you see:
```
No active shift found
```

Then the shift is not active or not assigned to this volunteer.

### Summary

The most common issue is forgetting to:
1. **Assign the volunteer** to the shift
2. **Start the shift** (change status from "scheduled" to "active")
3. **Login as the correct volunteer**

Make sure all three steps are completed!
