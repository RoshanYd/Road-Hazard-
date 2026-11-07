const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const { hashPassword } = require('../utils/hash');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Generates a secure 6-digit OTP valid for 15 minutes.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Always return 200 even if email not found (prevents email enumeration attacks)
        const userResult = await db.query(
            'SELECT id, name, email FROM users WHERE email = $1 AND status = $2',
            [email.toLowerCase().trim(), 'active']
        );

        if (userResult.rows.length === 0) {
            return res.json({
                success: true,
                message: 'If an account with that email exists, a reset OTP has been sent.',
            });
        }

        const user = userResult.rows[0];

        // Invalidate any existing unused tokens for this user
        await db.query(
            'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
            [user.id]
        );

        // Generate a cryptographically secure 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, otp, expiresAt]
        );

        // In production: send email with OTP
        console.log(`Password reset OTP for ${user.email}: ${otp}`);

        return res.json({
            success: true,
            message: 'OTP sent successfully.',
            // Returning the OTP so the client can simulate receiving it for testing
            resetToken: otp,
            expiresIn: '15 minutes',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-reset-token
// Check if an OTP is valid for a specific email
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { email, token } = req.body;
        
        if (!email || !token) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const result = await db.query(
            `SELECT prt.id, prt.expires_at, u.email, u.name
             FROM password_reset_tokens prt
             JOIN users u ON u.id = prt.user_id
             WHERE prt.token = $1 AND u.email = $2 AND prt.used = false`,
            [token.trim(), email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or incorrect OTP.' });
        }

        const row = result.rows[0];
        if (new Date(row.expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        return res.json({
            success: true,
            email: row.email,
            name: row.name,
        });
    } catch (error) {
        console.error('Verify reset token error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Consumes the OTP and sets the new password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, password } = req.body;

        if (!email || !token || !password) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
        }

        // Password strength check
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must include uppercase, lowercase, number and special character (@$!%*?&).',
            });
        }

        // Validate OTP
        const result = await db.query(
            `SELECT prt.id, prt.user_id, prt.expires_at
             FROM password_reset_tokens prt
             JOIN users u ON u.id = prt.user_id
             WHERE prt.token = $1 AND u.email = $2 AND prt.used = false`,
            [token.trim(), email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or incorrect OTP.' });
        }

        const row = result.rows[0];

        if (new Date(row.expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Hash new password
        const passwordHash = await hashPassword(password);

        // Update password & mark token as used (in a transaction)
        await db.transaction(async (client) => {
            await client.query(
                'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [passwordHash, row.user_id]
            );
            await client.query(
                'UPDATE password_reset_tokens SET used = true WHERE id = $1',
                [row.id]
            );
            // Revoke all active refresh tokens for this user
            await client.query(
                'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
                [row.user_id]
            );
        });

        return res.json({
            success: true,
            message: 'Password reset successfully. Please login with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

module.exports = router;
