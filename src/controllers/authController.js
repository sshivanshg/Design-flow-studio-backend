const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { admin } = require('../config/firebase');


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};


exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            isEmailVerified: true // Set to true for testing
        });

        // Create token
        const token = createToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = createToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();
        await user.save();

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Send email
        await sendPasswordResetEmail(user.email, resetUrl);

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const verificationToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: verificationToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Helper function to send verification email
const sendVerificationEmail = async (email, verificationUrl) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        to: email,
        subject: 'Email Verification',
        html: `Please click the link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`
    };

    await transporter.sendMail(message);
};

// Helper function to send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        to: email,
        subject: 'Password Reset',
        html: `Please click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    };

    await transporter.sendMail(message);
};

// Generate OTP
exports.generateOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Format phone number to E.164 format if not already
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // In a real application, you would send this code via SMS
        // For testing, we'll just return it
        console.log('Verification code:', verificationCode);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                verificationCode, // Remove this in production
                phoneNumber: formattedPhone
            }
        });
    } catch (error) {
        console.error('Generate OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Verify OTP and create/update user
exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        // Format phone number
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

        // In a real application, you would verify the OTP with Firebase
        // For testing, we'll just check if it's a 6-digit number
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format'
            });
        }

        // Check if user exists in MongoDB
        let user = await User.findOne({ phoneNumber: formattedPhone });

        if (!user) {
            // Create new user
            user = await User.create({
                phoneNumber: formattedPhone,
                firebaseUid: `temp_${Date.now()}`, // In production, use actual Firebase UID
                role: 'sales', // Default role
                lastLogin: new Date()
            });
        } else {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                phoneNumber: user.phoneNumber
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    name: user.name,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'designer', 'sales'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true, runValidators: true }
        ).select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Elevate user to admin (setup only, protected by secret)
exports.elevateToAdmin = async (req, res) => {
    try {
        const { email, secret } = req.body;
        if (!email || !secret) {
            return res.status(400).json({ success: false, message: 'Email and secret are required.' });
        }
        if (secret !== process.env.SETUP_ADMIN_SECRET) {
            return res.status(403).json({ success: false, message: 'Invalid secret.' });
        }
        const user = await User.findOneAndUpdate(
            { email },
            { role: 'admin' },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, message: 'User elevated to admin.', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 