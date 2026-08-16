// ==========================================
// ANALYTICS ROUTES
// Provides insights, trends, and reports
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('./db');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateCategoryTotals(expenses) {
    const totals = {};
    expenses.forEach(expense => {
        const category = expense.category;
        if (!totals[category]) {
            totals[category] = 0;
        }
        totals[category] += parseFloat(expense.amount);
    });
    return totals;
}

function getMonthlyTrends(expenses, months = 6) {
    const trends = {};
    const now = new Date();

    for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        trends[monthKey] = 0;
    }

    expenses.forEach(expense => {
        if (expense && expense.date) {
            const monthKey = expense.date.slice(0, 7);
            if (trends.hasOwnProperty(monthKey)) {
                trends[monthKey] += parseFloat(expense.amount);
            }
        }
    });

    return trends;
}

function checkOverspending(totalSpent, budget) {
    const percentage = (totalSpent / budget) * 100;
    return {
        isOverspending: totalSpent > budget,
        percentage: percentage.toFixed(2),
        amount: (totalSpent - budget).toFixed(2)
    };
}

function generateSuggestions(expenses, budget, categoryTotals) {
    const suggestions = [];
    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const spendingRate = (totalSpent / budget) * 100;

    // Budget-based suggestions
    if (spendingRate > 90) {
        suggestions.push({
            type: 'warning',
            icon: 'fa-exclamation-triangle',
            message: `You've used ${spendingRate.toFixed(1)}% of your budget! Consider reducing expenses.`
        });
    } else if (spendingRate > 75) {
        suggestions.push({
            type: 'info',
            icon: 'fa-info-circle',
            message: `You've used ${spendingRate.toFixed(1)}% of your budget. Monitor your spending carefully.`
        });
    } else {
        suggestions.push({
            type: 'success',
            icon: 'fa-check-circle',
            message: `Great job! You've only used ${spendingRate.toFixed(1)}% of your budget.`
        });
    }

    // Category-based suggestions
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        const categoryPercent = ((topCategory[1] / totalSpent) * 100).toFixed(1);
        suggestions.push({
            type: 'info',
            icon: 'fa-chart-pie',
            message: `${topCategory[0]} is your biggest expense at ${categoryPercent}% of total spending.`
        });
    }

    // Savings suggestion
    const potentialSavings = budget - totalSpent;
    if (potentialSavings > 0) {
        suggestions.push({
            type: 'success',
            icon: 'fa-piggy-bank',
            message: `You could save ₹${potentialSavings.toFixed(2)} this month if you maintain current spending.`
        });
    }

    return suggestions;
}

// ==========================================
// GET DASHBOARD SUMMARY
// ==========================================

router.get('/dashboard/:userId', async (req, res) => {
    try {
        const user = await db.getUserById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const expenses = await db.getExpensesByUserId(req.params.userId);
        const budget = parseFloat(user.budget) || 50000;

        // Calculate totals
        const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const categoryTotals = calculateCategoryTotals(expenses);
        const monthlyTrends = getMonthlyTrends(expenses);
        const overspending = checkOverspending(totalSpent, budget);
        const suggestions = generateSuggestions(expenses, budget, categoryTotals);

        // Calculate savings (budget - spent)
        const savings = budget - totalSpent;

        res.json({
            summary: {
                totalSpent: totalSpent.toFixed(2),
                budget: budget.toFixed(2),
                savings: savings.toFixed(2),
                expenseCount: expenses.length,
                overspending
            },
            categoryTotals,
            monthlyTrends,
            suggestions,
            recentExpenses: expenses.slice(0, 5).map(expense => ({
                id: expense.id,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                paymentMode: expense.payment_mode
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// ==========================================
// GET DETAILED ANALYTICS
// ==========================================

router.get('/analytics/:userId', async (req, res) => {
    try {
        const expenses = await db.getExpensesByUserId(req.params.userId);
        const user = await db.getUserById(req.params.userId);
        const budget = parseFloat(user.budget) || 50000;

        const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const categoryTotals = calculateCategoryTotals(expenses);
        const monthlyTrends = getMonthlyTrends(expenses, 12);

        // Payment mode analysis
        const paymentModes = {};
        expenses.forEach(expense => {
            const mode = expense.payment_mode;
            if (!paymentModes[mode]) {
                paymentModes[mode] = 0;
            }
            paymentModes[mode] += parseFloat(expense.amount);
        });

        // Daily average
        const daysInMonth = 30;
        const dailyAverage = totalSpent / daysInMonth;

        // Category trends (month over month)
        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

        const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));
        const lastMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(lastMonth));

        const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const trendPercentage = lastMonthTotal > 0
            ? (((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(2)
            : 0;

        res.json({
            totalSpent: totalSpent.toFixed(2),
            budget: budget.toFixed(2),
            categoryTotals,
            monthlyTrends,
            paymentModes,
            dailyAverage: dailyAverage.toFixed(2),
            monthOverMonth: {
                current: currentMonthTotal.toFixed(2),
                previous: lastMonthTotal.toFixed(2),
                change: trendPercentage,
                isIncrease: currentMonthTotal > lastMonthTotal
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// ==========================================
// ADMIN: GET ALL USERS ANALYTICS
// ==========================================

router.get('/admin/analytics', async (req, res) => {
    try {
        const users = db.getAllUsers();

        const userAnalytics = await Promise.all(users.map(async user => {
            const userExpenses = db.getExpensesByUserId(user.id);
            const totalSpent = userExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const budget = parseFloat(user.budget) || 50000;

            return {
                id: user.id,
                name: user.full_name,
                email: user.email,
                totalSpent: totalSpent.toFixed(2),
                budget: budget.toFixed(2),
                expenseCount: userExpenses.length,
                isOverspending: totalSpent > budget,
                overspendingAmount: Math.max(0, totalSpent - budget).toFixed(2)
            };
        }));

        const totalAmount = userAnalytics.reduce((sum, u) => sum + parseFloat(u.totalSpent), 0);
        const totalExpenses = userAnalytics.reduce((sum, u) => sum + u.expenseCount, 0);
        const overspendingUsers = userAnalytics.filter(u => u.isOverspending).length;

        res.json({
            statistics: {
                totalUsers: users.length,
                totalExpenses,
                totalAmount: totalAmount.toFixed(2),
                overspendingUsers
            },
            userAnalytics
        });
    } catch (error) {
        console.error('Error fetching admin analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// ==========================================
// EXPORT EXPENSES TO EXCEL (Admin)
// ==========================================

router.get('/admin/export', async (req, res) => {
    try {
        const { userId } = req.query;
        const ExcelJS = require('exceljs');
        const path = require('path');
        const fs = require('fs');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Financial Report');
        sheet.views = [{ showGridLines: false }];

        // Fetch data
        let expenses = userId
            ? db.getExpensesByUserId(userId)
            : db._db.prepare("SELECT * FROM expenses").all();

        const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        let budget = 0;
        if (userId) {
            const user = db.getUserById(userId);
            budget = user ? parseFloat(user.budget || 50000) : 50000;
        } else {
            const allUsers = db.getAllUsers();
            budget = allUsers.reduce((sum, u) => sum + parseFloat(u.budget || 50000), 0);
        }
        const savings = budget - totalSpent;

        // --- STYLING MACROS ---
        sheet.properties.defaultRowHeight = 20;
        sheet.getRow(1).height = 45;
        sheet.getRow(2).height = 45;

        // Add logo
        const logoPath = path.join(__dirname, '../public/images/logo.png');
        if (fs.existsSync(logoPath)) {
            const logoId = workbook.addImage({ filename: logoPath, extension: 'png' });
            sheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 80, height: 80 } });
        }

        // Title
        sheet.mergeCells('B1:F2');
        const titleCell = sheet.getCell('B1');
        titleCell.value = 'TrackMyExpenses Financial Report';
        titleCell.font = { size: 24, bold: true, color: { argb: 'FF2D8659' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        sheet.getRow(4).height = 10;
        sheet.getRow(5).height = 25;
        sheet.getRow(6).height = 25;
        sheet.getRow(7).height = 25;

        sheet.mergeCells('A5:B5');
        sheet.getCell('A5').value = 'Total Spent:';
        sheet.getCell('A5').font = { bold: true, size: 12 };
        sheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'right' };
        sheet.getCell('C5').value = `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        sheet.getCell('C5').font = { bold: true, size: 12, color: { argb: 'FFD32F2F' } };
        sheet.getCell('C5').alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('A6:B6');
        sheet.getCell('A6').value = 'Total Budget:';
        sheet.getCell('A6').font = { bold: true, size: 12 };
        sheet.getCell('A6').alignment = { vertical: 'middle', horizontal: 'right' };
        sheet.getCell('C6').value = `₹${budget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        sheet.getCell('C6').font = { bold: true, size: 12, color: { argb: 'FF1976D2' } };
        sheet.getCell('C6').alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('A7:B7');
        sheet.getCell('A7').value = 'Total Savings:';
        sheet.getCell('A7').font = { bold: true, size: 12 };
        sheet.getCell('A7').alignment = { vertical: 'middle', horizontal: 'right' };
        sheet.getCell('C7').value = `₹${savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        sheet.getCell('C7').font = { bold: true, size: 12, color: { argb: savings >= 0 ? 'FF388E3C' : 'FFD32F2F' } };
        sheet.getCell('C7').alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        sheet.getRow(10).height = 25;
        sheet.getRow(10).values = ['ID', 'User ID', 'Amount (₹)', 'Category', 'Date', 'Payment Mode', 'Notes'];
        sheet.getRow(10).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D8659' } };
        sheet.getRow(10).alignment = { vertical: 'middle', horizontal: 'center' };

        sheet.columns = [
            { key: 'id', width: 11 },
            { key: 'userId', width: 10 },
            { key: 'amount', width: 15 },
            { key: 'category', width: 22 },
            { key: 'date', width: 18 },
            { key: 'paymentMode', width: 20 },
            { key: 'notes', width: 35 }
        ];

        let rowIndex = 11;
        expenses.forEach((e, i) => {
            const row = sheet.getRow(rowIndex);
            row.values = [e.id, e.user_id, parseFloat(e.amount || 0), e.category, e.date, e.payment_mode, e.notes];
            row.alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell(3).numFmt = '₹#,##0.00';
            if (i % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6FAF8' } };
            }
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
                };
            });
            rowIndex++;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="TrackMyExpenses-Financial-Report.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting expenses:', error);
        res.status(500).json({ message: 'Error exporting data' });
    }
});

module.exports = router;
