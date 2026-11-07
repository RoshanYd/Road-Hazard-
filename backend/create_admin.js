const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

async function createAdmin() {
    try {
        const hash = await bcrypt.hash('admin123', 12);

        // Ensure admin@gov.in is created/updated
        const result1 = await pool.query(
            `INSERT INTO admins (name, email, password_hash, role, department, permissions, is_active)
             VALUES ($1, $2, $3, 'super_admin', 'Government of India',
             '{"can_update_status": true, "can_assign_reports": true, "can_delete_reports": true, "can_manage_admins": true}', true)
             ON CONFLICT (email) DO UPDATE SET password_hash = $3, is_active = true
             RETURNING id, email, role`,
            ['System Administrator', 'admin@gov.in', hash]
        );
        console.log('Admin 1 updated successfully:', result1.rows[0]);

        // Also ensure admin.gov.in is created/updated (supports both formats)
        const result2 = await pool.query(
            `INSERT INTO admins (name, email, password_hash, role, department, permissions, is_active)
             VALUES ($1, $2, $3, 'super_admin', 'Government of India',
             '{"can_update_status": true, "can_assign_reports": true, "can_delete_reports": true, "can_manage_admins": true}', true)
             ON CONFLICT (email) DO UPDATE SET password_hash = $3, is_active = true
             RETURNING id, email, role`,
            ['System Administrator', 'admin.gov.in', hash]
        );
        console.log('Admin 2 updated successfully:', result2.rows[0]);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
