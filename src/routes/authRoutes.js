const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
const {
    generateOTP,
    verifyOTP,
    updateUserRole,
    getCurrentUser,
    updateProfile,
    login,
    register,
    elevateToAdmin
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/generate-otp', generateOTP);
router.post('/verify-otp', verifyOTP);
router.post('/elevate-to-admin', elevateToAdmin);

// Protected routes
router.use(protect);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);

// Admin only routes
router.put('/users/:userId/role', checkRole(['admin']), updateUserRole);

module.exports = router; 