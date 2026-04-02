// ==========================================
// EXPRESS SERVER - Main Entry Point
// ==========================================

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

const app = express();
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'expense-tracker-secret-key-2024',
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// ROUTES
// ==========================================

// API Routes
app.use('/api', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', chatbotRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
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

app.get('/test-button.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/test-button.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'));
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
// START SERVER - removed for Serverless (Vercel) compatibility
// ==========================================

// For local development with plain Node, use server.js separately like:
//    node server.js
// or add a dedicated start script that calls app.listen(PORT)

module.exports = app;
