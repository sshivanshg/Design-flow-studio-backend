const Project = require('../models/Project');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { name, client, lead, startDate, endDate, zones } = req.body;
        const project = new Project({
            name,
            client,
            lead,
            startDate,
            endDate,
            zones,
            createdBy: req.user.id,
            lastUpdatedBy: req.user.id
        });
        await project.save();
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('client', 'name email phone')
            .populate('lead', 'name phone')
            .sort('-createdAt');
        
        res.status(200).json({ 
            success: true, 
            count: projects.length,
            data: projects 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get project by ID
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email phone')
            .populate('lead', 'name phone')
            .populate('zones.tasks.assignedTo', 'name role')
            .populate('zones.logs.createdBy', 'name role');
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add zone to project
exports.addZone = async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        project.zones.push({ name, description });
        project.lastUpdatedBy = req.user.id;
        await project.save();
        
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add task to zone
exports.addTask = async (req, res) => {
    try {
        const { zoneName, title, description, dueDate, category, assignedTo } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        const zone = project.zones.find(z => z.name === zoneName);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }
        
        zone.tasks.push({
            title,
            description,
            dueDate,
            category,
            assignedTo,
            createdBy: req.user.id
        });
        
        project.lastUpdatedBy = req.user.id;
        await project.save();
        
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { zoneName, taskId, status } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        const zone = project.zones.find(z => z.name === zoneName);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }
        
        const task = zone.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        
        task.status = status;
        if (status === 'Done') {
            task.completedAt = new Date();
        }
        
        project.lastUpdatedBy = req.user.id;
        await project.save();
        
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add log to zone
exports.addLog = async (req, res) => {
    try {
        const { zoneName, photos, notes } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        const zone = project.zones.find(z => z.name === zoneName);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }
        
        zone.logs.push({
            photos,
            notes,
            createdBy: req.user.id
        });
        
        // Update last client update
        project.lastClientUpdate = {
            timestamp: new Date(),
            content: `New update in ${zoneName}: ${notes}`
        };
        
        project.lastUpdatedBy = req.user.id;
        await project.save();
        
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Generate weekly report
exports.generateWeeklyReport = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email')
            .populate('zones.tasks.assignedTo', 'name')
            .populate('zones.logs.createdBy', 'name');
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, '../temp', `weekly-report-${project._id}.pdf`);
        doc.pipe(fs.createWriteStream(pdfPath));
        
        // Add project details
        doc.fontSize(20).text(`Weekly Report: ${project.name}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Client: ${project.client.name}`);
        doc.text(`Progress: ${project.overallProgress}%`);
        doc.moveDown();
        
        // Add zone-wise progress
        project.zones.forEach(zone => {
            doc.fontSize(14).text(`Zone: ${zone.name}`);
            doc.fontSize(12).text(`Progress: ${zone.progress}%`);
            
            // Add tasks
            doc.text('Tasks:');
            zone.tasks.forEach(task => {
                doc.text(`- ${task.title}: ${task.status}`);
                if (task.assignedTo) {
                    doc.text(`  Assigned to: ${task.assignedTo.name}`);
                }
            });
            
            // Add recent logs
            doc.text('Recent Updates:');
            const recentLogs = zone.logs.slice(-3); // Last 3 logs
            recentLogs.forEach(log => {
                doc.text(`- ${log.notes} (${log.createdBy.name})`);
            });
            
            doc.moveDown();
        });
        
        doc.end();
        
        // Update project with report details
        project.lastWeeklyReport = {
            generatedAt: new Date(),
            pdfUrl: pdfPath
        };
        await project.save();
        
        res.status(200).json({ 
            success: true, 
            data: { 
                message: 'Weekly report generated successfully',
                pdfUrl: pdfPath
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get recent updates for client portal
exports.getRecentUpdates = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('zones.logs.createdBy', 'name role');
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        // Collect last 3 updates across all zones
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