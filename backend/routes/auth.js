const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateUserTokens } = require('../utils/jwt');
const { validate, userRegistrationSchema, loginSchema } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(userRegistrationSchema), async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Check if user already exists (email)
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists. Please sign in.',
            });
        }

        // Check if phone already registered
        if (phone) {
            const existingPhone = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
            if (existingPhone.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this phone number already exists.',
                });
            }
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate verification token
        const verificationToken = uuidv4();

        // Create user
        const result = await db.query(
            `INSERT INTO users (name, email, phone, password_hash, verification_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, created_at`,
            [name, email, phone || null, passwordHash, verificationToken]
        );

        const user = result.rows[0];

        // TODO: Send verification email
        // await sendEmail(email, 'Verify your email', `Your verification token: ${verificationToken}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await db.query(
            'SELECT id, name, email, phone, password_hash, status FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const user = result.rows[0];

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended',
            });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateUserTokens(user.id);

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
            [user.id, refreshToken, expiresAt]
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
        });
    }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
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

        // Verify refresh token exists and is not revoked
        const result = await db.query(
            `SELECT user_id, expires_at FROM refresh_tokens 
       WHERE token = $1 AND revoked = false`,
            [refreshToken]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        const tokenData = result.rows[0];

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired',
            });
        }

        // Generate new access token
        const { accessToken } = generateUserTokens(tokenData.user_id);

        res.json({
            success: true,
            accessToken,
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
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
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
        });
    }
});

module.exports = router;
