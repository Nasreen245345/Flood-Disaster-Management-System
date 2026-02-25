const express = require('express');
const router = express.Router();
const {
    reportDisaster,
    getAllDisasters,
    getDisasterById,
    updateDisasterStatus,
    updateDisaster,
    deleteDisaster,
    getDisasterStats
} = require('../controllers/disaster.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public route - anyone can report a disaster
router.post('/', reportDisaster);

// Public route - anyone can view disasters
router.get('/', getAllDisasters);
router.get('/stats', getDisasterStats);
router.get('/:id', getDisasterById);

// Protected routes - require authentication
router.use(protect);

router.put('/:id/status', updateDisasterStatus);
router.put('/:id', updateDisaster);
router.delete('/:id', deleteDisaster);

module.exports = router;
