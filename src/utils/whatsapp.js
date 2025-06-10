const axios = require('axios');

// Initialize Interakt client
const interaktClient = axios.create({
    baseURL: 'https://api.interakt.ai',
    headers: {
        'Authorization': `Bearer ${process.env.INTERAKT_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Send a WhatsApp message using Interakt
 * @param {Object} options - Message options
 * @param {string} options.to - Recipient phone number (with country code)
 * @param {string} options.message - Message content
 * @returns {Promise} - Interakt API response
 */
exports.sendWhatsApp = async (options) => {
    try {
        const response = await interaktClient.post('/v1/public/message', {
            phoneNumber: options.to,
            body: options.message,
            type: 'text'
        });

        console.log('WhatsApp message sent via Interakt:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message via Interakt:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Send a template WhatsApp message using Interakt
 * @param {Object} options - Message options
 * @param {string} options.to - Recipient phone number (with country code)
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @returns {Promise} - Interakt API response
 */
exports.sendTemplateWhatsApp = async (options) => {
    try {
        const response = await interaktClient.post('/v1/public/template/message', {
            phoneNumber: options.to,
            templateName: options.template,
            templateData: options.data
        });

        console.log('Template WhatsApp message sent via Interakt:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending template WhatsApp message via Interakt:', error.response?.data || error.message);
        throw error;
    }
}; 