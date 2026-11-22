/**
 * PrepPulse QBANK - Mentor Dashboard Controller (PRD Phase 4, S7, S8, S12)
 */
(function () {
  'use strict';

  // Role Guard: Only mentors allowed!
  if (!Storage.requireAuth(['mentor'], 'mentor-login.html')) {
    return;
  }

  const esc = Components.esc;
  const currentUser = Storage.getCurrentUser();

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
    const name = currentUser ? currentUser.name : 'Ms. Rao';
    const avatar = currentUser ? currentUser.avatar : 'MR';
    document.getElementById('mentorWelcomeName').textContent = name;
    document.getElementById('mentorName').textContent = name;
    document.getElementById('mentorAvatar').textContent = avatar;
    document.getElementById('dropdownMentorName').textContent = name;
  }

  // ── SECTION 1: OVERVIEW ─────────────────────────────────────
  function renderOverview() {
    const overview = Storage.getMentorOverview();

    document.getElementById('mStatStudents').textContent = overview.totalStudents;
    document.getElementById('mStatQuestions').textContent = overview.totalQuestions;
    document.getElementById('mStatSubmissions').textContent = overview.totalSubmissions;
    document.getElementById('mStatPending').textContent = overview.pendingReviews;
    document.getElementById('mStatApproved').textContent = overview.approved;
    document.getElementById('mStatRevision').textContent = overview.needsRevision;

    // Badges
    document.getElementById('navQueueBadge').textContent = overview.pendingReviews;
    document.getElementById('queueTotalBadge').textContent = `${overview.pendingReviews} items awaiting review`;

    // Recent activity table
    const tbody = document.getElementById('mentorRecentTableBody');
    if (!overview.recentActivity.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No student submissions recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = overview.recentActivity.map(item => {
      const reviewClass = item.reviewStatus === 'approved' ? 'badge-status-approved' :
                          item.reviewStatus === 'needs_revision' ? 'badge-status-needs_revision' : 'badge-status-awaiting';
      const reviewText = item.reviewStatus === 'approved' ? 'Approved' :
                         item.reviewStatus === 'needs_revision' ? 'Needs Revision' : 'Awaiting Review';

      return `
        <tr>
          <td><strong class="text-dark">${esc(item.studentName)}</strong></td>
          <td><span class="fw-bold">${esc(item.questionTitle)}</span></td>
          <td><span class="tag">${esc(item.topic)}</span></td>
          <td><span class="badge-status badge-status-${item.status}">${item.status}</span></td>
          <td class="small text-muted">${timeAgo(item.createdAt)}</td>
          <td><span class="badge-status ${reviewClass}">${reviewText}</span></td>
          <td class="text-end">
            <a href="submission.html?id=${encodeURIComponent(item.attemptId)}" class="btn btn-pd btn-sm">
              Review →
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── SECTION 2: REVIEW QUEUE (PRD S7) ────────────────────────
  function renderReviewQueue() {
    const studentFilter = document.getElementById('queueStudentFilter').value;
    const topicFilter = document.getElementById('queueTopicFilter').value;
    const statusFilter = document.getElementById('queueStatusFilter').value;

    const queueItems = Storage.getReviewQueue({
      student: studentFilter,
      topic: topicFilter,
      status: statusFilter
    });

    const tbody = document.getElementById('queueTableBody');
    if (!queueItems.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <div class="display-6 text-success mb-2"><i class="bi bi-check-all"></i></div>
            <h3 class="h5 fw-bold">Queue is clear! 🎉</h3>
            <p class="text-muted small">No student submissions are currently awaiting review under this filter.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = queueItems.map(item => {
      const mins = Math.round((item.timeTakenSec || 60) / 60);
      const reviewClass = item.reviewStatus === 'approved' ? 'badge-status-approved' :
                          item.reviewStatus === 'needs_revision' ? 'badge-status-needs_revision' : 'badge-status-awaiting';
      const reviewText = item.reviewStatus === 'approved' ? 'Approved' :
                         item.reviewStatus === 'needs_revision' ? 'Needs Revision' : 'Awaiting Review';

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="avatar bg-primary" style="width:30px;height:30px;font-size:0.75rem;">${esc(item.studentAvatar)}</span>
              <div>
                <strong class="text-dark d-block">${esc(item.studentName)}</strong>
              </div>
            </div>
          </td>
          <td>
            <span class="fw-bold">${esc(item.questionTitle)}</span>
            <div class="small text-muted mt-1"><span class="tag">${esc(item.topic)}</span></div>
          </td>
          <td><span class="tag d-${item.difficulty}">${item.difficulty}</span></td>
          <td class="font-monospace">${mins} min</td>
          <td><span class="text-warning fw-bold">${'★'.repeat(item.confidence || 3)}</span></td>
          <td class="small text-muted">${new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          <td><span class="badge-status ${reviewClass}">${reviewText}</span></td>
          <td class="text-end">
            <a href="submission.html?id=${encodeURIComponent(item.id)}" class="btn btn-pd btn-sm">
              <i class="bi bi-pencil-square"></i> Review Submission
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Populate Queue Filter dropdowns
  function populateQueueFilters() {
    const studentSelect = document.getElementById('queueStudentFilter');
    const topicSelect = document.getElementById('queueTopicFilter');
    const crudTopicSelect = document.getElementById('crudTopicFilter');

    Storage.getUsers().filter(u => u.role === 'student').forEach(s => {
      studentSelect.insertAdjacentHTML('beforeend', `<option value="${s.id}">${esc(s.name)}</option>`);
    });

    Storage.getTopics().forEach(t => {
      topicSelect.insertAdjacentHTML('beforeend', `<option value="${esc(t)}">${esc(t)}</option>`);
      if (crudTopicSelect) crudTopicSelect.insertAdjacentHTML('beforeend', `<option value="${esc(t)}">${esc(t)}</option>`);
    });

    studentSelect.addEventListener('change', renderReviewQueue);
    topicSelect.addEventListener('change', renderReviewQueue);
    document.getElementById('queueStatusFilter').addEventListener('change', renderReviewQueue);
  }

  // ── SECTION 3: ALL SUBMISSIONS ──────────────────────────────
  function renderAllSubmissions() {
    const attempts = Storage.getAttempts();
    const tbody = document.getElementById('allSubmissionsTableBody');

    if (!attempts.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No submissions on record.</td></tr>';
      return;
    }

    tbody.innerHTML = attempts.map(a => {
      const q = Storage.getQuestionById(a.questionId);
      const student = Storage.getUserById(a.userId);
      const reviewClass = a.reviewStatus === 'approved' ? 'badge-status-approved' :
                          a.reviewStatus === 'needs_revision' ? 'badge-status-needs_revision' : 'badge-status-awaiting';
      const reviewText = a.reviewStatus === 'approved' ? 'Approved' :
                         a.reviewStatus === 'needs_revision' ? 'Needs Revision' : 'Awaiting Review';

      return `
        <tr>
          <td class="font-monospace small text-muted">${a.id}</td>
          <td><strong>${student ? esc(student.name) : 'Student'}</strong></td>
          <td>${q ? esc(q.title) : 'Question'}</td>
          <td><span class="tag">${q ? esc(q.topic) : ''}</span></td>
          <td><span class="badge-status badge-status-${a.status}">${a.status}</span></td>
          <td><span class="badge-status ${reviewClass}">${reviewText}</span></td>
          <td class="small text-muted">${new Date(a.createdAt).toLocaleDateString()}</td>
          <td class="text-end">
            <a href="submission.html?id=${encodeURIComponent(a.id)}" class="btn btn-soft btn-sm py-0 px-2">
              Inspect →
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── SECTION 4: STUDENT MANAGEMENT (PRD US-12) ───────────────
  function renderStudentManagement() {
    const studentsData = Storage.getStudentsOverview();
    const grid = document.getElementById('studentsManagementGrid');

    grid.innerHTML = studentsData.map(s => `
      <div class="col-lg-4">
        <div class="card-pd shadow-sm h-100 d-flex flex-column">
          <div class="d-flex align-items-center gap-3 mb-3">
            <span class="avatar bg-primary" style="width:48px;height:48px;font-size:1.1rem;">${esc(s.avatar)}</span>
            <div>
              <h2 class="h5 fw-bold mb-0">${esc(s.name)}</h2>
              <small class="text-muted">${esc(s.title || 'Student')}</small>
            </div>
          </div>

          <div class="row g-2 mb-3 text-center">
            <div class="col-4">
              <div class="p-2 bg-light rounded-3">
                <div class="h5 fw-bold text-success mb-0">${s.solved}</div>
                <small class="text-muted" style="font-size:0.75rem;">Solved</small>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2 bg-light rounded-3">
                <div class="h5 fw-bold text-dark mb-0">${s.attempted}</div>
                <small class="text-muted" style="font-size:0.75rem;">Attempted</small>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2 bg-light rounded-3">
                <div class="h5 fw-bold text-warning mb-0">${s.pendingReviews}</div>
                <small class="text-muted" style="font-size:0.75rem;">Pending Rev</small>
              </div>
            </div>
          </div>

          <!-- Overall Progress Bar -->
          <div class="mb-3">
            <div class="d-flex justify-content-between small mb-1">
              <span class="text-muted">Placement Readiness</span>
              <strong class="text-primary">${s.overallPct}%</strong>
            </div>
            <div class="bar">
              <span style="width:${s.overallPct}%;"></span>
            </div>
          </div>

          <!-- Struggled Questions to monitor -->
          <div class="mb-3 flex-grow-1">
            <h3 class="h6 fw-bold mb-1" style="font-size:0.8rem;">Struggled Areas (${s.struggled}):</h3>
            ${s.struggledQuestions.length ? `
              <ul class="list-unstyled small text-muted mb-0">
                ${s.struggledQuestions.slice(0, 2).map(q => `<li><i class="bi bi-exclamation-circle text-warning"></i> ${esc(q.title)}</li>`).join('')}
              </ul>
            ` : '<small class="text-muted">No struggled topics recorded.</small>'}
          </div>

          <div class="pt-2 border-top mt-auto">
            <button type="button" class="btn btn-soft btn-sm w-100 switch-to-student-btn" data-user="${s.id}">
              <i class="bi bi-box-arrow-in-right"></i> Inspect as ${esc(s.name.split(' ')[0])}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.switch-to-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uId = btn.getAttribute('data-user');
        Storage.switchUser(uId);
        Components.showToast(`Switched view to Student: ${uId}`);
        setTimeout(() => {
          window.location.href = 'student-dashboard.html';
        }, 300);
      });
    });
  }

  // ── SECTION 5: QUESTION MANAGEMENT (PRD S8) ─────────────────
  let crudQuestions = [];

  function renderCrudQuestions() {
    const term = document.getElementById('crudSearchInput').value.trim().toLowerCase();
    const topic = document.getElementById('crudTopicFilter').value;
    const all = Storage.getQuestions();

    const filtered = all.filter(q => {
      if (topic && q.topic !== topic) return false;
      if (term) {
        const corpus = (q.title + ' ' + q.prompt + ' ' + (q.tags || []).join(' ')).toLowerCase();
        if (!corpus.includes(term)) return false;
      }
      return true;
    });

    document.getElementById('crudCountSummary').textContent = `${filtered.length} of ${all.length} questions`;
    const tbody = document.getElementById('crudTableBody');

    tbody.innerHTML = filtered.slice(0, 30).map(q => `
      <tr>
        <td style="max-width: 320px;">
          <strong class="d-block text-dark">${esc(q.title)}</strong>
          <small class="text-muted d-block text-truncate" style="max-width:300px;">${esc(q.prompt)}</small>
        </td>
        <td><span class="tag">${esc(q.topic)}</span></td>
        <td><span class="tag d-${q.difficulty}">${q.difficulty}</span></td>
        <td class="small text-muted">${(q.tags || []).slice(0, 2).map(t => `#${esc(t)}`).join(' ')}</td>
        <td class="small text-muted">${(q.companies || []).slice(0, 2).join(', ')}</td>
        <td class="text-end text-nowrap">
          <a href="question-details.html?id=${encodeURIComponent(q.id)}" class="btn btn-sm btn-outline-secondary py-0 px-2" title="Preview question">
            <i class="bi bi-eye"></i>
          </a>
          <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 delete-q-btn" data-id="${esc(q.id)}" title="Delete question">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.delete-q-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete question ${qId} from the question bank?`)) {
          Storage.deleteQuestion(qId);
          Components.showToast('Question deleted from bank.');
          renderOverview();
          renderCrudQuestions();
        }
      });
    });
  }

  // Add Question Form Handler (PRD S8)
  const addModalEl = document.getElementById('addQuestionModal');
  const addModal = addModalEl ? new bootstrap.Modal(addModalEl) : null;

  document.getElementById('topbarNewQBtn')?.addEventListener('click', () => {
    if (addModal) addModal.show();
  });

  document.getElementById('saveNewQuestionBtn')?.addEventListener('click', () => {
    const title = document.getElementById('qFormTitle').value.trim();
    const topic = document.getElementById('qFormTopic').value;
    const difficulty = document.getElementById('qFormDifficulty').value;
    const prompt = document.getElementById('qFormPrompt').value.trim();
    const tagsStr = document.getElementById('qFormTags').value.trim();
    const compStr = document.getElementById('qFormCompanies').value.trim();
    const sampleInput = document.getElementById('qFormInput').value.trim();
    const sampleOutput = document.getElementById('qFormOutput').value.trim();
    const hint = document.getElementById('qFormHint').value.trim();

    if (!title || !prompt || !tagsStr) {
      alert('Please fill in all required fields (Title, Topic, Difficulty, Prompt, and at least 1 Tag).');
      return;
    }

    const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const companies = compStr ? compStr.split(',').map(s => s.trim()).filter(Boolean) : ['General'];
    const examples = (sampleInput || sampleOutput) ? [{ input: sampleInput, output: sampleOutput }] : [];
    const hints = hint ? [hint] : [];

    try {
      const newQ = Storage.addQuestion({
        title,
        topic,
        difficulty,
        prompt,
        tags,
        companies,
        examples,
        hints
      });

      if (addModal) addModal.hide();
      document.getElementById('addQuestionForm').reset();
      Components.showToast(`New question added: "${newQ.title}"! ✦`);
      renderOverview();
      renderCrudQuestions();
    } catch (err) {
      alert(err.message || 'Error saving question.');
    }
  });

  document.getElementById('crudSearchInput')?.addEventListener('input', renderCrudQuestions);
  document.getElementById('crudTopicFilter')?.addEventListener('change', renderCrudQuestions);

  // ── SECTION 6: SETTINGS ─────────────────────────────────────
  document.getElementById('saveMentorProfileBtn')?.addEventListener('click', () => {
    const newName = document.getElementById('mentorDisplayNameInput').value.trim();
    if (newName && currentUser) {
      currentUser.name = newName;
      const users = Storage.getUsers();
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx > -1) {
        users[idx].name = newName;
        localStorage.setItem(Storage.KEYS.USERS, JSON.stringify(users));
      }
      Components.showToast('Mentor profile name updated.');
      renderHeader();
    }
  });

  document.getElementById('mentorResetDataBtn')?.addEventListener('click', () => {
    if (confirm('Reset all questions, attempts, and comments back to default PRD seed data?')) {
      Storage.resetDemoData();
      Components.showToast('Demo data reset to pristine PRD defaults.');
      setTimeout(() => window.location.reload(), 400);
    }
  });

  // ── Hash View Routing ───────────────────────────────────────
  function setupRouting() {
    function updateView() {
      const hash = location.hash.slice(1) || 'overview';
      let activeView = 'overview';
      if (['overview', 'queue', 'submissions', 'students', 'questions', 'settings'].includes(hash)) {
        activeView = hash;
      }

      document.querySelectorAll('.mentor-view').forEach(viewEl => {
        viewEl.classList.toggle('d-none', viewEl.id !== `view-${activeView}`);
      });

      document.querySelectorAll('.nav-item-pd[data-view]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-view') === activeView);
      });

      if (activeView === 'overview') renderOverview();
      if (activeView === 'queue') renderReviewQueue();
      if (activeView === 'submissions') renderAllSubmissions();
      if (activeView === 'students') renderStudentManagement();
      if (activeView === 'questions') renderCrudQuestions();

      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl && window.bootstrap && bootstrap.Offcanvas) {
        const offcanvas = bootstrap.Offcanvas.getInstance(sidebarEl);
        if (offcanvas) offcanvas.hide();
      }
    }

    window.addEventListener('hashchange', updateView);
    updateView();
  }

  // Initialize
  renderHeader();
  populateQueueFilters();
  renderOverview();
  setupRouting();

})();
