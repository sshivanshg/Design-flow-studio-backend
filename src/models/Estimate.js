const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: function() { return !this.isTemplate; }
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['draft', 'sent', 'approved', 'rejected'],
        default: 'draft'
    },
    // Project Details
    projectDetails: {
        sqft: {
            type: Number,
            required: true
        },
        layoutType: {
            type: String,
            required: true,
            enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Commercial']
        },
        rooms: [{
            type: {
                type: String,
                required: true,
                enum: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Study', 'Balcony', 'Other']
            },
            count: {
                type: Number,
                required: true,
                default: 1
            }
        }],
        materialLevel: {
            type: String,
            required: true,
            enum: ['Basic', 'Standard', 'Premium', 'Luxury']
        }
    },
    // Costing
    costing: {
        baseCost: {
            type: Number,
            required: true
        },
        gst: {
            rate: {
                type: Number,
                default: 18
            },
            amount: {
                type: Number,
                required: true
            }
        },
        total: {
            type: Number,
            required: true
        },
        // Payment Milestones
        milestones: [{
            name: {
                type: String,
                required: true
            },
            percentage: {
                type: Number,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            dueDate: Date
        }]
    },
    // Material Specifications
    specifications: [{
        category: {
            type: String,
            required: true
        },
        items: [{
            name: {
                type: String,
                required: true
            },
            description: String,
            quantity: {
                type: Number,
                required: true
            },
            unit: {
                type: String,
                required: true
            },
            rate: {
                type: Number,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        }]
    }],
    // AI Generated Content
    aiSuggestions: {
        designTips: [String],
        materialRecommendations: [String],
        costOptimizations: [String]
    },
    // Template
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateName: String,
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientFeedback: {
        content: String,
        createdAt: Date
    }
}, {
    timestamps: true
});

// Indexes for better query performance
estimateSchema.index({ lead: 1, status: 1 });
estimateSchema.index({ isTemplate: 1 });
estimateSchema.index({ 'projectDetails.layoutType': 1, 'projectDetails.materialLevel': 1 });

module.exports = mongoose.model('Estimate', estimateSchema); 