const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createLead,
    getLeads,
    updateLead,
    deleteLead,
    updateLeadStage,
    addNote,
    getLeadsKanban,
    getLeadsList,
    getLeadDetail,
    addInteraction,
    bulkAssign,
    bulkMoveStage,
    bulkTag,
    bulkWhatsApp,
    exportLeads,
    importLeads,
    getLeadStats
} = require('../controllers/crmController');

// All CRM routes require authentication
router.use(protect);

// Basic CRUD operations
router.post('/', authorize('admin', 'sales'), createLead);
router.get('/', getLeads);
router.put('/:leadId', authorize('admin', 'sales'), updateLead);
router.delete('/:leadId', authorize('admin'), deleteLead);

// Lead stage management
router.patch('/:leadId/stage', authorize('admin', 'sales'), updateLeadStage);

// Notes
router.post('/:leadId/notes', authorize('admin', 'sales'), addNote);

// Advanced views
router.get('/kanban', getLeadsKanban);
router.get('/list', getLeadsList);

// Single lead detail
router.get('/:leadId/detail', getLeadDetail);
router.post('/:leadId/interactions', authorize('admin', 'sales'), addInteraction);

// Bulk operations
router.post('/bulk-assign', authorize('admin', 'sales'), bulkAssign);
router.post('/bulk-move-stage', authorize('admin', 'sales'), bulkMoveStage);
router.post('/bulk-tag', authorize('admin', 'sales'), bulkTag);
router.post('/bulk-whatsapp', authorize('admin', 'sales'), bulkWhatsApp);

// Import/Export
router.get('/export', exportLeads);
router.post('/import', authorize('admin', 'sales'), importLeads);

// Statistics
router.get('/stats', getLeadStats);

module.exports = router; 