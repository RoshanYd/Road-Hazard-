const morgan = require('morgan');
const db = require('../config/database');

/**
 * HTTP request logger using Morgan
 */
const httpLogger = morgan('combined', {
    skip: (req, res) => {
        // Skip logging for health checks
        return req.url === '/health';
    },
});

/**
 * Log admin actions to the audit log table
 * @param {Object} options - Logging options
 * @param {string} options.adminId - Admin UUID
 * @param {string} options.action - Action performed
 * @param {string} options.resourceType - Type of resource (e.g., 'report', 'user')
 * @param {string} options.resourceId - ID of the resource
 * @param {Object} options.details - Additional details (stored as JSONB)
 * @param {string} options.ipAddress - Client IP address
 * @param {string} options.userAgent - Client user agent
 */
const logAdminAction = async ({
    adminId,
    action,
    resourceType = null,
    resourceId = null,
    details = {},
    ipAddress = null,
    userAgent = null,
}) => {
    try {
        await db.query(
            `INSERT INTO admin_audit_logs 
       (admin_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [adminId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
        );
    } catch (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw - logging failure shouldn't break the request
    }
};

/**
 * Middleware to automatically log admin actions
 * Reads from req.admin and logs after response is sent
 */
const auditLogger = (action, resourceType = null) => {
    return (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function
        res.send = function (data) {
            // Only log successful operations (2xx status codes)
            if (req.admin && res.statusCode >= 200 && res.statusCode < 300) {
                const resourceId = req.params.id || req.body.id || null;
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('user-agent');

                logAdminAction({
                    adminId: req.admin.id,
                    action,
                    resourceType,
                    resourceId,
                    details: {
                        method: req.method,
                        path: req.path,
                        body: req.body,
                        params: req.params,
                        query: req.query,
                    },
                    ipAddress,
                    userAgent,
                }).catch(err => console.error('Audit log error:', err));
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    httpLogger,
    logAdminAction,
    auditLogger,
};
