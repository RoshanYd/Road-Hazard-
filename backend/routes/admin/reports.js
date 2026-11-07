const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { verifyAdminToken, requireAdmin, requirePermission } = require('../../middleware/auth');
const { validate, statusUpdateSchema, assignReportSchema, adminResponseSchema } = require('../../utils/validation');
const { auditLogger } = require('../../middleware/logger');
const { notifyReportStatusChange, notifyUser } = require('../../services/notifications');

/**
 * @route   GET /api/admin/reports
 * @desc    Get all reports with filtering
 * @access  Private (Admin only)
 */
router.get('/', verifyAdminToken, requireAdmin, async (req, res) => {
    try {
        const { status, severity, city, state, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
             it.name as issue_type_name, a.name as assigned_admin_name
      FROM reports r
      JOIN users u ON r.user_id = u.id
      JOIN issue_types it ON r.issue_type_id = it.id
      LEFT JOIN admins a ON r.assigned_to_admin = a.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND r.status = $${params.length}::report_status`;
        }

        if (severity) {
            params.push(severity);
            query += ` AND r.severity = $${params.length}::severity_level`;
        }

        if (city) {
            params.push(city);
            query += ` AND r.city ILIKE $${params.length}`;
        }

        if (state) {
            params.push(state);
            query += ` AND r.state ILIKE $${params.length}`;
        }

        query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM reports WHERE 1=1';
        const countParams = [];
        if (status) {
            countParams.push(status);
            countQuery += ` AND status = $${countParams.length}::report_status`;
        }
        if (severity) {
            countParams.push(severity);
            countQuery += ` AND severity = $${countParams.length}::severity_level`;
        }
        if (city) {
            countParams.push(city);
            countQuery += ` AND city ILIKE $${countParams.length}`;
        }
        if (state) {
            countParams.push(state);
            countQuery += ` AND state ILIKE $${countParams.length}`;
        }

        const countResult = await db.query(countQuery, countParams);

        res.json({
            success: true,
            reports: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
            },
        });
    } catch (error) {
        console.error('Get admin reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports',
        });
    }
});

/**
 * @route   GET /api/admin/reports/:id
 * @desc    Get single report with full details
 * @access  Private (Admin only)
 */
router.get('/:id', verifyAdminToken, requireAdmin, async (req, res) => {
    try {
        // Get report details
        const reportResult = await db.query(
            `SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
              it.name as issue_type_name, it.icon as issue_type_icon,
              a.name as assigned_admin_name, a.department as assigned_department
       FROM reports r
       JOIN users u ON r.user_id = u.id
       JOIN issue_types it ON r.issue_type_id = it.id
       LEFT JOIN admins a ON r.assigned_to_admin = a.id
       WHERE r.id = $1`,
            [req.params.id]
        );

        if (reportResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found',
            });
        }

        // Get status history
        const historyResult = await db.query(
            `SELECT sh.*, a.name as changed_by_name
       FROM status_history sh
       LEFT JOIN admins a ON sh.changed_by_admin_id = a.id
       WHERE sh.report_id = $1
       ORDER BY sh.changed_at DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            report: reportResult.rows[0],
            statusHistory: historyResult.rows,
        });
    } catch (error) {
        console.error('Get admin report details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report details',
        });
    }
});

/**
 * @route   PUT /api/admin/reports/:id/status
 * @desc    Update report status
 * @access  Private (Admin with update permission)
 */
router.put(
    '/:id/status',
    verifyAdminToken,
    requirePermission('can_update_status'),
    validate(statusUpdateSchema),
    async (req, res) => {
        try {
            const { status, comment } = req.body;

            // Get current report
            const currentReport = await db.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);

            if (currentReport.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found',
                });
            }

            const report = currentReport.rows[0];
            const oldStatus = report.status;

            // Use transaction to ensure data consistency
            await db.transaction(async (client) => {
                // Update report status (cast to enum type for Supabase compatibility)
                await client.query(
                    `UPDATE reports SET status = $1::report_status, updated_at = CURRENT_TIMESTAMP,
           resolved_at = CASE WHEN $1::report_status = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
           WHERE id = $2`,
                    [status, req.params.id]
                );

                // Insert status history (cast enum parameters)
                await client.query(
                    `INSERT INTO status_history (report_id, old_status, new_status, changed_by_admin_id, comment)
           VALUES ($1, $2::report_status, $3::report_status, $4, $5)`,
                    [req.params.id, oldStatus, status, req.admin.id, comment || null]
                );
            });

            // Send notification to user (non-blocking, don't let this fail the request)
            try {
                await notifyReportStatusChange(report, status, comment);
            } catch (notifError) {
                console.warn('Failed to send status change notification:', notifError.message);
            }

            // Push real-time WebSocket event to user
            try {
                const wsService = req.app.get('wsService');
                if (wsService) {
                    wsService.sendToUser(report.user_id, {
                        type: 'STATUS_UPDATE',
                        reportId: req.params.id,
                        oldStatus,
                        newStatus: status,
                        comment: comment || null,
                        message: `Your report status changed to ${status.replace('_', ' ')}`,
                    });
                }
            } catch (wsError) {
                // WebSocket errors should never break the API
            }

            res.json({
                success: true,
                message: 'Report status updated successfully',
            });
        } catch (error) {
            console.error('Update report status error:', error.message);
            console.error('Error detail:', error.detail || error.hint || error.code);
            console.error('Error stack:', error.stack?.substring(0, 300));
            res.status(500).json({
                success: false,
                message: 'Failed to update report status',
                debug: process.env.NODE_ENV !== 'production' ? error.message : undefined,
            });
        }
    }
);

/**
 * @route   PUT /api/admin/reports/:id/assign
 * @desc    Assign report to admin or department
 * @access  Private (Admin with assign permission)
 */
router.put(
    '/:id/assign',
    verifyAdminToken,
    requirePermission('can_assign_reports'),
    auditLogger('ASSIGN_REPORT', 'report'),
    validate(assignReportSchema),
    async (req, res) => {
        try {
            const { assigned_to_admin, assigned_department } = req.body;

            await db.query(
                `UPDATE reports 
         SET assigned_to_admin = $1, assigned_department = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
                [assigned_to_admin || null, assigned_department || null, req.params.id]
            );

            res.json({
                success: true,
                message: 'Report assigned successfully',
            });
        } catch (error) {
            console.error('Assign report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign report',
            });
        }
    }
);

/**
 * @route   POST /api/admin/reports/:id/respond
 * @desc    Send response to user
 * @access  Private (Admin only)
 */
router.post(
    '/:id/respond',
    verifyAdminToken,
    requireAdmin,
    auditLogger('RESPOND_TO_REPORT', 'report'),
    validate(adminResponseSchema),
    async (req, res) => {
        try {
            const { message } = req.body;

            // Get report and user details
            const result = await db.query(
                `SELECT r.*, u.email, u.phone FROM reports r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = $1`,
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found',
                });
            }

            const report = result.rows[0];

            // Update admin response
            await db.query(
                'UPDATE reports SET admin_response = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [message, req.params.id]
            );

            // Send notification (non-blocking)
            try {
                await notifyUser({
                    userId: report.user_id,
                    reportId: report.id,
                    title: 'Admin Response to Your Report',
                    message: message,
                    email: report.email,
                    phone: report.phone,
                    sendEmailNotification: true,
                });
            } catch (notifError) {
                console.warn('Failed to send response notification:', notifError.message);
            }

            // Push real-time WebSocket event
            try {
                const wsService = req.app.get('wsService');
                if (wsService) {
                    wsService.sendToUser(report.user_id, {
                        type: 'ADMIN_RESPONSE',
                        reportId: req.params.id,
                        message: message,
                    });
                }
            } catch (wsError) { /* ignore */ }

            res.json({
                success: true,
                message: 'Response sent successfully',
            });
        } catch (error) {
            console.error('Send response error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send response',
            });
        }
    }
);

/**
 * @route   DELETE /api/admin/reports/:id
 * @desc    Delete report
 * @access  Private (Super admin only)
 */
router.delete(
    '/:id',
    verifyAdminToken,
    requirePermission('can_delete_reports'),
    auditLogger('DELETE_REPORT', 'report'),
    async (req, res) => {
        try {
            await db.query('DELETE FROM reports WHERE id = $1', [req.params.id]);

            res.json({
                success: true,
                message: 'Report deleted successfully',
            });
        } catch (error) {
            console.error('Delete report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete report',
            });
        }
    }
);

module.exports = router;
