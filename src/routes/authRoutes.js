const express = require('express');
const router = express.Router();
const passport = require('passport');
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
    elevateToAdmin,
    googleAuthCallback
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/generate-otp', generateOTP);
router.post('/verify-otp', verifyOTP);
router.post('/elevate-to-admin', elevateToAdmin);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
    passport.authenticate('google', { session: false }), 
    googleAuthCallback
);

// Protected routes
router.use(protect);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);

// Admin only routes
router.put('/users/:userId/role', checkRole(['admin']), updateUserRole);

module.exports = router; 