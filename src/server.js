const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const crmRoutes = require('./routes/crmRoutes');
const estimateRoutes = require('./routes/estimateRoutes');
const projectRoutes = require('./routes/projectRoutes');
const clientPortalRoutes = require('./routes/clientPortalRoutes');
const moodboardRoutes = require('./routes/moodboardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Debug: Log environment variables (remove in production)
console.log('Environment Variables:', {
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    FRONTEND_URL: process.env.FRONTEND_URL,
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/client-portal', clientPortalRoutes);
app.use('/api/moodboards', moodboardRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!'
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }); 