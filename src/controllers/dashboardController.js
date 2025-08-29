const Project = require('../models/Project');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Estimate = require('../models/Estimate');
const Proposal = require('../models/Proposal');

// Get dashboard overview
exports.getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get counts
        const activeProjects = await Project.countDocuments({ 
            status: 'in_progress',
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        });
        
        const totalClients = await Client.countDocuments({ createdBy: userId });
        const totalLeads = await Lead.countDocuments({ assignedTo: userId });
        
        // Get recent projects
        const recentProjects = await Project.find({
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        })
        .populate('client', 'name')
        .sort('-createdAt')
        .limit(5);
        
        // Get today's tasks
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const projectsWithTasks = await Project.find({
            'zones.tasks.assignedTo': userId,
            'zones.tasks.dueDate': {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('zones.tasks.assignedTo', 'name');
        
        const todaysTasks = projectsWithTasks.reduce((acc, project) => {
            const tasks = project.zones.reduce((zoneAcc, zone) => {
                const zoneTasks = zone.tasks.filter(task => 
                    task.assignedTo && 
                    task.assignedTo.toString() === userId &&
                    task.dueDate >= today && 
                    task.dueDate < tomorrow
                );
                return [...zoneAcc, ...zoneTasks];
            }, []);
            return [...acc, ...tasks];
        }, []);
        
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    activeProjects,
                    totalClients,
                    totalLeads
                },
                recentProjects,
                todaysTasks: todaysTasks.slice(0, 5)
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get dashboard KPIs
exports.getDashboardKPIs = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Active projects count and change
        const currentActiveProjects = await Project.countDocuments({ 
            status: 'in_progress',
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        });
        
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const lastMonthActiveProjects = await Project.countDocuments({
            status: 'in_progress',
            createdAt: { $lt: lastMonth },
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        });
        
        const activeProjectsChange = lastMonthActiveProjects > 0 
            ? ((currentActiveProjects - lastMonthActiveProjects) / lastMonthActiveProjects * 100).toFixed(1)
            : 0;
        
        // Client conversion rate
        const totalLeads = await Lead.countDocuments({ assignedTo: userId });
        const convertedLeads = await Lead.countDocuments({ 
            assignedTo: userId,
            stage: 'closed'
        });
        
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0;
        
        // Get last month's conversion rate for comparison
        const lastMonthLeads = await Lead.countDocuments({ 
            assignedTo: userId,
            createdAt: { $lt: lastMonth }
        });
        const lastMonthConverted = await Lead.countDocuments({
            assignedTo: userId,
            stage: 'closed',
            createdAt: { $lt: lastMonth }
        });
        
        const lastMonthConversionRate = lastMonthLeads > 0 
            ? (lastMonthConverted / lastMonthLeads * 100).toFixed(1)
            : 0;
        
        const conversionChange = lastMonthConversionRate > 0
            ? ((conversionRate - lastMonthConversionRate) / lastMonthConversionRate * 100).toFixed(1)
            : 0;
        
        res.status(200).json({
            success: true,
            data: {
                activeProjects: {
                    count: currentActiveProjects,
                    change: activeProjectsChange
                },
                clientConversion: {
                    rate: conversionRate,
                    change: conversionChange
                }
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get project insights and workload distribution
exports.getProjectInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const { timeframe = 'week' } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeframe === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeframe === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
        
        // Get projects in date range
        const projects = await Project.find({
            createdAt: { $gte: startDate, $lte: endDate },
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        });
        
        // Calculate workload distribution by day
        const workloadDistribution = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayProjects = projects.filter(project => {
                const projectDate = new Date(project.createdAt);
                return projectDate.toDateString() === currentDate.toDateString();
            });
            
            workloadDistribution.push({
                date: currentDate.toISOString().split('T')[0],
                day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
                projects: dayProjects.length,
                tasks: dayProjects.reduce((acc, project) => {
                    return acc + project.zones.reduce((zoneAcc, zone) => {
                        return zoneAcc + zone.tasks.filter(task => 
                            task.assignedTo && 
                            task.assignedTo.toString() === userId
                        ).length;
                    }, 0);
                }, 0)
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Calculate estimated monthly revenue (mock calculation)
        const monthlyRevenue = projects.length * 1200; // Mock calculation
        
        res.status(200).json({
            success: true,
            data: {
                workloadDistribution,
                monthlyRevenue,
                timeframe
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get recent projects
exports.getRecentProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 5 } = req.query;
        
        const projects = await Project.find({
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        })
        .populate('client', 'name')
        .populate('zones.tasks.assignedTo', 'name')
        .sort('-createdAt')
        .limit(parseInt(limit));
        
        // Format projects for dashboard
        const formattedProjects = projects.map(project => {
            const totalTasks = project.zones.reduce((acc, zone) => acc + zone.tasks.length, 0);
            const completedTasks = project.zones.reduce((acc, zone) => {
                return acc + zone.tasks.filter(task => task.status === 'Done').length;
            }, 0);
            
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return {
                id: project._id,
                name: project.name,
                client: project.client.name,
                status: project.status,
                progress,
                rate: '$10/hr', // Mock data
                tags: ['Remote'], // Mock data
                description: 'Frontend, backend & API integration', // Mock data
                createdAt: project.createdAt
            };
        });
        
        res.status(200).json({
            success: true,
            data: formattedProjects
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get today's tasks
exports.getTodaysTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const projectsWithTasks = await Project.find({
            'zones.tasks.assignedTo': userId,
            'zones.tasks.dueDate': {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('zones.tasks.assignedTo', 'name');
        
        const todaysTasks = projectsWithTasks.reduce((acc, project) => {
            const tasks = project.zones.reduce((zoneAcc, zone) => {
                const zoneTasks = zone.tasks.filter(task => 
                    task.assignedTo && 
                    task.assignedTo.toString() === userId &&
                    task.dueDate >= today && 
                    task.dueDate < tomorrow
                ).map(task => ({
                    id: task._id,
                    title: task.title,
                    dueDate: task.dueDate,
                    status: task.status,
                    project: project.name
                }));
                return [...zoneAcc, ...zoneTasks];
            }, []);
            return [...acc, ...tasks];
        }, []);
        
        // Get tomorrow's tasks too
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        
        const tomorrowsTasks = await Project.find({
            'zones.tasks.assignedTo': userId,
            'zones.tasks.dueDate': {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            }
        }).populate('zones.tasks.assignedTo', 'name');
        
        const tomorrowsTaskList = tomorrowsTasks.reduce((acc, project) => {
            const tasks = project.zones.reduce((zoneAcc, zone) => {
                const zoneTasks = zone.tasks.filter(task => 
                    task.assignedTo && 
                    task.assignedTo.toString() === userId &&
                    task.dueDate >= tomorrow && 
                    task.dueDate < dayAfterTomorrow
                ).map(task => ({
                    id: task._id,
                    title: task.title,
                    dueDate: task.dueDate,
                    status: task.status,
                    project: project.name
                }));
                return [...zoneAcc, ...zoneTasks];
            }, []);
            return [...acc, ...tasks];
        }, []);
        
        res.status(200).json({
            success: true,
            data: {
                todaysTasks: todaysTasks.slice(0, 10),
                tomorrowsTasks: tomorrowsTaskList.slice(0, 5)
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get active clients
exports.getActiveClients = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const activeProjects = await Project.find({
            status: 'in_progress',
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        }).populate('client', 'name');
        
        // Get unique clients with their active projects
        const clientMap = new Map();
        
        activeProjects.forEach(project => {
            if (!clientMap.has(project.client._id.toString())) {
                clientMap.set(project.client._id.toString(), {
                    id: project.client._id,
                    name: project.client.name,
                    status: 'Ongoing',
                    project: project.name,
                    avatar: null // Mock data
                });
            }
        });
        
        const activeClients = Array.from(clientMap.values());
        
        res.status(200).json({
            success: true,
            data: activeClients
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get active projects with progress
exports.getActiveProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const activeProjects = await Project.find({
            status: 'in_progress',
            $or: [
                { createdBy: userId },
                { 'zones.tasks.assignedTo': userId }
            ]
        })
        .populate('client', 'name')
        .populate('zones.tasks.assignedTo', 'name')
        .sort('-createdAt');
        
        // Format projects for dashboard
        const formattedProjects = activeProjects.map(project => {
            const totalTasks = project.zones.reduce((acc, zone) => acc + zone.tasks.length, 0);
            const completedTasks = project.zones.reduce((acc, zone) => {
                return acc + zone.tasks.filter(task => task.status === 'Done').length;
            }, 0);
            
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            // Get next task
            const nextTask = project.zones.reduce((acc, zone) => {
                const pendingTask = zone.tasks.find(task => 
                    task.status !== 'Done' && 
                    task.assignedTo && 
                    task.assignedTo.toString() === userId
                );
                return pendingTask ? { ...pendingTask.toObject(), zone: zone.name } : acc;
            }, null);
            
            return {
                id: project._id,
                name: project.name,
                client: project.client.name,
                type: project.name.includes('Residence') ? 'Apartment' : 
                      project.name.includes('Office') ? 'Commercial Space' : 
                      project.name.includes('Villa') ? 'Independent House' : 'Restaurant Interior',
                progress,
                nextTask: nextTask ? nextTask.title : 'Project Complete',
                teamMembers: ['User1', 'User2', 'User3'], // Mock data
                createdAt: project.createdAt
            };
        });
        
        res.status(200).json({
            success: true,
            data: formattedProjects
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get leads funnel
exports.getLeadsFunnel = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const inquiryLeads = await Lead.countDocuments({ 
            assignedTo: userId,
            stage: 'new'
        });
        
        const proposalLeads = await Lead.countDocuments({ 
            assignedTo: userId,
            stage: 'quoted'
        });
        
        const negotiationLeads = await Lead.countDocuments({ 
            assignedTo: userId,
            stage: 'contacted'
        });
        
        const wonLeads = await Lead.countDocuments({ 
            assignedTo: userId,
            stage: 'closed'
        });
        
        res.status(200).json({
            success: true,
            data: {
                inquiry: inquiryLeads,
                proposalSent: proposalLeads,
                negotiation: negotiationLeads,
                won: wonLeads
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get recent leads
exports.getRecentLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 5 } = req.query;
        
        const recentLeads = await Lead.find({ assignedTo: userId })
            .sort('-createdAt')
            .limit(parseInt(limit));
        
        const formattedLeads = recentLeads.map(lead => ({
            id: lead._id,
            name: lead.name,
            projectType: lead.projectTag,
            status: lead.stage,
            createdAt: lead.createdAt
        }));
        
        res.status(200).json({
            success: true,
            data: formattedLeads
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get pending approvals
exports.getPendingApprovals = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get pending estimates
        const pendingEstimates = await Estimate.find({
            createdBy: userId,
            status: 'sent'
        }).populate('lead', 'name projectTag');
        
        // Get pending proposals (mock data for now)
        const pendingProposals = [
            {
                id: 'proposal-1',
                type: 'proposal',
                number: 'PRO-2023-032',
                client: 'Mehta Enterprises',
                project: 'Office Space',
                status: 'Awaiting',
                sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            }
        ];
        
        // Get pending moodboards (mock data for now)
        const pendingMoodboards = [
            {
                id: 'moodboard-1',
                type: 'moodboard',
                number: 'MB-2023-018',
                client: 'Verma Cafe',
                project: 'Restaurant',
                status: 'Awaiting',
                sentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            }
        ];
        
        const formattedEstimates = pendingEstimates.map(estimate => ({
            id: estimate._id,
            type: 'estimate',
            number: `EST-2023-${estimate._id.toString().slice(-3)}`,
            client: estimate.lead.name,
            project: estimate.lead.projectTag,
            status: 'Awaiting',
            sentDate: estimate.updatedAt
        }));
        
        const allPendingApprovals = [...formattedEstimates, ...pendingProposals, ...pendingMoodboards];
        
        res.status(200).json({
            success: true,
            data: allPendingApprovals
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get recent messages
exports.getRecentMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Mock data for recent messages
        const recentMessages = [
            {
                id: 'msg-1',
                sender: 'Aditya Kumar',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                content: 'Thank you for the estimate. I have a few questions about the material costs...',
                type: 'whatsapp'
            },
            {
                id: 'msg-2',
                sender: 'Riya Malhotra',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                content: 'The design looks amazing! Can we discuss the kitchen layout in more detail?',
                type: 'email'
            },
            {
                id: 'msg-3',
                sender: 'Mehta Enterprises',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                content: 'We reviewed the proposal. Let\'s schedule a meeting to discuss the budget...',
                type: 'whatsapp'
            }
        ];
        
        res.status(200).json({
            success: true,
            data: recentMessages
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get revenue snapshot
exports.getRevenueSnapshot = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = 'month' } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
        
        // Get estimates raised
        const estimatesRaised = await Estimate.find({
            createdBy: userId,
            createdAt: { $gte: startDate, $lte: endDate }
        });
        
        const totalEstimatesRaised = estimatesRaised.reduce((sum, estimate) => sum + estimate.costing.total, 0);
        
        // Get projects closed (mock calculation)
        const projectsClosed = totalEstimatesRaised * 0.64; // 64% conversion rate
        
        // Get payments received (mock calculation)
        const paymentsReceived = projectsClosed * 0.86; // 86% payment rate
        
        // Calculate percentage changes (mock data)
        const estimatesChange = 12; // +12%
        const projectsChange = 8; // +8%
        const paymentsChange = -3; // -3%
        
        // Weekly revenue breakdown
        const weeklyRevenue = [
            { week: 'Week 1', revenue: 450000 },
            { week: 'Week 2', revenue: 520000 },
            { week: 'Week 3', revenue: 380000 },
            { week: 'Week 4', revenue: 480000 }
        ];
        
        res.status(200).json({
            success: true,
            data: {
                estimatesRaised: {
                    amount: totalEstimatesRaised,
                    change: estimatesChange
                },
                projectsClosed: {
                    amount: projectsClosed,
                    change: projectsChange
                },
                paymentsReceived: {
                    amount: paymentsReceived,
                    change: paymentsChange
                },
                weeklyRevenue,
                period
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Quick actions
exports.createQuickLead = async (req, res) => {
    try {
        const { name, phone, email, projectTag, source } = req.body;
        
        const lead = new Lead({
            name,
            phone,
            email,
            projectTag,
            source: source || 'quick-action',
            assignedTo: req.user.id,
            createdBy: req.user.id
        });
        
        await lead.save();
        
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: lead
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createQuickProposal = async (req, res) => {
    try {
        const { projectId, title, description } = req.body;
        
        const proposal = new Proposal({
            project: projectId,
            title,
            description,
            createdBy: req.user.id
        });
        
        await proposal.save();
        
        res.status(201).json({
            success: true,
            message: 'Proposal created successfully',
            data: proposal
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createQuickEstimate = async (req, res) => {
    try {
        const { leadId, name, projectDetails } = req.body;
        
        const estimate = new Estimate({
            lead: leadId,
            name,
            projectDetails,
            createdBy: req.user.id
        });
        
        await estimate.save();
        
        res.status(201).json({
            success: true,
            message: 'Estimate created successfully',
            data: estimate
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
