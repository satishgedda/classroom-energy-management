/* =========================================================
   ECS — Authentication Controller (Pure Firebase Auth)
   Classroom Energy Management System
   ========================================================= */

(function () {
  'use strict';

  // Email format validation regex
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Initialize icons and Firebase on DOM ready
  function initAll() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
    if (window.ecsInitFirebase) {
      window.ecsInitFirebase();
    }

    initPasswordToggles();
    initSignupForm();
    initLoginForm();
    initGoogleAuth();
    initForgotPassword();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  /* ---------------------------------------------------------
     1. Password Visibility Toggle
     --------------------------------------------------------- */
  function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle');
    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        btn.innerHTML = isPassword
          ? '<i data-lucide="eye-off"></i>'
          : '<i data-lucide="eye"></i>';

        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     2. Field Error & Alert Helpers
     --------------------------------------------------------- */
  function setFieldError(fieldId, errorMsg) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    if (input) {
      input.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) {
      errorEl.textContent = errorMsg;
      errorEl.classList.add('visible');
    }
  }

  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    if (input) {
      input.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function clearAllErrors() {
    document.querySelectorAll('.field-group input').forEach((input) => {
      input.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
    });
    document.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    const generalError = document.getElementById('generalError');
    if (generalError) {
      generalError.classList.remove('visible');
      generalError.textContent = '';
    }
  }

  function showGeneralAlert(msg, type = 'error') {
    const generalError = document.getElementById('generalError');
    if (!generalError) return;
    generalError.className = `auth-alert ${type} visible`;
    const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
    generalError.innerHTML = `<i data-lucide="${iconName}"></i> <span>${msg}</span>`;
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ---------------------------------------------------------
     3. Sign Up: Pure Firebase createUserWithEmailAndPassword()
     --------------------------------------------------------- */
  function initSignupForm() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    ['fullName', 'email', 'password', 'confirmPassword'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => clearFieldError(id));
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const fullNameInput = document.getElementById('fullName');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitBtn = document.getElementById('signupSubmitBtn');

      const fullName = fullNameInput ? fullNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

      let hasError = false;

      // 1. Full Name Validation (Required, min 2 chars)
      if (!fullName || fullName.length < 2) {
        setFieldError('fullName', 'Please enter your full name.');
        hasError = true;
      }

      // 2. Email Validation (Required, valid format)
      if (!email || !EMAIL_REGEX.test(email)) {
        setFieldError('email', 'Please enter a valid email address.');
        hasError = true;
      }

      // 3. Password Validation (Required, min 6 chars)
      if (!password || password.length < 6) {
        setFieldError('password', 'Password must be at least 6 characters.');
        hasError = true;
      }

      // 4. Confirm Password Validation (Required, must match password)
      if (!confirmPassword) {
        setFieldError('confirmPassword', 'Please confirm your password.');
        hasError = true;
      } else if (password !== confirmPassword) {
        setFieldError('confirmPassword', 'Passwords do not match.');
        hasError = true;
      }

      if (hasError) return;

      const auth = window.ecsInitFirebase ? window.ecsInitFirebase() : null;
      if (!auth) {
        showGeneralAlert('Firebase Authentication service is unavailable. Please check your network and configuration.', 'error');
        return;
      }

      setButtonLoading(submitBtn, true, 'Creating account...');

      try {
        // Direct Firebase createUserWithEmailAndPassword call
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update display name using Full Name
        if (user && user.updateProfile) {
          try {
            await user.updateProfile({ displayName: fullName });
          } catch (profileErr) {
            console.warn('Profile name update notice:', profileErr);
          }
        }

        // Establish session
        localStorage.setItem('ecs_auth', 'true');
        localStorage.setItem('ecs_user_name', fullName);
        localStorage.setItem('ecs_user_email', email);

        showSuccessAndRedirect('✓ Account created successfully');
      } catch (err) {
        console.error('Firebase registration error:', err);
        console.warn('[Firebase Auth Debug] Registration failed. Error code:', err && err.code, '| Message:', err && err.message);
        setButtonLoading(submitBtn, false, 'Create Account');

        const friendlyMsg = window.ecsGetFriendlyAuthError
          ? window.ecsGetFriendlyAuthError(err)
          : 'Unable to create account. Please try again.';

        const errCode = (err && err.code ? err.code : '').toLowerCase();
        if (errCode.includes('email-already-in-use')) {
          setFieldError('email', 'This email is already registered. Please sign in instead.');
        } else if (errCode.includes('weak-password')) {
          setFieldError('password', 'Password must be at least 6 characters.');
        } else {
          showGeneralAlert(friendlyMsg, 'error');
        }
      }
    });
  }

  /* ---------------------------------------------------------
     4. Sign In: Pure Firebase signInWithEmailAndPassword()
     --------------------------------------------------------- */
  function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    ['email', 'password'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => clearFieldError(id));
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const submitBtn = document.getElementById('loginSubmitBtn');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      let hasError = false;

      if (!email || !EMAIL_REGEX.test(email)) {
        setFieldError('email', 'Please enter a valid email address.');
        hasError = true;
      }

      if (!password) {
        setFieldError('password', 'Please enter your password.');
        hasError = true;
      }

      if (hasError) return;

      const auth = window.ecsInitFirebase ? window.ecsInitFirebase() : null;
      if (!auth) {
        showGeneralAlert('Firebase Authentication service is unavailable. Please check your network and configuration.', 'error');
        return;
      }

      setButtonLoading(submitBtn, true, 'Signing in...');

      try {
        // Direct Firebase signInWithEmailAndPassword call
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        localStorage.setItem('ecs_auth', 'true');
        localStorage.setItem('ecs_user_name', user.displayName || user.email.split('@')[0]);
        localStorage.setItem('ecs_user_email', user.email);

        showSuccessAndRedirect('✓ Signed in successfully');
      } catch (err) {
        console.error('Firebase sign-in error:', err);
        console.warn('[Firebase Auth Debug] Sign-in failed. Error code:', err && err.code, '| Message:', err && err.message);
        setButtonLoading(submitBtn, false, 'Sign In');

        const friendlyMsg = window.ecsGetFriendlyAuthError
          ? window.ecsGetFriendlyAuthError(err)
          : 'Invalid email or password.';

        showGeneralAlert(friendlyMsg, 'error');
      }
    });
  }

  /* ---------------------------------------------------------
     5. Google Authentication: Pure Firebase signInWithPopup()
     --------------------------------------------------------- */
  function initGoogleAuth() {
    const googleBtn = document.getElementById('googleSignInBtn');
    if (!googleBtn) return;

    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const auth = window.ecsInitFirebase ? window.ecsInitFirebase() : null;
      if (!auth) {
        showGeneralAlert('Firebase Authentication service is unavailable. Please check your network and configuration.', 'error');
        return;
      }

      googleBtn.disabled = true;
      const originalHtml = googleBtn.innerHTML;
      googleBtn.innerHTML = `
        <span class="spinner-border" aria-hidden="true"></span>
        <span>Connecting to Google...</span>
      `;

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        localStorage.setItem('ecs_auth', 'true');
        localStorage.setItem('ecs_user_name', user.displayName || 'Google User');
        localStorage.setItem('ecs_user_email', user.email);

        showSuccessAndRedirect('✓ Signed in with Google');
      } catch (err) {
        console.error('Firebase Google auth error:', err);
        console.warn('[Firebase Auth Debug] Google sign-in failed. Error code:', err && err.code, '| Message:', err && err.message);
        googleBtn.disabled = false;
        googleBtn.innerHTML = originalHtml;
        if (window.lucide) window.lucide.createIcons();

        const friendlyMsg = window.ecsGetFriendlyAuthError
          ? window.ecsGetFriendlyAuthError(err)
          : 'Google sign-in could not be completed. Please try again.';

        showGeneralAlert(friendlyMsg, 'error');
      }
    });
  }

  /* ---------------------------------------------------------
     6. Password Reset via Firebase sendPasswordResetEmail()
     --------------------------------------------------------- */
  function initForgotPassword() {
    const forgotLink = document.getElementById('forgotPasswordLink');
    if (!forgotLink) return;

    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const emailInput = document.getElementById('email');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email || !EMAIL_REGEX.test(email)) {
        setFieldError('email', 'Please enter your email address to receive a password reset link.');
        return;
      }

      const auth = window.ecsInitFirebase ? window.ecsInitFirebase() : null;
      if (!auth) {
        showGeneralAlert('Firebase Authentication service is unavailable.', 'error');
        return;
      }

      try {
        await auth.sendPasswordResetEmail(email);
        showGeneralAlert(`Password reset link sent to ${email}. Please check your inbox.`, 'success');
      } catch (err) {
        console.error('Password reset error:', err);
        console.warn('[Firebase Auth Debug] Password reset failed. Error code:', err && err.code, '| Message:', err && err.message);
        const friendlyMsg = window.ecsGetFriendlyAuthError
          ? window.ecsGetFriendlyAuthError(err)
          : 'Unable to send password reset email. Please try again.';
        showGeneralAlert(friendlyMsg, 'error');
      }
    });
  }

  /* ---------------------------------------------------------
     7. UI State & Redirection Utilities
     --------------------------------------------------------- */
  function setButtonLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `
        <span class="spinner-border" aria-hidden="true"></span>
        <span>${loadingText}</span>
      `;
    } else {
      btn.innerHTML = btn.dataset.originalHtml || loadingText;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function showSuccessAndRedirect(message) {
    showGeneralAlert(message, 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 700);
  }

})();
