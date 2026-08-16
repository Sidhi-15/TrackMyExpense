// ==========================================
// EXPENSE TRACKING JAVASCRIPT
// ==========================================

let currentUser = null;
let allExpenses = [];
let editingExpenseId = null;

document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth();
    if (!currentUser) return;

    loadBranding();
    setupSidebarToggle();
    setupEventListeners();
    loadExpenses();

    // Set today's date as default
    document.getElementById('expenseDate').valueAsDate = new Date();

    // Hide form initially
    document.getElementById('expenseFormCard').style.display = 'none';
});

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-link');

    function closeSidebar() {
        sidebar.classList.remove('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            const isSmallScreen = window.innerWidth <= 1024;
            if (isSmallScreen) {
                closeSidebar();
            }
        });
    });
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Add expense button
    document.getElementById('addExpenseBtn').addEventListener('click', showExpenseForm);

    // Cancel button
    document.getElementById('cancelExpenseBtn').addEventListener('click', hideExpenseForm);

    // Form submission
    document.getElementById('expenseForm').addEventListener('submit', saveExpense);

    // Filters
    document.getElementById('filterCategory').addEventListener('change', filterExpenses);
    document.getElementById('filterFromDate').addEventListener('change', filterExpenses);
    document.getElementById('filterToDate').addEventListener('change', filterExpenses);
}

function showExpenseForm() {
    editingExpenseId = null;
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    document.getElementById('expenseFormCard').style.display = 'block';
    document.getElementById('expenseFormCard').scrollIntoView({ behavior: 'smooth' });
}

function hideExpenseForm() {
    document.getElementById('expenseFormCard').style.display = 'none';
    editingExpenseId = null;
}

async function loadExpenses() {
    try {
        const response = await fetch(`/api/expenses/${currentUser.id}`);
        const data = await response.json();
        allExpenses = data.expenses;
        displayExpenses(allExpenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
        document.getElementById('expensesList').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Error loading expenses</p>';
    }
}

function displayExpenses(expenses) {
    const container = document.getElementById('expensesList');

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No expenses found. Add your first expense!</p>';
        return;
    }

    const categoryIcons = {
        'Food': 'fa-utensils',
        'Travel': 'fa-car',
        'Shopping': 'fa-shopping-bag',
        'Bills': 'fa-file-invoice',
        'Entertainment': 'fa-film',
        'Health': 'fa-heartbeat',
        'Education': 'fa-graduation-cap',
        'Other': 'fa-tag'
    };

    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--light-gray); text-align: left;">
                    <th style="padding: 1rem;">Category</th>
                    <th style="padding: 1rem;">Amount</th>
                    <th style="padding: 1rem;">Date</th>
                    <th style="padding: 1rem;">Payment</th>
                    <th style="padding: 1rem;">Notes</th>
                    <th style="padding: 1rem;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        html += `
            <tr style="border-bottom: 1px solid var(--gray);">
                <td style="padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--${expense.category.toLowerCase()}); display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas ${categoryIcons[expense.category]}"></i>
                        </div>
                        <span style="font-weight: 600;">${expense.category}</span>
                    </div>
                </td>
                <td style="padding: 1rem; font-weight: 700; color: var(--danger);">₹${parseFloat(expense.amount).toFixed(2)}</td>
                <td style="padding: 1rem; color: var(--text-secondary);">${formattedDate}</td>
                <td style="padding: 1rem;">
                    <span class="badge badge-primary">${expense.paymentMode}</span>
                </td>
                <td style="padding: 1rem; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${expense.notes || '-'}</td>
                <td style="padding: 1rem;">
                    <button class="btn-icon" onclick="editExpense(${expense.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteExpense(${expense.id})" title="Delete" style="color: var(--danger);">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function saveExpense(e) {
    e.preventDefault();

    const amount = document.getElementById('expenseAmount').value;
    
    // Validation for negative amounts and alphabets
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
        alert('Please enter a valid amount. Negative numbers and alphabets are not allowed.');
        return;
    }

    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const paymentMode = document.getElementById('expensePaymentMode').value;
    const notes = document.getElementById('expenseNotes').value;

    const expenseData = {
        userId: currentUser.id,
        amount,
        category,
        date,
        paymentMode,
        notes
    };

    try {
        const url = editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses';
        const method = editingExpenseId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        if (response.ok) {
            alert(editingExpenseId ? 'Expense updated!' : 'Expense added!');
            hideExpenseForm();
            loadExpenses();
        } else {
            alert('Error saving expense');
        }
    } catch (error) {
        console.error('Error saving expense:', error);
        alert('Error saving expense');
    }
}

function editExpense(id) {
    const expense = allExpenses.find(e => e.id === id);
    if (!expense) return;

    editingExpenseId = id;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expensePaymentMode').value = expense.paymentMode;
    document.getElementById('expenseNotes').value = expense.notes;

    document.getElementById('expenseFormCard').style.display = 'block';
    document.getElementById('expenseFormCard').scrollIntoView({ behavior: 'smooth' });
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Expense deleted!');
            loadExpenses();
        } else {
            alert('Error deleting expense');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense');
    }
}

function filterExpenses() {
    const category = document.getElementById('filterCategory').value;
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;

    let filtered = allExpenses;

    if (category) {
        filtered = filtered.filter(e => e.category === category);
    }

    if (fromDate) {
        filtered = filtered.filter(e => new Date(e.date) >= new Date(fromDate));
    }

    if (toDate) {
        filtered = filtered.filter(e => new Date(e.date) <= new Date(toDate));
    }

    displayExpenses(filtered);
}
