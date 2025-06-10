const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    section: { type: String, required: true }, // e.g., 'proposal', 'estimate', 'moodboard', 'project'
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['proposal', 'estimate', 'moodboard', 'project_update', 'other'],
        required: true
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    comments: [commentSchema],
    uploadedAt: { type: Date, default: Date.now }
});

const clientPortalSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    accessToken: {
        token: String,
        expiresAt: Date
    },
    assignedTeam: {
        sales: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        designer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    documents: [documentSchema],
    activeProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    activeMoodboards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Moodboard'
    }],
    activeEstimates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Estimate'
    }],
    activeProposals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
    }],
    preferences: {
        notificationMethod: {
            type: String,
            enum: ['email', 'whatsapp', 'both'],
            default: 'email'
        },
        whatsappNumber: String
    },
    lastLogin: Date,
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
clientPortalSchema.index({ client: 1 });
clientPortalSchema.index({ 'accessToken.token': 1 });
clientPortalSchema.index({ 'assignedTeam.sales': 1 });
clientPortalSchema.index({ 'assignedTeam.designer': 1 });

// Method to generate access token
clientPortalSchema.methods.generateAccessToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.accessToken = {
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    return token;
};

// Method to check if token is valid
clientPortalSchema.methods.isTokenValid = function(token) {
    return this.accessToken && 
           this.accessToken.token === token && 
           this.accessToken.expiresAt > new Date();
};

module.exports = mongoose.model('ClientPortal', clientPortalSchema); 