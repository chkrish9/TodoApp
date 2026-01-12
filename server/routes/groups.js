const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

// Get all groups for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM groups WHERE user_id = $1 ORDER BY created_at ASC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create group
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, icon, color } = req.body;
        console.log(`[Groups] Creating group "${name}" for user ${req.user.username}`);
        const result = await pool.query(
            'INSERT INTO groups (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, name, icon || 'List', color || 'blue']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete group
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Groups] Deleting group ${id} for user ${req.user.username}`);
        // Check ownership
        const check = await pool.query('SELECT * FROM groups WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        await pool.query('DELETE FROM groups WHERE id = $1', [id]);
        res.json({ message: 'Group deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
