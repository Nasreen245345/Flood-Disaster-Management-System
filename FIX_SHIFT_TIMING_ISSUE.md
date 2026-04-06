# Fix: Shift Timing Issue

## Problem
The shifts show as "Completed" instead of "Active" because the shift end time has already passed.

## Why This Happens
The system automatically updates shift status based on time:
- If current time > shift end time → Status changes to "completed"
- If current time is between start and end time → Status is "active"

## Solution: Create Shift with Future End Time

### Step 1: Delete Old Shifts (Optional)
1. Login as NGO
2. Go to "Distribution Shifts"
3. Go to "Completed" tab
4. Delete the old completed shifts

### Step 2: Create New Shift with Correct Timing

**Important:** Make sure the end time is in the FUTURE!

1. Click "Create Shift"
2. Fill in the form:

```
Location: Main Distribution Center

Start Date: TODAY (March 3, 2026)
Start Time: [Current time - 1 hour]
Example: If now is 14:00, use 13:00

End Date: TODAY (March 3, 2026)  
End Time: [Current time + 3 hours]
Example: If now is 14:00, use 17:00

Notes: Food package distribution
```

3. Click "Create Shift"

### Step 3: Assign Volunteer
1. Find shift in "Scheduled" tab
2. Click "Assign Volunteer"
3. Select "Ali Zafar" (or any verified volunteer)
4. Click "Assign"

### Step 4: Start Shift
1. Click "Start Shift" button
2. Shift moves to "Active" tab
3. Status changes to "active"

### Step 5: Test as Volunteer
1. Logout from NGO
2. Login as Ali Zafar (the assigned volunteer)
3. Go to "Distribution Point"
4. Should see active shift!

## Quick Test Script

Alternatively, use this script to create a shift that's active right now:

```bash
cd backend
node create-test-shift.js
```

This script automatically creates a shift with:
- Start time: Current time - 1 hour
- End time: Current time + 8 hours
- Status: active
- Assigned to first volunteer found

## Example Timing

If current time is **14:00 (2:00 PM)**:

✅ **CORRECT:**
- Start: 13:00 (1:00 PM)
- End: 17:00 (5:00 PM)
- Result: Shift is ACTIVE from 13:00 to 17:00

❌ **WRONG:**
- Start: 09:00 (9:00 AM)
- End: 13:00 (1:00 PM)
- Result: Shift is COMPLETED (end time already passed)

## Checking Current Time

To check your current time:
1. Open browser console (F12)
2. Type: `new Date()`
3. Press Enter
4. You'll see: `Mon Mar 03 2026 14:23:45 GMT+0500`

Use this time to calculate your shift start/end times.

## Why Your Current Shifts Are Completed

Looking at your screenshot:
- Shift created: Mar 3, 2026, 09:00 AM
- If current time is after 09:00 AM, the shift end time has passed
- System automatically marked it as "completed"

## Prevention

Always create shifts with:
- Start time: Current time or slightly before
- End time: Several hours in the future
- This ensures the shift stays "active" during testing

## Summary

The system is working correctly! It's automatically managing shift status based on time. You just need to create a shift with an end time that hasn't passed yet.
