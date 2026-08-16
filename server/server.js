// ==========================================
// EXPRESS SERVER - Main Entry Point
// ==========================================

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Import route modules
const authRoutes = require('./auth');
const expenseRoutes = require('./expenses');
const analyticsRoutes = require('./analytics');
const chatbotRoutes = require('./chatbot');
const aiRoutes = require('./ai');

const app = express();
app.use(express.static('public'));
const PORT = parseInt(process.env.PORT) || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
// Explicit images mount (helps when hosting behind proxies/subpaths)
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ==========================================
// ROUTES
// ==========================================

// API Routes
app.use('/api', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', chatbotRoutes);
app.use('/api', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve HTML pages
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/signup.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/tracking.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/tracking.html'));
});

app.get('/savings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/savings.html'));
});

app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/reports.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/profile.html'));
});

app.get('/predictions.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/predictions.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'));
});

app.get('/forgot-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/forgot-password.html'));
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// ==========================================
// START SERVER
// ==========================================

function startServer(port, maxAttempts = 5) {
    const server = app.listen(port, () => {
        console.log('\n========================================');
        console.log('🚀 EXPENSE TRACKER SERVER RUNNING');
        console.log('========================================');
        console.log(`📍 Server: http://localhost:${port}`);
        console.log(`📊 Dashboard: http://localhost:${port}/dashboard.html`);
        console.log(`🔐 Login: http://localhost:${port}/`);
        console.log('========================================\n');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
            const nextPort = parseInt(port) + 1;
            console.warn(`⚠️ Port ${port} is in use. Trying port ${nextPort}...`);
            startServer(nextPort, maxAttempts - 1);
        } else {
            console.error('Failed to start server:', err);
            process.exit(1);
        }
    });

    return server;
}

const serverInstance = startServer(PORT);

module.exports = app;
