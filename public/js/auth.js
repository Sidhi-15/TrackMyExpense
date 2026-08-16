// ==========================================
// AUTHENTICATION - CLIENT SIDE
// ==========================================

// Check if user is already logged in
function checkAuth() {
    const user = sessionStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        // If on login/signup page, redirect to dashboard
        if (window.location.pathname === '/index.html' || window.location.pathname === '/signup.html' || window.location.pathname === '/') {
            window.location.href = '/dashboard.html';
        }
        return userData;
    }
    return null;
}

// Redirect to login if not authenticated
function requireAuth() {
    const user = checkAuth();
    if (!user && window.location.pathname !== '/index.html' && window.location.pathname !== '/signup.html' && window.location.pathname !== '/') {
        window.location.href = '/index.html';
        return false;
    }
    return user;
}

// Logout function
function logout() {
    // Clear session storage immediately
    sessionStorage.removeItem('user');

    // Call logout API asynchronously without waiting
    fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(() => {
        // Ignore errors
    });

    // Redirect to login page immediately
    window.location.href = '/';
}

function updateThemeToggleUI(themeBtn, isDark) {
    if (!themeBtn) return;
    const icon = themeBtn.querySelector('i');
    const label = themeBtn.querySelector('.theme-label');
    
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (label) {
        label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
    themeBtn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
}

// Standalone theme toggle initializer — safe to call multiple times (idempotent)
function initThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    updateThemeToggleUI(themeBtn, isDark);

    if (themeBtn.dataset.bound === 'true') return;
    themeBtn.dataset.bound = 'true';

    themeBtn.addEventListener('click', function () {
        const currentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = currentlyDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);

        updateThemeToggleUI(this, nextTheme === 'dark');

        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: nextTheme } }));
    });
}

// Load custom branding
async function loadBranding() {
    // Populate greeting on every page
    try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const el = document.getElementById('userName');
        if (el && user.fullName) el.textContent = user.fullName;
        else if (el && user.email) el.textContent = user.email.split('@')[0];
    } catch(e) {}

    // Init theme toggle (idempotent — safe even if called twice)
    initThemeToggle();

    try {
        const response = await fetch('/api/branding');
        if (response.ok) {
            const branding = await response.json();

            // Update logo if exists
            const logoElements = document.querySelectorAll('#brandLogo, .brand-logo');
            if (branding.logo && logoElements.length > 0) {
                logoElements.forEach(el => { el.src = branding.logo; });
            }

            // Update title if exists
            const titleElements = document.querySelectorAll('#brandTitle, .brand-title');
            if (branding.title && titleElements.length > 0) {
                titleElements.forEach(el => { el.textContent = branding.title; });
            }

            // Update page title
            if (branding.title) {
                document.title = document.title.replace('TrackMyExpenses', branding.title);
            }
        }
    } catch (error) {
        console.log('Using default branding');
    }
}

// ==========================================
// LOGIN PAGE
// ==========================================

if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    // Check if already logged in
    checkAuth();

    // Load custom branding
    loadBranding();

    // Password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginAlert = document.getElementById('loginAlert');

            // Hide previous alerts
            loginAlert.classList.add('hidden');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Store user data in session
                    sessionStorage.setItem('user', JSON.stringify(data.user));

                    // Redirect based on role
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                } else {
                    // Show error
                    document.getElementById('loginAlertMessage').textContent = data.message || 'Invalid credentials';
                    loginAlert.classList.remove('hidden');
                }
            } catch (error) {
                document.getElementById('loginAlertMessage').textContent = 'Connection error. Please try again.';
                loginAlert.classList.remove('hidden');
            }
        });
    }

    // Forgot password link
    const forgotLink = document.getElementById('forgotPasswordLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = '/forgot-password.html';
        });
    }

}

// ==========================================
// SIGNUP PAGE
// ==========================================

if (window.location.pathname === '/signup.html') {
    // Load custom branding
    loadBranding();

    // Password toggles
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function () {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Password strength checker
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            const strengthBar = document.getElementById('passwordStrengthBar');
            const strengthText = document.getElementById('passwordStrengthText');
            const strengthContainer = document.getElementById('passwordStrength');

            if (password.length === 0) {
                strengthContainer.classList.remove('active');
                return;
            }

            strengthContainer.classList.add('active');

            let strength = 0;
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;

            // Remove all classes
            strengthBar.classList.remove('weak', 'medium', 'strong');

            if (strength <= 2) {
                strengthBar.classList.add('weak');
                strengthText.innerHTML = '<span style="color: var(--danger)">Weak</span>';
            } else if (strength <= 4) {
                strengthBar.classList.add('medium');
                strengthText.innerHTML = '<span style="color: #f57c00">Medium</span>';
            } else {
                strengthBar.classList.add('strong');
                strengthText.innerHTML = '<span style="color: #00838f">Strong</span>';
            }
        });
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;

            // Validation
            let hasError = false;

            if (!fullName.trim()) {
                document.getElementById('nameError').classList.add('active');
                hasError = true;
            } else {
                document.getElementById('nameError').classList.remove('active');
            }

            if (!email.includes('@')) {
                document.getElementById('emailError').classList.add('active');
                hasError = true;
            } else {
                document.getElementById('emailError').classList.remove('active');
            }

            if (password.length < 6) {
                document.getElementById('passwordError').classList.add('active');
                hasError = true;
            } else {
                document.getElementById('passwordError').classList.remove('active');
            }

            if (password !== confirmPassword) {
                document.getElementById('confirmPasswordError').classList.add('active');
                hasError = true;
            } else {
                document.getElementById('confirmPasswordError').classList.remove('active');
            }

            if (!agreeTerms) {
                alert('Please agree to the terms and conditions');
                hasError = true;
            }

            if (hasError) return;

            const signupAlert = document.getElementById('signupAlert');
            signupAlert.classList.add('hidden');

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fullName, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message
                    document.getElementById('signupFormContainer').classList.add('hidden');
                    document.getElementById('successMessage').classList.remove('hidden');

                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    // Show error
                    document.getElementById('signupAlertMessage').textContent = data.message || 'Error creating account';
                    signupAlert.classList.remove('hidden');
                }
            } catch (error) {
                document.getElementById('signupAlertMessage').textContent = 'Connection error. Please try again.';
                signupAlert.classList.remove('hidden');
            }
        });
    }

}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth, requireAuth, logout, loadBranding };
}
