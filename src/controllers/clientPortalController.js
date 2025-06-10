const ClientPortal = require('../models/ClientPortal');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Moodboard = require('../models/Moodboard');
const Estimate = require('../models/Estimate');
const Proposal = require('../models/Proposal');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { sendWhatsApp } = require('../utils/whatsapp');

// Generate portal access token
exports.generateAccessToken = async (req, res) => {
    try {
        const { clientId, method } = req.body;
        const client = await Client.findById(clientId);
        
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        let clientPortal = await ClientPortal.findOne({ client: clientId });
        if (!clientPortal) {
            clientPortal = new ClientPortal({ client: clientId });
        }

        const token = clientPortal.generateAccessToken();
        await clientPortal.save();

        // Send token via email or WhatsApp
        if (method === 'email') {
            await sendEmail({
                to: client.email,
                subject: 'Your DesignFlow Studio Portal Access',
                text: `Your portal access token is: ${token}\nThis token will expire in 7 days.`
            });
        } else if (method === 'whatsapp') {
            await sendWhatsApp({
                to: client.phone,
                message: `Your DesignFlow Studio portal access token is: ${token}\nThis token will expire in 7 days.`
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Access token sent via ${method}` 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Verify portal access token
exports.verifyToken = async (req, res) => {
    try {
        const { token } = req.body;
        const clientPortal = await ClientPortal.findOne({ 'accessToken.token': token });
        
        if (!clientPortal || !clientPortal.isTokenValid(token)) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }

        clientPortal.lastLogin = new Date();
        await clientPortal.save();

        res.status(200).json({ 
            success: true, 
            data: { 
                clientId: clientPortal.client,
                accessToken: token
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get client portal dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const clientPortal = await ClientPortal.findOne({ client: req.params.clientId })
            .populate('assignedTeam.sales', 'name email phone')
            .populate('assignedTeam.designer', 'name email phone')
            .populate('activeProjects', 'name status overallProgress')
            .populate('activeMoodboards', 'name theme')
            .populate('activeEstimates', 'name status total')
            .populate('activeProposals', 'name status');

        if (!clientPortal) {
            return res.status(404).json({ success: false, message: 'Client portal not found' });
        }

        res.status(200).json({ success: true, data: clientPortal });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add comment to document
exports.addComment = async (req, res) => {
    try {
        const { documentId, content, section, sectionId } = req.body;
        const clientPortal = await ClientPortal.findOne({ client: req.params.clientId });
        
        if (!clientPortal) {
            return res.status(404).json({ success: false, message: 'Client portal not found' });
        }

        const document = clientPortal.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        document.comments.push({
            content,
            section,
            sectionId,
            createdBy: req.user.id
        });

        await clientPortal.save();

        // Notify team members
        if (clientPortal.assignedTeam.sales) {
            await sendEmail({
                to: clientPortal.assignedTeam.sales.email,
                subject: 'New Comment on Client Portal',
                text: `New comment from client on ${document.title}: ${content}`
            });
        }

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update document status (approve/reject)
exports.updateDocumentStatus = async (req, res) => {
    try {
        const { documentId, status } = req.body;
        const clientPortal = await ClientPortal.findOne({ client: req.params.clientId });
        
        if (!clientPortal) {
            return res.status(404).json({ success: false, message: 'Client portal not found' });
        }

        const document = clientPortal.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        document.status = status;
        await clientPortal.save();

        // Notify team members
        if (clientPortal.assignedTeam.sales) {
            await sendEmail({
                to: clientPortal.assignedTeam.sales.email,
                subject: 'Document Status Updated',
                text: `Document ${document.title} has been ${status} by the client`
            });
        }

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
    try {
        const { notificationMethod, whatsappNumber } = req.body;
        const clientPortal = await ClientPortal.findOne({ client: req.params.clientId });
        
        if (!clientPortal) {
            return res.status(404).json({ success: false, message: 'Client portal not found' });
        }

        clientPortal.preferences = {
            notificationMethod,
            whatsappNumber
        };

        await clientPortal.save();
        res.status(200).json({ success: true, data: clientPortal.preferences });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get project updates
exports.getProjectUpdates = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId)
            .populate('zones.logs.createdBy', 'name role')
            .populate('zones.tasks.assignedTo', 'name role');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Get recent updates
        const updates = project.zones.reduce((acc, zone) => {
            const zoneUpdates = zone.logs.map(log => ({
                zone: zone.name,
                content: log.notes,
                photos: log.photos,
                timestamp: log.createdAt,
                createdBy: log.createdBy
            }));
            return [...acc, ...zoneUpdates];
        }, []);

        // Sort by timestamp and get last 3
        const recentUpdates = updates
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 3);

        res.status(200).json({ success: true, data: recentUpdates });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Test WhatsApp message
exports.testWhatsApp = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and message are required' 
            });
        }

        // Format phone number to include country code if not present
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

        const result = await sendWhatsApp({
            to: formattedPhone,
            message: message
        });

        res.status(200).json({ 
            success: true, 
            message: 'WhatsApp message sent successfully',
            data: result
        });
    } catch (error) {
        console.error('WhatsApp test error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send WhatsApp message',
            error: error.message
        });
    }
}; 