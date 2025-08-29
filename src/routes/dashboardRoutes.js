const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getDashboardOverview,
    getDashboardKPIs,
    getProjectInsights,
    getRecentProjects,
    getTodaysTasks,
    getActiveClients,
    getActiveProjects,
    getLeadsFunnel,
    getRecentLeads,
    getPendingApprovals,
    getRecentMessages,
    getRevenueSnapshot,
    createQuickLead,
    createQuickProposal,
    createQuickEstimate
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(protect);

// Dashboard overview
router.get('/overview', getDashboardOverview);

// Dashboard KPIs
router.get('/kpis', getDashboardKPIs);

// Project insights and workload distribution
router.get('/project-insights', getProjectInsights);

// Recent projects
router.get('/recent-projects', getRecentProjects);

// Today's tasks
router.get('/todays-tasks', getTodaysTasks);

// Active clients
router.get('/active-clients', getActiveClients);

// Active projects with progress
router.get('/active-projects', getActiveProjects);

// Leads funnel
router.get('/leads-funnel', getLeadsFunnel);

// Recent leads
router.get('/recent-leads', getRecentLeads);

// Pending approvals
router.get('/pending-approvals', getPendingApprovals);

// Recent messages
router.get('/recent-messages', getRecentMessages);

// Revenue snapshot
router.get('/revenue-snapshot', getRevenueSnapshot);

// Quick actions
router.post('/quick-actions/new-lead', createQuickLead);
router.post('/quick-actions/new-proposal', createQuickProposal);
router.post('/quick-actions/new-estimate', createQuickEstimate);

module.exports = router;
