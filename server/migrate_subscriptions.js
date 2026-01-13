const { pool } = require('./db');

async function migrate() {
    try {
        console.log('Creating subscriptions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                endpoint TEXT NOT NULL,
                keys_auth TEXT NOT NULL,
                keys_p256dh TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, endpoint)
            );
        `);
        console.log('Subscriptions table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
