const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');
const vapid = require('./lib/vapid');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`, req.body && Object.keys(req.body).length > 0 ? req.body : '');
    next();
});

// Helper to send push
async function sendPush(subscription, payload) {
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.hostname}`;

    const vapidHeader = vapid.generateVapidHeader(
        audience,
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PRIVATE_KEY
    );

    if (!vapidHeader) {
        console.error('Failed to generate VAPID header');
        return;
    }

    try {
        // Send Notification Payload
        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': vapidHeader,
                'TTL': '60',
                'Content-Type': 'application/json'
            },
            body: payload
        });

        if (response.status === 410) {
            return 'gone';
        }
        if (!response.ok) {
            console.error(`Push failed: ${response.status} ${await response.text()}`);
        }
    } catch (err) {
        console.error('Push error', err);
    }
}

// Daily Timer (Check every minute)
setInterval(async () => {
    const now = new Date();
    // Run at 09:00 AM server time
    if (now.getHours() === 9 && now.getMinutes() === 0) {
        console.log('[Timer] Running daily task reminder...');
        const client = await pool.connect();

        try {
            // Get users with active subscriptions
            const { rows: users } = await client.query('SELECT DISTINCT user_id FROM subscriptions');

            for (const user of users) {
                const userId = user.user_id;

                // Check if user has incomplete tasks due today
                const { rows: tasks } = await client.query(
                    `SELECT count(*) as count FROM tasks 
                      WHERE group_id IN (SELECT id FROM groups WHERE user_id = $1)
                      AND is_completed = false
                      AND due_date::date = CURRENT_DATE`,
                    [userId]
                );

                const taskCount = parseInt(tasks[0].count);

                if (taskCount > 0) {
                    // Get user subscriptions
                    const { rows: subs } = await client.query(
                        'SELECT * FROM subscriptions WHERE user_id = $1',
                        [userId]
                    );

                    const payload = JSON.stringify({
                        title: 'Daily Focus',
                        body: `You have ${taskCount} task${taskCount === 1 ? '' : 's'} due today.`,
                        url: '/'
                    });

                    for (const sub of subs) {
                        const result = await sendPush(sub, payload);
                        if (result === 'gone') {
                            await client.query('DELETE FROM subscriptions WHERE endpoint = $1', [sub.endpoint]);
                            console.log('Removed stale subscription');
                        }
                    }
                    console.log(`Sent reminders to user ${userId} (Count: ${taskCount})`);
                }
            }
        } catch (e) {
            console.error('[Timer] Job failed', e);
        } finally {
            client.release();
        }
    }
}, 60000); // Check every minute

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/tasks', require('./routes/tasks'));
app.use('/api/v1/notifications', require('./routes/notifications'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
