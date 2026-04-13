const express = require('express');
const router = express.Router();
const {
    registerVolunteer,
    getAllVolunteers,
    getNGOVolunteers,
    getMyVolunteerProfile,
    verifyVolunteer,
    updateAvailability,
    updateVolunteer,
    getNGOCapacity,
    deleteVolunteer,
    assignRegion,
    getMyRegion
} = require('../controllers/volunteer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Public volunteer routes (authenticated users)
router.post('/', registerVolunteer);
router.get('/me', getMyVolunteerProfile);
router.get('/my-region', getMyRegion);

// NGO/Admin routes
router.get('/', authorize('admin', 'ngo'), getAllVolunteers);
router.get('/ngo/:ngoId', authorize('admin', 'ngo'), getNGOVolunteers);
router.get('/capacity/:ngoId', authorize('admin', 'ngo'), getNGOCapacity);

// Update routes
router.put('/:id/verify', authorize('admin', 'ngo'), verifyVolunteer);
router.put('/:id/assign-region', authorize('admin', 'ngo'), assignRegion);
router.put('/:id/availability', updateAvailability);
router.put('/:id', updateVolunteer);

// Admin only
router.delete('/:id', authorize('admin'), deleteVolunteer);

module.exports = router;
