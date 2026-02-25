# 🚀 QUICK START GUIDE

## Current Status
✅ **Both servers are RUNNING**
- Backend: http://localhost:5000/api
- Frontend: http://localhost:4200

---

## 🎯 Quick Actions

### View Your Application
Open browser: **http://localhost:4200**

### Test Volunteer Registration
1. Go to http://localhost:4200
2. Click **"Join as Volunteer"** button
3. Fill the 4-step form
4. Select **"Akhuwat Foundation"** from NGO dropdown
5. Submit

### Test Aid Request
1. Go to http://localhost:4200
2. Click **"Request Help"** button
3. Fill the form
4. Submit

### Test Disaster Reporting
1. Go to http://localhost:4200
2. Look for **"Report Disaster"** option
3. Fill the form
4. Submit

---

## 🔑 Test Accounts

### NGO User (Akhuwat Foundation)
- **Email:** akhuwat@gmail.com
- **Password:** (You need to check your database or create one)
- **Role:** ngo
- **Organization ID:** 69956ee5fc279ce9b2ab9e92

### Create Admin Account
```bash
cd backend
node create-admin.js
```

---

## 📊 Check System Status

### Backend Health Check
```bash
curl http://localhost:5000/api/health
```

### Check Approved NGOs
```bash
curl http://localhost:5000/api/organizations/approved/list
```

### View Process Status
Both servers are running as background processes:
- Frontend Process ID: 2
- Backend Process ID: 6

---

## 🛠️ Common Commands

### Stop Servers
Press `Ctrl+C` in the terminal where servers are running

### Restart Backend
```bash
cd backend
npm start
```

### Restart Frontend
```bash
cd dms-landing
npm start
```

### View Backend Logs
Check the terminal where backend is running

### View Frontend Logs
Check the terminal where frontend is running

---

## 🗄️ Database Operations

### Create Organization for NGO User
```bash
cd backend
node create-organization-for-ngo.js
```

### Seed Organizations
```bash
cd backend
node seed-organizations.js
```

### Create Admin User
```bash
cd backend
node create-admin.js
```

---

## 🔍 Testing Checklist

### ✅ Frontend Tests
- [ ] Landing page loads
- [ ] "Join as Volunteer" button works
- [ ] Volunteer registration form opens
- [ ] NGO dropdown shows "Akhuwat Foundation"
- [ ] Form validation works
- [ ] "Request Help" dialog opens
- [ ] "Report Disaster" dialog opens

### ✅ Backend Tests
- [ ] Health endpoint responds
- [ ] Approved NGOs endpoint returns data
- [ ] Authentication works
- [ ] Volunteer registration endpoint works
- [ ] Aid request endpoint works
- [ ] Disaster reporting endpoint works

### ✅ Integration Tests
- [ ] Volunteer registration saves to database
- [ ] Aid requests save to database
- [ ] Disaster reports save to database
- [ ] Capacity calculation works
- [ ] NGO dashboard shows capacity widget

---

## 📱 Access Points

### Public Routes (No Login Required)
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/volunteer/register` - Volunteer registration

### Protected Routes (Login Required)
- `/dashboard` - Main dashboard
- `/dashboard/ngo/overview` - NGO dashboard with capacity
- `/dashboard/admin/*` - Admin routes
- `/dashboard/volunteer/*` - Volunteer routes
- `/dashboard/victim/*` - Victim routes

---

## 🎨 Key Features to Demonstrate

### 1. Volunteer Registration
- Multi-step wizard
- NGO selection
- Skill-based service rates
- Availability settings

### 2. Capacity Calculation
- Three-pillar model
- Real-time calculation
- Limiting factor identification
- Workload percentage

### 3. Aid Request System
- Simple form
- Separate people count field
- Status tracking

### 4. Disaster Reporting
- Location tracking
- Needs checklist
- Status workflow

### 5. User Management
- Active/Inactive status
- Role-based access
- Admin controls

---

## 🐛 Quick Fixes

### NGO Dropdown Empty?
```bash
cd backend
node create-organization-for-ngo.js
```

### Can't Login?
Check if user exists in database or create new account via signup

### Backend Not Responding?
```bash
# Check if running
curl http://localhost:5000/api/health

# Restart if needed
cd backend
npm start
```

### Frontend Not Loading?
```bash
# Check if running
curl http://localhost:4200

# Restart if needed
cd dms-landing
npm start
```

---

## 📞 API Endpoints Quick Reference

### Public Endpoints
```
GET  /api/health
GET  /api/organizations/approved/list
POST /api/auth/register
POST /api/auth/login
POST /api/disasters
```

### Authenticated Endpoints
```
POST /api/volunteers
POST /api/aid-requests
GET  /api/volunteers/me
GET  /api/organizations/me
```

### NGO Endpoints
```
GET  /api/volunteers/ngo/:ngoId
GET  /api/volunteers/capacity/:ngoId
PUT  /api/volunteers/:id/verify
PUT  /api/organizations/:id/inventory
```

### Admin Endpoints
```
GET  /api/users
PUT  /api/users/:id/status
GET  /api/organizations
PUT  /api/organizations/:id/status
```

---

## 💡 Tips

1. **Hot Reload is Enabled**
   - Frontend changes reflect automatically
   - No need to restart server for code changes

2. **Check Browser Console**
   - Press F12 to open developer tools
   - Check for any errors

3. **Check Network Tab**
   - See API requests and responses
   - Verify data is being sent correctly

4. **Use Postman/Thunder Client**
   - Test API endpoints directly
   - Verify backend functionality

5. **MongoDB Compass**
   - Connect to your database
   - View collections and documents
   - Verify data is being saved

---

## 🎓 For Your FYP Presentation

### Demo Flow
1. Show landing page
2. Click "Join as Volunteer"
3. Fill registration form
4. Show NGO selection
5. Submit and show success
6. Login as NGO
7. Show capacity widget
8. Explain three-pillar model
9. Show volunteer list
10. Verify a volunteer
11. Show capacity update

### Key Points to Mention
- Hybrid capacity model
- Skill-based service rates
- Real-time calculations
- Dual verification system
- Role-based access control
- RESTful API architecture
- MongoDB for flexibility
- Angular Material for UI

---

## 📚 Documentation Files

- `SYSTEM_STATUS.md` - Complete system status
- `CAPACITY_SYSTEM_IMPLEMENTATION.md` - Capacity system details
- `VOLUNTEER_REGISTRATION_FLOW.md` - Registration flow
- `NGO_SETUP_COMPLETE.md` - NGO setup guide
- `INTEGRATION_COMPLETE.md` - Integration summary

---

**Everything is ready! Start testing your application now! 🎉**
