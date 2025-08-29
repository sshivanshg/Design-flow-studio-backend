const Lead = require('../models/Lead');
const User = require('../models/User');
const Estimate = require('../models/Estimate');
const Proposal = require('../models/Proposal');
const Moodboard = require('../models/Moodboard');

// Create a new lead
exports.createLead = async (req, res) => {
    try {
        const leadData = {
            ...req.body,
            createdBy: req.user.id,
            lastUpdatedBy: req.user.id
        };

        const lead = await Lead.create(leadData);
        
        res.status(201).json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all leads with filtering and pagination
exports.getLeads = async (req, res) => {
    try {
        const {
            stage,
            projectTag,
            source,
            assignedTo,
            startDate,
            endDate,
            search,
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = {};

        if (stage) query.stage = stage;
        if (projectTag) query.projectTag = projectTag;
        if (source) query.source = source;
        if (assignedTo) query.assignedTo = assignedTo;
        
        // Date range filter
        if (startDate || endDate) {
            query.followUpDate = {};
            if (startDate) query.followUpDate.$gte = new Date(startDate);
            if (endDate) query.followUpDate.$lte = new Date(endDate);
        }

        // Search in name, phone, email, or projectTag
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { projectTag: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const leads = await Lead.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Lead.countDocuments(query);

        res.status(200).json({
            success: true,
            count: leads.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: leads
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update lead stage (for drag-and-drop)
exports.updateLeadStage = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { stage } = req.body;

        if (!['new', 'contacted', 'visited', 'quoted', 'closed'].includes(stage)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stage'
            });
        }

        const lead = await Lead.findByIdAndUpdate(
            leadId,
            {
                stage,
                lastUpdatedBy: req.user.id
            },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email')
         .populate('lastUpdatedBy', 'name email');

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Update lead stage error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add note to lead
exports.addNote = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { content } = req.body;

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        lead.notes.push({
            content,
            createdBy: req.user.id
        });

        lead.lastUpdatedBy = req.user.id;
        await lead.save();

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update lead details
exports.updateLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const updateData = {
            ...req.body,
            lastUpdatedBy: req.user.id
        };

        const lead = await Lead.findByIdAndUpdate(
            leadId,
            updateData,
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email')
         .populate('lastUpdatedBy', 'name email');

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete lead
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        await lead.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 

// Get leads for Kanban board view
exports.getLeadsKanban = async (req, res) => {
    try {
        const userId = req.user.id;
        const { source, tag, assignedTo } = req.query;
        
        // Build filter query
        const filterQuery = {};
        
        if (source && source !== 'all') {
            filterQuery.source = source;
        }
        
        if (tag && tag !== 'all') {
            filterQuery.tags = { $in: [tag] };
        }
        
        if (assignedTo && assignedTo !== 'all') {
            filterQuery.assignedTo = assignedTo;
        } else {
            filterQuery.assignedTo = userId;
        }
        
        const leads = await Lead.find(filterQuery)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .sort('-createdAt');
        
        // Group leads by stage
        const kanbanData = {
            new: leads.filter(lead => lead.stage === 'new'),
            contacted: leads.filter(lead => lead.stage === 'contacted'),
            qualified: leads.filter(lead => lead.stage === 'qualified'),
            proposal: leads.filter(lead => lead.stage === 'quoted'),
            negotiation: leads.filter(lead => lead.stage === 'negotiation'),
            closed: leads.filter(lead => lead.stage === 'closed')
        };
        
        res.status(200).json({
            success: true,
            data: kanbanData
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get leads for list view with advanced filtering
exports.getLeadsList = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            source, 
            stage, 
            assignedTo, 
            dateFrom, 
            dateTo, 
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        // Build filter query
        const filterQuery = {};
        
        if (source && source !== 'all') {
            filterQuery.source = source;
        }
        
        if (stage && stage !== 'all') {
            filterQuery.stage = stage;
        }
        
        if (assignedTo && assignedTo !== 'all') {
            filterQuery.assignedTo = assignedTo;
        } else {
            filterQuery.assignedTo = userId;
        }
        
        if (dateFrom || dateTo) {
            filterQuery.createdAt = {};
            if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
        }
        
        if (search) {
            filterQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { projectTag: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const leads = await Lead.find(filterQuery)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Lead.countDocuments(filterQuery);
        const totalPages = Math.ceil(total / parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: {
                leads,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get single lead detail with timeline
exports.getLeadDetail = async (req, res) => {
    try {
        const { leadId } = req.params;
        const userId = req.user.id;
        
        const lead = await Lead.findById(leadId)
            .populate('assignedTo', 'name email role')
            .populate('createdBy', 'name')
            .populate('notes.createdBy', 'name');
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        // Get related estimates
        const estimates = await Estimate.find({ lead: leadId })
            .sort('-createdAt');
        
        // Get related proposals
        const proposals = await Proposal.find({ 
            project: { $in: lead.projects || [] }
        }).sort('-createdAt');
        
        // Get related moodboards
        const moodboards = await Moodboard.find({ 
            client: { $in: lead.clients || [] }
        }).sort('-createdAt');
        
        // Build timeline from notes and interactions
        const timeline = [
            ...lead.notes.map(note => ({
                type: 'note',
                content: note.content,
                createdBy: note.createdBy,
                timestamp: note.createdAt
            })),
            {
                type: 'lead_created',
                content: 'Lead created',
                createdBy: lead.createdBy,
                timestamp: lead.createdAt
            }
        ].sort((a, b) => b.timestamp - a.timestamp);
        
        res.status(200).json({
            success: true,
            data: {
                lead,
                estimates,
                proposals,
                moodboards,
                timeline
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add interaction to lead timeline
exports.addInteraction = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { type, content, scheduledFor } = req.body;
        
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        // Add interaction to notes
        lead.notes.push({
            content: `[${type.toUpperCase()}] ${content}`,
            createdBy: req.user.id
        });
        
        await lead.save();
        
        res.status(200).json({
            success: true,
            message: 'Interaction added successfully',
            data: lead
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Bulk assign leads
exports.bulkAssign = async (req, res) => {
    try {
        const { leadIds, assignedTo } = req.body;
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Lead IDs are required' });
        }
        
        if (!assignedTo) {
            return res.status(400).json({ success: false, message: 'Assigned user is required' });
        }
        
        const result = await Lead.updateMany(
            { _id: { $in: leadIds } },
            { assignedTo, lastUpdatedBy: req.user.id }
        );
        
        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} leads assigned successfully`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Bulk move leads to stage
exports.bulkMoveStage = async (req, res) => {
    try {
        const { leadIds, stage } = req.body;
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Lead IDs are required' });
        }
        
        if (!stage) {
            return res.status(400).json({ success: false, message: 'Stage is required' });
        }
        
        const result = await Lead.updateMany(
            { _id: { $in: leadIds } },
            { stage, lastUpdatedBy: req.user.id }
        );
        
        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} leads moved to ${stage} stage`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Bulk tag leads
exports.bulkTag = async (req, res) => {
    try {
        const { leadIds, tags, action } = req.body; // action: 'add' or 'remove'
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Lead IDs are required' });
        }
        
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({ success: false, message: 'Tags are required' });
        }
        
        let updateQuery;
        if (action === 'remove') {
            updateQuery = { $pullAll: { tags } };
        } else {
            updateQuery = { $addToSet: { tags: { $each: tags } } };
        }
        
        const result = await Lead.updateMany(
            { _id: { $in: leadIds } },
            { ...updateQuery, lastUpdatedBy: req.user.id }
        );
        
        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} leads ${action === 'remove' ? 'untagged' : 'tagged'} successfully`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Bulk WhatsApp follow-up
exports.bulkWhatsApp = async (req, res) => {
    try {
        const { leadIds, message } = req.body;
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Lead IDs are required' });
        }
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }
        
        const leads = await Lead.find({ _id: { $in: leadIds } });
        
        // Add interaction note to each lead
        for (const lead of leads) {
            lead.notes.push({
                content: `[WHATSAPP] ${message}`,
                createdBy: req.user.id
            });
            await lead.save();
        }
        
        // TODO: Integrate with WhatsApp API to actually send messages
        // For now, just log the action
        
        res.status(200).json({
            success: true,
            message: `WhatsApp follow-up scheduled for ${leads.length} leads`,
            data: { 
                leadsCount: leads.length,
                message: 'WhatsApp integration pending'
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Export leads to CSV
exports.exportLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const { source, stage, dateFrom, dateTo } = req.query;
        
        // Build filter query
        const filterQuery = { assignedTo: userId };
        
        if (source && source !== 'all') {
            filterQuery.source = source;
        }
        
        if (stage && stage !== 'all') {
            filterQuery.stage = stage;
        }
        
        if (dateFrom || dateTo) {
            filterQuery.createdAt = {};
            if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
        }
        
        const leads = await Lead.find(filterQuery)
            .populate('assignedTo', 'name')
            .sort('-createdAt');
        
        // Convert to CSV format
        const csvHeaders = [
            'Name',
            'Email',
            'Phone',
            'Source',
            'Stage',
            'Project Tag',
            'Assigned To',
            'Created Date',
            'Last Contact'
        ];
        
        const csvData = leads.map(lead => [
            lead.name,
            lead.email,
            lead.phone,
            lead.source,
            lead.stage,
            lead.projectTag,
            lead.assignedTo?.name || '',
            lead.createdAt.toISOString().split('T')[0],
            lead.updatedAt.toISOString().split('T')[0]
        ]);
        
        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
        res.send(csvContent);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Import leads from CSV
exports.importLeads = async (req, res) => {
    try {
        const { leads } = req.body; // Array of lead objects from CSV
        
        if (!leads || !Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ success: false, message: 'Leads data is required' });
        }
        
        const importedLeads = [];
        const errors = [];
        
        for (let i = 0; i < leads.length; i++) {
            try {
                const leadData = leads[i];
                
                // Validate required fields
                if (!leadData.name || !leadData.phone) {
                    errors.push(`Row ${i + 1}: Name and phone are required`);
                    continue;
                }
                
                // Check if lead already exists
                const existingLead = await Lead.findOne({ 
                    phone: leadData.phone,
                    assignedTo: req.user.id
                });
                
                if (existingLead) {
                    errors.push(`Row ${i + 1}: Lead with phone ${leadData.phone} already exists`);
                    continue;
                }
                
                // Create new lead
                const lead = new Lead({
                    name: leadData.name,
                    phone: leadData.phone,
                    email: leadData.email || '',
                    source: leadData.source || 'import',
                    projectTag: leadData.projectTag || 'General',
                    stage: leadData.stage || 'new',
                    assignedTo: req.user.id,
                    createdBy: req.user.id
                });
                
                await lead.save();
                importedLeads.push(lead);
                
            } catch (error) {
                errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Import completed. ${importedLeads.length} leads imported successfully.`,
            data: {
                imported: importedLeads.length,
                errors: errors.length,
                errorDetails: errors
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get lead statistics
exports.getLeadStats = async (req, res) => {
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
        
        // Get lead counts by stage
        const stageStats = await Lead.aggregate([
            {
                $match: {
                    assignedTo: userId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$stage',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Get source distribution
        const sourceStats = await Lead.aggregate([
            {
                $match: {
                    assignedTo: userId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Get conversion rate
        const totalLeads = await Lead.countDocuments({
            assignedTo: userId,
            createdAt: { $gte: startDate, $lte: endDate }
        });
        
        const convertedLeads = await Lead.countDocuments({
            assignedTo: userId,
            stage: 'closed',
            createdAt: { $gte: startDate, $lte: endDate }
        });
        
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0;
        
        res.status(200).json({
            success: true,
            data: {
                stageStats,
                sourceStats,
                conversionRate: parseFloat(conversionRate),
                totalLeads,
                convertedLeads,
                period
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}; 