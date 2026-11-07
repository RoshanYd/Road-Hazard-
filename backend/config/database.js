const { Pool } = require('pg');
const config = require('./env');

// Create PostgreSQL connection pool
const pool = new Pool(config.database);

// Handle pool errors (don't crash — pool will reconnect)
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// Test database connection
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function to get a client from the pool (for transactions)
const getClient = async () => {
    const client = await pool.connect();
    return client;
};

// Transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Graceful shutdown
const shutdown = async () => {
    console.log('Closing database connection pool...');
    await pool.end();
    console.log('✓ Database connection pool closed');
};

module.exports = {
    pool,
    query,
    getClient,
    transaction,
    shutdown,
};
