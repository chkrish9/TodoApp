const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const authenticateToken = require('../middleware/auth');
const vapid = require('../lib/vapid');

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, [
    body('endpoint').notEmpty().withMessage('Endpoint is required'),
    // keys (auth/p256dh) are needed if we ever do encryption, but we store them anyway
], async (req, res) => {
    // Validation
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
             ON CONFLICT (user_id, endpoint) DO UPDATE
             SET keys_auth = EXCLUDED.keys_auth,
                 keys_p256dh = EXCLUDED.keys_p256dh`,
            [userId, endpoint, keys?.auth || '', keys?.p256dh || '']
        );
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// Helper to send push
async function sendPush(subscription) {
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.hostname}`;

    const vapidHeader = vapid.generateVapidHeader(
        audience,
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PRIVATE_KEY
    );

    if (!vapidHeader) {
        throw new Error('Failed to generate VAPID header');
    }

    try {
        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': vapidHeader,
                'TTL': '60',
            }
        });

        if (response.status === 410) {
            return 'gone';
        }

        if (!response.ok) {
            throw new Error(`Push failed: ${response.status}`);
        }
        return response;
    } catch (err) {
        throw err;
    }
}

// Send a test notification to the current user
router.post('/test', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const { rows: subs } = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = $1',
            [userId]
        );

        if (subs.length === 0) {
            return res.status(404).json({ error: 'No subscriptions found' });
        }

        const results = await Promise.allSettled(subs.map(sub => sendPush(sub)));

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        res.json({ message: `Sent test tickles`, successChain: successCount });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
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
