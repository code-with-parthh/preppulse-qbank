/**
 * PrepPulse QBANK - Question Details & Solution Editor Controller (PRD S3, S4)
 */
(function () {
  'use strict';

  const esc = Components.esc;
  const session = Storage.getSession();
  const currentUser = Storage.getCurrentUser();
  const studentId = currentUser ? currentUser.id : null;

  if (document.getElementById('studentName') && currentUser) {
    document.getElementById('studentName').textContent = currentUser.name;
  }

  // Parse ID from URL
  const params = new URLSearchParams(window.location.search);
  const allQuestions = Storage.getQuestions();
  let questionId = params.get('id');
  let qIndex = allQuestions.findIndex(q => q.id === questionId);
  if (qIndex === -1) {
    qIndex = 0;
    questionId = allQuestions[0].id;
  }
  const q = allQuestions[qIndex];

  // ── Render Question Info (PRD S3) ───────────────────────────
  function renderQuestionDetails() {
    document.title = `${q.title} | PrepDeck`;
    document.getElementById('breadcrumbTopic').textContent = q.topic;
    document.getElementById('breadcrumbTitle').textContent = q.title;

    document.getElementById('qTopic').textContent = q.topic;
    const diffEl = document.getElementById('qDifficulty');
    diffEl.textContent = q.difficulty;
    diffEl.className = `tag d-${q.difficulty}`;

    // My Status badge
    const progress = studentId ? Storage.getStudentProgress(studentId) : null;
    const myStatus = (progress && progress.statusByQuestion) ? progress.statusByQuestion[q.id] : null;
    const statusContainer = document.getElementById('qMyStatusBadge');
    if (myStatus === 'solved') {
      statusContainer.innerHTML = '<span class="badge-status badge-status-solved"><i class="bi bi-check-circle-fill"></i> Solved</span>';
    } else if (myStatus === 'struggled') {
      statusContainer.innerHTML = '<span class="badge-status badge-status-struggled"><i class="bi bi-hourglass-split"></i> Struggled</span>';
    } else if (myStatus === 'skipped') {
      statusContainer.innerHTML = '<span class="badge-status badge-status-skipped"><i class="bi bi-skip-forward-fill"></i> Skipped</span>';
    } else {
      statusContainer.innerHTML = '<span class="badge-status badge-status-not_attempted">Not Attempted</span>';
    }

    // Companies
    const companiesContainer = document.getElementById('qCompanies');
    if (companiesContainer && Array.isArray(q.companies) && q.companies.length) {
      companiesContainer.innerHTML = q.companies.map(c => `<span class="tag tag-company">${esc(c)}</span>`).join('');
    }

    document.getElementById('qTitle').textContent = q.title;
    document.getElementById('qPrompt').textContent = q.prompt;

    // Examples
    const exContainer = document.getElementById('qExamples');
    if (exContainer) {
      if (Array.isArray(q.examples) && q.examples.length) {
        exContainer.innerHTML = q.examples.map((ex, idx) => `
          <div class="mb-2 p-3 bg-light rounded-3 border">
            <div class="small fw-bold text-muted mb-1">Example ${idx + 1}:</div>
            <div class="font-monospace small mb-1"><strong>Input:</strong> ${esc(ex.input)}</div>
            <div class="font-monospace small"><strong>Output:</strong> ${esc(ex.output)}</div>
            ${ex.explanation ? `<div class="small text-muted mt-1"><strong>Explanation:</strong> ${esc(ex.explanation)}</div>` : ''}
          </div>
        `).join('');
      } else {
        exContainer.innerHTML = '<p class="text-muted small">No specific example provided.</p>';
      }
    }

    // Collapsible Hints (PRD Section 13: Native <details><summary>)
    const hintsContainer = document.getElementById('qHints');
    if (hintsContainer) {
      if (Array.isArray(q.hints) && q.hints.length) {
        hintsContainer.innerHTML = q.hints.map((hint, idx) => `
          <details>
            <summary><i class="bi bi-lightbulb-fill text-warning me-1"></i> Hint ${idx + 1} (Click to reveal)</summary>
            <p>${esc(hint)}</p>
          </details>
        `).join('');
      } else {
        hintsContainer.innerHTML = '<p class="text-muted small">No hints available for this question.</p>';
      }
    }

    // Tags
    const tagsContainer = document.getElementById('qTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = (q.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('');
    }

    // Previous Attempt History
    const historyContainer = document.getElementById('qAttemptHistory');
    if (historyContainer && studentId) {
      const attempts = Storage.getAttemptsForQuestion(q.id, studentId);
      if (!attempts.length) {
        historyContainer.innerHTML = '<p class="text-muted mb-0">No previous attempts recorded yet.</p>';
      } else {
        historyContainer.innerHTML = `
          <div class="list-group list-group-flush border rounded-3">
            ${attempts.map(a => {
              const reviewClass = a.reviewStatus === 'approved' ? 'badge-status-approved' :
                                  a.reviewStatus === 'needs_revision' ? 'badge-status-needs_revision' : 'badge-status-awaiting';
              const reviewText = a.reviewStatus === 'approved' ? 'Approved' :
                                 a.reviewStatus === 'needs_revision' ? 'Needs Revision' : 'Awaiting Review';
              return `
                <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2 py-2">
                  <div>
                    <span class="badge-status badge-status-${a.status}">${a.status}</span>
                    <span class="badge-status ${reviewClass} ms-1">${reviewText}</span>
                    <small class="text-muted ms-2">${new Date(a.createdAt).toLocaleDateString()} (${Math.round(a.timeTakenSec / 60)}m)</small>
                  </div>
                  <a href="submission.html?id=${encodeURIComponent(a.id)}" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size:0.75rem;">
                    View Submission →
                  </a>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    // Pager
    document.getElementById('qPagerIndex').textContent = `Question ${qIndex + 1} of ${allQuestions.length}`;
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (qIndex > 0) {
      prevBtn.href = `question-details.html?id=${encodeURIComponent(allQuestions[qIndex - 1].id)}`;
      prevBtn.classList.remove('disabled');
    } else {
      prevBtn.classList.add('disabled');
    }
    if (qIndex < allQuestions.length - 1) {
      nextBtn.href = `question-details.html?id=${encodeURIComponent(allQuestions[qIndex + 1].id)}`;
      nextBtn.classList.remove('disabled');
    } else {
      nextBtn.classList.add('disabled');
    }

    // Bookmark button
    updateBookmarkButton();
  }

  function updateBookmarkButton() {
    const btn = document.getElementById('qBookmarkBtn');
    if (!btn || !studentId) return;
    const isSaved = Storage.isBookmarked(q.id, studentId);
    if (isSaved) {
      btn.className = 'btn btn-outline-danger btn-sm';
      btn.innerHTML = '<i class="bi bi-bookmark-fill"></i> <span class="d-none d-sm-inline">Bookmarked</span>';
    } else {
      btn.className = 'btn btn-outline-secondary btn-sm';
      btn.innerHTML = '<i class="bi bi-bookmark"></i> <span class="d-none d-sm-inline">Bookmark</span>';
    }
  }

  document.getElementById('qBookmarkBtn')?.addEventListener('click', () => {
    if (!studentId) return;
    const isSaved = Storage.toggleBookmark(q.id, studentId);
    updateBookmarkButton();
    Components.showToast(isSaved ? 'Question bookmarked for revision! ✦' : 'Bookmark removed.');
  });

  // ── Timer Logic (PRD US-02) ─────────────────────────────────
  let timerSeconds = 0;
  let timerInterval = null;
  let isTimerRunning = false;

  function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    document.getElementById('timerText').textContent = formatTime(timerSeconds);
  }

  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    document.getElementById('timerIcon').className = 'bi bi-pause-fill';
    document.getElementById('timerActionText').textContent = 'Pause';
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function pauseTimer() {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timerIcon').className = 'bi bi-play-fill';
    document.getElementById('timerActionText').textContent = 'Resume';
  }

  document.getElementById('timerToggleBtn')?.addEventListener('click', () => {
    if (isTimerRunning) pauseTimer();
    else startTimer();
  });

  document.getElementById('timerResetBtn')?.addEventListener('click', () => {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
  });

  // ── Editor & Auto-save Drafts (PRD S4, US-03) ────────────────
  const textarea = document.getElementById('solutionTextarea');
  const langSelect = document.getElementById('languageSelect');
  const charCountEl = document.getElementById('charCount');
  const charCounterWrap = document.getElementById('charCounter');
  const draftStatusBadge = document.getElementById('draftStatusBadge');

  // Tab key inserts 4 spaces (PRD Section 13: prevents keyboard trap)
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      const tabEnabled = document.getElementById('tabKeyToggle').checked;
      if (tabEnabled) {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        updateCharCount();
      }
    }
  });

  function updateCharCount() {
    const len = textarea.value.length;
    charCountEl.textContent = len.toLocaleString();
    if (len > 5000) {
      charCounterWrap.classList.add('text-danger');
      charCounterWrap.innerHTML = `<strong>${len.toLocaleString()}</strong> / 5,000 characters (Exceeded maximum!)`;
    } else {
      charCounterWrap.classList.remove('text-danger');
      charCounterWrap.innerHTML = `<span>${len.toLocaleString()}</span> / 5,000 characters`;
    }
  }

  let autoSaveTimeout = null;
  function triggerAutoSave() {
    if (!studentId) return;
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      Storage.saveDraft(q.id, {
        text: textarea.value,
        language: langSelect.value,
        startedAt: new Date().toISOString()
      }, studentId);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      draftStatusBadge.innerHTML = `<i class="bi bi-cloud-check-fill text-success"></i> Draft auto-saved at ${timeStr}`;
    }, 1500);
  }

  textarea.addEventListener('input', () => {
    updateCharCount();
    // Auto start timer on typing if not started
    if (!isTimerRunning && textarea.value.trim().length > 0) {
      startTimer();
    }
    triggerAutoSave();
  });

  document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
    if (!studentId) return;
    Storage.saveDraft(q.id, {
      text: textarea.value,
      language: langSelect.value,
      startedAt: new Date().toISOString()
    }, studentId);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    draftStatusBadge.innerHTML = `<i class="bi bi-cloud-check-fill text-success"></i> Draft saved at ${timeStr}`;
    Components.showToast('Draft saved successfully.');
  });

  // Check for restored draft (PRD Section 11)
  function checkExistingDraft() {
    if (!studentId) return;
    const draft = Storage.getDraft(q.id, studentId);
    if (draft && draft.text && draft.text.trim().length > 0) {
      textarea.value = draft.text;
      if (draft.language) langSelect.value = draft.language;
      updateCharCount();
      const savedTime = draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently';
      document.getElementById('draftRestoredMsg').textContent = `Restored your unsaved draft from ${savedTime}.`;
      document.getElementById('draftRestoredAlert').classList.remove('d-none');
      draftStatusBadge.innerHTML = `<i class="bi bi-cloud-check text-primary"></i> Draft restored`;
    }
  }

  document.getElementById('discardDraftBtn')?.addEventListener('click', () => {
    if (confirm('Discard your restored draft and start fresh?')) {
      Storage.deleteDraft(q.id, studentId);
      textarea.value = '';
      updateCharCount();
      document.getElementById('draftRestoredAlert').classList.add('d-none');
      draftStatusBadge.innerHTML = `<i class="bi bi-check2"></i> Fresh draft`;
      Components.showToast('Draft discarded.');
    }
  });

  // ── Submit Attempt Modal Logic (PRD S4, US-04) ───────────────
  const submitModalEl = document.getElementById('submitAttemptModal');
  const submitModal = submitModalEl ? new bootstrap.Modal(submitModalEl) : null;

  document.getElementById('openSubmitModalBtn')?.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) {
      Components.showToast('Please write your solution approach before submitting.');
      textarea.focus();
      return;
    }
    if (text.length > 5000) {
      Components.showToast('Solution exceeds maximum allowed length of 5,000 characters.');
      textarea.focus();
      return;
    }
    // Pause timer while reviewing submission modal
    pauseTimer();
    document.getElementById('modalTimeTakenDisplay').textContent = formatTime(timerSeconds);
    if (submitModal) submitModal.show();
  });

  // Confidence star rating selection
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      document.getElementById('confidenceValue').value = val;
      document.querySelectorAll('.star-btn').forEach(b => {
        const bVal = parseInt(b.getAttribute('data-val'), 10);
        b.classList.toggle('active', bVal <= val);
      });
    });
  });

  document.getElementById('confirmSubmitBtn')?.addEventListener('click', () => {
    const text = textarea.value.trim();
    const statusRadio = document.querySelector('input[name="attemptStatusRadio"]:checked');
    const status = statusRadio ? statusRadio.value : 'solved';
    const confidence = parseInt(document.getElementById('confidenceValue').value, 10) || 3;
    const language = langSelect.value;
    const timeTakenSec = timerSeconds > 0 ? timerSeconds : 60; // minimum 1 min if not recorded

    try {
      const attempt = Storage.createAttempt({
        questionId: q.id,
        userId: studentId,
        status,
        confidence,
        timeTakenSec,
        language,
        text
      });

      if (submitModal) submitModal.hide();
      Components.showToast('Solution submitted for review! Redirecting to submission view... ✦');
      setTimeout(() => {
        window.location.href = `submission.html?id=${encodeURIComponent(attempt.id)}`;
      }, 500);
    } catch (err) {
      Components.showToast(err.message || 'Error submitting attempt.');
    }
  });

  // Initialize
  renderQuestionDetails();
  checkExistingDraft();
})();
