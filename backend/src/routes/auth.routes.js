const express = require('express');
const router = express.Router();
const { signup, login, cnicLogin, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/cnic-login', cnicLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
