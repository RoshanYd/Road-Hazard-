/**
 * Migration: Create password_reset_tokens table
 * Run once: node migrations/add_password_reset_tokens.js
 */
const db = require('../config/database');

async function migrate() {
    console.log('Running migration: add_password_reset_tokens...');

    await db.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id          SERIAL PRIMARY KEY,
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token       VARCHAR(255) NOT NULL UNIQUE,
            expires_at  TIMESTAMPTZ NOT NULL,
            used        BOOLEAN DEFAULT FALSE,
            created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_prt_token   ON password_reset_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
    `);

    console.log('✓ password_reset_tokens table created (or already exists)');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
