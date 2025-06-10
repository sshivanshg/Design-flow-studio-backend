const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Proposal title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
        default: 'draft'
    },
    validUntil: Date,
    items: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        quantity: {
            type: Number,
            default: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        category: {
            type: String,
            enum: ['labor', 'materials', 'furniture', 'lighting', 'other'],
            default: 'materials'
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        rate: {
            type: Number,
            default: 0
        },
        amount: {
            type: Number,
            default: 0
        }
    },
    total: {
        type: Number,
        required: true
    },
    terms: {
        paymentSchedule: [{
            percentage: Number,
            dueDate: Date,
            amount: Number
        }],
        conditions: [String]
    },
    clientFeedback: {
        content: String,
        createdAt: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Proposal', proposalSchema); 