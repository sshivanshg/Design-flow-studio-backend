const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    generateAccessToken,
    verifyToken,
    getDashboard,
    addComment,
    updateDocumentStatus,
    updatePreferences,
    getProjectUpdates,
    testWhatsApp
} = require('../controllers/clientPortalController');

// Generate portal access token (admin/sales only)
router.post('/generate-token', protect, authorize('admin', 'sales'), generateAccessToken);

// Verify portal access token
router.post('/verify-token', verifyToken);

// Get client portal dashboard
router.get('/:clientId/dashboard', protect, getDashboard);

// Add comment to document
router.post('/:clientId/comments', protect, addComment);

// Update document status
router.put('/:clientId/documents/:documentId/status', protect, updateDocumentStatus);

// Update notification preferences
router.put('/:clientId/preferences', protect, updatePreferences);

// Get project updates
router.get('/projects/:projectId/updates', protect, getProjectUpdates);

// Test WhatsApp message
router.post('/test-whatsapp', protect, authorize('admin', 'sales'), testWhatsApp);

module.exports = router; 