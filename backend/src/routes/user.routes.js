const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    getUserStats
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getUserStats);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
