const { verifyToken, extractToken } = require('../utils/jwt');
const db = require('../config/database');

/**
 * Middleware to verify user JWT token
 */
const verifyUserToken = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided',
            });
        }

        const decoded = verifyToken(token, 'user');

        // Verify user exists and is active
        const result = await db.query(
            'SELECT id, name, email, status FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        const user = result.rows[0];

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'User account is suspended',
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token',
        });
    }
};

/**
 * Middleware to verify admin JWT token
 */
const verifyAdminToken = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided',
            });
        }

        const decoded = verifyToken(token, 'admin');

        // Verify admin exists and is active
        const result = await db.query(
            'SELECT id, name, email, role, department, permissions, is_active FROM admins WHERE id = $1',
            [decoded.adminId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found',
            });
        }

        const admin = result.rows[0];

        if (!admin.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Admin account is deactivated',
            });
        }

        // Attach admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token',
        });
    }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.admin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
    }
    next();
};

/**
 * Middleware to check specific admin permission
 * @param {string} permission - Permission to check
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        // Super admins have all permissions
        if (req.admin.role === 'super_admin') {
            return next();
        }

        // Check permission in JSONB permissions column
        const permissions = req.admin.permissions;
        if (!permissions[permission]) {
            return res.status(403).json({
                success: false,
                message: `Permission denied: ${permission} required`,
            });
        }

        next();
    };
};

/**
 * Optional authentication - attach user if token is present, but don't require it
 */
const optionalAuth = async (req, res, next) => {
    const token = extractToken(req.headers.authorization);

    if (!token) {
        return next();
    }

    try {
        const decoded = verifyToken(token, 'user');
        const result = await db.query(
            'SELECT id, name, email, status FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length > 0 && result.rows[0].status === 'active') {
            req.user = result.rows[0];
        }
    } catch (error) {
        // Ignore errors for optional auth
    }

    next();
};

module.exports = {
    verifyUserToken,
    verifyAdminToken,
    requireAdmin,
    requirePermission,
    optionalAuth,
};
