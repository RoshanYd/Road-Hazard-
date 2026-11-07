const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { verifyAdminToken, requireAdmin } = require('../../middleware/auth');

/**
 * @route   GET /api/admin/audit
 * @desc    Get audit logs
 * @access  Private (Admin only)
 */
router.get('/', verifyAdminToken, requireAdmin, async (req, res) => {
    try {
        const { admin_id, action, resource_type, start_date, end_date, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT al.*, a.name as admin_name, a.email as admin_email, a.role as admin_role
      FROM admin_audit_logs al
      JOIN admins a ON al.admin_id = a.id
      WHERE 1=1
    `;
        const params = [];

        if (admin_id) {
            params.push(admin_id);
            query += ` AND al.admin_id = $${params.length}`;
        }

        if (action) {
            params.push(action);
            query += ` AND al.action = $${params.length}`;
        }

        if (resource_type) {
            params.push(resource_type);
            query += ` AND al.resource_type = $${params.length}`;
        }

        if (start_date) {
            params.push(start_date);
            query += ` AND al.created_at >= $${params.length}`;
        }

        if (end_date) {
            params.push(end_date);
            query += ` AND al.created_at <= $${params.length}`;
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        res.json({
            success: true,
            auditLogs: result.rows,
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
        });
    }
});

module.exports = router;
