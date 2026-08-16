// ==========================================
// DATABASE MODULE — SQLite (local, no setup needed)
// ==========================================

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'app.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ==========================================
// INITIALIZE TABLES
// ==========================================

function initDB() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            budget REAL DEFAULT 50000,
            custom_logo TEXT,
            custom_title TEXT
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            payment_mode TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS savings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            salary REAL NOT NULL,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            category TEXT NOT NULL,
            predicted_amount REAL NOT NULL,
            confidence REAL,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed default admin user if not present
    const admin = db.prepare("SELECT id FROM users WHERE email = 'sidhi@admin.com'").get();
    if (!admin) {
        const hash = bcrypt.hashSync('Admin@123', 10);
        db.prepare(
            "INSERT INTO users (full_name, email, password, role, budget) VALUES (?, ?, ?, ?, ?)"
        ).run('Admin User', 'sidhi@admin.com', hash, 'admin', 100000);
        console.log('✅ Default admin created — email: sidhi@admin.com  password: Admin@123');
    }

    console.log('✅ Database initialized (SQLite)');
}

initDB();

// ==========================================
// USER OPERATIONS
// ==========================================

function getUserByEmail(email) {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
}

function getUserById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
}

function getAllUsers() {
    return db.prepare("SELECT * FROM users").all();
}

function addUser(userData) {
    const { fullName, email, password, role = 'user', budget = 50000 } = userData;
    const result = db.prepare(
        "INSERT INTO users (full_name, email, password, role, budget) VALUES (?, ?, ?, ?, ?)"
    ).run(fullName, email, password, role, budget);
    return { id: result.lastInsertRowid, fullName, email, role, budget };
}

// alias used by auth.js (called createUser in some places)
function createUser(userData) {
    return addUser(userData);
}

function updateUser(id, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return 0;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const result = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values);
    return result.changes;
}

function readUsers() {
    return getAllUsers();
}

// ==========================================
// EXPENSE OPERATIONS
// ==========================================

function getExpensesByUser(userId, filters = {}) {
    let query = "SELECT * FROM expenses WHERE user_id = ?";
    const params = [userId];

    if (filters.category) { query += " AND category = ?"; params.push(filters.category); }
    if (filters.startDate) { query += " AND date >= ?"; params.push(filters.startDate); }
    if (filters.endDate)   { query += " AND date <= ?"; params.push(filters.endDate); }

    query += " ORDER BY date DESC, created_at DESC";
    return db.prepare(query).all(...params);
}

// alias used by expenses.js / analytics.js / ai.js
function getExpensesByUserId(userId) {
    return getExpensesByUser(userId);
}

function addExpense(expenseData) {
    const { userId, amount, category, date, paymentMode, notes = '' } = expenseData;
    const result = db.prepare(
        "INSERT INTO expenses (user_id, amount, category, date, payment_mode, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, amount, category, date, paymentMode, notes);
    return { id: result.lastInsertRowid };
}

// alias
function createExpense(expenseData) { return addExpense(expenseData); }

function updateExpense(id, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return 0;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const result = db.prepare(`UPDATE expenses SET ${setClause} WHERE id = ?`).run(...values);
    return result.changes;
}

function deleteExpense(id) {
    const result = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    return result.changes;
}

// ==========================================
// SAVINGS OPERATIONS
// ==========================================

function getSavingsByUser(userId) {
    return db.prepare("SELECT * FROM savings WHERE user_id = ? ORDER BY date DESC").all(userId);
}

function addSaving(savingData) {
    const { userId, amount, description = '', date } = savingData;
    const result = db.prepare(
        "INSERT INTO savings (user_id, amount, description, date) VALUES (?, ?, ?, ?)"
    ).run(userId, amount, description, date);
    return { id: result.lastInsertRowid };
}

function createSaving(savingData) { return addSaving(savingData); }

function updateSaving(id, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return 0;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const result = db.prepare(`UPDATE savings SET ${setClause} WHERE id = ?`).run(...values);
    return result.changes;
}

function deleteSaving(id) {
    const result = db.prepare("DELETE FROM savings WHERE id = ?").run(id);
    return result.changes;
}

// ==========================================
// SALARY OPERATIONS
// ==========================================

function addSalary(salaryData) {
    const { userId, salary, month, year } = salaryData;
    const result = db.prepare(
        "INSERT INTO salaries (user_id, salary, month, year) VALUES (?, ?, ?, ?)"
    ).run(userId, salary, month, year);
    return { id: result.lastInsertRowid };
}

function createSalary(salaryData) { return addSalary(salaryData); }

function getSalariesByUser(userId) {
    return db.prepare("SELECT * FROM salaries WHERE user_id = ? ORDER BY year DESC, month DESC").all(userId);
}

function getSalariesByUserId(userId) { return getSalariesByUser(userId); }

// ==========================================
// PREDICTION OPERATIONS
// ==========================================

function addPrediction(predictionData) {
    const { userId, category, predictedAmount, confidence, month, year } = predictionData;
    const result = db.prepare(
        "INSERT INTO predictions (user_id, category, predicted_amount, confidence, month, year) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, category, predictedAmount, confidence, month, year);
    return { id: result.lastInsertRowid };
}

function createPrediction(predictionData) { return addPrediction(predictionData); }

function getPredictionsByUser(userId) {
    return db.prepare("SELECT * FROM predictions WHERE user_id = ? ORDER BY year DESC, month DESC").all(userId);
}

function getPredictionsByUserId(userId) { return getPredictionsByUser(userId); }

function clearPredictions(userId) {
    const result = db.prepare("DELETE FROM predictions WHERE user_id = ?").run(userId);
    return result.changes;
}

// ==========================================
// ANALYTICS HELPERS
// ==========================================

function getExpenseStats(userId, startDate, endDate) {
    return db.prepare(`
        SELECT COUNT(*) as count, SUM(amount) as total,
               AVG(amount) as average, MIN(amount) as min, MAX(amount) as max
        FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?
    `).get(userId, startDate, endDate);
}

function getCategoryTotals(userId, startDate, endDate) {
    return db.prepare(`
        SELECT category, SUM(amount) as total FROM expenses
        WHERE user_id = ? AND date BETWEEN ? AND ?
        GROUP BY category ORDER BY total DESC
    `).all(userId, startDate, endDate);
}

function getMonthlyTrends(userId, months = 12) {
    return db.prepare(`
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM expenses WHERE user_id = ?
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month
    `).all(userId);
}

function getRecentExpenses(userId, limit = 10) {
    return db.prepare(`
        SELECT * FROM expenses WHERE user_id = ?
        ORDER BY date DESC, created_at DESC LIMIT ?
    `).all(userId, limit);
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    // Users
    getUserByEmail, getUserById, getAllUsers, readUsers,
    addUser, createUser, updateUser,
    // Expenses
    getExpensesByUser, getExpensesByUserId,
    addExpense, createExpense, updateExpense, deleteExpense,
    // Savings
    getSavingsByUser, addSaving, createSaving, updateSaving, deleteSaving,
    // Salaries
    addSalary, createSalary, getSalariesByUser, getSalariesByUserId,
    // Predictions
    addPrediction, createPrediction,
    getPredictionsByUser, getPredictionsByUserId,
    clearPredictions,
    // Analytics
    getExpenseStats, getCategoryTotals, getMonthlyTrends, getRecentExpenses,
    // Raw db for admin routes
    _db: db
};
