/**
 * PrepPulse QBANK - Student Login Controller
 */
(function () {
  'use strict';

  const form = document.getElementById('studentLoginForm');
  const errorEl = document.getElementById('loginError');

  // Handle 1-click demo login buttons
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.getAttribute('data-user');
      const user = Storage.switchUser(userId);
      if (user) {
        Components.showToast(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          window.location.href = 'student-dashboard.html';
        }, 300);
      }
    });
  });

  // Handle form submission
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      const id = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!id || !password) {
        if (errorEl) {
          errorEl.textContent = 'Please enter both student ID and password.';
          errorEl.style.display = 'block';
        }
        return;
      }

      const res = Storage.login(id, password);
      if (res.success) {
        if (res.user.role === 'mentor') {
          Components.showToast(`Logged in as Mentor: ${res.user.name}`);
          setTimeout(() => {
            window.location.href = 'mentor-dashboard.html';
          }, 300);
        } else {
          Components.showToast(`Welcome back, ${res.user.name}!`);
          setTimeout(() => {
            window.location.href = 'student-dashboard.html';
          }, 300);
        }
      } else {
        if (errorEl) {
          errorEl.textContent = res.message || 'Invalid credentials. Try student1 / 123';
          errorEl.style.display = 'block';
        }
      }
    });
  }
})();
