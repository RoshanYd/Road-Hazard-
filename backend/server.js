const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const db = require('./config/database');
const { httpLogger } = require('./middleware/logger');
const { ensureUploadDir } = require('./services/imageUpload');

// Initialize Express app
const app = express();

// ================================
// MIDDLEWARE
// ================================

// Security headers (configured to allow cross-origin resource access for images)
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}));

// CORS configuration (allow both user and admin frontends)
app.use(cors({
    origin: [config.frontendUrls.user, config.frontendUrls.admin],
    credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
app.use(httpLogger);

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, config.upload.directory)));

// ================================
// ROUTES
// ================================

// Root route - API info
app.get('/', (req, res) => {
    res.json({
        success: true,
        name: 'Road Hazard Reporting Platform - API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            userAuth: '/api/auth',
            reports: '/api/reports',
            adminAuth: '/api/admin/auth',
            adminDashboard: '/api/admin/dashboard',
            adminReports: '/api/admin/reports',
        },
        timestamp: new Date().toISOString(),
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// User routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/passwordReset'));  // forgot-password & reset-password
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sensor', require('./routes/sensor'));

// Admin routes (separate from user routes)
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/auth', require('./routes/admin/passwordReset')); // admin forgot-password & reset-password
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/reports', require('./routes/admin/reports'));
app.use('/api/admin/audit', require('./routes/admin/audit'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ================================
// SERVER INITIALIZATION
// ================================

const startServer = async () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000;

    // Ensure upload directory exists
    await ensureUploadDir();
    console.log('✓ Upload directory ready');

    // Test database connection with retries
    let dbConnected = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await db.query('SELECT NOW()');
            console.log('✓ Database connection successful');
            dbConnected = true;
            break;
        } catch (error) {
            console.error(`Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);
            if (attempt < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }

    if (!dbConnected) {
        console.warn('⚠ Could not connect to database after retries. Starting server anyway — some endpoints may fail.');
    }

    // Create HTTP server and attach WebSocket
    const http = require('http');
    const wsService = require('./services/websocket');
    const server = http.createServer(app);
    wsService.attach(server);

    // Make wsService available to routes
    app.set('wsService', wsService);

    // Start server
    const PORT = config.PORT;
    server.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════╗
║  Road Hazard Reporting Platform - Backend     ║
║  Environment: ${config.NODE_ENV.padEnd(31)} ║
║  Port: ${PORT.toString().padEnd(39)} ║
║  User Frontend: ${config.frontendUrls.user.padEnd(27)} ║
║  Admin Frontend: ${config.frontendUrls.admin.padEnd(26)} ║
║  WebSocket: ws://localhost:${(PORT + '/ws').padEnd(19)} ║
╚════════════════════════════════════════════════╝
      `);
        console.log('Server is ready to accept connections');
    });
};


// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\nSIGTERM signal received: closing HTTP server');
    await db.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    await db.shutdown();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
