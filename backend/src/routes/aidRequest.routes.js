const express = require('express');
const router = express.Router();
const {
    createRequest,
    getAllRequests,
    getNGORequests,
    getMyRequests,
    getRequestById,
    updateRequestStatus,
    deleteRequest
} = require('../controllers/aidRequest.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getAllRequests)
    .post(createRequest);

router.get('/my-requests', getMyRequests);
router.get('/ngo/:ngoId', getNGORequests);

router.route('/:id')
    .get(getRequestById)
    .delete(deleteRequest);

router.put('/:id/status', updateRequestStatus);

module.exports = router;
