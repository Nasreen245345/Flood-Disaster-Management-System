const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    getUserStats,
    updateMyProfile
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Self-update (any logged-in user)
router.use(protect);
router.put('/me', updateMyProfile);

// Admin-only routes
router.use(authorize('admin'));

router.get('/stats', getUserStats);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
