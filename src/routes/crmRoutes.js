const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createLead,
    getLeads,
    updateLeadStage,
    addNote,
    updateLead,
    deleteLead
} = require('../controllers/crmController');

// All routes are protected and require authentication
router.use(protect);

// Create a new lead
router.post('/', authorize('admin', 'sales'), createLead);

// Get all leads with filtering
router.get('/', getLeads);

// Update lead stage (for drag-and-drop)
router.patch('/:leadId/stage', authorize('admin', 'sales'), updateLeadStage);

// Add note to lead
router.post('/:leadId/notes', authorize('admin', 'sales'), addNote);

// Update lead details
router.put('/:leadId', authorize('admin', 'sales'), updateLead);

// Delete lead
router.delete('/:leadId', authorize('admin'), deleteLead);

module.exports = router; 