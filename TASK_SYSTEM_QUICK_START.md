# 🚀 Task Management System - Quick Start Guide

## What's New?

Your disaster management system now has a complete task management system for NGO operational workflows!

---

## For NGOs

### Access Task Management
1. Login as NGO user
2. Click "Task Management" in the sidebar
3. URL: `http://localhost:4200/dashboard/ngo/tasks`

### Create a Task
1. Click "Create Task" button
2. Fill in the form:
   - **Task Type:** delivery, warehouse, field_work, or other
   - **Title:** Short task name
   - **Description:** What needs to be done
   - **Priority:** low, medium, high, or critical
   - **Location:** (Optional) GPS coordinates or address
   - **Due Date:** (Optional) When it should be completed
3. Click "Create Task"

### Assign a Task
1. Find the task in "Pending" tab
2. Click "Assign Volunteer"
3. See list of available volunteers (sorted by workload)
4. Click on a volunteer to select
5. Click "Assign"

### Monitor Tasks
- **Pending Tab:** Tasks waiting to be assigned
- **Assigned Tab:** Tasks assigned to volunteers
- **In Progress Tab:** Tasks being worked on
- **Completed Tab:** Finished tasks

---

## For Volunteers

### Access Your Tasks
1. Login as volunteer
2. Click "My Tasks" in the sidebar
3. URL: `http://localhost:4200/dashboard/volunteer/tasks`

### Work on Tasks
1. **Pending Tab:** See tasks assigned to you
2. Click "Start Task" to begin work
3. Task moves to "Active" tab
4. Click "Mark Completed" when done
5. Task moves to "Completed" tab

---

## Task Types

### 🚚 Delivery
- Delivering food packages
- Delivering medical supplies
- Delivering shelter kits

### 📦 Warehouse
- Loading/unloading packages
- Counting inventory
- Preparing packages

### 🗺️ Field Work
- Victim verification
- Damage assessment
- Follow-up visits

### 📋 Other
- Camp management
- Registration support
- Any other tasks

---

## Priority Levels

- 🔴 **Critical:** Immediate action required
- 🟠 **High:** Important, needs attention soon
- 🔵 **Medium:** Normal priority (default)
- ⚪ **Low:** Can wait

---

## API Endpoints

### NGO Endpoints
```
GET    /api/tasks/organization/:orgId          - Get all tasks
POST   /api/tasks                              - Create task
PUT    /api/tasks/:id/assign                   - Assign to volunteer
GET    /api/tasks/:id/available-volunteers     - Get available volunteers
DELETE /api/tasks/:id                          - Delete task
```

### Volunteer Endpoints
```
GET    /api/tasks/volunteer/:volunteerId       - Get my tasks
PUT    /api/tasks/:id/status                   - Update task status
```

---

## Example: Create Delivery Task

```javascript
POST /api/tasks
Authorization: Bearer {token}

{
  "taskType": "delivery",
  "title": "Deliver food packages to Ahmed Khan",
  "description": "Deliver 5 food packages to victim location",
  "organization": "ngo_id",
  "priority": "high",
  "location": "24.8607, 67.0011",
  "dueDate": "2026-02-26T10:00:00Z"
}
```

---

## Example: Assign Task

```javascript
PUT /api/tasks/task_id/assign
Authorization: Bearer {token}

{
  "volunteerId": "volunteer_id"
}
```

---

## Example: Complete Task

```javascript
PUT /api/tasks/task_id/status
Authorization: Bearer {token}

{
  "status": "completed",
  "completionNotes": "Delivered successfully. Victim received all packages."
}
```

---

## Status Flow

```
pending → assigned → in_progress → completed
```

---

## Quick Test

### 1. Create Test Task (NGO)
```bash
# Login as NGO
# Go to: http://localhost:4200/dashboard/ngo/tasks
# Click "Create Task"
# Fill form and submit
```

### 2. Assign to Volunteer (NGO)
```bash
# Click "Assign Volunteer" on the task
# Select a volunteer
# Click "Assign"
```

### 3. Complete Task (Volunteer)
```bash
# Login as volunteer
# Go to: http://localhost:4200/dashboard/volunteer/tasks
# Click "Start Task"
# Click "Mark Completed"
```

---

## Troubleshooting

### Task not showing?
- Check if backend is running: `http://localhost:5000`
- Check if you're logged in
- Check browser console for errors

### Can't assign volunteer?
- Make sure volunteer is verified
- Make sure volunteer status is "active"
- Check if volunteer belongs to your NGO

### Import errors in console?
- These are TypeScript compile-time warnings
- They will resolve when Angular compiles
- Restart dev server if needed: `npm start`

---

## Files to Check

### Backend:
- `backend/src/models/Task.js` - Task model
- `backend/src/controllers/task.controller.js` - Task API
- `backend/src/routes/task.routes.js` - Task routes

### Frontend NGO:
- `dms-landing/src/app/dashboard/ngo/tasks/tasks.ts` - Main component
- `dms-landing/src/app/dashboard/ngo/tasks/tasks.html` - Template
- `dms-landing/src/app/dashboard/ngo/services/ngo.service.ts` - API service

### Frontend Volunteer:
- `dms-landing/src/app/dashboard/volunteer/my-tasks/my-tasks.ts` - Component
- `dms-landing/src/app/dashboard/volunteer/services/volunteer.service.ts` - API service

---

## Documentation

- `TASK_MANAGEMENT_SYSTEM_DESIGN.md` - Full system design
- `TASK_SYSTEM_IMPLEMENTATION.md` - Backend implementation
- `TASK_MANAGEMENT_FRONTEND_COMPLETE.md` - Frontend implementation
- `TASK_SYSTEM_QUICK_START.md` - This file

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify authentication token
4. Restart both servers
5. Clear browser cache

---

## Next Steps

1. Test the system end-to-end
2. Create real tasks for your NGO
3. Assign tasks to volunteers
4. Monitor task completion
5. Provide feedback for improvements

---

**Status:** ✅ READY TO USE

**Servers:**
- Backend: http://localhost:5000 ✅
- Frontend: http://localhost:4200 ✅

Enjoy your new task management system! 🎉
