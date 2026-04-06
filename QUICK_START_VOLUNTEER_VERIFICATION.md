# 🚀 Quick Start: Volunteer Victim Verification

## 5-Minute Setup Guide

### Prerequisites
- ✅ Backend running on port 5000
- ✅ Frontend running on port 4200
- ✅ Volunteer account created
- ✅ NGO account created

---

## Step-by-Step Instructions

### STEP 1: Create Distribution Shift (NGO)

**Using Postman:**

```http
POST http://localhost:5000/api/distribution/shifts
```

**Headers:**
```
Authorization: Bearer <NGO_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "organization": "YOUR_NGO_ID",
  "location": "Distribution Point - Main Center",
  "shiftStart": "2026-03-04T08:00:00.000Z",
  "shiftEnd": "2026-03-04T20:00:00.000Z",
  "notes": "Full day shift"
}
```

**Important:** 
- Replace `YOUR_NGO_ID` with actual NGO organization ID
- Set `shiftStart` to current or future time
- Set `shiftEnd` to several hours later

**Response:** Copy the `_id` from response (this is your SHIFT_ID)

---

### STEP 2: Assign Volunteer to Shift (NGO)

```http
PUT http://localhost:5000/api/distribution/shifts/SHIFT_ID/assign
```

**Headers:**
```
Authorization: Bearer <NGO_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "volunteerId": "YOUR_VOLUNTEER_ID"
}
```

**Important:**
- Replace `SHIFT_ID` with ID from Step 1
- Replace `YOUR_VOLUNTEER_ID` with actual volunteer ID

---

### STEP 3: Volunteer Logs In

1. Open browser: **http://localhost:4200**
2. Click **"Login"**
3. Enter volunteer credentials
4. Click **"Login"** button

---

### STEP 4: Navigate to Distribution Point

1. In sidebar, click **"Distribution Point"**
2. You should see:
   - ✅ Active Shift card (if shift is active)
   - OR "No Active Shift" message (if no shift)

---

### STEP 5: Verify Victim

**If you see "Active Shift" card:**

1. Enter victim CNIC in input field
   - Example: `1234512345671`
2. Click **"Verify"** button
3. Wait for response

**Expected Results:**

**Success:**
- Victim details card appears
- Shows name, CNIC, phone, packages

**Error:**
- "No pending aid request found for this CNIC"
- "Access denied: You do not have an active distribution shift"

---

### STEP 6: Mark as Distributed

1. Review victim details
2. Verify identity
3. Give packages to victim
4. Click **"Mark as Distributed"**
5. Confirm action
6. See success message

---

## Testing with Sample Data

### Create Test Aid Request (Victim)

```http
POST http://localhost:5000/api/aid-requests
```

**Headers:**
```
Authorization: Bearer <VICTIM_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "victimName": "Test Victim",
  "victimCNIC": "1234512345671",
  "victimPhone": "0300-1234567",
  "location": "33.123456, 73.654321",
  "packagesNeeded": [
    {
      "category": "food",
      "packageName": "Food Package Basic",
      "quantity": 2
    }
  ],
  "urgency": "high",
  "peopleCount": 5,
  "additionalNotes": "Test request"
}
```

**Important:** The system will auto-assign this to an NGO

---

## Troubleshooting

### Problem: "No Active Shift"

**Check:**
1. Is shift created? (Step 1)
2. Is volunteer assigned? (Step 2)
3. Is current time between shiftStart and shiftEnd?
4. Is shift status "active"?

**Fix:**
- Create shift with current time
- Assign volunteer to shift
- Wait for shift to start
- Refresh page

---

### Problem: "Victim Not Found"

**Check:**
1. Does aid request exist for this CNIC?
2. Is aid request approved?
3. Is aid request assigned to same NGO?
4. Is CNIC entered correctly?

**Fix:**
- Create aid request first
- Wait for auto-assignment
- Check CNIC number
- Try different CNIC

---

### Problem: Can't Login

**Check:**
1. Are servers running?
2. Is email/password correct?
3. Is user role "volunteer"?

**Fix:**
- Start servers: `npm start`
- Check credentials
- Create volunteer account if needed

---

## Quick Commands

### Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd dms-landing
npm start
```

### Check Server Status
```bash
# Backend health check
curl http://localhost:5000/api/health

# Frontend
# Open: http://localhost:4200
```

---

## API Testing with Postman

### Collection Setup

1. **Create Collection:** "DMS Distribution"

2. **Add Environment Variables:**
   - `base_url`: http://localhost:5000/api
   - `ngo_token`: (paste NGO JWT token)
   - `volunteer_token`: (paste volunteer JWT token)
   - `shift_id`: (paste shift ID after creation)
   - `volunteer_id`: (paste volunteer ID)

3. **Add Requests:**

**Request 1: Create Shift**
```
POST {{base_url}}/distribution/shifts
Headers: Authorization: Bearer {{ngo_token}}
Body: { shift data }
```

**Request 2: Assign Volunteer**
```
PUT {{base_url}}/distribution/shifts/{{shift_id}}/assign
Headers: Authorization: Bearer {{ngo_token}}
Body: { "volunteerId": "{{volunteer_id}}" }
```

**Request 3: Check Active Shift**
```
GET {{base_url}}/distribution/my-active-shift
Headers: Authorization: Bearer {{volunteer_token}}
```

**Request 4: Verify Victim**
```
POST {{base_url}}/distribution/verify-victim
Headers: Authorization: Bearer {{volunteer_token}}
Body: { "cnic": "1234512345671" }
```

**Request 5: Mark Distributed**
```
POST {{base_url}}/distribution/mark-distributed
Headers: Authorization: Bearer {{volunteer_token}}
Body: { "aidRequestId": "...", "cnic": "1234512345671" }
```

---

## Expected Flow

```
1. NGO creates shift          → Status: scheduled
2. NGO assigns volunteer      → Volunteer linked
3. Time reaches shiftStart    → Status: active
4. Volunteer logs in          → Sees active shift
5. Volunteer enters CNIC      → Verifies victim
6. System shows details       → Full victim info
7. Volunteer distributes      → Gives packages
8. Volunteer marks done       → Status: fulfilled
9. Time reaches shiftEnd      → Status: completed
10. Access revoked            → No longer can verify
```

---

## Success Indicators

### ✅ Everything Working When:

1. **Shift Created:**
   - Response has `_id`
   - Status is "scheduled"

2. **Volunteer Assigned:**
   - Response shows volunteer name
   - `assignedVolunteer` field populated

3. **Shift Active:**
   - Current time within shift hours
   - Status is "active"
   - Volunteer sees shift card

4. **Verification Works:**
   - Enter CNIC → See victim details
   - All fields populated
   - Packages list shown

5. **Distribution Works:**
   - Click button → Success message
   - Aid request status → "fulfilled"
   - Shift stats updated

---

## Time-Saving Tips

### Use Current Time for Testing

Instead of future times, use current time:

```javascript
// Get current time + 1 hour
const now = new Date();
const shiftStart = now.toISOString();
const shiftEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();

// Use these in your API call
{
  "shiftStart": shiftStart,
  "shiftEnd": shiftEnd
}
```

### Auto-Approve Aid Requests

The system auto-assigns aid requests to NGOs based on:
- NGO capacity
- Region assignments
- Inventory availability

So just create the aid request and it should auto-assign!

---

## Common Mistakes

### ❌ Mistake 1: Shift Time in Past
```json
{
  "shiftStart": "2026-01-01T08:00:00Z",  // ← Past date
  "shiftEnd": "2026-01-01T16:00:00Z"
}
```
**Fix:** Use current or future dates

### ❌ Mistake 2: Wrong Organization ID
```json
{
  "organization": "wrong_id",  // ← Doesn't exist
}
```
**Fix:** Use actual NGO organization ID from database

### ❌ Mistake 3: Volunteer Not Assigned
```
Shift created but volunteer not assigned
```
**Fix:** Call the assign endpoint (Step 2)

### ❌ Mistake 4: Wrong CNIC Format
```
CNIC: "12345-1234567-1"  // ← With dashes
```
**Fix:** Use without dashes: `1234512345671`

---

## Next Steps

After successful verification:

1. **Test Multiple Victims** - Create more aid requests
2. **Test Shift Handover** - Create new shift for different volunteer
3. **Test Access Control** - Try verifying after shift ends
4. **Monitor Statistics** - Check shift totalDistributions
5. **Review Audit Logs** - Check aidRequestsHandled array

---

## Support

If you encounter issues:

1. **Check Backend Logs** - Look for error messages
2. **Check Frontend Console** - Open browser DevTools
3. **Verify Data** - Check MongoDB for records
4. **Test APIs** - Use Postman to isolate issues
5. **Restart Servers** - Sometimes helps with caching

---

**Ready to test?** Follow the steps above and you'll be verifying victims in minutes! 🚀
