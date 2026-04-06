# 🎯 Task Management System - Professional Design

## Current Implementation Analysis

### ✅ What Exists Now
- Basic volunteer task interface (mock data)
- Volunteer can see tasks (Pending/Active/Completed)
- Simple task status updates
- NGO can assign volunteers to generic "tasks"

### ❌ What's Missing
- No task types/categories
- No operational workflow (warehouse, distribution, field)
- No task generation from aid requests
- No role-based task assignment
- No task priority system
- No real backend integration
- No task tracking and reporting

---

## 🏗️ Proposed Architecture

### 1. Task Model (Backend)

```javascript
// backend/src/models/Task.js

const taskSchema = new mongoose.Schema({
    // Basic Information
    taskType: {
        type: String,
        enum: [
            // Distribution Tasks
            'delivery_food',
            'delivery_medical',
            'delivery_shelter',
            'delivery_clothing',
            
            // Warehouse Tasks
            'warehouse_unload',
            'warehouse_load',
            'warehouse_count',
            'warehouse_package',
            
            // Field Tasks
            'field_verification',
            'field_assessment',
            'field_followup',
            
            // Camp Operations
            'camp_registration',
            'camp_queue',
            'camp_management'
        ],
        required: true
    },
    
    title: {
        type: String,
        required: true
    },
    
    description: {
        type: String,
        required: true
    },
    
    // Relationships
    organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: true
    },
    
    relatedAidRequest: {
        type: mongoose.Schema.ObjectId,
        ref: 'AidRequest',
        default: null  // Optional - some tasks not linked to requests
    },
    
    assignedVolunteer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Volunteer',
        default: null
    },
    
    // Task Details
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    status: {
        type: String,
        enum: ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // Location (for field/distribution tasks)
    location: {
        type: String
    },
    
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    
    // Scheduling
    dueDate: {
        type: Date
    },
    
    estimatedDuration: {
        type: Number,  // in minutes
        default: 60
    },
    
    // Task-specific data
    packages: [{
        category: String,
        packageName: String,
        quantity: Number
    }],
    
    vehicleRequired: {
        type: Boolean,
        default: false
    },
    
    requiredSkills: [{
        type: String,
        enum: ['driver', 'medical', 'warehouse', 'field_officer', 'general']
    }],
    
    // Completion tracking
    startedAt: Date,
    completedAt: Date,
    
    completionNotes: String,
    
    completionProof: {
        photos: [String],  // URLs
        signature: String,  // URL or data
        gpsLocation: String
    },
    
    // Assignment history
    assignmentHistory: [{
        volunteer: {
            type: mongoose.Schema.ObjectId,
            ref: 'Volunteer'
        },
        assignedAt: Date,
        status: String,
        notes: String
    }]
}, {
    timestamps: true
});

// Indexes
taskSchema.index({ organization: 1, status: 1 });
taskSchema.index({ assignedVolunteer: 1, status: 1 });
taskSchema.index({ taskType: 1, priority: -1 });
taskSchema.index({ dueDate: 1 });
```

---

## 2. Task Generation Logic

### Automatic Task Creation from Aid Request

```javascript
// backend/src/services/taskGenerator.service.js

class TaskGenerator {
    
    // Generate tasks when aid request is approved
    async generateTasksFromAidRequest(aidRequest, ngo) {
        const tasks = [];
        
        // 1. Warehouse Task - Prepare packages
        tasks.push({
            taskType: 'warehouse_package',
            title: `Prepare packages for ${aidRequest.victimName}`,
            description: `Prepare ${aidRequest.packagesNeeded.length} packages for delivery`,
            organization: ngo._id,
            relatedAidRequest: aidRequest._id,
            priority: aidRequest.urgency,
            packages: aidRequest.packagesNeeded,
            requiredSkills: ['warehouse'],
            estimatedDuration: 30,
            status: 'pending'
        });
        
        // 2. Loading Task - Load into vehicle
        tasks.push({
            taskType: 'warehouse_load',
            title: `Load packages for delivery`,
            description: `Load prepared packages into delivery vehicle`,
            organization: ngo._id,
            relatedAidRequest: aidRequest._id,
            priority: aidRequest.urgency,
            packages: aidRequest.packagesNeeded,
            requiredSkills: ['warehouse', 'driver'],
            vehicleRequired: true,
            estimatedDuration: 15,
            status: 'pending'
        });
        
        // 3. Distribution Task - Deliver to victim
        const deliveryType = this.getDeliveryType(aidRequest.packagesNeeded);
        
        tasks.push({
            taskType: deliveryType,
            title: `Deliver to ${aidRequest.victimName}`,
            description: `Deliver packages to victim at ${aidRequest.location}`,
            organization: ngo._id,
            relatedAidRequest: aidRequest._id,
            priority: aidRequest.urgency,
            location: aidRequest.location,
            coordinates: aidRequest.coordinates,
            packages: aidRequest.packagesNeeded,
            requiredSkills: ['driver', 'general'],
            vehicleRequired: true,
            estimatedDuration: 120,
            status: 'pending'
        });
        
        // 4. Field Verification Task (for high priority)
        if (aidRequest.urgency === 'high' || aidRequest.urgency === 'critical') {
            tasks.push({
                taskType: 'field_verification',
                title: `Verify victim location and needs`,
                description: `Verify ${aidRequest.victimName}'s situation before delivery`,
                organization: ngo._id,
                relatedAidRequest: aidRequest._id,
                priority: aidRequest.urgency,
                location: aidRequest.location,
                coordinates: aidRequest.coordinates,
                requiredSkills: ['field_officer'],
                estimatedDuration: 60,
                status: 'pending'
            });
        }
        
        return tasks;
    }
    
    getDeliveryType(packages) {
        const categories = packages.map(p => p.category);
        if (categories.includes('medical')) return 'delivery_medical';
        if (categories.includes('food')) return 'delivery_food';
        if (categories.includes('shelter')) return 'delivery_shelter';
        return 'delivery_food';
    }
}
```

---

## 3. Task Assignment System

### Smart Volunteer Matching

```javascript
// backend/src/services/taskAssignment.service.js

class TaskAssignmentService {
    
    // Find best volunteers for a task
    async findEligibleVolunteers(task) {
        const Volunteer = require('../models/Volunteer');
        
        // Base query
        const query = {
            assignedNGO: task.organization,
            availabilityStatus: 'active',
            verificationStatus: 'verified',
            status: 'active'
        };
        
        // Filter by required skills
        if (task.requiredSkills && task.requiredSkills.length > 0) {
            // Match volunteer category with required skills
            const categoryMap = {
                'driver': ['logistics'],
                'medical': ['medical'],
                'warehouse': ['logistics', 'general_support'],
                'field_officer': ['general_support'],
                'general': ['general_support', 'food_distribution']
            };
            
            const matchingCategories = [];
            task.requiredSkills.forEach(skill => {
                if (categoryMap[skill]) {
                    matchingCategories.push(...categoryMap[skill]);
                }
            });
            
            if (matchingCategories.length > 0) {
                query.category = { $in: matchingCategories };
            }
        }
        
        // Get volunteers
        const volunteers = await Volunteer.find(query)
            .populate('userId', 'name phone');
        
        // Score volunteers
        const scoredVolunteers = await Promise.all(
            volunteers.map(async (volunteer) => {
                let score = 0;
                
                // 1. Availability score
                if (volunteer.availabilityStatus === 'active') score += 30;
                
                // 2. Skill match score
                const hasRequiredSkill = this.checkSkillMatch(volunteer, task);
                if (hasRequiredSkill) score += 40;
                
                // 3. Current workload score
                const currentTasks = await this.getVolunteerActiveTasks(volunteer._id);
                if (currentTasks.length === 0) score += 20;
                else if (currentTasks.length < 3) score += 10;
                
                // 4. Location proximity (if task has location)
                if (task.coordinates && volunteer.assignedRegion) {
                    score += 10; // Simplified - could calculate actual distance
                }
                
                // 5. Vehicle availability (if required)
                if (task.vehicleRequired && volunteer.hasVehicle) {
                    score += 20;
                } else if (task.vehicleRequired && !volunteer.hasVehicle) {
                    score = 0; // Disqualify
                }
                
                return {
                    volunteer,
                    score,
                    currentTasks: currentTasks.length
                };
            })
        );
        
        // Sort by score
        return scoredVolunteers
            .filter(v => v.score > 0)
            .sort((a, b) => b.score - a.score);
    }
    
    checkSkillMatch(volunteer, task) {
        const skillCategoryMap = {
            'medical': ['medical'],
            'logistics': ['driver', 'warehouse'],
            'food_distribution': ['general', 'driver'],
            'general_support': ['general', 'field_officer', 'warehouse']
        };
        
        const volunteerSkills = skillCategoryMap[volunteer.category] || [];
        return task.requiredSkills.some(skill => volunteerSkills.includes(skill));
    }
    
    async getVolunteerActiveTasks(volunteerId) {
        const Task = require('../models/Task');
        return await Task.find({
            assignedVolunteer: volunteerId,
            status: { $in: ['assigned', 'accepted', 'in_progress'] }
        });
    }
}
```

---

## 4. NGO Dashboard - Task Management UI

### Task Management Page Structure

```
NGO Dashboard
├── Tasks Overview
│   ├── Pending Tasks (need assignment)
│   ├── Active Tasks (in progress)
│   ├── Completed Tasks (today)
│   └── Overdue Tasks (alerts)
│
├── Task Categories
│   ├── 📦 Warehouse Operations
│   ├── 🚚 Distribution Tasks
│   ├── 🏕️ Field Operations
│   └── 📋 Camp Management
│
├── Create Task
│   ├── Manual Task Creation
│   ├── Task Type Selection
│   ├── Volunteer Assignment
│   └── Schedule & Priority
│
└── Task Assignment
    ├── View Task Details
    ├── See Eligible Volunteers
    ├── Assign Volunteer
    └── Track Progress
```

### Task Assignment Flow (NGO Perspective)

```
Step 1: NGO sees new aid request
   ↓
Step 2: System auto-generates tasks
   ↓
Step 3: NGO reviews generated tasks
   ↓
Step 4: NGO clicks "Assign Volunteer" on a task
   ↓
Step 5: System shows eligible volunteers with scores:
   - Ahmed (Score: 90) - Available, Has vehicle, Warehouse exp
   - Fatima (Score: 75) - Available, No vehicle
   - Hassan (Score: 60) - Busy with 2 tasks
   ↓
Step 6: NGO selects volunteer
   ↓
Step 7: System sends notification to volunteer
   ↓
Step 8: Volunteer accepts/rejects
   ↓
Step 9: Task status updates
   ↓
Step 10: NGO tracks progress
```

---

## 5. Volunteer Dashboard - Task View

### Volunteer Task Interface

```
Volunteer Dashboard
├── My Tasks
│   ├── Pending (awaiting acceptance)
│   ├── Active (currently working on)
│   ├── Completed (history)
│   └── Rejected (declined tasks)
│
├── Task Details
│   ├── Task Type & Description
│   ├── Location (with map)
│   ├── Required Items
│   ├── Due Date & Time
│   ├── Estimated Duration
│   └── Special Instructions
│
└── Task Actions
    ├── Accept Task
    ├── Start Task
    ├── Mark In Progress
    ├── Complete Task (with proof)
    └── Report Issue
```

### Volunteer Task Flow

```
Step 1: Volunteer receives notification
   ↓
Step 2: Views task details
   ↓
Step 3: Accepts or Rejects
   ↓
Step 4: If accepted → Task appears in "Active"
   ↓
Step 5: Clicks "Start Task"
   ↓
Step 6: Performs task (delivery, warehouse work, etc.)
   ↓
Step 7: Clicks "Complete Task"
   ↓
Step 8: Uploads proof:
   - Photos
   - GPS location
   - Signature (if delivery)
   - Notes
   ↓
Step 9: Task marked complete
   ↓
Step 10: Inventory auto-updates
```

---

## 6. Task Types & Workflows

### 📦 Warehouse Tasks

**1. Unload Stock**
- Triggered: When new supplies arrive
- Required Skills: Warehouse staff
- Duration: 30-60 min
- Completion: Count and verify items

**2. Package Preparation**
- Triggered: From aid request
- Required Skills: Warehouse staff
- Duration: 20-40 min
- Completion: Packages ready for loading

**3. Load Vehicle**
- Triggered: After packaging
- Required Skills: Warehouse + Driver
- Duration: 15-30 min
- Completion: Vehicle loaded, checklist signed

**4. Inventory Count**
- Triggered: Daily/Weekly schedule
- Required Skills: Warehouse staff
- Duration: 60-120 min
- Completion: Inventory report submitted

### 🚚 Distribution Tasks

**1. Food Delivery**
- Triggered: From aid request
- Required Skills: Driver + General
- Vehicle: Required
- Duration: 60-180 min
- Completion: Delivery proof (photo + signature)

**2. Medical Kit Delivery**
- Triggered: From aid request
- Required Skills: Medical volunteer (preferred)
- Vehicle: Required
- Duration: 60-120 min
- Completion: Delivery proof + medical assessment

**3. Shelter Kit Delivery**
- Triggered: From aid request
- Required Skills: Driver + General
- Vehicle: Required
- Duration: 90-180 min
- Completion: Delivery proof + setup assistance

### 🏕️ Field Tasks

**1. Victim Verification**
- Triggered: High-priority requests
- Required Skills: Field officer
- Duration: 60-90 min
- Completion: Verification report + photos

**2. Damage Assessment**
- Triggered: Disaster event
- Required Skills: Field officer
- Duration: 120-240 min
- Completion: Assessment report + photos

**3. Follow-up Visit**
- Triggered: Post-delivery
- Required Skills: Field officer
- Duration: 30-60 min
- Completion: Follow-up report

### 📋 Camp Operations

**1. Registration Support**
- Triggered: Camp setup
- Required Skills: General
- Duration: 240-480 min (shift-based)
- Completion: Registration count

**2. Queue Management**
- Triggered: Distribution day
- Required Skills: General
- Duration: 180-360 min
- Completion: Crowd control report

**3. Camp Management**
- Triggered: Ongoing
- Required Skills: Field officer
- Duration: Full day
- Completion: Daily report

---

## 7. Database Schema

### Task Table Structure

```sql
tasks
├── _id (ObjectId)
├── taskType (enum)
├── title (string)
├── description (string)
├── organization (ref: Organization)
├── relatedAidRequest (ref: AidRequest, nullable)
├── assignedVolunteer (ref: Volunteer, nullable)
├── priority (enum: low/medium/high/critical)
├── status (enum: pending/assigned/accepted/in_progress/completed/cancelled)
├── location (string)
├── coordinates (lat/lng)
├── dueDate (date)
├── estimatedDuration (number, minutes)
├── packages (array)
├── vehicleRequired (boolean)
├── requiredSkills (array)
├── startedAt (date)
├── completedAt (date)
├── completionNotes (string)
├── completionProof (object)
├── assignmentHistory (array)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

---

## 8. API Endpoints

### Task Management APIs

```
POST   /api/tasks                    - Create task
GET    /api/tasks                    - Get all tasks (admin)
GET    /api/tasks/ngo/:ngoId         - Get NGO tasks
GET    /api/tasks/volunteer/:volId   - Get volunteer tasks
GET    /api/tasks/:id                - Get task details
PUT    /api/tasks/:id                - Update task
DELETE /api/tasks/:id                - Delete task

POST   /api/tasks/:id/assign         - Assign volunteer
POST   /api/tasks/:id/accept         - Volunteer accepts
POST   /api/tasks/:id/reject         - Volunteer rejects
POST   /api/tasks/:id/start          - Start task
POST   /api/tasks/:id/complete       - Complete task
POST   /api/tasks/:id/cancel         - Cancel task

GET    /api/tasks/:id/eligible-volunteers  - Get eligible volunteers
POST   /api/tasks/generate-from-request    - Auto-generate tasks
GET    /api/tasks/stats/:ngoId             - Get task statistics
```

---

## 9. Implementation Priority

### Phase 1: Core Task System (Week 1)
1. ✅ Create Task model
2. ✅ Create Task controller
3. ✅ Create Task routes
4. ✅ Basic CRUD operations

### Phase 2: Task Generation (Week 1-2)
1. ✅ Task generator service
2. ✅ Auto-generate from aid requests
3. ✅ Task type logic

### Phase 3: Assignment System (Week 2)
1. ✅ Volunteer matching algorithm
2. ✅ Assignment API
3. ✅ Notification system

### Phase 4: NGO Dashboard (Week 2-3)
1. ✅ Task management page
2. ✅ Task assignment UI
3. ✅ Task tracking dashboard

### Phase 5: Volunteer Dashboard (Week 3)
1. ✅ Task list view
2. ✅ Task acceptance flow
3. ✅ Task completion with proof

### Phase 6: Advanced Features (Week 4)
1. ✅ Task analytics
2. ✅ Performance tracking
3. ✅ Automated scheduling

---

## 10. Benefits of This System

### For NGOs:
✅ Professional operational workflow
✅ Clear task breakdown
✅ Efficient volunteer utilization
✅ Real-time progress tracking
✅ Performance analytics

### For Volunteers:
✅ Clear task assignments
✅ Know exactly what to do
✅ Track their contributions
✅ Skill-based assignments
✅ Fair workload distribution

### For System:
✅ Scalable architecture
✅ Automated workflows
✅ Better resource management
✅ Complete audit trail
✅ Professional-grade system

---

## 11. Real-World Alignment

This system aligns with how real organizations operate:

**Red Cross/Red Crescent:**
- Task-based operations
- Role-specific assignments
- Chain of custody tracking

**World Food Programme:**
- Logistics task management
- Distribution workflows
- Field verification

**UNICEF:**
- Camp operations
- Registration tasks
- Assessment workflows

---

## Status: 📋 DESIGN COMPLETE - READY FOR REVIEW

Please review this design and let me know:
1. ✅ Approve to implement
2. 🔄 Suggest changes
3. ❓ Ask questions

Once approved, I'll implement:
- Backend (Task model, controller, routes, services)
- Frontend (NGO task management, Volunteer task view)
- Integration with existing aid request system
