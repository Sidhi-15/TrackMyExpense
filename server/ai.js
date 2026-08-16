// ==========================================
// AI/ML ROUTES
// Handles salary input and expense predictions
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('./db');

// ==========================================
// DEFAULT CATEGORY ALLOCATIONS (50/30/20 Rule)
// Used for new users with no expense history
// ==========================================

const DEFAULT_ALLOCATIONS = {
    'Food & Dining': { percent: 0.15, icon: '🍽️', description: 'Groceries, restaurants, snacks' },
    'Housing & Rent': { percent: 0.25, icon: '🏠', description: 'Rent, utilities, maintenance' },
    'Transport': { percent: 0.10, icon: '🚗', description: 'Fuel, public transport, cabs' },
    'Health': { percent: 0.05, icon: '💊', description: 'Medicine, gym, checkups' },
    'Shopping': { percent: 0.08, icon: '🛍️', description: 'Clothing, electronics, personal items' },
    'Entertainment': { percent: 0.05, icon: '🎬', description: 'Movies, subscriptions, hobbies' },
    'Education': { percent: 0.07, icon: '📚', description: 'Courses, books, learning' },
    'Savings': { percent: 0.20, icon: '💰', description: 'Emergency fund, investments' },
    'Other': { percent: 0.05, icon: '📦', description: 'Miscellaneous expenses' }
};

// ==========================================
// PREDICTION ENGINE
// ==========================================

async function predictExpenses(userId, salary) {
    // Get user's historical expenses
    const expenses = await db.getExpensesByUserId(userId);

    // ---- NEW USER: No historical data → use 50/30/20 defaults ----
    if (!expenses || expenses.length === 0) {
        const predictions = {};
        for (const [category, config] of Object.entries(DEFAULT_ALLOCATIONS)) {
            const amount = Math.round(salary * config.percent * 100) / 100;
            predictions[category] = {
                predictedAmount: amount,
                confidence: 0.70, // Moderate confidence for defaults
                historicalAvg: 0,
                dataPoints: 0,
                isDefault: true,
                icon: config.icon,
                description: config.description,
                percentOfSalary: (config.percent * 100).toFixed(1)
            };
        }
        return { predictions, isNewUser: true };
    }

    // ---- RETURNING USER: Blend historical patterns with salary ----
    const categoryTotals = {};
    const categoryCounts = {};
    let totalSpent = 0;

    expenses.forEach(expense => {
        const category = expense.category;
        const amount = parseFloat(expense.amount);
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
            categoryCounts[category] = 0;
        }
        categoryTotals[category] += amount;
        categoryCounts[category] += 1;
        totalSpent += amount;
    });

    // Get months of data (for monthly average calculation)
    const dates = expenses.map(e => new Date(e.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const monthsOfData = Math.max(1,
        (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        (maxDate.getMonth() - minDate.getMonth()) + 1
    );

    const monthlyAvgTotal = totalSpent / monthsOfData;

    // Salary-based scaling factor: if salary is higher, scale predictions proportionally
    const scalingFactor = monthlyAvgTotal > 0 ? Math.min(salary / monthlyAvgTotal, 1.5) : 1;

    const predictions = {};
    const categories = Object.keys(categoryTotals);

    categories.forEach(category => {
        const monthlyAvg = categoryTotals[category] / monthsOfData;
        const scaledAmount = Math.round(monthlyAvg * scalingFactor * 100) / 100;
        const confidence = Math.min(categoryCounts[category] / 10, 1);

        // Find matching default for icon/description
        const defaultInfo = Object.entries(DEFAULT_ALLOCATIONS).find(
            ([key]) => key.toLowerCase().includes(category.toLowerCase()) ||
                       category.toLowerCase().includes(key.toLowerCase().split(' ')[0])
        );

        predictions[category] = {
            predictedAmount: scaledAmount,
            confidence,
            historicalAvg: Math.round(monthlyAvg * 100) / 100,
            dataPoints: categoryCounts[category],
            isDefault: false,
            icon: defaultInfo ? defaultInfo[1].icon : '📊',
            percentOfSalary: ((scaledAmount / salary) * 100).toFixed(1)
        };
    });

    // Savings prediction
    const totalPredicted = Object.values(predictions).reduce((sum, pred) => sum + pred.predictedAmount, 0);
    const savings = salary - totalPredicted;

    predictions['Savings'] = {
        predictedAmount: Math.max(0, Math.round(savings * 100) / 100),
        confidence: 0.85,
        historicalAvg: monthlyAvgTotal > 0 ? Math.round((salary - monthlyAvgTotal) * 100) / 100 : 0,
        dataPoints: expenses.length,
        isDefault: false,
        icon: '💰',
        percentOfSalary: Math.max(0, ((savings / salary) * 100)).toFixed(1)
    };

    return { predictions, isNewUser: false, monthsOfData };
}

// ==========================================
// ADD SALARY & GENERATE PREDICTIONS
// ==========================================

router.post('/salary', async (req, res) => {
    try {
        const { userId, salary, month, year } = req.body;

        if (!userId || !salary || !month || !year) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const parsedSalary = parseFloat(salary);
        if (isNaN(parsedSalary) || parsedSalary <= 0) {
            return res.status(400).json({ message: 'Invalid salary amount' });
        }

        // Save salary
        await db.addSalary({ userId, salary: parsedSalary, month, year });

        // Generate predictions
        const { predictions, isNewUser, monthsOfData } = await predictExpenses(userId, parsedSalary);

        // Clear old predictions and save new ones
        await db.clearPredictions(userId);

        for (const [category, pred] of Object.entries(predictions)) {
            await db.addPrediction({
                userId,
                category,
                predictedAmount: pred.predictedAmount,
                confidence: pred.confidence,
                month,
                year
            });
        }

        res.json({
            message: 'Salary added and predictions generated',
            salary: parsedSalary,
            predictions,
            isNewUser,
            monthsOfData: monthsOfData || 0
        });
    } catch (error) {
        console.error('Error adding salary:', error);
        res.status(500).json({ message: 'Error processing salary and predictions' });
    }
});

// ==========================================
// GET PREDICTIONS
// ==========================================

router.get('/predictions/:userId', async (req, res) => {
    try {
        const predictions = await db.getPredictionsByUserId(req.params.userId);
        const salaries = await db.getSalariesByUserId(req.params.userId);

        // Group predictions by month/year
        const groupedPredictions = {};
        predictions.forEach(pred => {
            const key = `${pred.month}-${pred.year}`;
            if (!groupedPredictions[key]) {
                groupedPredictions[key] = [];
            }
            groupedPredictions[key].push({
                category: pred.category,
                predictedAmount: pred.predicted_amount,
                confidence: pred.confidence
            });
        });

        res.json({ predictions: groupedPredictions, salaries });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ message: 'Error fetching predictions' });
    }
});

// ==========================================
// GET PURCHASE PLAN
// ==========================================

router.post('/purchase-plan', async (req, res) => {
    try {
        const { userId, item, price, priority } = req.body;

        if (!userId || !item || !price) {
            return res.status(400).json({ message: 'User ID, item, and price are required' });
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: 'Invalid price' });
        }

        const salaries = await db.getSalariesByUserId(userId);
        const predictions = await db.getPredictionsByUserId(userId);

        if (salaries.length === 0) {
            return res.status(400).json({ message: 'Please add your salary first to get a purchase plan' });
        }

        const latestSalary = salaries[0];
        const currentPredictions = predictions.filter(p =>
            p.month === latestSalary.month && p.year === latestSalary.year
        );

        const totalPredictedExpenses = currentPredictions
            .filter(p => p.category !== 'Savings')
            .reduce((sum, pred) => sum + pred.predicted_amount, 0);

        const availableBudget = latestSalary.salary - totalPredictedExpenses;
        const monthsNeeded = availableBudget < parsedPrice
            ? Math.ceil((parsedPrice - availableBudget) / (latestSalary.salary * 0.2))
            : 0;

        const plan = {
            item,
            price: parsedPrice,
            priority: priority || 'medium',
            canAfford: availableBudget >= parsedPrice,
            availableBudget: Math.round(availableBudget * 100) / 100,
            salary: latestSalary.salary,
            recommendedSavings: Math.max(0, parsedPrice - availableBudget),
            monthlySavingsNeeded: monthsNeeded > 0 ? Math.round((parsedPrice - availableBudget) / 3 * 100) / 100 : 0,
            monthsNeeded,
            alternativeSuggestions: []
        };

        if (!plan.canAfford) {
            if (priority === 'high') {
                plan.alternativeSuggestions.push(`Save ₹${Math.round((parsedPrice - availableBudget) / 3)} extra/month for 3 months`);
                plan.alternativeSuggestions.push('Consider an EMI or financing option');
                plan.alternativeSuggestions.push('Reduce entertainment & shopping expenses temporarily');
            } else {
                plan.alternativeSuggestions.push(`You need ${monthsNeeded} more month(s) of savings`);
                plan.alternativeSuggestions.push('Consider a cheaper alternative for now');
                plan.alternativeSuggestions.push('Wait until your salary increases or expenses reduce');
            }
        } else {
            plan.alternativeSuggestions.push('✅ You can comfortably afford this purchase!');
            plan.alternativeSuggestions.push(`You'll still have ₹${Math.round(availableBudget - parsedPrice)} left after purchase`);
            plan.alternativeSuggestions.push('Consider investing the remaining budget for better returns');
        }

        res.json({ message: 'Purchase plan generated', plan });
    } catch (error) {
        console.error('Error generating purchase plan:', error);
        res.status(500).json({ message: 'Error generating purchase plan' });
    }
});

module.exports = router;