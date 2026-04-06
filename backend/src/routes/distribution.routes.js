const express = require('express');
const router = express.Router();
const {
    createShift,
    getOrganizationShifts,
    getVolunteerShifts,
    assignVolunteer,
    getMyActiveShift,
    verifyVictim,
    markDistributed,
    updateShiftStatus,
    deleteShift,
    getPublicShifts
} = require('../controllers/distribution.controller');
const { protect } = require('../middleware/auth.middleware');

// Public route - victims can see active shifts for their assigned NGO
router.get('/shifts/public/:orgId', getPublicShifts);

// All other routes are protected
router.use(protect);

// Shift management
router.post('/shifts', createShift);
router.get('/shifts/organization/:orgId', getOrganizationShifts);
router.get('/shifts/volunteer/:volunteerId', getVolunteerShifts);
router.put('/shifts/:id/assign', assignVolunteer);
router.put('/shifts/:id/status', updateShiftStatus);
router.delete('/shifts/:id', deleteShift);

// Volunteer distribution operations
router.get('/my-active-shift', getMyActiveShift);
router.post('/verify-victim', verifyVictim);
router.post('/mark-distributed', markDistributed);

module.exports = router;
