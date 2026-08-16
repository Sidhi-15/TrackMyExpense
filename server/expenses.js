// ==========================================
// EXPENSE ROUTES
// Handles expense CRUD operations
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('./db');

// ==========================================
// GET ALL EXPENSES FOR A USER
// ==========================================

router.get('/expenses/:userId', async (req, res) => {
    try {
        const expenses = await db.getExpensesByUserId(req.params.userId);

        const formattedExpenses = expenses.map(expense => ({
            id: expense.id,
            userId: expense.user_id,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            paymentMode: expense.payment_mode,
            notes: expense.notes,
            createdAt: expense.created_at
        }));

        res.json({ expenses: formattedExpenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

// ==========================================
// ADD NEW EXPENSE
// ==========================================

router.post('/expenses', async (req, res) => {
    try {
        const { userId, amount, category, date, paymentMode, notes } = req.body;

        if (!userId || !amount || !category || !date || !paymentMode) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
        }

        const newExpense = await db.addExpense({
            userId,
            amount: parsedAmount,
            category,
            date,
            paymentMode,
            notes: notes || ''
        });

        res.status(201).json({
            message: 'Expense added successfully',
            expense: {
                id: newExpense.id,
                userId,
                amount: parsedAmount,
                category,
                date,
                paymentMode,
                notes: notes || ''
            }
        });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense' });
    }
});

// ==========================================
// UPDATE EXPENSE
// ==========================================

router.put('/expenses/:expenseId', async (req, res) => {
    try {
        const { amount, category, date, paymentMode, notes } = req.body;
        const updateData = {};

        if (amount !== undefined) {
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
            }
            updateData.amount = parsedAmount;
        }
        if (category) updateData.category = category;
        if (date) updateData.date = date;
        if (paymentMode) updateData.payment_mode = paymentMode;
        if (notes !== undefined) updateData.notes = notes;

        const changes = await db.updateExpense(req.params.expenseId, updateData);

        if (changes > 0) {
            res.json({ message: 'Expense updated successfully' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Error updating expense' });
    }
});

// ==========================================
// DELETE EXPENSE
// ==========================================

router.delete('/expenses/:expenseId', async (req, res) => {
    try {
        const changes = await db.deleteExpense(req.params.expenseId);

        if (changes > 0) {
            res.json({ message: 'Expense deleted successfully' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
});

// ==========================================
// GET EXPENSES BY DATE RANGE
// ==========================================

router.get('/expenses/:userId/range', async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        const expenses = await db.getExpensesByUser(req.params.userId, { startDate, endDate, category });

        const formattedExpenses = expenses.map(expense => ({
            id: expense.id,
            userId: expense.user_id,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            paymentMode: expense.payment_mode,
            notes: expense.notes
        }));

        res.json({ expenses: formattedExpenses });
    } catch (error) {
        console.error('Error fetching expenses by range:', error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

module.exports = router;
