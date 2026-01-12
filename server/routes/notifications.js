const express = require('express');
const router = express.Router();
const pool = require('../db');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, [
    body('endpoint').notEmpty().withMessage('Endpoint is required'),
    body('keys.auth').notEmpty().withMessage('Auth key is required'),
    body('keys.p256dh').notEmpty().withMessage('P256dh key is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { endpoint, keys } = req.body;
    const userId = req.user.id;

    try {
        await pool.query(
            `INSERT INTO subscriptions (user_id, endpoint, keys_auth, keys_p256dh)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, endpoint) DO NOTHING`,
            [userId, endpoint, keys.auth, keys.p256dh]
        );

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send a test notification to the current user
router.post('/test', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const webpush = require('web-push');

    try {
        const { rows: subs } = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = $1',
            [userId]
        );

        if (subs.length === 0) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        const payload = JSON.stringify({
            title: 'Test Notification',
            body: 'If you see this, push notifications are working!',
            url: '/'
        });

        const results = [];
        for (const sub of subs) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.keys_auth,
                    p256dh: sub.keys_p256dh
                }
            };
            try {
                await webpush.sendNotification(pushSubscription, payload);
                results.push({ endpoint: sub.endpoint, status: 'sent' });
            } catch (error) {
                console.error('Error sending test push:', error);
                results.push({ endpoint: sub.endpoint, status: 'failed', error: error.message });
            }
        }

        res.json({ message: 'Test notification sent', results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get VAPID Public Key
router.get('/vapid-key', authenticateToken, (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(500).json({ error: 'VAPID keys not configured' });
    }
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
