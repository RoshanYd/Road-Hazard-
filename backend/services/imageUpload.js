const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

// Ensure upload directory exists
const ensureUploadDir = async () => {
    try {
        await fs.access(config.upload.directory);
    } catch {
        await fs.mkdir(config.upload.directory, { recursive: true });
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await ensureUploadDir();
        cb(null, config.upload.directory);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`), false);
    }
};

// Multer configuration
const upload = multer({
    storage,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
    fileFilter,
});

/**
 * Get URL for an uploaded file
 * @param {string} filename - Name of the uploaded file
 * @returns {string} - Public URL for the file
 */
const getFileUrl = (filename) => {
    // In production, this would be your cloud storage URL or CDN
    return `/uploads/${filename}`;
};

/**
 * Delete a file from storage
 * @param {string} filename - Name of the file to delete
 */
const deleteFile = async (filename) => {
    try {
        const filePath = path.join(config.upload.directory, filename);
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new Error('Failed to delete file');
    }
};

/**
 * Middleware to handle image upload errors
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size: ${config.upload.maxFileSize / 1024 / 1024}MB`,
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next();
};

module.exports = {
    upload,
    getFileUrl,
    deleteFile,
    handleUploadError,
    ensureUploadDir,
};
