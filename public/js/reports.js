// ==========================================
// REPORTS & ANALYTICS JAVASCRIPT
// ==========================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth();
    if (!currentUser) return;

    loadBranding();
    setupSidebarToggle();
    loadAnalytics();

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
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

async function loadAnalytics() {
    try {
        const response = await fetch(`/api/analytics/${currentUser.id}`);
        const data = await response.json();

        updateStats(data);
        renderCategoryChart(data.categoryTotals);
        renderPaymentChart(data.paymentModes);
        renderYearlyTrend(data.monthlyTrends);
        renderMonthComparison(data.monthOverMonth);
        renderTopCategories(data.categoryTotals);

    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updateStats(data) {
    document.getElementById('totalSpent').textContent = '₹' + parseFloat(data.totalSpent).toFixed(2);
    document.getElementById('dailyAvg').textContent = '₹' + parseFloat(data.dailyAverage).toFixed(2);

    const change = parseFloat(data.monthOverMonth.change);
    const sign = change >= 0 ? '+' : '';
    document.getElementById('monthChange').textContent = sign + change + '%';
    document.getElementById('monthChange').style.color = change > 0 ? 'var(--danger)' : 'var(--success)';

    // Find top payment mode
    const payments = Object.entries(data.paymentModes);
    if (payments.length > 0) {
        const top = payments.sort((a, b) => b[1] - a[1])[0];
        document.getElementById('topPayment').textContent = top[0];
    }
}

function renderCategoryChart(categoryTotals) {
    const columns = Object.entries(categoryTotals).map(([cat, amt]) => [cat, amt]);

    if (columns.length === 0) {
        document.getElementById('categoryChart').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data</p>';
        return;
    }

    c3.generate({
        bindto: '#categoryChart',
        data: {
            columns: columns,
            type: 'donut',
            colors: {
                'Food': '#D9534F',
                'Travel': '#12B886',
                'Shopping': '#C9A227',
                'Bills': '#176B4D',
                'Entertainment': '#E9A23B',
                'Health': '#087F5B',
                'Education': '#12B886',
                'Other': '#66756E'
            }
        },
        donut: {
            title: 'Breakdown'
        }
    });
}

function renderPaymentChart(paymentModes) {
    const columns = Object.entries(paymentModes).map(([mode, amt]) => [mode, amt]);

    if (columns.length === 0) {
        document.getElementById('paymentChart').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data</p>';
        return;
    }

    c3.generate({
        bindto: '#paymentChart',
        data: {
            columns: columns,
            type: 'bar',
            colors: {
                'Cash': '#D9534F',
                'UPI': '#12B886',
                'Card': '#087F5B',
                'Net Banking': '#176B4D'
            }
        },
        axis: {
            x: {
                type: 'category',
                categories: columns.map(c => c[0])
            }
        }
    });
}

function renderYearlyTrend(monthlyTrends) {
    const months = Object.keys(monthlyTrends).sort();
    const amounts = months.map(m => monthlyTrends[m]);

    if (months.length === 0) {
        document.getElementById('yearlyTrendChart').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data</p>';
        return;
    }

    const categories = months.map(m => {
        const date = new Date(m + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    c3.generate({
        bindto: '#yearlyTrendChart',
        data: {
            columns: [['Spending', ...amounts]],
            type: 'area-spline',
            colors: { 'Spending': '#087F5B' }
        },
        axis: {
            x: {
                type: 'category',
                categories: categories
            }
        }
    });
}

function renderMonthComparison(monthOverMonth) {
    const container = document.getElementById('monthCompare');
    const current = parseFloat(monthOverMonth.current);
    const previous = parseFloat(monthOverMonth.previous);
    const change = parseFloat(monthOverMonth.change);

    const arrow = change > 0 ? '↑' : '↓';
    const color = change > 0 ? 'var(--danger)' : 'var(--success)';

    container.innerHTML = `
        <div style="padding: 2rem;">
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--text-primary);">₹${current.toFixed(2)}</div>
            <div style="color: var(--text-secondary); margin-bottom: 1rem;">Current Month</div>
            
            <div style="font-size: 1.5rem; color: var(--text-secondary);">₹${previous.toFixed(2)}</div>
            <div style="color: var(--text-secondary); margin-bottom: 1rem;">Previous Month</div>
            
            <div style="font-size: 1.75rem; font-weight: 700; color: ${color};">${arrow} ${Math.abs(change).toFixed(1)}%</div>
            <div style="color: var(--text-secondary);">${change > 0 ? 'Increase' : 'Decrease'} from last month</div>
        </div>
    `;
}

function renderTopCategories(categoryTotals) {
    const container = document.getElementById('topCategories');
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No data</p>';
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

    let html = '<div style="padding: 1rem;">';
    sorted.forEach(([category, amount], index) => {
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--gray);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-secondary); width: 30px;">${index + 1}</div>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--${category.toLowerCase()}); display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas ${categoryIcons[category]}"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600;">${category}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Rank #${index + 1}</div>
                    </div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">₹${amount.toFixed(2)}</div>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}
