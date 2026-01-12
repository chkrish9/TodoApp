const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/tasks', require('./routes/tasks'));

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', db: 'disconnected' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
