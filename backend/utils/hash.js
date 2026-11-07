const bcrypt = require('bcrypt');
const config = require('../config/env');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hash) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw new Error('Failed to verify password');
    }
};

module.exports = {
    hashPassword,
    comparePassword,
};
