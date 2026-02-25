const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getAllAssignments,
    getAssignmentById,
    updateAssignmentStatus,
    updateAssignment,
    deleteAssignment,
    getNGOAssignments,
    getAssignmentStats
} = require('../controllers/regionAssignment.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getAllAssignments);
router.get('/stats', getAssignmentStats);
router.get('/ngo/:ngoId', getNGOAssignments);
router.get('/:id', getAssignmentById);

// Admin only routes
router.post('/', authorize('admin'), createAssignment);
router.put('/:id', authorize('admin'), updateAssignment);
router.delete('/:id', authorize('admin'), deleteAssignment);

// Admin or assigned NGO can update status
router.put('/:id/status', updateAssignmentStatus);

module.exports = router;
