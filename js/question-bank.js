(() => {
  const data = window.PrepDeck, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params = new URLSearchParams(location.search);
  $('studentName').textContent = data.state.name;
  data.categories().forEach(c => $('categoryFilter').insertAdjacentHTML('beforeend', `<option value="${esc(c)}">${esc(c)}</option>`));
  $('bankSearch').value = params.get('search') || '';
  let limit = 18;
  function render() {
    const term = $('bankSearch').value.trim().toLowerCase(), cat = $('categoryFilter').value, diff = $('difficultyFilter').value;
    const all = data.questions().filter(q => (!cat || q.category === cat) && (!diff || q.difficulty === diff) && (!term || [q.title,q.category,q.description].join(' ').toLowerCase().includes(term)));
    $('totalCount').textContent = data.questions().length;
    $('resultSummary').textContent = `Showing ${Math.min(limit, all.length)} of ${all.length} matching questions`;
    $('questionList').innerHTML = all.slice(0,limit).map(q => `<div class="col-md-6 col-xl-4"><article class="q-card"><div><span class="tag">${esc(q.category)}</span><span class="tag d-${esc(q.difficulty)}">${esc(q.difficulty)}</span><span class="tag">MCQ</span></div><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><div class="q-foot"><a class="btn-soft" href="question-details.html?id=${encodeURIComponent(q.id)}">Start Practicing</a><button class="bm ${data.isBookmarked(q.id)?'on':''}" data-bm="${esc(q.id)}" aria-label="${data.isBookmarked(q.id)?'Remove bookmark':'Bookmark question'}"><i class="bi bi-bookmark${data.isBookmarked(q.id)?'-fill':''}"></i></button></div></article></div>`).join('') || '<div class="col-12"><p class="text-muted">No questions match these filters.</p></div>';
    $('loadMore').classList.toggle('d-none', limit >= all.length);
  }
  $('bankSearch').addEventListener('input', () => { limit=18; render(); });
  $('categoryFilter').addEventListener('change', () => { limit=18; render(); });
  $('difficultyFilter').addEventListener('change', () => { limit=18; render(); });
  $('loadMore').addEventListener('click', () => { limit+=18; render(); });
  document.addEventListener('click', e => { const b=e.target.closest('[data-bm]'); if (!b) return; data.toggleBookmark(b.dataset.bm); render(); });
  render();
})();
