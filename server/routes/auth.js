const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

const { body } = require('express-validator');
const validate = require('../middleware/validate');


// Register
router.post('/register', [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
], async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
            [username, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[Auth] Login attempt for: ${username}`);

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            console.warn(`[Auth] Login failed - User not found: ${username}`);
            return res.status(400).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        if (await bcrypt.compare(password, user.password_hash)) {
            const accessToken = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET || 'your-secret-key'
            );
            res.json({ accessToken, user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.sendStatus(404);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
