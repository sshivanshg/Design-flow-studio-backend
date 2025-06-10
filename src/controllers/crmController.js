const Lead = require('../models/Lead');

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