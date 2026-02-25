# Quick Test Guide - Auto-Create Records

## 🚀 Quick Start

**Backend:** http://localhost:5000 ✅ Running (Process 5)
**Frontend:** http://localhost:4200 ✅ Running (Process 1)

---

## Test 1: NGO Auto-Creation (2 minutes)

### Step 1: Sign Up
1. Go to http://localhost:4200
2. Click "Sign Up"
3. Fill form:
   - Name: `Test NGO 2024`
   - Email: `testngo2024@example.com`
   - Phone: `+1234567890`
   - Role: `NGO Representative`
   - Password: `password123`
4. Click "Create Account"

### Step 2: Verify Organization Created
1. Login as admin (if you have admin account)
2. Go to "Organizations" page
3. Look for "Test NGO 2024"
4. Should show:
   - Status: Pending
   - Email: testngo2024@example.com
   - Phone: +1234567890

### Expected Result:
✅ Organization automatically created when NGO signs up
✅ Organization linked to user account
✅ Status is "Pending" (awaiting admin approval)

---

## Test 2: Volunteer Registration (3 minutes)

### Step 1: Sign Up
1. Go to http://localhost:4200
2. Click "Sign Up"
3. Fill form:
   - Name: `John Volunteer`
   - Email: `johnvol@example.com`
   - Phone: `+9876543210`
   - Role: `Field Volunteer`
   - Password: `password123`
4. Click "Create Account"

### Step 2: Complete Registration Form
After login, you'll see volunteer registration form:

**Page 1 - Basic Info:**
- Full Name: `John Volunteer`
- CNIC: `12345-1234567-1`
- Phone: `+9876543210`
- Email: `johnvol@example.com`
- Select NGO: Choose any approved NGO

**Page 2 - Classification:**
- Category: `Medical`
- Skill Level: `Nurse`

**Page 3 - Availability:**
- Status: `Active`
- Shift Type: `Full Day`

**Page 4 - Deployment:**
- Working Area: `Karachi`
- Has Mobility: Check if yes
- Has Vehicle: Check if yes

Click "Submit Registration"

### Step 3: Verify Volunteer Created
1. Login as NGO (the one you selected)
2. Go to "Volunteers" page
3. Look for "John Volunteer"
4. Should show:
   - Category: Medical
   - Skill Level: Nurse
   - Status: Pending

### Expected Result:
✅ Volunteer record created after form submission
✅ Volunteer linked to selected NGO
✅ Status is "Pending" (awaiting verification)

---

## What to Check in Backend Logs

Open backend terminal and look for:

### For NGO Signup:
```
✅ Auto-created Organization for NGO user: Test NGO 2024
```

### For Volunteer Registration:
```
=== REGISTER VOLUNTEER ===
✅ Volunteer Registered Successfully: [volunteer_id]
✅ Assigned to NGO: [ngo_name]
```

---

## Common Issues & Solutions

### Issue: "Organization not found"
**Solution:** Make sure you approved at least one NGO before testing volunteer registration

### Issue: "NGO not approved"
**Solution:** Login as admin and approve the NGO first

### Issue: "Port already in use"
**Solution:** 
```bash
# Kill process on port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id [PID] -Force

# Restart backend
cd backend
npm start
```

### Issue: "Cannot read property of undefined"
**Solution:** Clear browser cache and localStorage, then try again

---

## Database Verification (Optional)

If you have MongoDB access, check:

### Organizations Collection:
```javascript
db.organizations.find({ name: "Test NGO 2024" })
```

Should return organization with:
- adminUser: [user_id]
- status: "pending"
- type: "ngo"

### Volunteers Collection:
```javascript
db.volunteers.find({ fullName: "John Volunteer" })
```

Should return volunteer with:
- userId: [user_id]
- assignedNGO: [org_id]
- verificationStatus: "pending"

---

## Success Criteria

✅ NGO signup creates both User and Organization records
✅ Organization is linked to user via adminUser field
✅ Organization status is "pending" by default
✅ Volunteer registration creates Volunteer record
✅ Volunteer is linked to both User and Organization
✅ Volunteer status is "pending" by default
✅ Admin can see and approve organizations
✅ NGO can see and verify volunteers

---

## Next Actions After Testing

1. **Approve Organizations:**
   - Login as admin
   - Go to Organizations page
   - Change status from "Pending" to "Approved"

2. **Verify Volunteers:**
   - Login as NGO
   - Go to Volunteers page
   - Change verification status to "Verified"

3. **Check Capacity:**
   - Go to NGO dashboard
   - Check capacity widget
   - Should show volunteer count and capacity

---

## Test Checklist

- [ ] NGO signup creates organization
- [ ] Organization appears in admin dashboard
- [ ] Organization has correct contact info
- [ ] Volunteer signup works
- [ ] Volunteer registration form loads
- [ ] Volunteer record created after form submission
- [ ] Volunteer appears in NGO volunteers list
- [ ] Backend logs show success messages
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## Files to Reference

- `AUTO_CREATE_RECORDS_IMPLEMENTATION.md` - Technical details
- `SIGNUP_FLOW_COMPLETE.md` - Complete documentation
- `backend/test-ngo-signup.js` - Automated test script

---

## Run Automated Test (Optional)

```bash
cd backend
node test-ngo-signup.js
```

This will:
1. Create a test NGO account
2. Verify organization was auto-created
3. Show results in console
