const express = require('express');
const router = express.Router();
const {
    createRequest,
    getAllRequests,
    getNGORequests,
    getMyRequests,
    getRequestById,
    updateRequestStatus,
    deleteRequest,
    getRequestForVolunteer,
    createDistributionTask
} = require('../controllers/aidRequest.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

// Public submission (auto-creates victim account if not logged in)
router.post('/', optionalAuth, createRequest);

// Protected routes
router.use(protect);

router.get('/', getAllRequests);
router.get('/my-requests', getMyRequests);
router.get('/ngo/:ngoId', getNGORequests);
router.get('/:id/volunteer-view', getRequestForVolunteer);
router.post('/:id/create-task', createDistributionTask);

router.route('/:id')
    .get(getRequestById)
    .delete(deleteRequest);

router.put('/:id/status', updateRequestStatus);

router.get('/my-requests', getMyRequests);
router.get('/ngo/:ngoId', getNGORequests);
router.get('/:id/volunteer-view', getRequestForVolunteer);
router.post('/:id/create-task', createDistributionTask);

router.route('/:id')
    .get(getRequestById)
    .delete(deleteRequest);

router.put('/:id/status', updateRequestStatus);

module.exports = router;
