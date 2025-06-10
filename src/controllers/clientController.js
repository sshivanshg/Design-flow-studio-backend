const Client = require('../models/Client');

// Create a new client
exports.createClient = async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            createdBy: req.user.id // Assuming user is authenticated and available in req.user
        };

        const client = await Client.create(clientData);
        res.status(201).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all clients
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find({ createdBy: req.user.id })
            .populate('projects', 'name status')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: clients.length,
            data: clients
        });
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single client
exports.getClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('projects')
            .populate('notes.createdBy', 'name email');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check if client belongs to the user
        if (client.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this client'
            });
        }

        res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update client
exports.updateClient = async (req, res) => {
    try {
        let client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check if client belongs to the user
        if (client.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this client'
            });
        }

        client = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check if client belongs to the user
        if (client.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this client'
            });
        }

        await client.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add note to client
exports.addNote = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Check if client belongs to the user
        if (client.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add notes to this client'
            });
        }

        client.notes.push({
            content: req.body.content,
            createdBy: req.user.id
        });

        await client.save();

        res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 