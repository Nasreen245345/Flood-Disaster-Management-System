const express = require('express');
const router = express.Router();
const {
    registerOrganization,
    getAllOrganizations,
    getMyOrganization,
    getOrganizationById,
    updateOrganizationStatus,
    updateInventory,
    updateActiveDistributions,
    updateOrganization,
    deleteOrganization,
    getApprovedNGOs
} = require('../controllers/organization.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public route - get approved NGOs for volunteer registration
router.get('/approved/list', getApprovedNGOs);

// All other routes require authentication
router.use(protect);

// NGO user routes
router.post('/', authorize('ngo'), registerOrganization);
router.get('/me', authorize('ngo'), getMyOrganization);

// Admin routes
router.get('/', authorize('admin'), getAllOrganizations);
router.get('/:id', getOrganizationById);
router.put('/:id/status', authorize('admin'), updateOrganizationStatus);

// NGO/Admin routes
router.put('/:id/inventory', authorize('admin', 'ngo'), updateInventory);
router.put('/:id/distributions', authorize('admin', 'ngo'), updateActiveDistributions);
router.put('/:id', authorize('admin', 'ngo'), updateOrganization);

// Admin only
router.delete('/:id', authorize('admin'), deleteOrganization);

module.exports = router;
