/**
 * PrepPulse QBANK - Student Dashboard Controller
 * Connects directly to Storage module (PRD PST_PD_113)
 */
(function () {
  'use strict';

  // Auth Guard: Only students allowed
  if (!Storage.requireAuth(['student'], 'student-login.html')) {
    return;
  }

  const currentUser = Storage.getCurrentUser();
  const esc = Components.esc;

  function timeAgo(dateStr) {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function renderHeader() {
    const name = currentUser ? currentUser.name : 'Student';
    const avatar = currentUser ? currentUser.avatar : 'ST';
    const roleTitle = currentUser ? currentUser.title : 'Student';

    document.getElementById('welcomeName').textContent = name.split(' ')[0];
    document.getElementById('studentName').textContent = name;
    document.getElementById('avatar').textContent = avatar;
    document.getElementById('dropdownUserName').textContent = name;
    document.getElementById('dropdownUserRole').textContent = roleTitle;

    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-US', dateOptions).toUpperCase();
  }

  function renderStatsAndProgress() {
    const progress = Storage.getStudentProgress(currentUser.id);

    // Top Stats Cards
    document.getElementById('statTotal').textContent = progress.total;
    document.getElementById('statSolved').textContent = progress.solved;
    document.getElementById('statSolvedPct').textContent = `${progress.overallPct}% of bank solved`;
    document.getElementById('statAttempted').textContent = progress.attempted;
    document.getElementById('statRemaining').textContent = `${progress.remaining} questions to go`;
    document.getElementById('statReviews').textContent = progress.pendingReviews;
    document.getElementById('statUnreadNotes').textContent = `${progress.unreadComments} unread mentor feedback`;

    // Overall Progress
    document.getElementById('overallPct').textContent = `${progress.overallPct}%`;
    document.getElementById('overallBar').style.width = `${progress.overallPct}%`;

    // Topic-wise progress bars (8 topics)
    const topicContainer = document.getElementById('topicProgressBars');
    const fullTopicContainer = document.getElementById('fullTopicList');
    const topicHtml = progress.topicProgress.map(t => `
      <div class="col-md-6">
        <div class="cat p-3 border rounded-3 bg-white h-100">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-bold">${esc(t.topic)}</span>
            <span class="badge ${t.pct > 50 ? 'bg-success' : t.pct > 0 ? 'bg-primary' : 'bg-light text-muted border'}">${t.pct}%</span>
          </div>
          <div class="d-flex justify-content-between text-muted small mb-2">
            <span>${t.solved} of ${t.total} solved</span>
            ${t.struggled > 0 ? `<span class="text-warning"><i class="bi bi-hourglass-split"></i> ${t.struggled} struggled</span>` : ''}
          </div>
          <div class="bar">
            <span style="width: ${t.pct}%;"></span>
          </div>
        </div>
      </div>
    `).join('');

    if (topicContainer) topicContainer.innerHTML = topicHtml;
    if (fullTopicContainer) fullTopicContainer.innerHTML = topicHtml;

    // Difficulty Mastery Bars
    const diffContainer = document.getElementById('difficultyBars');
    if (diffContainer) {
      diffContainer.innerHTML = progress.difficultyProgress.map(d => {
        const colorClass = d.difficulty === 'Easy' ? 'bg-success' : d.difficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger';
        return `
          <div class="col-md-4">
            <div class="p-3 border rounded-3 bg-white">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="tag d-${d.difficulty}">${d.difficulty}</span>
                <span class="fw-bold">${d.solved} / ${d.total}</span>
              </div>
              <div class="bar">
                <span style="width: ${d.pct}%;" class="${colorClass}"></span>
              </div>
              <small class="text-muted d-block mt-2">${d.pct}% solved</small>
            </div>
          </div>
        `;
      }).join('');
    }

    // Recommended Question (PRD Promise: under 30s)
    const rec = progress.recommended;
    if (rec) {
      document.getElementById('recTitle').textContent = rec.title;
      document.getElementById('recPrompt').textContent = rec.prompt;
      document.getElementById('recTopicBadge').textContent = rec.topic;
      document.getElementById('recStartBtn').href = `question-details.html?id=${encodeURIComponent(rec.id)}`;
      const tagsHtml = (rec.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('') +
                       (rec.companies || []).slice(0, 2).map(c => `<span class="tag tag-company">${esc(c)}</span>`).join('');
      document.getElementById('recTags').innerHTML = tagsHtml;
    }

    // Daily Goal
    const goalBody = document.getElementById('goalBody');
    if (goalBody) {
      const target = progress.dailyTarget;
      const done = progress.todaySolvedCount;
      const goalPct = Math.min(100, Math.round((done / target) * 100));
      const reached = done >= target;

      goalBody.innerHTML = `
        <div class="goal-num">${done}<small> / ${target} solved today</small></div>
        <div class="bar mt-2">
          <span style="width: ${goalPct}%;"></span>
        </div>
        ${reached ?
          '<div class="goal-msg mt-3"><i class="bi bi-trophy-fill"></i> Daily target achieved! Awesome work.</div>' :
          `<p class="text-muted small mt-2 mb-0">${target - done} more question${target - done === 1 ? '' : 's'} to hit today's target.</p>`}
        <div class="goal-ctl mt-3">
          <a class="btn btn-pd btn-sm" href="question-bank.html"><i class="bi bi-play-fill"></i> Practice Now</a>
          <div class="d-flex align-items-center gap-1 ms-auto">
            <label class="small text-muted" for="goalInput">Goal:</label>
            <input type="number" id="goalInput" min="1" max="50" value="${target}" class="form-control form-control-sm" style="width:65px;">
            <button class="btn btn-soft btn-sm" id="saveGoalBtn">Set</button>
          </div>
        </div>
      `;

      document.getElementById('saveGoalBtn')?.addEventListener('click', () => {
        const val = parseInt(document.getElementById('goalInput').value, 10);
        if (val && val >= 1 && val <= 50) {
          localStorage.setItem(Storage.KEYS.DAILY_TARGET, val);
          Components.showToast(`Daily target set to ${val} questions!`);
          renderStatsAndProgress();
        }
      });
    }

    // Recent Practice Activity
    const attempts = Storage.getAttempts(currentUser.id);
    const activityList = document.getElementById('activityList');
    if (activityList) {
      if (attempts.length === 0) {
        activityList.innerHTML = '<li class="text-muted small py-3">No practice attempts yet. Browse the question bank to start your first question!</li>';
      } else {
        activityList.innerHTML = attempts.slice(0, 5).map(a => {
          const q = Storage.getQuestionById(a.questionId);
          if (!q) return '';
          const reviewBadgeClass = a.reviewStatus === 'approved' ? 'badge-status-approved' :
                                   a.reviewStatus === 'needs_revision' ? 'badge-status-needs_revision' : 'badge-status-awaiting';
          const reviewText = a.reviewStatus === 'approved' ? 'Approved' :
                             a.reviewStatus === 'needs_revision' ? 'Needs Revision' : 'Awaiting Review';

          return `
            <li>
              <div>
                <a href="submission.html?id=${encodeURIComponent(a.id)}" class="fw-bold text-dark text-decoration-none">
                  ${esc(q.title)}
                </a>
                <div class="m text-muted small">
                  ${esc(q.topic)} • ${Math.round(a.timeTakenSec / 60)}m • ${timeAgo(a.createdAt)}
                </div>
              </div>
              <div class="d-flex flex-column align-items-end gap-1">
                <span class="badge-status badge-status-${a.status}">${a.status}</span>
                <span class="badge-status ${reviewBadgeClass}" style="font-size:0.7rem;">${reviewText}</span>
              </div>
            </li>
          `;
        }).join('');
      }
    }

    // Struggled Questions to retry
    const struggledList = document.getElementById('struggledQuestionList');
    if (struggledList) {
      if (progress.struggledQuestions.length === 0) {
        struggledList.innerHTML = '<div class="col-12"><p class="text-muted">No struggled questions recorded. Great job!</p></div>';
      } else {
        struggledList.innerHTML = progress.struggledQuestions.map(q => `
          <div class="col-md-6 col-xl-4">
            <div class="q-card p-3 border rounded-3 bg-white h-100 d-flex flex-column">
              <div class="d-flex justify-content-between mb-2">
                <span class="tag">${esc(q.topic)}</span>
                <span class="tag d-${q.difficulty}">${q.difficulty}</span>
              </div>
              <h3 class="h6 fw-bold mb-2">${esc(q.title)}</h3>
              <p class="text-muted small flex-grow-1" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(q.prompt)}</p>
              <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <a href="question-details.html?id=${encodeURIComponent(q.id)}" class="btn btn-pd btn-sm">
                  <i class="bi bi-arrow-repeat"></i> Retry Question
                </a>
                <span class="badge-status badge-status-struggled">Struggled</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Bookmarks count
    const bookmarks = Storage.getBookmarks(currentUser.id);
    document.getElementById('bookmarkNavCount').textContent = bookmarks.length;
    renderBookmarksView();
  }

  function renderBookmarksView() {
    const listContainer = document.getElementById('bookmarkList');
    if (!listContainer) return;

    const bms = Storage.getBookmarks(currentUser.id);
    if (!bms.length) {
      listContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="display-6 text-muted mb-3"><i class="bi bi-bookmark"></i></div>
          <p class="text-muted">No saved bookmarks yet.</p>
          <a href="question-bank.html" class="btn btn-pd btn-sm">Browse Question Bank to Bookmark</a>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = bms.map(id => {
      const q = Storage.getQuestionById(id);
      if (!q) return '';
      return `
        <div class="col-md-6 col-xl-4">
          <div class="q-card p-3 border rounded-3 bg-white h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="tag">${esc(q.topic)}</span>
              <span class="tag d-${q.difficulty}">${q.difficulty}</span>
            </div>
            <h3 class="h6 fw-bold mb-2">${esc(q.title)}</h3>
            <p class="text-muted small flex-grow-1" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${esc(q.prompt)}</p>
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <a href="question-details.html?id=${encodeURIComponent(q.id)}" class="btn btn-pd btn-sm">Start Attempt</a>
              <button type="button" class="btn btn-sm btn-outline-danger remove-bm-btn" data-id="${esc(q.id)}" title="Remove bookmark">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('.remove-bm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.getAttribute('data-id');
        Storage.toggleBookmark(qId, currentUser.id);
        Components.showToast('Bookmark removed');
        renderStatsAndProgress();
      });
    });
  }

  function renderNotifications() {
    const attempts = Storage.getAttempts(currentUser.id);
    const comments = Storage.getComments();
    const studentAttemptIds = new Set(attempts.map(a => a.id));
    const studentComments = comments.filter(c => studentAttemptIds.has(c.attemptId));
    const unreadCount = studentComments.filter(c => !c.readByStudent).length;

    const notifDot = document.getElementById('notifDot');
    if (notifDot) notifDot.style.display = unreadCount > 0 ? 'block' : 'none';

    const notifList = document.getElementById('notifList');
    if (notifList) {
      if (!studentComments.length) {
        notifList.innerHTML = '<div class="p-3 text-muted small text-center">No mentor comments yet.</div>';
      } else {
        notifList.innerHTML = studentComments.slice(0, 6).map(c => {
          const attempt = Storage.getAttemptById(c.attemptId);
          const q = attempt ? Storage.getQuestionById(attempt.questionId) : null;
          return `
            <a href="submission.html?id=${encodeURIComponent(c.attemptId)}" class="notif-item text-decoration-none d-block ${!c.readByStudent ? 'unread' : ''}">
              <div class="d-flex justify-content-between align-items-center">
                <strong><i class="bi bi-chat-quote-fill text-primary"></i> ${esc(c.authorName || 'Mentor')}</strong>
                <small class="text-muted">${timeAgo(c.at)}</small>
              </div>
              <div class="text-dark small my-1 text-truncate">${esc(c.text)}</div>
              <small class="text-muted">On: ${q ? esc(q.title) : 'Attempt'}</small>
            </a>
          `;
        }).join('');
      }
    }

    document.getElementById('markReadBtn')?.addEventListener('click', () => {
      studentComments.forEach(c => Storage.markCommentsReadForAttempt(c.attemptId));
      Components.showToast('All notifications marked as read.');
      renderNotifications();
      Components.updateUnreadBadges();
    });
  }

  function setupSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const form = document.getElementById('searchForm');

    if (!input || !results) return;

    input.addEventListener('input', () => {
      const term = input.value.trim().toLowerCase();
      if (!term) {
        results.classList.add('d-none');
        return;
      }
      const questions = Storage.getQuestions();
      const hits = questions.filter(q =>
        (q.title + ' ' + q.topic + ' ' + (q.tags || []).join(' ')).toLowerCase().includes(term)
      ).slice(0, 6);

      if (!hits.length) {
        results.innerHTML = '<div class="empty">No matching questions found.</div>';
      } else {
        results.innerHTML = hits.map(q => `
          <a href="question-details.html?id=${encodeURIComponent(q.id)}" class="text-decoration-none">
            <span class="d-flex justify-content-between">
              <span>${esc(q.title)}</span>
              <span class="tag d-${q.difficulty} ms-2">${q.difficulty}</span>
            </span>
            <small class="text-muted">${esc(q.topic)} • ${(q.tags || []).slice(0, 2).join(', ')}</small>
          </a>
        `).join('');
      }
      results.classList.remove('d-none');
    });

    form?.addEventListener('submit', e => {
      e.preventDefault();
      const term = input.value.trim();
      if (term) window.location.href = `question-bank.html?search=${encodeURIComponent(term)}`;
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search')) results.classList.add('d-none');
    });
  }

  function setupSettings() {
    const nameInput = document.getElementById('settingsName');
    const goalInput = document.getElementById('settingsDailyGoal');
    if (nameInput) nameInput.value = currentUser ? currentUser.name : '';
    if (goalInput) goalInput.value = localStorage.getItem(Storage.KEYS.DAILY_TARGET) || 5;

    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      const newName = nameInput.value.trim();
      const newGoal = parseInt(goalInput.value, 10);
      if (newName && currentUser) {
        currentUser.name = newName;
        const users = Storage.getUsers();
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx > -1) {
          users[idx].name = newName;
          localStorage.setItem(Storage.KEYS.USERS, JSON.stringify(users));
        }
      }
      if (newGoal && newGoal >= 1 && newGoal <= 50) {
        localStorage.setItem(Storage.KEYS.DAILY_TARGET, newGoal);
      }
      Components.showToast('Profile settings saved successfully.');
      renderHeader();
      renderStatsAndProgress();
    });

    document.getElementById('resetDataSettingsBtn')?.addEventListener('click', () => {
      if (confirm('Reset all questions, attempts, drafts, and mentor reviews back to default PRD seed data?')) {
        Storage.resetDemoData();
        Components.showToast('All demo data has been reset to PRD defaults!');
        setTimeout(() => window.location.reload(), 500);
      }
    });
  }

  function setupViewRouting() {
    function updateView() {
      const hash = location.hash.slice(1) || 'dashboard';
      let activeView = 'dashboard';
      if (hash === 'progress') activeView = 'progress';
      else if (hash === 'bookmarks') activeView = 'bookmarks';
      else if (hash === 'settings') activeView = 'settings';

      document.getElementById('view-dashboard')?.classList.toggle('d-none', activeView !== 'dashboard');
      document.getElementById('view-progress')?.classList.toggle('d-none', activeView !== 'progress');
      document.getElementById('view-bookmarks')?.classList.toggle('d-none', activeView !== 'bookmarks');
      document.getElementById('view-settings')?.classList.toggle('d-none', activeView !== 'settings');

      document.querySelectorAll('.nav-item-pd[data-view]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-view') === activeView);
      });

      if (activeView === 'bookmarks') renderBookmarksView();
      if (activeView === 'settings') setupSettings();

      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl && window.bootstrap && bootstrap.Offcanvas) {
        const offcanvas = bootstrap.Offcanvas.getInstance(sidebarEl);
        if (offcanvas) offcanvas.hide();
      }
    }

    window.addEventListener('hashchange', updateView);
    updateView();
  }

  function setupLogout() {
    const handleLogout = (e) => {
      e.preventDefault();
      Storage.logout();
      window.location.href = 'student-login.html';
    };
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('dropdownLogoutBtn')?.addEventListener('click', handleLogout);
  }

  // Initialize all sections
  renderHeader();
  renderStatsAndProgress();
  renderNotifications();
  setupSearch();
  setupSettings();
  setupViewRouting();
  setupLogout();

})();
