const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    images: [{
        url: { type: String, required: true },
        caption: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    notes: [{
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }]
});

const moodboardSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Moodboard name is required'],
        trim: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    sections: [sectionSchema], // e.g. Color Palette, Furniture, Decor, Textures, Lighting, Theme Inspiration
    theme: { type: String }, // e.g. Modern, Boho, Minimalist
    aiSuggestion: {
        prompt: String,
        result: mongoose.Schema.Types.Mixed // Store GPT result (JSON or text)
    },
    isPreloaded: { type: Boolean, default: false },
    preloadedCategory: String, // e.g. "Modern", "Classic", etc.
    colors: [{
        hex: String,
        name: String
    }],
    materials: [{
        name: String,
        description: String,
        imageUrl: String
    }],
    status: {
        type: String,
        enum: ['draft', 'shared', 'approved', 'rejected'],
        default: 'draft'
    },
    feedback: [{
        content: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
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
    sharedLink: String, // For sharable/preview links
    pdfUrl: String, // For exported PDF
}, {
    timestamps: true
});

// Index for client linkage and preloaded packs
moodboardSchema.index({ client: 1 });
moodboardSchema.index({ isPreloaded: 1, preloadedCategory: 1 });

module.exports = mongoose.model('Moodboard', moodboardSchema); 