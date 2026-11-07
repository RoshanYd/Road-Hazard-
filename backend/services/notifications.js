const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require('../config/env');
const db = require('../config/database');

// Email transporter
let emailTransporter = null;
if (config.email.user && config.email.password) {
    emailTransporter = nodemailer.createTransport({
        service: config.email.service,
        auth: {
            user: config.email.user,
            pass: config.email.password,
        },
    });
}

// Twilio client
let twilioClient = null;
if (config.sms.accountSid && config.sms.authToken) {
    twilioClient = twilio(config.sms.accountSid, config.sms.authToken);
}

/**
 * Send email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 */
const sendEmail = async (to, subject, html) => {
    if (!emailTransporter) {
        console.warn('Email service not configured. Skipping email to:', to);
        return;
    }

    try {
        const info = await emailTransporter.sendMail({
            from: config.email.from,
            to,
            subject,
            html,
        });
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email notification');
    }
};

/**
 * Send SMS notification
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message text
 */
const sendSMS = async (to, message) => {
    if (!twilioClient) {
        console.warn('SMS service not configured. Skipping SMS to:', to);
        return;
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: config.sms.phoneNumber,
            to,
        });
        console.log('SMS sent:', result.sid);
        return result;
    } catch (error) {
        console.error('Failed to send SMS:', error);
        throw new Error('Failed to send SMS notification');
    }
};

/**
 * Create in-app notification in database
 * @param {string} userId - User UUID
 * @param {string} reportId - Report UUID (optional)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('email', 'sms', 'in_app')
 */
const createNotification = async (userId, title, message, reportId = null, type = 'in_app') => {
    try {
        const result = await db.query(
            `INSERT INTO notifications (user_id, report_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [userId, reportId, title, message, type]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Failed to create notification:', error);
        throw new Error('Failed to create notification');
    }
};

/**
 * Send complete notification (email + SMS + in-app)
 * @param {Object} options - Notification options
 */
const notifyUser = async ({
    userId,
    reportId = null,
    title,
    message,
    email = null,
    phone = null,
    sendEmailNotification = true,
    sendSMSNotification = false,
}) => {
    try {
        // Create in-app notification
        await createNotification(userId, title, message, reportId, 'in_app');

        // Send email
        if (sendEmailNotification && email) {
            const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${title}</h2>
          <p>${message}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification from the Road Hazard Reporting Platform.
            Please do not reply to this email.
          </p>
        </div>
      `;

            await sendEmail(email, title, emailHtml);
            await createNotification(userId, title, message, reportId, 'email');
        }

        // Send SMS
        if (sendSMSNotification && phone) {
            const smsText = `${title}: ${message}`;
            await sendSMS(phone, smsText);
            await createNotification(userId, title, message, reportId, 'sms');
        }

        return { success: true };
    } catch (error) {
        console.error('Notification error:', error);
        // Don't throw - partial notification success is acceptable
        return { success: false, error: error.message };
    }
};

/**
 * Send report status update notification
 * @param {Object} report - Report object
 * @param {string} newStatus - New status
 * @param {string} adminComment - Admin comment (optional)
 */
const notifyReportStatusChange = async (report, newStatus, adminComment = '') => {
    const statusMessages = {
        under_review: 'Your report is now under review by our team.',
        in_progress: 'Work has started on resolving your reported issue.',
        resolved: 'Your reported issue has been resolved. Thank you for helping improve road safety!',
        rejected: 'Your report has been reviewed and marked as not applicable.',
    };

    const message = statusMessages[newStatus] || 'Your report status has been updated.';
    const fullMessage = adminComment ? `${message}\n\nAdmin notes: ${adminComment}` : message;

    // Get user details
    const userResult = await db.query(
        'SELECT email, phone FROM users WHERE id = $1',
        [report.user_id]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];

    await notifyUser({
        userId: report.user_id,
        reportId: report.id,
        title: `Report Status Updated: ${newStatus.replace('_', ' ').toUpperCase()}`,
        message: fullMessage,
        email: user.email,
        phone: user.phone,
        sendEmailNotification: true,
        sendSMSNotification: newStatus === 'resolved', // Only send SMS for resolved
    });
};

module.exports = {
    sendEmail,
    sendSMS,
    createNotification,
    notifyUser,
    notifyReportStatusChange,
};
