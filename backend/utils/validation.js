const Joi = require('joi');

/**
 * Validation schemas for various inputs
 */

// User registration validation
const userRegistrationSchema = Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
        'string.pattern.base': 'Phone number must be 10 digits',
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
});

// Login validation (supports standard emails and official IDs like admin.gov.in)
const loginSchema = Joi.object({
    email: Joi.string().trim().required().messages({
        'string.empty': 'Email or Official ID is required',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
    }),
});

// Report submission validation
const reportSubmissionSchema = Joi.object({
    issue_type_id: Joi.number().integer().positive().required(),
    location_lat: Joi.number().min(-90).max(90).required().messages({
        'number.base': 'Invalid latitude',
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90',
    }),
    location_lng: Joi.number().min(-180).max(180).required().messages({
        'number.base': 'Invalid longitude',
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180',
    }),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(255).optional(),
    state: Joi.string().max(255).optional(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    description: Joi.string().min(10).max(1000).required().messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description must not exceed 1000 characters',
    }),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
});

// Status update validation (admin)
const statusUpdateSchema = Joi.object({
    status: Joi.string().valid('submitted', 'under_review', 'in_progress', 'resolved', 'rejected').required(),
    comment: Joi.string().max(500).optional(),
});

// Assign report validation (admin)
const assignReportSchema = Joi.object({
    assigned_to_admin: Joi.string().uuid().optional().allow(null),
    assigned_department: Joi.string().max(255).optional().allow(null),
});

// Admin response validation
const adminResponseSchema = Joi.object({
    message: Joi.string().min(10).max(500).required().messages({
        'string.empty': 'Message is required',
        'string.min': 'Message must be at least 10 characters',
    }),
});

/**
 * Middleware to validate request body against a schema
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
        }

        // Replace req.body with validated and sanitized value
        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    userRegistrationSchema,
    loginSchema,
    reportSubmissionSchema,
    statusUpdateSchema,
    assignReportSchema,
    adminResponseSchema,
};
