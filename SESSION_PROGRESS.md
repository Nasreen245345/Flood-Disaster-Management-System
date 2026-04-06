# DMS Project - Session Progress Summary

## Project Overview
Disaster Management System (DMS) with Angular frontend, Node.js/Express backend, MongoDB database.

**Ports:** Backend: 5000 | Frontend: 4200

---

## Completed Features

### 1. Task Management System
- Backend: Task model, 9 API endpoints (create, assign, status update, delete)
- Frontend: NGO tasks page with 4 tabs (Pending, Assigned, In Progress, Completed)
- Create task dialog, assign volunteer dialog
- Route: `/dashboard/ngo/tasks`

### 2. Distribution Shift System
- Backend: DistributionShift model with time-based access control
- Shift statuses: scheduled → active → completed
- 9 API endpoints for shift management and victim verification
- Security: volunteers only access victim data during active shift hours
- Auto-revoke access when shift ends

### 3. Volunteer Distribution Point
- Frontend: Volunteer distribution page
- Shows "No Active Shift" when not assigned
- Shows active shift with CNIC verification form
- Victim details shown only during active shift
- Route: `/dashboard/volunteer/distribution`

### 4. NGO Distribution Shifts Management
- Frontend: NGO can create/manage shifts
- Create shift dialog (location, start/end time, notes)
- Assign volunteer dialog (shows verified volunteers only)
- Start/End shift buttons
- Route: `/dashboard/ngo/distribution-shifts`

### 5. CNIC-Based Login for Victims
- Victims who submitted aid request without account can login with CNIC + phone
- Auto-creates victim account when aid request submitted without login
- CNIC normalized (dashes stripped) on both storage and lookup
- Login page has two tabs: Email Login | Login with CNIC
- Route: `POST /api/auth/cnic-login`

### 6. Victim My Requests Page
- Shows real API data (not mock)
- Shows assigned NGO name and contact
- Shows active distribution shifts as pickup points
- Status pipeline: Submitted → Approved → In Progress → Fulfilled
- Route: `/dashboard/victim/requests`

### 7. Smart NGO Routing (Aid Request Assignment)
- Two criteria: distance + capacity
- Distance: victim coordinates vs region assignment coordinates
- Capacity: NGO must have enough available capacity for peopleCount
- Score = distanceScore (max 50) + capacityScore (max 50)
- Only NGOs assigned to active region assignments are considered

### 8. CORS Fix
- Backend allows: localhost:4200, 127.0.0.1:4200, ports 4201/4202
- Handles preflight OPTIONS requests

---

## Pending Features

### ML Prediction Model (PLANNED)
**Goal:** Predict resource needs (packages) for next 1-3 days per NGO

**Features from system:**
- disaster_type, severity, day_of_disaster, people_affected (from Disaster model)
- daily request rate, category distribution (from AidRequest model)
- totalDistributions per shift (from DistributionShift model)
- current inventory levels (from Organization model)

**Architecture:**
```
ml-service/
  generate_data.py   ← synthetic training data
  train_model.py     ← Random Forest / XGBoost
  app.py             ← Flask API on port 5001
  model.pkl          ← saved model
```

**API:**
```
POST /predict
{ disaster_type, severity, day_of_disaster, people_affected, days_ahead }
→ { day_1: {food, medical, shelter, clothing}, day_2: {...}, day_3: {...} }
```

**Placement:**
- NGO Dashboard: widget showing forecast for their assigned disaster
- Admin Dashboard: system-wide forecast across all disasters

---

## Current Work: Interactive Map (IN PROGRESS)

### Requirements
1. Show REAL data (no mock data)
2. Proper flags/markers for different types
3. All disasters and distribution points visible
4. When dashboard opens → auto-center on device location
5. Nearby disasters/distribution points highlighted
6. User can also see all ongoing disasters/points globally
7. Different marker styles per role/type

### Data Sources for Map
- Disasters: `GET /api/disasters` → coordinates field (added to model)
- Distribution Shifts: `GET /api/distribution/shifts/public/:orgId` → location + coordinates
- Aid Requests: coordinates field (victim locations)

### Marker Types Needed
- 🔴 Active disaster (red warning flag)
- 🟡 Reported disaster (yellow)
- 🟢 Active distribution point (green store icon)
- 🔵 Victim's own request location (blue)
- 📍 User's current location

### Backend Needed
- Add `GET /api/map/data` endpoint returning all map markers
- Add coordinates to Disaster model (DONE)
- Add coordinates to DistributionShift model (DONE)

### Frontend
- Current map component: `dms-landing/src/app/shared/components/interactive-map/`
- Uses Leaflet (already installed)
- Need to replace mock data with real API calls
- Need to add marker clustering for dense areas
- Need geolocation to center on user

---

## Key Credentials

### Admin
- Email: admin@gov.pk
- Password: Admin@123456

### NGO (Akhuwat Foundation)
- Email: akhuwat@gmail.com
- Password: password123

### Volunteers
- Nasreen Bibi: bscs22f10@gmail.com / password123
- Ali Zafar: ali@gmail.com / password123
- Mamoon Haseeb: bscs22f24@namal.edu.pk / password123

### Victims
- Muhammad Shahbaz: bscs22f30@gmail.com / password123 (CNIC: 3520212345678)
- Waqar Ahmed: CNIC login → 3830211844218 / phone: 03024449315

---

## File Structure (Key Files)

### Backend
```
backend/src/
  models/
    AidRequest.js       ← victimCNIC, coordinates, packagesNeeded
    Disaster.js         ← coordinates added
    DistributionShift.js ← location, coordinates, status
    Organization.js     ← inventory, capacity methods
    RegionAssignment.js ← coordinates added
    User.js             ← cnic field added
    Volunteer.js
  controllers/
    aidRequest.controller.js  ← smart routing (distance + capacity)
    auth.controller.js        ← cnicLogin added
    distribution.controller.js ← getPublicShifts added
  routes/
    aidRequest.routes.js  ← POST uses optionalAuth
    auth.routes.js        ← /cnic-login route
    distribution.routes.js ← /shifts/public/:orgId
  middleware/
    auth.middleware.js    ← optionalAuth added
```

### Frontend
```
dms-landing/src/app/
  auth/login/           ← two tabs: email + CNIC login
  dashboard/
    ngo/
      distribution-shifts/  ← create/manage shifts
      tasks/                ← task management
      services/ngo.service.ts ← all NGO API methods
    volunteer/
      distribution/         ← distribution point page
    victim/
      my-requests/          ← shows requests + distribution points
      services/victim.service.ts ← fixed payload mapping
  shared/components/
    interactive-map/        ← NEEDS REAL DATA (current task)
    help-request-dialog/    ← aid request form
```

---

## Important Notes
- CNIC always stored WITHOUT dashes (normalized)
- Aid requests can be submitted without login (auto-creates victim account)
- Shift must be status "active" AND within time window for volunteer access
- NGO routing: only considers NGOs in active region assignments
- Backend CORS allows multiple localhost ports
- All volunteer passwords reset to: password123
