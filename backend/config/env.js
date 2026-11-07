require('dotenv').config();

module.exports = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // Database - supports DATABASE_URL (Render.com) or individual fields
  database: process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'road_hazard_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },

  // JWT Configuration
  jwt: {
    userSecret: process.env.JWT_SECRET_USER,
    adminSecret: process.env.JWT_SECRET_ADMIN,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Frontend URLs for CORS
  frontendUrls: {
    user: process.env.USER_FRONTEND_URL || 'http://localhost:3000',
    admin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',
  },

  // File Upload
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(','),
  },

  // AWS S3 (if using cloud storage)
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  // Cloudinary (alternative to AWS)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'Road Hazard Platform <noreply@roadsafety.gov.in>',
  },

  // SMS Configuration (Twilio)
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
