/**
 * PrepPulse QBANK - Mentor Login Controller
 */
(function () {
  'use strict';

  const form = document.getElementById('mentorLoginForm');
  const errorEl = document.getElementById('loginError');

  // Handle 1-click demo mentor button
  document.querySelectorAll('.demo-mentor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.getAttribute('data-user') || 'u_rao';
      const user = Storage.switchUser(userId);
      if (user) {
        Components.showToast(`Logged in as Mentor: ${user.name}`);
        setTimeout(() => {
          window.location.href = 'mentor-dashboard.html';
        }, 300);
      }
    });
  });

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
          errorEl.textContent = 'Please enter both mentor ID and password.';
          errorEl.style.display = 'block';
        }
        return;
      }

      const res = Storage.login(id, password);
      if (res.success) {
        if (res.user.role === 'mentor') {
          Components.showToast(`Welcome, Mentor ${res.user.name}!`);
          setTimeout(() => {
            window.location.href = 'mentor-dashboard.html';
          }, 300);
        } else {
          // A student tried logging in via mentor portal
          if (errorEl) {
            errorEl.textContent = `${res.user.name} has a Student account. Please sign in via Student Login.`;
            errorEl.style.display = 'block';
          }
        }
      } else {
        if (errorEl) {
          errorEl.textContent = res.message || 'Invalid mentor credentials. Try mentor1 / 123';
          errorEl.style.display = 'block';
        }
      }
    });
  }
})();
