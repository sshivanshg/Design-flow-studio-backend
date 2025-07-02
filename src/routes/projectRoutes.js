const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createProject,
    getProjects,
    getProject,
    addZone,
    addTask,
    updateTaskStatus,
    addLog,
    generateWeeklyReport,
    getRecentUpdates
} = require('../controllers/projectController');

// Create new project
router.post('/', protect, authorize('admin', 'sales'), createProject);

// Get all projects
router.get('/', protect, getProjects);

// Get project details
router.get('/:id', protect, getProject);

// Add zone to project
router.post('/:id/zones', protect, authorize('admin', 'sales'), addZone);

// Add task to zone
router.post('/:id/tasks', protect, authorize('admin', 'sales'), addTask);

// Update task status
router.put('/:id/tasks/status', protect, authorize('admin', 'sales'), updateTaskStatus);

// Add log to zone
router.post('/:id/logs', protect, authorize('admin', 'sales'), addLog);

// Generate weekly report
router.get('/:id/weekly-report', protect, authorize('admin', 'sales'), generateWeeklyReport);

// Get recent updates for client portal
router.get('/:id/recent-updates', protect, getRecentUpdates);

module.exports = router; 