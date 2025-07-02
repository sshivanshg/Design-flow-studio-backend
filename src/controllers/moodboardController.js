const Moodboard = require('../models/Moodboard');
const { OpenAI } = require('openai');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create a new moodboard
exports.createMoodboard = async (req, res) => {
    try {
        const { client, project, name, description, theme, sections } = req.body;
        const moodboard = new Moodboard({
            client,
            project,
            name,
            description,
            theme,
            sections,
            createdBy: req.user.id,
            lastUpdatedBy: req.user.id
        });
        await moodboard.save();
        res.status(201).json({ success: true, data: moodboard });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Upload image to a section
exports.uploadImage = async (req, res) => {
    try {
        const { moodboardId, sectionName, imageUrl, caption } = req.body;
        const moodboard = await Moodboard.findById(moodboardId);
        if (!moodboard) {
            return res.status(404).json({ success: false, message: 'Moodboard not found' });
        }
        const section = moodboard.sections.find(s => s.name === sectionName);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }
        section.images.push({
            url: imageUrl,
            caption,
            uploadedBy: req.user.id
        });
        moodboard.lastUpdatedBy = req.user.id;
        await moodboard.save();
        res.status(200).json({ success: true, data: moodboard });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add note to a section
exports.addNote = async (req, res) => {
    try {
        const { moodboardId, sectionName, content } = req.body;
        const moodboard = await Moodboard.findById(moodboardId);
        if (!moodboard) {
            return res.status(404).json({ success: false, message: 'Moodboard not found' });
        }
        const section = moodboard.sections.find(s => s.name === sectionName);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }
        section.notes.push({
            content,
            createdBy: req.user.id
        });
        moodboard.lastUpdatedBy = req.user.id;
        await moodboard.save();
        res.status(200).json({ success: true, data: moodboard });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Fetch preloaded moodboard packs
exports.getPreloadedPacks = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { isPreloaded: true };
        if (category) {
            query.preloadedCategory = category;
        }
        const packs = await Moodboard.find(query);
        res.status(200).json({ success: true, data: packs });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Generate AI-based moodboard suggestion
exports.generateAISuggestion = async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
        });
        res.status(200).json({ success: true, data: response.choices[0].message.content });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Export moodboard to PDF
exports.exportToPDF = async (req, res) => {
    try {
        const { moodboardId } = req.params;
        const moodboard = await Moodboard.findById(moodboardId);
        if (!moodboard) {
            return res.status(404).json({ success: false, message: 'Moodboard not found' });
        }
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, '../temp', `${moodboardId}.pdf`);
        doc.pipe(fs.createWriteStream(pdfPath));
        doc.text(`Moodboard: ${moodboard.name}`, { align: 'center' });
        doc.text(`Description: ${moodboard.description}`, { align: 'center' });
        moodboard.sections.forEach(section => {
            doc.text(`Section: ${section.name}`, { align: 'left' });
            section.images.forEach(image => {
                doc.text(`Image: ${image.url}`, { align: 'left' });
                doc.text(`Caption: ${image.caption}`, { align: 'left' });
            });
            section.notes.forEach(note => {
                doc.text(`Note: ${note.content}`, { align: 'left' });
            });
        });
        doc.end();
        moodboard.pdfUrl = pdfPath;
        await moodboard.save();
        res.status(200).json({ success: true, data: { pdfUrl: pdfPath } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Generate sharable link
exports.generateSharableLink = async (req, res) => {
    try {
        const { moodboardId } = req.params;
        const moodboard = await Moodboard.findById(moodboardId);
        if (!moodboard) {
            return res.status(404).json({ success: false, message: 'Moodboard not found' });
        }
        const sharedLink = `http://localhost:3000/moodboard/${moodboardId}`;
        moodboard.sharedLink = sharedLink;
        await moodboard.save();
        res.status(200).json({ success: true, data: { sharedLink } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}; 