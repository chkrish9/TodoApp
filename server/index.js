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

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/tasks', require('./routes/tasks'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
