/* PrepDeck Student Dashboard - vanilla JS, demo data stored in LocalStorage */

// ---- 1. Page paths: change these to match your project structure ----
const PAGES = {
  questionBank: 'question-bank.html',
  questionDetails: 'question-details.html', // opened as question-details.html?id=3
  login: '../student-login.html'
};

// ---- 2. Demo data ----
const QUESTIONS = [
  { id: 1, title: 'What is the CSS box model?', cat: 'CSS', diff: 'Easy', desc: 'Explain content, padding, border and margin.' },
  { id: 2, title: 'Difference between var, let and const', cat: 'JavaScript', diff: 'Easy', desc: 'Cover scope, hoisting and reassignment.' },
  { id: 3, title: 'Explain closures with an example', cat: 'JavaScript', diff: 'Medium', desc: 'Show how inner functions keep outer variables.' },
  { id: 4, title: 'What is semantic HTML?', cat: 'HTML', diff: 'Easy', desc: 'Why tags like <article> and <nav> matter.' },
  { id: 5, title: 'List vs tuple in Python', cat: 'Python', diff: 'Easy', desc: 'Mutability, performance and use cases.' },
  { id: 6, title: 'Reverse a linked list', cat: 'Data Structures and Algorithms', diff: 'Medium', desc: 'Iterative and recursive approaches.' },
  { id: 7, title: 'What is normalization in DBMS?', cat: 'DBMS', diff: 'Medium', desc: 'Walk through 1NF, 2NF and 3NF.' },
  { id: 8, title: 'Process vs thread', cat: 'Operating Systems', diff: 'Medium', desc: 'Memory, context switching and communication.' },
  { id: 9, title: 'Tell me about yourself', cat: 'HR', diff: 'Easy', desc: 'Build a short, confident introduction.' },
  { id: 10, title: 'Detect a cycle in a graph', cat: 'Data Structures and Algorithms', diff: 'Hard', desc: 'DFS colouring and union-find methods.' }
];
// [completed, total] per category (starting demo values)
const CATEGORY_SEED = { 'HTML': [14, 20], 'CSS': [11, 20], 'JavaScript': [9, 30], 'Python': [7, 25],
  'Data Structures and Algorithms': [4, 30], 'DBMS': [3, 15], 'Operating Systems': [2, 12], 'HR': [6, 8] };
const todayKey = () => new Date().toISOString().slice(0, 10);

// ---- 3. State (LocalStorage) ----
function loadState() {
  const saved = JSON.parse(localStorage.getItem('prepdeck_dash') || 'null');
  if (saved) return saved;
  return {
    name: localStorage.getItem('prepdeck_student_name') || 'Student',
    cats: Object.fromEntries(Object.entries(CATEGORY_SEED).map(([k, v]) => [k, v[0]])),
    counts: { solved: 56, struggled: 9, skipped: 5 },
    bookmarks: [3, 6],
    goal: 5, goalDate: todayKey(), goalDone: 2,
    activity: [
      { id: 2, status: 'solved', time: Date.now() - 3600e3 },
      { id: 8, status: 'struggled', time: Date.now() - 26 * 3600e3 },
      { id: 9, status: 'skipped', time: Date.now() - 50 * 3600e3 }
    ],
    notifs: [
      { text: 'Welcome to PrepDeck! Start with an easy question.', time: 'Just now', read: false },
      { text: 'You are on a 3-day practice streak.', time: 'Today', read: false },
      { text: 'New DBMS questions were added.', time: 'Yesterday', read: true }
    ]
  };
}
let state = loadState();
const save = () => localStorage.setItem('prepdeck_dash', JSON.stringify(state));

// Reset the daily counter when a new day starts
if (state.goalDate !== todayKey()) { state.goalDate = todayKey(); state.goalDone = 0; save(); }

// ---- 4. Helpers ----
const $ = id => document.getElementById(id);
const qById = id => QUESTIONS.find(q => q.id === id);
const detailsUrl = id => `${PAGES.questionDetails}?id=${id}`;
const totalQuestions = () => Object.values(CATEGORY_SEED).reduce((s, v) => s + v[1], 0);
const solvedTotal = () => Object.values(state.cats).reduce((s, n) => s + n, 0);
function timeAgo(t) {
  const h = Math.round((Date.now() - t) / 3600e3);
  return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
function toast(msg) {
  $('toastMsg').textContent = msg;
  bootstrap.Toast.getOrCreateInstance($('toast'), { delay: 2200 }).show();
}

// ---- 5. Render sections ----
function renderHeader() {
  $('studentName').textContent = $('welcomeName').textContent = state.name;
  $('avatar').textContent = state.name.charAt(0).toUpperCase();
  $('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function renderStats() {
  const cards = [
    ['Total Questions', totalQuestions(), 'Across 8 categories', 'bi-collection', 'ic-lav'],
    ['Solved', solvedTotal(), 'Keep it going', 'bi-check2-circle', 'ic-mint'],
    ['In Progress', state.counts.struggled, 'Marked as struggled', 'bi-hourglass-split', 'ic-peach'],
    ['Bookmarked', state.bookmarks.length, 'Saved for later', 'bi-bookmark-star', 'ic-lav']
  ];
  $('stats').innerHTML = cards.map(c => `
    <div class="col-6 col-xl-3"><div class="stat">
      <div class="stat-icon ${c[4]}"><i class="bi ${c[3]}"></i></div>
      <div><p class="stat-label">${c[0]}</p><p class="stat-num">${c[1]}</p><p class="stat-note">${c[2]}</p></div>
    </div></div>`).join('');
}

function renderLearning() {
  const { solved, struggled, skipped } = state.counts;
  const attempted = solved + struggled + skipped;
  const pct = Math.round(solvedTotal() / totalQuestions() * 100);
  const row = (label, n) => `<div class="mix"><div class="row-line"><span>${label}</span><b>${n}</b></div>
    <div class="bar"><span style="width:${attempted ? n / attempted * 100 : 0}%"></span></div></div>`;
  $('learningBody').innerHTML = row('Questions attempted', attempted) + row('Solved', solved) +
    row('Struggled', struggled) + row('Skipped', skipped) +
    `<div class="overall"><div class="row-line"><span>Overall completion</span><span class="pct">${pct}%</span></div>
    <div class="bar"><span style="width:${pct}%"></span></div></div>`;
}

function renderCategories() {
  $('categories').innerHTML = Object.entries(CATEGORY_SEED).map(([name, v]) => {
    const done = state.cats[name], pct = Math.round(done / v[1] * 100);
    return `<div class="col-md-6"><div class="cat"><div class="t">${name}</div>
      <div class="m"><span>${done} of ${v[1]} done</span><span>${pct}%</span></div>
      <div class="bar"><span style="width:${pct}%"></span></div></div></div>`;
  }).join('');
}

function renderActivity() {
  $('activity').innerHTML = state.activity.slice(0, 5).map(a => {
    const q = qById(a.id);
    return `<li><div><div class="t">${q.title}</div><div class="m">${q.cat}, ${timeAgo(a.time)}</div></div>
      <span class="badge-s s-${a.status}">${a.status[0].toUpperCase() + a.status.slice(1)}</span></li>`;
  }).join('');
}

// One reusable question card (used for Recommended and Bookmarks)
function questionCard(q) {
  const on = state.bookmarks.includes(q.id);
  return `<div class="col-md-6 col-xl-4"><div class="q-card">
    <div><span class="tag">${q.cat}</span><span class="tag d-${q.diff}">${q.diff}</span></div>
    <h3>${q.title}</h3><p>${q.desc}</p>
    <div class="q-foot"><a class="btn-soft" href="${detailsUrl(q.id)}">Start</a>
    <button class="bm ${on ? 'on' : ''}" data-bm="${q.id}" aria-label="Toggle bookmark"><i class="bi bi-bookmark${on ? '-fill' : ''}"></i></button></div>
  </div></div>`;
}
function renderRecommended() {
  // Recommend questions the student has not recently practised
  const recent = state.activity.slice(0, 3).map(a => a.id);
  $('recommended').innerHTML = QUESTIONS.filter(q => !recent.includes(q.id)).slice(0, 6).map(questionCard).join('');
}
function renderBookmarks() {
  const list = state.bookmarks.map(qById).filter(Boolean);
  $('bookmarkList').innerHTML = list.length ? list.map(questionCard).join('') :
    `<p class="text-muted">No bookmarks yet. Tap the bookmark icon on any question to save it here.</p>`;
}

function renderGoal() {
  const pct = Math.min(100, Math.round(state.goalDone / state.goal * 100));
  const reached = state.goalDone >= state.goal;
  $('goalBody').innerHTML = `
    <div class="goal-num">${state.goalDone}<small> / ${state.goal} today</small></div>
    <div class="bar mt-2"><span style="width:${pct}%"></span></div>
    ${reached ? '<div class="goal-msg">Goal reached! Great work, see you tomorrow.</div>' :
      `<p class="text-muted small mt-3 mb-0">${state.goal - state.goalDone} more to hit today's goal.</p>`}
    <div class="goal-ctl">
      <button class="btn-soft" id="logBtn">Log a solved question</button>
      <label class="small text-muted">Daily target</label>
      <input type="number" id="goalInput" min="1" max="50" value="${state.goal}" aria-label="Daily target">
      <button class="btn-soft" id="saveGoal">Save</button>
    </div>`;
  $('saveGoal').onclick = () => {
    const n = parseInt($('goalInput').value, 10);
    if (!n || n < 1 || n > 50) return toast('Enter a target between 1 and 50.');
    state.goal = n; save(); renderGoal(); toast('Daily goal saved.');
  };
  // Demo action: pretend the student solved the next recommended question
  $('logBtn').onclick = () => {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    state.cats[q.cat] = Math.min(CATEGORY_SEED[q.cat][1], state.cats[q.cat] + 1);
    state.counts.solved++; state.goalDone++;
    state.activity.unshift({ id: q.id, status: 'solved', time: Date.now() });
    save(); renderAll(); toast('Logged: ' + q.title);
  };
}

function renderNotifs() {
  const unread = state.notifs.some(n => !n.read);
  $('notifDot').style.display = unread ? 'block' : 'none';
  $('notifMenu').innerHTML = `<div class="notif-head">Notifications<button id="markRead">Mark all read</button></div>` +
    state.notifs.map(n => `<div class="notif-item ${n.read ? '' : 'unread'}">${n.text}<small>${n.time}</small></div>`).join('');
  $('markRead').onclick = () => { state.notifs.forEach(n => n.read = true); save(); renderNotifs(); };
}

function renderAll() {
  renderHeader(); renderStats(); renderLearning(); renderCategories(); renderActivity();
  renderRecommended(); renderBookmarks(); renderGoal(); renderNotifs();
}

// ---- 6. Events ----
// Bookmark toggle (event delegation: one listener for all cards)
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-bm]');
  if (!btn) return;
  const id = +btn.dataset.bm;
  state.bookmarks = state.bookmarks.includes(id) ? state.bookmarks.filter(b => b !== id) : [...state.bookmarks, id];
  save(); renderStats(); renderRecommended(); renderBookmarks();
});

// Logout: clear the demo session, then follow the link to the login page
document.querySelectorAll('[data-logout]').forEach(a => a.addEventListener('click', () => localStorage.removeItem('prepdeck_logged_in')));

// Search: filter questions by title or category
const input = $('searchInput'), results = $('searchResults');
input.addEventListener('input', () => {
  const term = input.value.trim().toLowerCase();
  if (!term) return results.classList.add('d-none');
  const hits = QUESTIONS.filter(q => (q.title + q.cat).toLowerCase().includes(term)).slice(0, 6);
  results.innerHTML = hits.length ? hits.map(q => `<a href="${detailsUrl(q.id)}">${q.title}<small>${q.cat}</small></a>`).join('') :
    '<div class="empty">No matching questions.</div>';
  results.classList.remove('d-none');
});
$('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const term = input.value.trim();
  if (term) location.href = `${PAGES.questionBank}?search=${encodeURIComponent(term)}`;
});
document.addEventListener('click', e => { if (!e.target.closest('.search')) results.classList.add('d-none'); });

// In-page views: Dashboard / My Progress / Bookmarks (driven by the URL hash)
function showView() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const view = hash === 'bookmarks' ? 'bookmarks' : 'dashboard';
  $('view-dashboard').classList.toggle('d-none', view !== 'dashboard');
  $('view-bookmarks').classList.toggle('d-none', view !== 'bookmarks');
  document.querySelectorAll('.nav-item-pd[data-view]').forEach(a => a.classList.toggle('active', a.dataset.view === hash));
  if (hash === 'progress') $('learning').scrollIntoView({ behavior: 'smooth' });
  // close the mobile sidebar after navigating
  const sb = bootstrap.Offcanvas.getInstance($('sidebar')); if (sb) sb.hide();
}
window.addEventListener('hashchange', showView);

renderAll();
showView();
