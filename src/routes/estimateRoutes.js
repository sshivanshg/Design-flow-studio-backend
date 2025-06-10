const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createEstimate,
    getEstimate,
    getLeadEstimates,
    updateEstimate,
    saveAsTemplate,
    generatePDF
} = require('../controllers/estimateController');

// All routes are protected
router.use(protect);

// Create estimate for a lead
router.post('/leads/:leadId', authorize('admin', 'sales'), createEstimate);

// Get all estimates for a lead
router.get('/leads/:leadId', getLeadEstimates);

// Get single estimate
router.get('/:estimateId', getEstimate);

// Update estimate
router.put('/:estimateId', authorize('admin', 'sales'), updateEstimate);

// Save estimate as template
router.post('/:estimateId/template', authorize('admin', 'sales'), saveAsTemplate);

// Generate PDF
router.get('/:estimateId/pdf', generatePDF);

module.exports = router; 