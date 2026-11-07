const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyUserToken } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private (User only)
 */
router.get('/', verifyUserToken, async (req, res) => {
    try {
        const { is_read, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const params = [req.user.id];

        if (is_read !== undefined) {
            query += ` AND is_read = $${params.length + 1}`;
            params.push(is_read === 'true');
        }

        query += ` ORDER BY sent_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        res.json({
            success: true,
            notifications: result.rows,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
        });
    }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private (User only)
 */
router.get('/unread-count', verifyUserToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({
            success: true,
            count: parseInt(result.rows[0].count),
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
        });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (User only)
 */
router.put('/:id/read', verifyUserToken, async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.json({
            success: true,
            notification: result.rows[0],
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
        });
    }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private (User only)
 */
router.put('/mark-all-read', verifyUserToken, async (req, res) => {
    try {
        await db.query(
            `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
        });
    }
});

module.exports = router;
