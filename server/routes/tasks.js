const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');

// Get all tasks for user (optionally filter by group)
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Join with groups to ensure user owns the task's group
        const result = await pool.query(
            `SELECT 
        t.id, 
        t.group_id as "groupId", 
        t.title, 
        t.description, 
        t.is_completed as "isCompleted", 
        t.reminder_enabled as "reminderEnabled", 
        t.due_date as "dueDate", 
        t.created_at as "createdAt",
        t.custom_field_values as "customFieldValues"
       FROM tasks t
       JOIN groups g ON t.group_id = g.id
       WHERE g.user_id = $1
       ORDER BY t.created_at ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { group_id, title, description, is_completed, reminder_enabled, due_date, custom_field_values } = req.body;
        // Map camelCase if sent from frontend, or snake_case if we align. 
        // The previous todoStore sent "task" object which has camelCase keys usually. 
        // Let's support camelCase input for better DX.

        const groupIdInput = req.body.groupId || group_id;
        const isCompletedInput = req.body.isCompleted ?? is_completed;
        const reminderEnabledInput = req.body.reminderEnabled ?? reminder_enabled;
        const dueDateInput = req.body.dueDate || due_date;
        const customFieldValuesInput = req.body.customFieldValues || custom_field_values;


        // Check group ownership
        const groupCheck = await pool.query('SELECT * FROM groups WHERE id = $1 AND user_id = $2', [groupIdInput, req.user.id]);
        if (groupCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid group' });
        }

        const result = await pool.query(
            `INSERT INTO tasks 
      (group_id, title, description, is_completed, reminder_enabled, due_date, custom_field_values)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, 
        group_id as "groupId", 
        title, 
        description, 
        is_completed as "isCompleted", 
        reminder_enabled as "reminderEnabled", 
        due_date as "dueDate", 
        created_at as "createdAt",
        custom_field_values as "customFieldValues"`,
            [groupIdInput, title, description, isCompletedInput || false, reminderEnabledInput || false, dueDateInput, JSON.stringify(customFieldValuesInput || [])]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update task
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check ownership via join
        const check = await pool.query(
            `SELECT t.id FROM tasks t JOIN groups g ON t.group_id = g.id WHERE t.id = $1 AND g.user_id = $2`,
            [id, req.user.id]
        );

        if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

        const fields = [];
        const values = [];
        let idx = 1;

        // Map frontend keys to DB keys
        const keyMap = {
            'groupId': 'group_id',
            'title': 'title',
            'description': 'description',
            'isCompleted': 'is_completed',
            'reminderEnabled': 'reminder_enabled',
            'dueDate': 'due_date',
            'customFieldValues': 'custom_field_values'
        };

        Object.keys(updates).forEach(key => {
            const dbKey = keyMap[key] || key;
            if (Object.values(keyMap).includes(dbKey)) {
                fields.push(`${dbKey} = $${idx}`);
                values.push(dbKey === 'custom_field_values' ? JSON.stringify(updates[key]) : updates[key]);
                idx++;
            }
        });

        if (fields.length === 0) return res.json(check.rows[0]); // No updates

        values.push(id);
        const result = await pool.query(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} 
            RETURNING 
                id, 
                group_id as "groupId", 
                title, 
                description, 
                is_completed as "isCompleted", 
                reminder_enabled as "reminderEnabled", 
                due_date as "dueDate", 
                created_at as "createdAt",
                custom_field_values as "customFieldValues"`,
            values
        );

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Check ownership
        const check = await pool.query(
            `SELECT t.id FROM tasks t JOIN groups g ON t.group_id = g.id WHERE t.id = $1 AND g.user_id = $2`,
            [id, req.user.id]
        );
        if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
