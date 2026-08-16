// ==========================================
// DASHBOARD JAVASCRIPT
// ==========================================

let currentUser = null;
let dashboardData = null;

// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // Require authentication
    currentUser = requireAuth();
    if (!currentUser) return;

    // Load branding
    loadBranding();

    // Display user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.fullName || currentUser.email?.split('@')[0] || 'User';
    }

    // Show admin panel link if user is admin
    if (currentUser.role === 'admin') {
        const adminNavLink = document.getElementById('adminNavLink');
        if (adminNavLink) {
            adminNavLink.innerHTML = '<a href="/admin.html" class="nav-link"><i class="fas fa-cog"></i><span>Admin Panel</span></a>';
        }
    }

    // Load dashboard data
    loadDashboardData();

    // Setup event listeners
    setupEventListeners();
});

// ==========================================
// LOAD DASHBOARD DATA
// ==========================================

async function loadDashboardData() {
    try {
        const response = await fetch(`/api/dashboard/${currentUser.id}`);
        const data = await response.json();

        dashboardData = data;

        // Update UI
        updateStats(data.summary);
        updateBudgetProgress(data.summary);
        renderAlerts(data.summary.overspending);
        renderCategoryChart(data.categoryTotals);
        renderTrendChart(data.monthlyTrends);
        renderSuggestions(data.suggestions);
        renderRecentTransactions(data.recentExpenses);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data');
    }
}

// ==========================================
// UPDATE STATS CARDS
// ==========================================

function updateStats(summary) {
    // Animate number counting
    animateNumber('totalSpent', 0, parseFloat(summary.totalSpent), '₹');
    animateNumber('totalSavings', 0, parseFloat(summary.savings), '₹');
    animateNumber('totalBudget', 0, parseFloat(summary.budget), '₹');
    animateNumber('expenseCount', 0, summary.expenseCount, '');
}

function animateNumber(elementId, start, end, prefix = '') {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = start + (end - start) * progress;
        element.textContent = prefix + current.toFixed(2);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ==========================================
// UPDATE BUDGET PROGRESS
// ==========================================

function updateBudgetProgress(summary) {
    const spent = parseFloat(summary.totalSpent);
    const budget = parseFloat(summary.budget);
    const percentage = Math.min((spent / budget) * 100, 100);

    const progressBar = document.getElementById('budgetProgressBar');

    // Set color based on percentage
    let gradient = 'var(--success-gradient)';
    if (percentage > 90) {
        gradient = 'var(--danger-gradient)';
    } else if (percentage > 75) {
        gradient = 'var(--warning-gradient)';
    }

    progressBar.style.background = gradient;

    // Animate width
    setTimeout(() => {
        progressBar.style.width = percentage + '%';
    }, 100);

    document.getElementById('budgetSpentLabel').textContent = `Spent: ₹${spent.toFixed(2)}`;
    document.getElementById('budgetRemainingLabel').textContent = `Remaining: ₹${(budget - spent).toFixed(2)}`;
}

// ==========================================
// RENDER ALERTS
// ==========================================

function renderAlerts(overspending) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';

    if (overspending.isOverspending) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger animate-fade-in-up';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Overspending Alert!</strong> You've exceeded your budget by ₹${Math.abs(overspending.amount)}.
                Consider reviewing your expenses and cutting back on non-essential spending.
            </div>
        `;
        container.appendChild(alert);
    } else if (overspending.percentage > 90) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning animate-fade-in-up';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <div>
                <strong>Budget Warning!</strong> You've used ${overspending.percentage}% of your budget.
                Be mindful of your spending for the rest of the month.
            </div>
        `;
        container.appendChild(alert);
    }
}

// ==========================================
// RENDER CHARTS
// ==========================================

function renderCategoryChart(categoryTotals) {
    const categoryColors = {
        'Food': '#D9534F',
        'Travel': '#12B886',
        'Shopping': '#C9A227',
        'Bills': '#176B4D',
        'Entertainment': '#E9A23B',
        'Health': '#087F5B',
        'Education': '#12B886',
        'Other': '#66756E'
    };

    const columns = Object.entries(categoryTotals).map(([category, amount]) => [category, amount]);

    if (columns.length === 0) {
        document.getElementById('categoryChart').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No expenses yet</p>';
        return;
    }

    c3.generate({
        bindto: '#categoryChart',
        data: {
            columns: columns,
            type: 'donut',
            colors: categoryColors
        },
        donut: {
            title: 'Expenses',
            label: {
                format: function (value, ratio, id) {
                    return '₹' + value.toFixed(0);
                }
            }
        },
        legend: {
            position: 'bottom'
        }
    });
}

function renderTrendChart(monthlyTrends) {
    const months = Object.keys(monthlyTrends).sort().reverse().slice(0, 6).reverse();
    const amounts = months.map(month => monthlyTrends[month]);

    if (months.length === 0) {
        document.getElementById('trendChart').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data yet</p>';
        return;
    }

    const data = ['Spending', ...amounts];
    const categories = months.map(m => {
        const date = new Date(m + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    c3.generate({
        bindto: '#trendChart',
        data: {
            columns: [data],
            type: 'area-spline',
            colors: {
                'Spending': '#087F5B'
            }
        },
        axis: {
            x: {
                type: 'category',
                categories: categories
            },
            y: {
                tick: {
                    format: function (d) {
                        return '₹' + d.toFixed(0);
                    }
                }
            }
        },
        grid: {
            y: {
                show: true
            }
        },
        point: {
            r: 4
        }
    });
}

// ==========================================
// RENDER SUGGESTIONS
// ==========================================

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No suggestions available</p>';
        return;
    }

    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = `suggestion-item ${suggestion.type}`;
        item.innerHTML = `
            <i class="${suggestion.icon} suggestion-icon"></i>
            <p class="suggestion-text">${suggestion.message}</p>
        `;
        container.appendChild(item);
    });
}

// ==========================================
// RENDER RECENT TRANSACTIONS
// ==========================================

function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No transactions yet</p>';
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

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'transaction-item';

        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        item.innerHTML = `
            <div class="transaction-left">
                <div class="transaction-icon category-${transaction.category.toLowerCase()}">
                    <i class="fas ${categoryIcons[transaction.category] || 'fa-tag'}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.category}</h4>
                    <p>${formattedDate} • ${transaction.paymentMode}</p>
                </div>
            </div>
            <div class="transaction-amount">-₹${parseFloat(transaction.amount).toFixed(2)}</div>
        `;

        container.appendChild(item);
    });
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        logout();
    });

    // Download Summary Button
    const downloadBtn = document.getElementById('downloadSummaryBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadSummaryReport);
    }

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-link');

    // Function to close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
    }

    // Function to open sidebar
    function openSidebar() {
        sidebar.classList.add('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
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

    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            // Only close sidebar on mobile (when it's not already hidden by CSS)
            const isSmallScreen = window.innerWidth <= 1024;
            if (isSmallScreen) {
                closeSidebar();
            }
        });
    });

    // Re-render C3 charts when theme changes
    window.addEventListener('themeChanged', function () {
        if (dashboardData && window.c3) {
            setTimeout(() => {
                renderCategoryChart(dashboardData.categoryTotals);
                renderTrendChart(dashboardData.monthlyTrends);
            }, 50);
        }
    });
}

// Helper to convert image URL to base64 for jsPDF
function getBase64Image(url) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = function() {
            resolve(null); // Return null on error so it doesn't break PDF
        };
        img.src = url;
    });
}

// ==========================================
// DOWNLOAD SUMMARY REPORT
// ==========================================

async function downloadSummaryReport() {
    if (!dashboardData) {
        alert('No data available to download');
        return;
    }

    try {
        const btn = document.getElementById('downloadSummaryBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        btn.disabled = true;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const summary = dashboardData.summary;
        const date = new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 0;

        // --- CREATIVE HEADER ---
        // Header Background Solid Color
        doc.setFillColor(33, 43, 54); 
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Load Logo 
        try {
            const logoImg = document.querySelector('.sidebar-logo img') || document.querySelector('.logo img');
            const logoUrl = logoImg ? logoImg.src : '/images/logo.png';
            const logoBase64 = await getBase64Image(logoUrl);
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 15, 8, 24, 24);
            }
        } catch(e) { console.log('Logo load failed', e); }

        // Application Name & Title in header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('TrackMyExpenses', 45, 20);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Monthly Financial Dashboard Report', 45, 28);
        
        // Reset text color for body
        doc.setTextColor(50, 50, 50);
        yPosition = 55;

        // --- REPORT METADATA ---
        doc.setFontSize(10);
        doc.text(`Generated For: ${currentUser.fullName}`, 15, yPosition);
        doc.text(`Date: ${date}`, pageWidth - 15, yPosition, { align: 'right' });
        
        yPosition += 10;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 15;

        // --- FINANCIAL OVERVIEW CARDS ---
        const totalSpent = parseFloat(summary.totalSpent || 0);
        const budget = parseFloat(summary.budget || 0);
        const savings = parseFloat(summary.savings || 0);
        const budgetUsed = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
        
        // Card 1: Total Spent
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(15, yPosition, 55, 30, 3, 3, 'F');
        doc.setFontSize(10);
        doc.text('Total Spent', 42.5, yPosition + 10, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(220, 53, 69); // Red
        doc.text(`Rs. ${totalSpent.toFixed(2)}`, 42.5, yPosition + 22, { align: 'center' });

        // Card 2: Monthly Budget
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(75, yPosition, 60, 30, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text('Monthly Budget', 105, yPosition + 10, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 141, 188); // Blue
        doc.text(`Rs. ${budget.toFixed(2)}`, 105, yPosition + 22, { align: 'center' });

        // Card 3: Savings
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(140, yPosition, 55, 30, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text('Total Savings', 167.5, yPosition + 10, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(46, 134, 89); // Green
        doc.text(`Rs. ${savings.toFixed(2)}`, 167.5, yPosition + 22, { align: 'center' });

        yPosition += 45;

        // --- BUDGET STATUS ---
        doc.setTextColor(33, 43, 54);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Budget Status', 15, yPosition);
        yPosition += 8;

        // Progress bar background
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(15, yPosition, pageWidth - 30, 8, 4, 4, 'F');
        
        // Progress bar fill
        const progressWidth = Math.min((pageWidth - 30) * (budgetUsed / 100), pageWidth - 30);
        if (progressWidth > 0) {
            if (budgetUsed > 90) doc.setFillColor(220, 53, 69); // Red
            else if (budgetUsed > 75) doc.setFillColor(255, 193, 7); // Yellow
            else doc.setFillColor(46, 134, 89); // Green
            doc.roundedRect(15, yPosition, progressWidth, 8, 4, 4, 'F');
        }

        yPosition += 15;
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`${budgetUsed}% of budget used`, 15, yPosition);
        
        let statusText = 'Excellent! You are well within your budget.';
        if (budgetUsed > 100) statusText = 'Warning: You have exceeded your monthly budget!';
        else if (budgetUsed > 80) statusText = 'Caution: You are nearing your monthly budget limit.';
        
        doc.text(statusText, pageWidth - 15, yPosition, { align: 'right' });
        yPosition += 20;

        // --- EXPENSES BY CATEGORY ---
        doc.setTextColor(33, 43, 54);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Spending by Category', 15, yPosition);
        yPosition += 10;

        const categories = Object.entries(dashboardData.categoryTotals || {}).sort((a,b) => b[1] - a[1]);
        if (categories.length > 0) {
            // Draw table header
            doc.setFillColor(240, 240, 240);
            doc.rect(15, yPosition, pageWidth - 30, 10, 'F');
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(50, 50, 50);
            doc.text('Category', 20, yPosition + 7);
            doc.text('Amount', 130, yPosition + 7);
            doc.text('% of Total', 170, yPosition + 7);
            yPosition += 12;

            doc.setFont(undefined, 'normal');
            categories.forEach(([category, amount], index) => {
                const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                
                // Zebra striping
                if (index % 2 === 0) {
                    doc.setFillColor(252, 252, 252);
                    doc.rect(15, yPosition - 3, pageWidth - 30, 8, 'F');
                }

                doc.text(category, 20, yPosition + 2);
                doc.text(`Rs. ${amount.toFixed(2)}`, 130, yPosition + 2);
                doc.text(`${percentage}%`, 170, yPosition + 2);
                yPosition += 8;
            });
        } else {
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text('No expenses recorded yet.', 15, yPosition);
            yPosition += 10;
        }

        yPosition += 15;

        // --- CHARTS ---
        const categoryChartEl = document.getElementById('categoryChart');
        const trendChartEl = document.getElementById('trendChart');

        if (categoryChartEl && categoryChartEl.querySelector('svg')) {
            if (yPosition > pageHeight - 100) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(33, 43, 54);
            doc.text('Visual Analytics', 15, yPosition);
            yPosition += 10;

            const categoryCanvas = await html2canvas(categoryChartEl, { backgroundColor: '#ffffff', scale: 2 });
            const imgWidth = (pageWidth - 40) / 2; // Half width for side-by-side
            const imgHeight = (categoryCanvas.height * imgWidth) / categoryCanvas.width;

            doc.setFontSize(11);
            doc.text('Category Distribution', 15, yPosition);
            doc.addImage(categoryCanvas.toDataURL('image/png'), 'PNG', 15, yPosition + 5, imgWidth, Math.min(imgHeight, 60));

            if (trendChartEl && trendChartEl.querySelector('svg')) {
                const trendCanvas = await html2canvas(trendChartEl, { backgroundColor: '#ffffff', scale: 2 });
                const trendHeight = (trendCanvas.height * imgWidth) / trendCanvas.width;
                
                doc.text('Spending Trends', pageWidth / 2 + 5, yPosition);
                doc.addImage(trendCanvas.toDataURL('image/png'), 'PNG', pageWidth / 2 + 5, yPosition + 5, imgWidth, Math.min(trendHeight, 60));
            }
        }

        // --- FOOTER ON ALL PAGES ---
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const finalY = pageHeight - 15;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(15, finalY - 5, pageWidth - 15, finalY - 5);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`TrackMyExpenses - Empowering your financial freedom | Page ${i} of ${pageCount}`, pageWidth / 2, finalY, { align: 'center' });
        }

        // Save PDF
        const fileName = `TrackMyExpenses_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        // Success UI
        btn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        btn.style.background = 'var(--success-gradient)';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please try again.');
        const btn = document.getElementById('downloadSummaryBtn');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}
