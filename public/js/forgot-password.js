// ==========================================
// FORGOT PASSWORD PAGE - CLIENT SIDE
// ==========================================

let currentEmail = '';
let currentCode = '';

// Helper functions for step navigation
function showStep(stepNumber) {
    // Hide all steps
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.add('hidden');

    // Hide all alerts
    document.getElementById('emailAlert').classList.add('hidden');
    document.getElementById('emailSuccessAlert').classList.add('hidden');
    document.getElementById('codeAlert').classList.add('hidden');
    document.getElementById('codeSuccessAlert').classList.add('hidden');
    document.getElementById('passwordAlert').classList.add('hidden');
    document.getElementById('passwordSuccessAlert').classList.add('hidden');

    // Show requested step
    document.getElementById(`step${stepNumber}`).classList.remove('hidden');
}

// ==========================================
// STEP 1: EMAIL VERIFICATION
// ==========================================

const emailForm = document.getElementById('emailForm');
if (emailForm) {
    emailForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const emailAlert = document.getElementById('emailAlert');
        const emailSuccessAlert = document.getElementById('emailSuccessAlert');

        // Hide alerts
        emailAlert.classList.add('hidden');
        emailSuccessAlert.classList.add('hidden');

        // Basic email validation
        if (!email.includes('@')) {
            document.getElementById('emailError').classList.add('active');
            return;
        } else {
            document.getElementById('emailError').classList.remove('active');
        }

        try {
            // Disable button and show loading state
            const submitBtn = emailForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;

            if (response.ok) {
                // Store email for next step
                currentEmail = email;

                // Show success alert
                document.getElementById('emailSuccessMessage').textContent = 'Reset code sent! Check your email.';
                emailSuccessAlert.classList.remove('hidden');

                // Redirect to code verification step after 2 seconds
                setTimeout(() => {
                    document.getElementById('codeEmailDisplay').textContent = `Code sent to: ${email}`;
                    showStep(2);
                    document.getElementById('resetCode').focus();
                }, 1500);
            } else {
                // Show error
                document.getElementById('emailAlertMessage').textContent = data.message || 'Error sending reset code';
                emailAlert.classList.remove('hidden');
            }
        } catch (error) {
            document.getElementById('emailAlertMessage').textContent = 'Connection error. Please try again.';
            emailAlert.classList.remove('hidden');
        }
    });
}

// ==========================================
// STEP 2: CODE VERIFICATION
// ==========================================

const codeForm = document.getElementById('codeForm');
if (codeForm) {
    // Only digits in code input
    const resetCodeInput = document.getElementById('resetCode');
    if (resetCodeInput) {
        resetCodeInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    codeForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const code = document.getElementById('resetCode').value.trim();
        const codeAlert = document.getElementById('codeAlert');
        const codeSuccessAlert = document.getElementById('codeSuccessAlert');

        // Hide alerts
        codeAlert.classList.add('hidden');
        codeSuccessAlert.classList.add('hidden');

        // Validation
        if (code.length !== 6) {
            document.getElementById('codeError').classList.add('active');
            return;
        } else {
            document.getElementById('codeError').classList.remove('active');
        }

        try {
            // Disable button and show loading state
            const submitBtn = codeForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            const response = await fetch('/api/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: currentEmail, code }),
            });

            const data = await response.json();

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;

            if (response.ok) {
                // Store code for next step
                currentCode = code;

                // Show success alert
                document.getElementById('codeSuccessMessage').textContent = 'Code verified! Please set your new password.';
                codeSuccessAlert.classList.remove('hidden');

                // Redirect to password reset step after 1.5 seconds
                setTimeout(() => {
                    showStep(3);
                    document.getElementById('newPassword').focus();
                }, 1000);
            } else {
                // Show error
                document.getElementById('codeAlertMessage').textContent = data.message || 'Invalid code';
                codeAlert.classList.remove('hidden');
            }
        } catch (error) {
            document.getElementById('codeAlertMessage').textContent = 'Connection error. Please try again.';
            codeAlert.classList.remove('hidden');
        }
    });
}

// Resend code button
const resendCodeBtn = document.getElementById('resendCodeBtn');
if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', async function () {
        const resendAlert = document.getElementById('codeAlert');
        const successAlert = document.getElementById('codeSuccessAlert');
        
        resendAlert.classList.add('hidden');
        successAlert.classList.add('hidden');

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: currentEmail }),
            });

            if (response.ok) {
                // Clear code input
                document.getElementById('resetCode').value = '';

                // Show success message
                document.getElementById('codeSuccessMessage').textContent = 'New code sent to your email!';
                successAlert.classList.remove('hidden');

                // Scroll to top
                document.querySelector('.auth-container').scrollTop = 0;
            } else {
                document.getElementById('codeAlertMessage').textContent = 'Error resending code';
                resendAlert.classList.remove('hidden');
            }
        } catch (error) {
            document.getElementById('codeAlertMessage').textContent = 'Connection error. Please try again.';
            resendAlert.classList.remove('hidden');
        }
    });
}

// ==========================================
// STEP 3: PASSWORD RESET
// ==========================================

// Password toggle functionality
const togglePassword1 = document.getElementById('togglePassword1');
const newPasswordInput = document.getElementById('newPassword');
const togglePassword2 = document.getElementById('togglePassword2');
const confirmPasswordInput = document.getElementById('confirmPassword');

if (togglePassword1) {
    togglePassword1.addEventListener('click', function () {
        const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        newPasswordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });
}

if (togglePassword2) {
    togglePassword2.addEventListener('click', function () {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });
}

// Password strength checker
if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function () {
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

// Password reset form submission
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passwordAlert = document.getElementById('passwordAlert');
        const passwordSuccessAlert = document.getElementById('passwordSuccessAlert');

        // Hide alerts
        passwordAlert.classList.add('hidden');
        passwordSuccessAlert.classList.add('hidden');

        // Validation
        let hasError = false;

        if (newPassword.length < 6) {
            document.getElementById('passwordError').classList.add('active');
            hasError = true;
        } else {
            document.getElementById('passwordError').classList.remove('active');
        }

        if (newPassword !== confirmPassword) {
            document.getElementById('confirmPasswordError').classList.add('active');
            hasError = true;
        } else {
            document.getElementById('confirmPasswordError').classList.remove('active');
        }

        if (hasError) return;

        try {
            // Disable button and show loading state
            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: currentEmail,
                    code: currentCode,
                    newPassword
                }),
            });

            const data = await response.json();

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;

            if (response.ok) {
                // Show success message
                document.getElementById('passwordSuccessMessage').textContent = data.message || 'Password reset successfully!';
                passwordSuccessAlert.classList.remove('hidden');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                // Show error
                document.getElementById('passwordAlertMessage').textContent = data.message || 'Error resetting password';
                passwordAlert.classList.remove('hidden');
            }
        } catch (error) {
            document.getElementById('passwordAlertMessage').textContent = 'Connection error. Please try again.';
            passwordAlert.classList.remove('hidden');
        }
    });
}

// Custom styles for reset steps
const style = document.createElement('style');
style.textContent = `
    .reset-step {
        transition: opacity 0.3s ease-in-out;
    }

    .reset-step.hidden {
        display: none;
    }

    .link-btn {
        background: none;
        border: none;
        color: var(--primary);
        cursor: pointer;
        font-size: 0.9rem;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    .link-btn:hover {
        color: var(--primary-dark, #1e5631);
        text-decoration: underline;
    }

    .password-strength {
        display: none;
        margin-top: 8px;
    }

    .password-strength.active {
        display: block;
    }

    .password-strength-bar {
        height: 6px;
        background-color: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 5px;
    }

    .password-strength-bar.weak {
        background: linear-gradient(90deg, var(--danger) 33%, #e0e0e0 33%);
    }

    .password-strength-bar.medium {
        background: linear-gradient(90deg, #f57c00 66%, #e0e0e0 66%);
    }

    .password-strength-bar.strong {
        background: linear-gradient(90deg, #00838f 100%, #e0e0e0 100%);
    }

    .password-strength-text {
        font-size: 0.8rem;
        text-align: right;
    }

    .password-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .password-toggle {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-light);
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s ease;
    }

    .password-toggle:hover {
        color: var(--primary);
    }

    .form-input {
        padding-right: 45px;
    }

    .alert {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInUp 0.3s ease-out;
    }

    .alert.hidden {
        display: none;
    }

    .alert-danger {
        background-color: rgba(211, 47, 47, 0.1);
        border-left: 4px solid var(--danger);
        color: var(--danger);
    }

    .alert-success {
        background-color: rgba(45, 134, 89, 0.1);
        border-left: 4px solid var(--primary);
        color: var(--primary);
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
