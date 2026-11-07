const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { verifyAdminToken, requireAdmin } = require('../../middleware/auth');

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', verifyAdminToken, requireAdmin, async (req, res) => {
    try {
        // Core stats
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_reports,
                COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
                COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
                COUNT(*) FILTER (WHERE severity = 'high') as high_count,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month
            FROM reports
        `);

        // Active users
        const usersResult = await db.query(`
            SELECT COUNT(*) as total_users,
                   COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month
            FROM users
        `);

        // Average resolution time (for resolved reports)
        const resTimeResult = await db.query(`
            SELECT 
                ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1) as avg_hours,
                ROUND(MIN(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1) as min_hours,
                ROUND(MAX(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1) as max_hours
            FROM reports 
            WHERE status = 'resolved' AND resolved_at IS NOT NULL
        `);

        // Reports by severity
        const severityResult = await db.query(`
            SELECT severity, COUNT(*) as count
            FROM reports GROUP BY severity ORDER BY count DESC
        `);

        // Reports by issue type
        const issueTypeResult = await db.query(`
            SELECT it.name, COUNT(r.id) as count
            FROM issue_types it
            LEFT JOIN reports r ON r.issue_type_id = it.id
            GROUP BY it.name ORDER BY count DESC
        `);

        // Reports by status (for donut chart)
        const statusResult = await db.query(`
            SELECT status, COUNT(*) as count
            FROM reports GROUP BY status ORDER BY count DESC
        `);

        // High-risk zones (top 10 cities)
        const highRiskZonesResult = await db.query(`
            SELECT city, state, COUNT(*) as report_count,
                   COUNT(*) FILTER (WHERE severity IN ('high','critical')) as critical_reports
            FROM reports
            WHERE city IS NOT NULL
            GROUP BY city, state
            ORDER BY report_count DESC LIMIT 10
        `);

        // Monthly comparison (this month vs last month)
        const monthlyComparison = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as current_month,
                COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                                  AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as last_month
            FROM reports
        `);

        res.json({
            success: true,
            stats: statsResult.rows[0],
            users: usersResult.rows[0],
            resolutionTime: resTimeResult.rows[0],
            bySeverity: severityResult.rows,
            byIssueType: issueTypeResult.rows,
            byStatus: statusResult.rows,
            highRiskZones: highRiskZonesResult.rows,
            monthlyComparison: monthlyComparison.rows[0],
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
        });
    }
});

/**
 * @route   GET /api/admin/dashboard/trends
 * @desc    Get trend data for charts
 * @access  Private (Admin only)
 */
router.get('/trends', verifyAdminToken, requireAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const daysInt = parseInt(days) || 30;

        // Reports over time
        const trendsResult = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
                COUNT(*) FILTER (WHERE severity IN ('high','critical')) as critical
            FROM reports
            WHERE created_at >= CURRENT_DATE - INTERVAL '${daysInt} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC`
        );

        res.json({
            success: true,
            trends: trendsResult.rows,
        });
    } catch (error) {
        console.error('Dashboard trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trend data',
        });
    }
});

module.exports = router;
