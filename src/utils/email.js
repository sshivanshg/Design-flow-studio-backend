const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise} - Nodemailer send result
 */
exports.sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || 'DesignFlow Studio <noreply@designflowstudio.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Send a template email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @returns {Promise} - Nodemailer send result
 */
exports.sendTemplateEmail = async (options) => {
    try {
        // TODO: Implement email template rendering
        // For now, just send plain text
        return await exports.sendEmail({
            to: options.to,
            subject: options.subject,
            text: JSON.stringify(options.data)
        });
    } catch (error) {
        console.error('Error sending template email:', error);
        throw error;
    }
}; 