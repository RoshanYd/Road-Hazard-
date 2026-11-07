const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyUserToken, optionalAuth } = require('../middleware/auth');
const { validate, reportSubmissionSchema } = require('../utils/validation');
const { upload, getFileUrl, handleUploadError } = require('../services/imageUpload');
const { notifyUser } = require('../services/notifications');

/**
 * @route   POST /api/reports
 * @desc    Submit a new report
 * @access  Private (User only)
 */
router.post(
    '/',
    verifyUserToken,
    upload.array('images', 5), // Allow up to 5 images
    handleUploadError,
    validate(reportSubmissionSchema),
    async (req, res) => {
        try {
            const {
                issue_type_id,
                location_lat,
                location_lng,
                address,
                city,
                state,
                pincode,
                description,
                severity,
            } = req.body;

            // Process uploaded images
            const imageUrls = req.files ? req.files.map((file) => getFileUrl(file.filename)) : [];

            // Insert report
            const result = await db.query(
                `INSERT INTO reports 
         (user_id, issue_type_id, location_lat, location_lng, address, city, state, pincode, 
          description, severity, image_urls, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'submitted')
         RETURNING *`,
                [
                    req.user.id,
                    issue_type_id,
                    location_lat,
                    location_lng,
                    address || null,
                    city || null,
                    state || null,
                    pincode || null,
                    description,
                    severity,
                    imageUrls,
                ]
            );

            const report = result.rows[0];

            // Send confirmation notification
            await notifyUser({
                userId: req.user.id,
                reportId: report.id,
                title: 'Report Submitted Successfully',
                message: `Your ${severity} severity report has been submitted and will be reviewed soon.`,
                email: req.user.email,
                phone: req.user.phone,
                sendEmailNotification: true,
            });

            res.status(201).json({
                success: true,
                message: 'Report submitted successfully',
                report: {
                    id: report.id,
                    status: report.status,
                    severity: report.severity,
                    created_at: report.created_at,
                },
            });
        } catch (error) {
            console.error('Report submission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit report',
            });
        }
    }
);

/**
 * @route   GET /api/reports/my
 * @desc    Get current user's reports
 * @access  Private (User only)
 */
router.get('/my', verifyUserToken, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT r.*, it.name as issue_type_name
      FROM reports r
      JOIN issue_types it ON r.issue_type_id = it.id
      WHERE r.user_id = $1
    `;
        const params = [req.user.id];

        // Add status filter if provided
        if (status) {
            query += ` AND r.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM reports WHERE user_id = $1';
        const countParams = [req.user.id];
        if (status) {
            countQuery += ' AND status = $2';
            countParams.push(status);
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
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports',
        });
    }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get a single report
 * @access  Private (User can only view their own reports)
 */
router.get('/:id', verifyUserToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT r.*, it.name as issue_type_name, it.icon as issue_type_icon
       FROM reports r
       JOIN issue_types it ON r.issue_type_id = it.id
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

        // Ensure user can only view their own reports
        if (report.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        // Get status history
        const historyResult = await db.query(
            `SELECT sh.*, a.name as admin_name
       FROM status_history sh
       LEFT JOIN admins a ON sh.changed_by_admin_id = a.id
       WHERE sh.report_id = $1
       ORDER BY sh.changed_at DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            report,
            history: historyResult.rows,
        });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report',
        });
    }
});

/**
 * @route   GET /api/reports/public
 * @desc    Get public reports for map view (no auth required)
 * @access  Public
 */
router.get('/public/map', optionalAuth, async (req, res) => {
    try {
        const { status = 'submitted,under_review,in_progress,resolved', severity } = req.query;

        let query = `
      SELECT r.id, r.location_lat, r.location_lng, r.severity, r.status, 
             it.name as issue_type, it.icon
      FROM reports r
      JOIN issue_types it ON r.issue_type_id = it.id
      WHERE r.status = ANY($1::report_status[])
    `;
        const params = [status.split(',')];

        if (severity) {
            query += ` AND r.severity = ANY($${params.length + 1}::severity_level[])`;
            params.push(severity.split(','));
        }

        query += ` LIMIT 500`; // Limit to prevent overload

        const result = await db.query(query, params);

        res.json({
            success: true,
            reports: result.rows,
        });
    } catch (error) {
        console.error('Get public reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public reports',
        });
    }
});

module.exports = router;
