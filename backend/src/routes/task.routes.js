const express = require('express');
const router = express.Router();
const {
    createTask,
    getOrganizationTasks,
    getVolunteerTasks,
    getTask,
    assignTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    getAvailableVolunteers
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Task CRUD
router.route('/')
    .post(createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(deleteTask);

// Organization tasks
router.get('/organization/:orgId', getOrganizationTasks);

// Volunteer tasks
router.get('/volunteer/:volunteerId', getVolunteerTasks);

// Task assignment
router.put('/:id/assign', assignTask);

// Task status update
router.put('/:id/status', updateTaskStatus);

// Get available volunteers for task
router.get('/:id/available-volunteers', getAvailableVolunteers);

module.exports = router;
