const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate JWT access and refresh tokens for a user
 * @param {string} userId - User UUID
 * @returns {Object} - { accessToken, refreshToken }
 */
const generateUserTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId, type: 'user' },
        config.jwt.userSecret,
        { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
        { userId, type: 'user', jti: uuidv4() },
        config.jwt.userSecret,
        { expiresIn: config.jwt.refreshExpiry }
    );

    return { accessToken, refreshToken };
};

/**
 * Generate JWT access and refresh tokens for an admin
 * @param {string} adminId - Admin UUID
 * @param {string} role - Admin role
 * @returns {Object} - { accessToken, refreshToken }
 */
const generateAdminTokens = (adminId, role) => {
    const accessToken = jwt.sign(
        { adminId, role, type: 'admin' },
        config.jwt.adminSecret,
        { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
        { adminId, role, type: 'admin', jti: uuidv4() },
        config.jwt.adminSecret,
        { expiresIn: config.jwt.refreshExpiry }
    );

    return { accessToken, refreshToken };
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @param {string} type - 'user' or 'admin'
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token, type = 'user') => {
    try {
        const secret = type === 'admin' ? config.jwt.adminSecret : config.jwt.userSecret;
        const decoded = jwt.verify(token, secret);

        // Verify token type matches
        if (decoded.type !== type) {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
const extractToken = (authHeader) => {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
    }

    return null;
};

module.exports = {
    generateUserTokens,
    generateAdminTokens,
    verifyToken,
    extractToken,
};
