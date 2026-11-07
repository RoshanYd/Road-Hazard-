const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyUserToken } = require('../middleware/auth');

/**
 * @route   POST /api/sensor/event
 * @desc    Receive a sensor-detected road event (pothole, bump, etc.)
 * @access  Private (authenticated user)
 */
router.post('/event', verifyUserToken, async (req, res) => {
    try {
        const {
            type = 'pothole_detected',
            location,
            speed_kmh,
            sensor_data,
        } = req.body;

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({
                success: false,
                message: 'Location (lat/lng) is required',
            });
        }

        // Store the sensor event
        const result = await db.query(
            `INSERT INTO sensor_events (user_id, event_type, location_lat, location_lng, location_accuracy, speed_kmh,
             peak_acceleration, duration_ms, rms_magnitude, device_model, sampling_rate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id`,
            [
                req.user.id || req.user.userId,
                type,
                location.lat,
                location.lng,
                location.accuracy || null,
                speed_kmh || null,
                sensor_data?.peak_acceleration || null,
                sensor_data?.duration_ms || null,
                sensor_data?.rms_magnitude || null,
                sensor_data?.device_model || null,
                sensor_data?.sampling_rate || null,
            ]
        );

        const eventId = result.rows[0]?.id;

        // Check for nearby sensor events from OTHER users (crowdsource validation)
        const nearbyResult = await db.query(
            `SELECT COUNT(DISTINCT user_id) as reporter_count
             FROM sensor_events
             WHERE user_id != $1
               AND ABS(location_lat - $2) < 0.0005
               AND ABS(location_lng - $3) < 0.0005
               AND created_at > NOW() - INTERVAL '7 days'`,
            [req.user.id || req.user.userId, location.lat, location.lng]
        );

        const nearbyReporters = parseInt(nearbyResult.rows[0]?.reporter_count || '0');
        const confidence = Math.min(0.3 + nearbyReporters * 0.25, 1.0); // 30% base + 25% per user, max 100%

        let autoReportCreated = false;

        // Auto-create a report if confidence > 70% (3+ independent detections)
        if (confidence >= 0.7 && nearbyReporters >= 2) {
            try {
                // Check if auto-report already exists for this spot
                const existingReport = await db.query(
                    `SELECT id FROM reports
                     WHERE ABS(location_lat - $1) < 0.0005
                       AND ABS(location_lng - $2) < 0.0005
                       AND source = 'sensor'
                       AND created_at > NOW() - INTERVAL '30 days'`,
                    [location.lat, location.lng]
                );

                if (existingReport.rows.length === 0) {
                    // Get first issue_type for potholes
                    const issueType = await db.query(
                        `SELECT id FROM issue_types WHERE name ILIKE '%pothole%' LIMIT 1`
                    );

                    if (issueType.rows.length > 0) {
                        await db.query(
                            `INSERT INTO reports (user_id, issue_type_id, description, location_lat, location_lng,
                             severity, status, source)
                             VALUES ($1, $2, $3, $4, $5, $6::severity_level, $7::report_status, 'sensor')`,
                            [
                                req.user.id || req.user.userId,
                                issueType.rows[0].id,
                                `Auto-detected pothole (${nearbyReporters + 1} independent sensor detections, confidence: ${Math.round(confidence * 100)}%)`,
                                location.lat,
                                location.lng,
                                sensor_data?.peak_acceleration > 4 ? 'high' : 'medium',
                                'submitted',
                            ]
                        );
                        autoReportCreated = true;
                    }
                }
            } catch (reportError) {
                console.warn('Auto-report creation failed:', reportError.message);
            }
        }

        res.json({
            success: true,
            event_id: eventId,
            nearby_reports: nearbyReporters,
            confidence: Math.round(confidence * 100) / 100,
            auto_report_created: autoReportCreated,
        });
    } catch (error) {
        console.error('Sensor event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process sensor event',
        });
    }
});

/**
 * @route   GET /api/sensor/stats
 * @desc    Get sensor detection stats for user
 * @access  Private
 */
router.get('/stats', verifyUserToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        const result = await db.query(
            `SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                AVG(peak_acceleration) as avg_acceleration,
                MAX(peak_acceleration) as max_acceleration
             FROM sensor_events
             WHERE user_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            stats: result.rows[0],
        });
    } catch (error) {
        console.error('Sensor stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sensor stats',
        });
    }
});

module.exports = router;
