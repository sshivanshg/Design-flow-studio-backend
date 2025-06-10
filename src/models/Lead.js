const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    source: {
        type: String,
        required: [true, 'Please specify the lead source'],
        enum: ['website', 'referral', 'social', 'walk-in', 'other']
    },
    projectTag: {
        type: String,
        required: [true, 'Please add a project tag'],
        trim: true
    },
    stage: {
        type: String,
        enum: ['new', 'contacted', 'visited', 'quoted', 'closed'],
        default: 'new'
    },
    followUpDate: {
        type: Date
    },
    notes: [{
        content: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
leadSchema.index({ stage: 1 });
leadSchema.index({ projectTag: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ followUpDate: 1 });
leadSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Lead', leadSchema); 