const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    appId: process.env.VITE_FIREBASE_APP_ID
};

admin.initializeApp(firebaseConfig);

// Export both admin and config
module.exports = {
    admin,
    firebaseConfig
}; 