const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateAdminTokens } = require('../../utils/jwt');
const { validate, loginSchema } = require('../../utils/validation');

/**
 * @route   POST /api/admin/login
 * @desc    Admin login (separate from user login)
 * @access  Public
 */
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalized = (email || '').trim().toLowerCase();
        const altEmail = normalized === 'admin.gov.in' ? 'admin@gov.in' : (normalized === 'admin@gov.in' ? 'admin.gov.in' : normalized);

        // Find admin
        const result = await db.query(
            `SELECT id, name, email, password_hash, role, department, permissions, is_active 
             FROM admins WHERE LOWER(email) = $1 OR LOWER(email) = $2`,
            [normalized, altEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const admin = result.rows[0];

        // Check if admin is active
        if (!admin.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated',
            });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateAdminTokens(admin.id, admin.role);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.query(
            `INSERT INTO refresh_tokens (admin_id, token, expires_at)
       VALUES ($1, $2, $3)`,
            [admin.id, refreshToken, expiresAt]
        );

        // Update last login
        await db.query(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [admin.id]
        );

        res.json({
            success: true,
            message: 'Login successful',
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                department: admin.department,
                permissions: admin.permissions,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
        });
    }
});

/**
 * @route   POST /api/admin/refresh
 * @desc    Refresh admin access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required',
            });
        }

        // Verify refresh token
        const result = await db.query(
            `SELECT admin_id, expires_at FROM refresh_tokens 
       WHERE token = $1 AND revoked = false AND admin_id IS NOT NULL`,
            [refreshToken]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        const tokenData = result.rows[0];

        // Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired',
            });
        }

        // Get admin role
        const adminResult = await db.query(
            'SELECT role FROM admins WHERE id = $1',
            [tokenData.admin_id]
        );

        const { accessToken } = generateAdminTokens(tokenData.admin_id, adminResult.rows[0].role);

        res.json({
            success: true,
            accessToken,
        });
    } catch (error) {
        console.error('Admin token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
        });
    }
});

/**
 * @route   POST /api/admin/logout
 * @desc    Logout admin
 * @access  Public
 */
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await db.query(
                'UPDATE refresh_tokens SET revoked = true, revoked_at = CURRENT_TIMESTAMP WHERE token = $1',
                [refreshToken]
            );
        }

        res.json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
        });
    }
});

module.exports = router;
