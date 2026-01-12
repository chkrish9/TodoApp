const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');

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

const webpush = require('web-push');
const cron = require('node-cron');

// Initialize Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('Web Push initialized');
} else {
    console.warn('VAPID keys not found, push notifications disabled');
}

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/tasks', require('./routes/tasks'));
app.use('/api/v1/notifications', require('./routes/notifications'));


// Daily Cron Job (Runs at 09:00 AM every day)
// Note: This uses server time.
cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily task reminder...');
    const client = await pool.connect();

    try {
        // Get all unique users who have subscriptions
        const { rows: users } = await client.query('SELECT DISTINCT user_id FROM subscriptions');

        for (const user of users) {
            const userId = user.user_id;

            // Get today's tasks for this user
            // We check if due_date is "today" relative to server time, or just overdue
            // Simple logic: tasks due today (server time) AND not completed
            const { rows: tasks } = await client.query(
                `SELECT * FROM tasks 
                  WHERE group_id IN (SELECT id FROM groups WHERE user_id = $1)
                  AND is_completed = false
                  AND due_date::date = CURRENT_DATE`,
                [userId]
            );

            let title, body;
            if (tasks.length > 0) {
                title = `You have ${tasks.length} tasks today`;
                body = `Top task: ${tasks[0].title}`;
                if (tasks.length > 1) body += ` and ${tasks.length - 1} more.`;
            } else {
                title = 'No tasks for today!';
                body = 'Enjoy your free time.';
            }

            // Get user subscriptions
            const { rows: subs } = await client.query(
                'SELECT * FROM subscriptions WHERE user_id = $1',
                [userId]
            );

            // Send notification to all subscriptions
            const payload = JSON.stringify({ title, body, url: '/' });

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
                    console.log(`[Cron] Notification sent to user ${userId}`);
                } catch (error) {
                    console.error(`[Cron] Error sending to ${userId}:`, error.statusCode);
                    if (error.statusCode === 410) {
                        // Subscription gone, remove it
                        await client.query('DELETE FROM subscriptions WHERE endpoint = $1', [sub.endpoint]);
                        console.log('[Cron] Removed stale subscription');
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Cron] Job failed:', error);
    } finally {
        client.release();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
