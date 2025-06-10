const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Delayed', 'Done'],
        default: 'Not Started'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
        enum: ['design', 'site_marking', 'furniture', 'finishing'],
        required: true
    },
    completedAt: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const logSchema = new mongoose.Schema({
    photos: [{
        url: { type: String, required: true },
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Dining Room', 'Balcony', 'Other']
    },
    description: String,
    tasks: [taskSchema],
    logs: [logSchema],
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    status: {
        type: String,
        enum: ['planning', 'in_progress', 'on_hold', 'completed'],
        default: 'planning'
    },
    startDate: Date,
    endDate: Date,
    zones: [zoneSchema],
    overallProgress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    lastWeeklyReport: {
        generatedAt: Date,
        pdfUrl: String
    },
    lastClientUpdate: {
        timestamp: Date,
        content: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
projectSchema.index({ client: 1 });
projectSchema.index({ lead: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'zones.tasks.status': 1 });
projectSchema.index({ 'zones.tasks.dueDate': 1 });

// Method to calculate overall progress
projectSchema.methods.calculateProgress = function() {
    if (this.zones.length === 0) return 0;
    
    const totalProgress = this.zones.reduce((sum, zone) => {
        if (zone.tasks.length === 0) return sum;
        
        const zoneProgress = zone.tasks.reduce((taskSum, task) => {
            switch(task.status) {
                case 'Done': return taskSum + 1;
                case 'In Progress': return taskSum + 0.5;
                case 'Delayed': return taskSum + 0.25;
                default: return taskSum;
            }
        }, 0) / zone.tasks.length;
        
        return sum + zoneProgress;
    }, 0);
    
    return Math.round((totalProgress / this.zones.length) * 100);
};

// Pre-save middleware to update overall progress
projectSchema.pre('save', function(next) {
    this.overallProgress = this.calculateProgress();
    next();
});

module.exports = mongoose.model('Project', projectSchema); 