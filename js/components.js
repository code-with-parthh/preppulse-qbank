/**
 * PrepPulse QBANK (PrepDeck) - Shared Navigation, Role Switcher, and UI Components
 */
(function (global) {
  'use strict';

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderDemoBar() {
    // Never inject demo bar on public landing page or dedicated login pages
    const path = (window.location.pathname || '').toLowerCase();
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/') || path.includes('login')) {
      return;
    }
    if (document.getElementById('demoRoleBanner')) return;

    const session = Storage.getSession();
    const currentUser = Storage.getCurrentUser();
    const isMentor = session.role === 'mentor';

    const bar = document.createElement('div');
    bar.id = 'demoRoleBanner';
    bar.className = 'demo-role-banner';
    bar.innerHTML = `
      <div class="container-fluid d-flex align-items-center justify-content-between flex-wrap gap-2 py-1 px-3">
        <div class="d-flex align-items-center gap-2 small">
          <span class="badge ${isMentor ? 'bg-warning text-dark' : 'bg-primary text-white'} text-uppercase fw-bold">
            <i class="bi ${isMentor ? 'bi-person-badge' : 'bi-mortarboard'}"></i> ${isMentor ? 'Mentor' : 'Student'}
          </span>
          <span class="text-white">Active User: <strong class="text-warning">${esc(currentUser ? currentUser.name : 'Guest')}</strong></span>
          <span class="badge bg-secondary d-none d-lg-inline">${esc(currentUser ? currentUser.title : '')}</span>
        </div>
        <div class="d-flex align-items-center gap-2 small flex-wrap">
          <span class="text-white-50 d-none d-sm-inline">Switch Demo User:</span>
          <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn ${currentUser && currentUser.id === 'u_nikhil' ? 'btn-light fw-bold text-primary' : 'btn-outline-light'} btn-sm demo-switch-btn" data-user="u_nikhil">Nikhil</button>
            <button type="button" class="btn ${currentUser && currentUser.id === 'u_fatima' ? 'btn-light fw-bold text-primary' : 'btn-outline-light'} btn-sm demo-switch-btn" data-user="u_fatima">Fatima</button>
            <button type="button" class="btn ${currentUser && currentUser.id === 'u_parth' ? 'btn-light fw-bold text-primary' : 'btn-outline-light'} btn-sm demo-switch-btn" data-user="u_parth">Parth</button>
            <button type="button" class="btn ${currentUser && currentUser.id === 'u_rao' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'} btn-sm demo-switch-btn" data-user="u_rao">Ms. Rao (Mentor)</button>
          </div>
          <button type="button" class="btn btn-outline-danger btn-sm ms-1" id="demoResetBtn" title="Reset all data to default PRD seed data">
            <i class="bi bi-arrow-counterclockwise"></i> Reset Data
          </button>
        </div>
      </div>
    `;

    document.body.insertBefore(bar, document.body.firstChild);

    // Event listeners
    bar.querySelectorAll('.demo-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user');
        const user = Storage.switchUser(userId);
        if (user) {
          showToast(`Switched active user to ${user.name} (${user.role.toUpperCase()})`);
          setTimeout(() => {
            // If on mentor page and switched to student -> go to student dashboard
            if (user.role === 'student' && window.location.pathname.includes('mentor')) {
              window.location.href = 'student-dashboard.html';
            } else if (user.role === 'mentor' && !window.location.pathname.includes('mentor') && !window.location.pathname.includes('submission')) {
              window.location.href = 'mentor-dashboard.html';
            } else {
              window.location.reload();
            }
          }, 300);
        }
      });
    });

    const resetBtn = bar.querySelector('#demoResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all demo questions, attempts, drafts, and mentor reviews back to PRD defaults?')) {
          Storage.resetDemoData();
          showToast('All demo data has been reset to PRD defaults!');
          setTimeout(() => window.location.reload(), 500);
        }
      });
    }
  }

  function showToast(msg, delay = 2500) {
    let toastWrap = document.querySelector('.toast-wrap');
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toast-wrap';
      toastWrap.innerHTML = '<div id="globalToast" class="toast pd-toast" role="status"><div class="toast-body" id="globalToastMsg"></div></div>';
      document.body.appendChild(toastWrap);
    }
    const toastEl = document.getElementById('globalToast') || toastWrap.querySelector('.toast');
    const toastMsg = document.getElementById('globalToastMsg') || toastWrap.querySelector('.toast-body');
    if (toastMsg) toastMsg.textContent = msg;
    if (toastEl && window.bootstrap && window.bootstrap.Toast) {
      bootstrap.Toast.getOrCreateInstance(toastEl, { delay }).show();
    }
  }

  // Update navbar unread count
  function updateUnreadBadges() {
    const session = Storage.getSession();
    if (session.role === 'student') {
      const count = Storage.getUnreadCommentCount(session.userId);
      document.querySelectorAll('.unread-comment-count').forEach(el => {
        el.textContent = count > 0 ? count : '';
        el.classList.toggle('d-none', count === 0);
      });
      const dot = document.getElementById('notifDot');
      if (dot) dot.style.display = count > 0 ? 'block' : 'none';
    } else if (session.role === 'mentor') {
      const queue = Storage.getReviewQueue({ status: 'awaiting' });
      document.querySelectorAll('.mentor-queue-count').forEach(el => {
        el.textContent = queue.length > 0 ? queue.length : '';
        el.classList.toggle('d-none', queue.length === 0);
      });
    }
  }

  // Auto-init demo bar on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderDemoBar();
      updateUnreadBadges();
    });
  } else {
    renderDemoBar();
    updateUnreadBadges();
  }

  global.Components = {
    renderDemoBar,
    showToast,
    updateUnreadBadges,
    esc
  };
})(window);
