// CHATBOT ROUTES - AI-powered financial assistant
const express = require('express');
const router = express.Router();
const db = require('./db');

async function processMessage(message, userId) {
    const lowerMessage = message.toLowerCase();
    const user = await db.getUserById(userId);
    const expenses = await db.getExpensesByUser(userId);
    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const budget = parseFloat(user ? user.budget : 0) || 50000;

    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(expense.amount);
    });

    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|greetings)/)) {
        return {
            message: "Hello! I'm your financial assistant. I can help you understand your spending, provide budget advice, and suggest ways to save money. What would you like to know?",
            suggestions: ['How much did I spend?', 'Am I overspending?', 'Budget tips', 'Savings ideas']
        };
    }

    // Total spending
    if (lowerMessage.includes('how much') && (lowerMessage.includes('spent') || lowerMessage.includes('spend'))) {
        return {
            message: `You've spent a total of Rs.${totalSpent.toFixed(2)} out of your Rs.${budget.toFixed(2)} budget. That's ${((totalSpent / budget) * 100).toFixed(1)}% of your budget.`,
            suggestions: ['Category breakdown', 'Am I overspending?', 'How can I save?']
        };
    }

    // Category breakdown
    if (lowerMessage.includes('category') || lowerMessage.includes('breakdown')) {
        const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        let breakdown = "Here's your spending by category:\n\n";
        sorted.forEach(([category, amount]) => {
            breakdown += `${category}: Rs.${amount.toFixed(2)} (${((amount / totalSpent) * 100).toFixed(1)}%)\n`;
        });
        return { message: breakdown, suggestions: ['How can I cut costs?', 'Budget tips'] };
    }

    // Overspending
    if (lowerMessage.includes('overspending') || lowerMessage.includes('over budget')) {
        const remaining = budget - totalSpent;
        if (totalSpent > budget) {
            return {
                message: `Yes, you're overspending by Rs.${Math.abs(remaining).toFixed(2)}. Consider reviewing your expenses and cutting back on non-essential spending.`,
                suggestions: ['How can I save?', 'Budget tips']
            };
        } else if (totalSpent > budget * 0.9) {
            return {
                message: `You're close to your limit! You have Rs.${remaining.toFixed(2)} remaining. Be careful with your spending.`,
                suggestions: ['Savings tips', 'Category breakdown']
            };
        } else {
            return {
                message: `No, you're doing great! You have Rs.${remaining.toFixed(2)} remaining in your budget.`,
                suggestions: ['Savings ideas', 'Category breakdown']
            };
        }
    }

    // Budget advice
    if (lowerMessage.includes('budget') && (lowerMessage.includes('advice') || lowerMessage.includes('tip'))) {
        const tips = [
            'Follow the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.',
            'Track every expense, no matter how small.',
            'Set clear financial goals for each month.',
            'Use budget alerts to stay informed about your spending.'
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        return {
            message: `Here's a budget tip for you:\n\n${randomTip}\n\nYour current spending is ${((totalSpent / budget) * 100).toFixed(1)}% of your budget.`,
            suggestions: ['Savings ideas', 'How can I save?']
        };
    }

    // Savings
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
        return {
            message: "Here are personalized savings suggestions:\n\nCook at home more often and reduce eating out.\nUse public transportation or carpool.\nCancel unused subscriptions.\nCompare prices before buying.\nUse cashback and rewards programs.",
            suggestions: ['Am I overspending?', 'Budget tips']
        };
    }

    // Default
    return {
        message: `I understand you're asking about "${message}". I can help you with:\n\nChecking your total spending\nAnalyzing spending by category\nIdentifying overspending\nProviding budget advice\nSuggesting ways to save money\n\nWhat would you like to know?`,
        suggestions: ['How much did I spend?', 'Am I overspending?', 'Savings tips', 'Category breakdown']
    };
}

router.post('/chatbot', async (req, res) => {
    try {
        const { message, userId } = req.body;
        if (!message || !userId) {
            return res.status(400).json({ message: 'Message and userId are required' });
        }
        const response = await processMessage(message, userId);
        res.json({
            userMessage: message,
            botMessage: response.message,
            suggestions: response.suggestions || []
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            message: 'Sorry, I encountered an error. Please try again.',
            botMessage: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
            suggestions: []
        });
    }
});

module.exports = router;
