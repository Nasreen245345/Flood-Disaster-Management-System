# Signup Flow Diagrams

## NGO Signup Flow (Auto-Create Organization)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGO SIGNUP FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User Action                Backend Process              Database
───────────                ───────────────              ────────

1. Fill Signup Form
   ├─ Name: "Red Cross"
   ├─ Email: "redcross@example.com"
   ├─ Phone: "+1234567890"
   ├─ Role: "ngo"
   └─ Password: "password123"
        │
        ▼
2. Click "Create Account"
        │
        ▼
                        POST /api/auth/signup
                               │
                               ▼
                        Check if email exists ──────► Users
                               │                       Collection
                               ▼
                        Create User record ─────────► Users
                               │                       Collection
                               ├─ _id: user123
                               ├─ name: "Red Cross"
                               ├─ email: "redcross@..."
                               ├─ role: "ngo"
                               └─ phone: "+1234567890"
                               │
                               ▼
                        Check if role === 'ngo'
                               │
                               ▼ YES
                        Auto-create Organization ───► Organizations
                               │                       Collection
                               ├─ _id: org456
                               ├─ name: "Red Cross"
                               ├─ type: "ngo"
                               ├─ adminUser: user123 ◄─┐
                               ├─ status: "pending"    │
                               └─ contact: {...}       │
                               │                       │
                               ▼                       │
                        Generate JWT Token            │
                               │                       │
                               ▼                       │
3. Receive Token & Login                              │
        │                                              │
        ▼                                              │
4. Access NGO Dashboard                               │
        │                                              │
        ▼                                              │
5. Manage Inventory,                                  │
   Volunteers, etc.                                   │
        │                                              │
        ▼                                              │
   (Awaiting Admin Approval) ◄───────────────────────┘


RESULT:
✅ User record created
✅ Organization record auto-created
✅ Organization linked to user
✅ Status: Pending (awaits admin approval)
```

---

## Volunteer Signup & Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   VOLUNTEER REGISTRATION FLOW                   │
└─────────────────────────────────────────────────────────────────┘

User Action                Backend Process              Database
───────────                ───────────────              ────────

1. Fill Signup Form
   ├─ Name: "John Doe"
   ├─ Email: "john@example.com"
   ├─ Phone: "+9876543210"
   ├─ Role: "volunteer"
   └─ Password: "password123"
        │
        ▼
2. Click "Create Account"
        │
        ▼
                        POST /api/auth/signup
                               │
                               ▼
                        Create User record ─────────► Users
                               │                       Collection
                               ├─ _id: user789
                               ├─ name: "John Doe"
                               ├─ email: "john@..."
                               ├─ role: "volunteer"
                               └─ phone: "+9876543210"
                               │
                               ▼
                        Generate JWT Token
                               │
                               ▼
3. Receive Token & Login
        │
        ▼
4. Redirected to Registration Form
        │
        ▼
5. Fill Multi-Step Form
   │
   ├─ Step 1: Basic Info
   │  ├─ Full Name: "John Doe"
   │  ├─ CNIC: "12345-1234567-1"
   │  ├─ Phone: "+9876543210"
   │  └─ Select NGO: "Red Cross"
   │
   ├─ Step 2: Classification
   │  ├─ Category: "Medical"
   │  └─ Skill Level: "Nurse"
   │
   ├─ Step 3: Availability
   │  ├─ Status: "Active"
   │  └─ Shift Type: "Full Day"
   │
   └─ Step 4: Deployment
      ├─ Working Area: "Karachi"
      ├─ Has Mobility: Yes
      └─ Has Vehicle: Yes
        │
        ▼
6. Click "Submit Registration"
        │
        ▼
                        POST /api/volunteers
                        (with JWT token)
                               │
                               ▼
                        Verify NGO exists ──────────► Organizations
                        and is approved               Collection
                               │
                               ▼
                        Calculate service rate
                        (based on skill level)
                               │
                               ▼
                        Create Volunteer record ────► Volunteers
                               │                       Collection
                               ├─ _id: vol999
                               ├─ userId: user789 ◄────┐
                               ├─ fullName: "John Doe" │
                               ├─ cnic: "12345-..."    │
                               ├─ assignedNGO: org456 ◄┤
                               ├─ category: "medical"  │
                               ├─ skillLevel: "nurse"  │
                               ├─ serviceRate: 35      │
                               └─ status: "pending"    │
                               │                       │
                               ▼                       │
7. Success Message                                    │
   "Registration submitted"                           │
        │                                              │
        ▼                                              │
8. Access Volunteer Dashboard                         │
        │                                              │
        ▼                                              │
   (Awaiting NGO Verification) ◄──────────────────────┘


RESULT:
✅ User record created
✅ Volunteer record created via form
✅ Volunteer linked to user
✅ Volunteer linked to NGO
✅ Status: Pending (awaits verification)
```

---

## Admin Approval Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN APPROVAL FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. NGO Signs Up
        │
        ▼
   Organization Created
   Status: "pending"
        │
        ▼
2. Admin Logs In
        │
        ▼
3. Goes to Organizations Page
        │
        ▼
4. Sees "Red Cross" - Status: Pending
        │
        ▼
5. Reviews Organization Details
   ├─ Contact info
   ├─ Registration details
   └─ Verification documents
        │
        ▼
6. Changes Status to "Approved"
        │
        ▼
   Organization Status: "approved"
        │
        ▼
7. NGO Can Now:
   ├─ Appear in volunteer NGO dropdown
   ├─ Accept volunteer registrations
   ├─ Manage inventory
   ├─ Get region assignments
   └─ Participate in disaster response
```

---

## NGO Volunteer Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  NGO VOLUNTEER VERIFICATION                     │
└─────────────────────────────────────────────────────────────────┘

1. Volunteer Completes Registration
        │
        ▼
   Volunteer Record Created
   Status: "pending"
   Assigned to: "Red Cross"
        │
        ▼
2. NGO Logs In
        │
        ▼
3. Goes to Volunteers Page
        │
        ▼
4. Sees "John Doe" - Status: Pending
        │
        ▼
5. Reviews Volunteer Details
   ├─ CNIC/ID verification
   ├─ Skill level
   ├─ Category
   └─ Certifications (if medical)
        │
        ▼
6. Changes Verification to "Verified"
        │
        ▼
   Volunteer Status: "verified"
        │
        ▼
7. Volunteer Now:
   ├─ Counts toward NGO capacity
   ├─ Can be assigned to tasks
   ├─ Appears in capacity calculations
   └─ Can participate in distributions
```

---

## Data Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                     DATA RELATIONSHIPS                       │
└──────────────────────────────────────────────────────────────┘

Users Collection
├─ user123 (role: "ngo")
│  └─ Links to ──────────┐
│                         │
└─ user789 (role: "volunteer")
   └─ Links to ──────┐   │
                      │   │
                      │   ▼
                      │   Organizations Collection
                      │   └─ org456
                      │      ├─ adminUser: user123 ◄──┐
                      │      ├─ name: "Red Cross"     │
                      │      ├─ status: "approved"    │
                      │      └─ inventory: [...]      │
                      │                               │
                      ▼                               │
                      Volunteers Collection           │
                      └─ vol999                       │
                         ├─ userId: user789           │
                         ├─ assignedNGO: org456 ──────┘
                         ├─ category: "medical"
                         ├─ serviceRate: 35
                         └─ status: "verified"


CAPACITY CALCULATION:
Organizations.calculateEffectiveCapacity()
    │
    ├─ Counts all volunteers where:
    │  ├─ assignedNGO = org456
    │  ├─ status = "active"
    │  └─ verificationStatus = "verified"
    │
    ├─ Sums their service rates
    │  └─ Total: 35 (from vol999)
    │
    ├─ Compares with inventory
    │  └─ Resource capacity: 100 packages
    │
    └─ Returns minimum:
       └─ Effective Capacity = min(35, 100) = 35 victims/day
```

---

## Status Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        STATUS FLOW                           │
└──────────────────────────────────────────────────────────────┘

ORGANIZATION STATUS:
pending ──[Admin Approves]──► approved ──[Admin Action]──► disabled
   │                                                            │
   └──[Admin Rejects]──► suspended ◄──[Admin Action]──────────┘


VOLUNTEER VERIFICATION:
pending ──[NGO Verifies]──► verified ──[NGO/Admin Action]──► rejected
   │                                                            │
   └──[NGO Rejects]──────────────────────────────────────────►┘


VOLUNTEER AVAILABILITY:
active ──[Volunteer Changes]──► on_call ──[Volunteer Changes]──► inactive
   │                                                               │
   └──[Volunteer Changes]──────────────────────────────────────►┘
```

---

## Key Points

### NGO Signup:
✅ One-step process
✅ Organization auto-created
✅ Immediate dashboard access
✅ Awaits admin approval for full functionality

### Volunteer Registration:
✅ Two-step process (signup + registration form)
✅ Detailed information collected
✅ Linked to chosen NGO
✅ Awaits NGO verification

### Admin Role:
✅ Approves organizations
✅ Monitors all activities
✅ Can verify volunteers
✅ Manages system-wide settings

### NGO Role:
✅ Verifies their volunteers
✅ Manages inventory
✅ Handles distributions
✅ Monitors capacity
