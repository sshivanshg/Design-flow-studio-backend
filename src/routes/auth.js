const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { googleAuth, googleCallback } = require('../middleware/googleAuth');

// Local authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resetToken', authController.resetPassword);

// Email verification route
router.get('/verify-email/:token', authController.verifyEmail);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router; 