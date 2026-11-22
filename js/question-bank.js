/**
 * PrepPulse QBANK - Question Bank Controller (PRD S2, US-01)
 */
(function () {
  'use strict';

  const esc = Components.esc;
  const session = Storage.getSession();
  const currentUser = Storage.getCurrentUser();
  const studentId = currentUser ? currentUser.id : null;

  // Set user display
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay && currentUser) {
    userDisplay.textContent = `${currentUser.name} (${session.role.toUpperCase()})`;
  }

  // Populate Topic Filter dropdown
  const topicFilter = document.getElementById('topicFilter');
  Storage.getTopics().forEach(topic => {
    topicFilter.insertAdjacentHTML('beforeend', `<option value="${esc(topic)}">${esc(topic)}</option>`);
  });

  // Populate Company Filter dropdown
  const companyFilter = document.getElementById('companyFilter');
  Storage.getCompanies().forEach(company => {
    companyFilter.insertAdjacentHTML('beforeend', `<option value="${esc(company)}">${esc(company)}</option>`);
  });

  // URL search query param support (e.g. question-bank.html?topic=Arrays or ?search=two+sum)
  const params = new URLSearchParams(window.location.search);
  if (params.get('search')) document.getElementById('bankSearch').value = params.get('search');
  if (params.get('topic')) topicFilter.value = params.get('topic');
  if (params.get('difficulty')) document.getElementById('difficultyFilter').value = params.get('difficulty');
  if (params.get('company')) companyFilter.value = params.get('company');
  if (params.get('status')) document.getElementById('statusFilter').value = params.get('status');

  let limit = 18;

  function render() {
    const term = document.getElementById('bankSearch').value.trim().toLowerCase();
    const topic = topicFilter.value;
    const diff = document.getElementById('difficultyFilter').value;
    const company = companyFilter.value;
    const statusFilterVal = document.getElementById('statusFilter').value;

    const allQuestions = Storage.getQuestions();
    const progress = studentId ? Storage.getStudentProgress(studentId) : { statusByQuestion: {} };
    const statusMap = progress.statusByQuestion || {};

    // Filter logic
    const filtered = allQuestions.filter(q => {
      // Topic filter
      if (topic && q.topic !== topic) return false;
      // Difficulty filter
      if (diff && q.difficulty !== diff) return false;
      // Company filter
      if (company && (!Array.isArray(q.companies) || !q.companies.includes(company))) return false;
      // Status filter
      const myStatus = statusMap[q.id] || 'not_attempted';
      if (statusFilterVal) {
        if (statusFilterVal === 'attempted' && myStatus === 'not_attempted') return false;
        if (statusFilterVal === 'not_attempted' && myStatus !== 'not_attempted') return false;
        if (statusFilterVal === 'solved' && myStatus !== 'solved') return false;
        if (statusFilterVal === 'struggled' && myStatus !== 'struggled') return false;
      }
      // Keyword search (title, prompt, tags, topic, companies)
      if (term) {
        const corpus = [
          q.title,
          q.prompt,
          q.topic,
          (q.tags || []).join(' '),
          (q.companies || []).join(' ')
        ].join(' ').toLowerCase();
        if (!corpus.includes(term)) return false;
      }
      return true;
    });

    // Update counts
    document.getElementById('totalCount').textContent = allQuestions.length;
    const summaryEl = document.getElementById('resultSummary');
    const hasFilters = Boolean(term || topic || diff || company || statusFilterVal);
    document.getElementById('clearFiltersBtn').classList.toggle('d-none', !hasFilters);

    if (filtered.length === 0) {
      summaryEl.textContent = 'No questions match these filters. Try broadening your criteria.';
      document.getElementById('questionList').innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="display-6 text-muted mb-3"><i class="bi bi-funnel"></i></div>
          <h3 class="h5 fw-bold">No matching questions found</h3>
          <p class="text-muted">No questions in the bank match your active filter combinations.</p>
          <button class="btn btn-pd btn-sm" id="resetFiltersEmptyBtn">Reset All Filters</button>
        </div>
      `;
      document.getElementById('resetFiltersEmptyBtn')?.addEventListener('click', clearFilters);
      document.getElementById('loadMore').classList.add('d-none');
      return;
    }

    summaryEl.textContent = `Showing ${Math.min(limit, filtered.length)} of ${filtered.length} matching questions`;

    // Render cards
    document.getElementById('questionList').innerHTML = filtered.slice(0, limit).map(q => {
      const isBm = studentId ? Storage.isBookmarked(q.id, studentId) : false;
      const myStatus = statusMap[q.id] || 'not_attempted';

      let statusBadge = '';
      if (myStatus === 'solved') {
        statusBadge = '<span class="badge-status badge-status-solved"><i class="bi bi-check-circle-fill"></i> Solved</span>';
      } else if (myStatus === 'struggled') {
        statusBadge = '<span class="badge-status badge-status-struggled"><i class="bi bi-hourglass-split"></i> Struggled</span>';
      } else if (myStatus === 'skipped') {
        statusBadge = '<span class="badge-status badge-status-skipped"><i class="bi bi-skip-forward-fill"></i> Skipped</span>';
      } else {
        statusBadge = '<span class="badge-status badge-status-not_attempted">Not Attempted</span>';
      }

      const tagsHtml = (q.tags || []).slice(0, 3).map(t =>
        `<span class="tag clickable-tag" data-tag="${esc(t)}" title="Filter by tag #${esc(t)}">#${esc(t)}</span>`
      ).join('');

      const companiesHtml = (q.companies || []).slice(0, 2).map(c =>
        `<span class="tag tag-company">${esc(c)}</span>`
      ).join('');

      return `
        <div class="col-md-6 col-xl-4">
          <article class="q-card p-3 border rounded-3 bg-white h-100 d-flex flex-column shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span class="tag">${esc(q.topic)}</span>
                <span class="tag d-${q.difficulty}">${q.difficulty}</span>
              </div>
              ${statusBadge}
            </div>

            <h3 class="h6 fw-bold mb-2">
              <a href="question-details.html?id=${encodeURIComponent(q.id)}" class="text-dark text-decoration-none hover-primary">
                ${esc(q.title)}
              </a>
            </h3>

            <p class="text-muted small flex-grow-1" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;">
              ${esc(q.prompt)}
            </p>

            <div class="mb-2">
              ${tagsHtml}
              ${companiesHtml}
            </div>

            <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
              <a class="btn btn-pd btn-sm" href="question-details.html?id=${encodeURIComponent(q.id)}">
                <i class="bi bi-pencil-square"></i> Start Attempt
              </a>
              <button class="bm ${isBm ? 'on text-danger' : 'text-muted'}" data-bm="${esc(q.id)}" aria-label="${isBm ? 'Remove bookmark' : 'Bookmark question'}">
                <i class="bi bi-bookmark${isBm ? '-fill' : ''}"></i>
              </button>
            </div>
          </article>
        </div>
      `;
    }).join('');

    // Toggle Load More button
    document.getElementById('loadMore').classList.toggle('d-none', limit >= filtered.length);

    // Bind tag click to immediate filter
    document.querySelectorAll('.clickable-tag').forEach(tagEl => {
      tagEl.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = tagEl.getAttribute('data-tag');
        document.getElementById('bankSearch').value = tag;
        limit = 18;
        render();
      });
    });
  }

  function clearFilters() {
    document.getElementById('bankSearch').value = '';
    topicFilter.value = '';
    document.getElementById('difficultyFilter').value = '';
    companyFilter.value = '';
    document.getElementById('statusFilter').value = '';
    limit = 18;
    render();
  }

  // Event Listeners
  document.getElementById('bankSearch').addEventListener('input', () => { limit = 18; render(); });
  topicFilter.addEventListener('change', () => { limit = 18; render(); });
  document.getElementById('difficultyFilter').addEventListener('change', () => { limit = 18; render(); });
  companyFilter.addEventListener('change', () => { limit = 18; render(); });
  document.getElementById('statusFilter').addEventListener('change', () => { limit = 18; render(); });
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('loadMore').addEventListener('click', () => { limit += 18; render(); });

  // Handle bookmark button clicks
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-bm]');
    if (!btn) return;
    const qId = btn.getAttribute('data-bm');
    const isNowSaved = Storage.toggleBookmark(qId, studentId);
    Components.showToast(isNowSaved ? 'Question bookmarked for revision! ✦' : 'Bookmark removed.');
    render();
  });

  render();
})();
