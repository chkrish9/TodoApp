const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DB || 'midnight_ride',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: process.env.POSTGRES_PORT || 5432,
});

module.exports = { pool };
