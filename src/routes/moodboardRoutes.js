const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createMoodboard,
    uploadImage,
    addNote,
    getPreloadedPacks,
    generateAISuggestion,
    exportToPDF,
    generateSharableLink
} = require('../controllers/moodboardController');

// Create a new moodboard
router.post('/', protect, createMoodboard);

// Upload image to a section
router.post('/upload', protect, uploadImage);

// Add note to a section
router.post('/note', protect, addNote);

// Fetch preloaded moodboard packs
router.get('/preloaded', getPreloadedPacks);

// Generate AI-based moodboard suggestion
router.post('/ai-suggestion', protect, generateAISuggestion);

// Export moodboard to PDF
router.get('/:moodboardId/export', protect, exportToPDF);

// Generate sharable link
router.get('/:moodboardId/share', protect, generateSharableLink);

module.exports = router; 