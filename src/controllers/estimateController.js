const Estimate = require('../models/Estimate');
const Lead = require('../models/Lead');
const OpenAI = require('openai');
const PDFDocument = require('pdfkit');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Base rates per sqft for different material levels
const BASE_RATES = {
    Basic: 1200,
    Standard: 1800,
    Premium: 2500,
    Luxury: 3500
};

// Room-wise multipliers
const ROOM_MULTIPLIERS = {
    'Living Room': 1.2,
    'Bedroom': 1.0,
    'Kitchen': 1.5,
    'Bathroom': 1.3,
    'Dining Room': 1.1,
    'Study': 1.0,
    'Balcony': 0.8,
    'Other': 1.0
};

// Generate AI suggestions
const generateAISuggestions = async (projectDetails) => {
    try {
        const prompt = `Given the following interior design project details:
        - Layout: ${projectDetails.layoutType}
        - Material Level: ${projectDetails.materialLevel}
        - Total Area: ${projectDetails.sqft} sqft
        - Rooms: ${projectDetails.rooms.map(r => `${r.count} ${r.type}`).join(', ')}

        Please provide:
        1. 3 design tips specific to this layout and material level
        2. 3 material recommendations that would work well
        3. 2 cost optimization suggestions

        Format the response as JSON with keys: designTips, materialRecommendations, costOptimizations`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('AI suggestion generation error:', error);
        return {
            designTips: [],
            materialRecommendations: [],
            costOptimizations: []
        };
    }
};

// Calculate estimate costs
const calculateCosts = (projectDetails) => {
    const baseRate = BASE_RATES[projectDetails.materialLevel];
    let totalBaseCost = 0;

    // Calculate room-wise costs
    projectDetails.rooms.forEach(room => {
        const roomArea = projectDetails.sqft * (room.count / projectDetails.rooms.reduce((sum, r) => sum + r.count, 0));
        const roomCost = roomArea * baseRate * ROOM_MULTIPLIERS[room.type];
        totalBaseCost += roomCost;
    });

    // Calculate GST
    const gstAmount = totalBaseCost * 0.18;
    const totalCost = totalBaseCost + gstAmount;

    // Calculate milestones (40-40-20)
    const milestones = [
        {
            name: 'Initial Payment',
            percentage: 40,
            amount: totalCost * 0.4
        },
        {
            name: 'Mid-Project Payment',
            percentage: 40,
            amount: totalCost * 0.4
        },
        {
            name: 'Final Payment',
            percentage: 20,
            amount: totalCost * 0.2
        }
    ];

    return {
        baseCost: totalBaseCost,
        gst: {
            rate: 18,
            amount: gstAmount
        },
        total: totalCost,
        milestones
    };
};

// Create new estimate
exports.createEstimate = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { name, description, projectDetails } = req.body;

        // Verify lead exists
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Calculate costs
        const costing = calculateCosts(projectDetails);

        // Generate AI suggestions
        const aiSuggestions = await generateAISuggestions(projectDetails);

        // Create estimate
        const estimate = await Estimate.create({
            lead: leadId,
            name,
            description,
            projectDetails,
            costing,
            aiSuggestions,
            createdBy: req.user.id,
            lastUpdatedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: estimate
        });
    } catch (error) {
        console.error('Create estimate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get estimate by ID
exports.getEstimate = async (req, res) => {
    try {
        const { estimateId } = req.params;

        const estimate = await Estimate.findById(estimateId)
            .populate('lead', 'name phone email')
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email');

        if (!estimate) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: estimate
        });
    } catch (error) {
        console.error('Get estimate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get estimates for a lead
exports.getLeadEstimates = async (req, res) => {
    try {
        const { leadId } = req.params;

        const estimates = await Estimate.find({ lead: leadId })
            .populate('createdBy', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: estimates.length,
            data: estimates
        });
    } catch (error) {
        console.error('Get lead estimates error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update estimate
exports.updateEstimate = async (req, res) => {
    try {
        const { estimateId } = req.params;
        const updateData = {
            ...req.body,
            lastUpdatedBy: req.user.id
        };

        // If project details are updated, recalculate costs
        if (req.body.projectDetails) {
            updateData.costing = calculateCosts(req.body.projectDetails);
            updateData.aiSuggestions = await generateAISuggestions(req.body.projectDetails);
        }

        const estimate = await Estimate.findByIdAndUpdate(
            estimateId,
            updateData,
            { new: true, runValidators: true }
        ).populate('lead', 'name phone email')
         .populate('lastUpdatedBy', 'name email');

        if (!estimate) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: estimate
        });
    } catch (error) {
        console.error('Update estimate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Save as template
exports.saveAsTemplate = async (req, res) => {
    try {
        const { estimateId } = req.params;
        const { templateName } = req.body;

        const estimate = await Estimate.findById(estimateId);
        if (!estimate) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }

        // Create new estimate as template
        const templateData = estimate.toObject();
        delete templateData._id;
        delete templateData.lead;
        delete templateData.createdAt;
        delete templateData.updatedAt;
        delete templateData.__v;

        const template = await Estimate.create({
            ...templateData,
            name: templateName,
            isTemplate: true,
            templateName,
            createdBy: req.user.id,
            lastUpdatedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Save template error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate PDF
exports.generatePDF = async (req, res) => {
    try {
        const { estimateId } = req.params;

        const estimate = await Estimate.findById(estimateId)
            .populate('lead', 'name phone email')
            .populate('createdBy', 'name email');

        if (!estimate) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }

        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="estimate-${estimateId}.pdf"`);

        // Create PDF and pipe directly to response
        const doc = new PDFDocument();

        // Pipe PDF directly to response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(25).text('Interior Design Estimate', { align: 'center' });
        doc.moveDown();

        // Client Details
        doc.fontSize(16).text('Client Details');
        doc.fontSize(12).text(`Name: ${estimate.lead.name}`);
        doc.text(`Phone: ${estimate.lead.phone}`);
        doc.text(`Email: ${estimate.lead.email}`);
        doc.moveDown();

        // Project Details
        doc.fontSize(16).text('Project Details');
        doc.fontSize(12).text(`Layout Type: ${estimate.projectDetails.layoutType}`);
        doc.text(`Total Area: ${estimate.projectDetails.sqft} sqft`);
        doc.text(`Material Level: ${estimate.projectDetails.materialLevel}`);
        doc.moveDown();

        // Cost Breakdown
        doc.fontSize(16).text('Cost Breakdown');
        doc.fontSize(12).text(`Base Cost: ₹${estimate.costing.baseCost.toFixed(2)}`);
        doc.text(`GST (${estimate.costing.gst.rate}%): ₹${estimate.costing.gst.amount.toFixed(2)}`);
        doc.text(`Total: ₹${estimate.costing.total.toFixed(2)}`);
        doc.moveDown();

        // Payment Milestones
        doc.fontSize(16).text('Payment Milestones');
        estimate.costing.milestones.forEach(milestone => {
            doc.fontSize(12).text(`${milestone.name}: ₹${milestone.amount.toFixed(2)} (${milestone.percentage}%)`);
        });
        doc.moveDown();

        // AI Suggestions (only if they exist)
        if (estimate.aiSuggestions && estimate.aiSuggestions.designTips && estimate.aiSuggestions.designTips.length > 0) {
            doc.fontSize(16).text('Design Tips');
            estimate.aiSuggestions.designTips.forEach(tip => {
                doc.fontSize(12).text(`• ${tip}`);
            });
            doc.moveDown();
        }

        // Add company details
        doc.fontSize(16).text('Company Details');
        doc.fontSize(12).text('DesignFlow Studio');
        doc.text('Interior Design & Consultation');
        doc.text('Contact: +91-9876543210');
        doc.text('Email: info@designflowstudio.com');
        doc.moveDown();

        // Add terms and conditions
        doc.fontSize(14).text('Terms & Conditions');
        doc.fontSize(10).text('• This estimate is valid for 30 days');
        doc.text('• Payment schedule must be followed as per milestones');
        doc.text('• Any changes to scope will require a revised estimate');
        doc.text('• GST is applicable as per government regulations');

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 