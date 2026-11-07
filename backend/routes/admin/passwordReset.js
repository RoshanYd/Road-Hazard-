const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../../config/database');
const { hashPassword } = require('../../utils/hash');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/forgot-password
// Generates a secure 6-digit OTP valid for 15 minutes for admin accounts.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Always return 200 even if email not found (prevents email enumeration attacks)
        const adminResult = await db.query(
            'SELECT id, name, email FROM admins WHERE email = $1 AND is_active = true',
            [email.toLowerCase().trim()]
        );

        if (adminResult.rows.length === 0) {
            return res.json({
                success: true,
                message: 'If an admin account with that email exists, a reset OTP has been sent.',
            });
        }

        const admin = adminResult.rows[0];

        // Invalidate any existing unused tokens for this admin
        await db.query(
            'UPDATE password_reset_tokens SET used = true WHERE admin_id = $1 AND used = false',
            [admin.id]
        );

        // Generate a cryptographically secure 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.query(
            'INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES ($1, $2, $3)',
            [admin.id, otp, expiresAt]
        );

        // In production: send email with OTP
        console.log(`Admin password reset OTP for ${admin.email}: ${otp}`);

        return res.json({
            success: true,
            message: 'OTP sent successfully.',
            // Returning the OTP so the client can simulate receiving it for testing
            resetToken: otp,
            expiresIn: '15 minutes',
        });
    } catch (error) {
        console.error('Admin forgot password error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/verify-reset-token
// Check if an OTP is valid for a specific admin email
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const result = await db.query(
            `SELECT prt.id, prt.expires_at, a.email, a.name
             FROM password_reset_tokens prt
             JOIN admins a ON a.id = prt.admin_id
             WHERE prt.token = $1 AND a.email = $2 AND prt.used = false`,
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
        console.error('Admin verify reset token error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/reset-password
// Consumes the OTP and sets the new password for admin
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
            `SELECT prt.id, prt.admin_id, prt.expires_at
             FROM password_reset_tokens prt
             JOIN admins a ON a.id = prt.admin_id
             WHERE prt.token = $1 AND a.email = $2 AND prt.used = false`,
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
                'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [passwordHash, row.admin_id]
            );
            await client.query(
                'UPDATE password_reset_tokens SET used = true WHERE id = $1',
                [row.id]
            );
            // Revoke all active refresh tokens for this admin
            await client.query(
                'UPDATE refresh_tokens SET revoked = true WHERE admin_id = $1 AND revoked = false',
                [row.admin_id]
            );
        });

        return res.json({
            success: true,
            message: 'Password reset successfully. Please login with your new password.',
        });
    } catch (error) {
        console.error('Admin reset password error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

module.exports = router;
