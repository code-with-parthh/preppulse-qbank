/* Shared LocalStorage adapter. Replace this module with API calls when a backend is added. */
(() => {
  const KEY = 'prepdeck_data_v1';
  const QUESTION_KEY = 'prepdeck_questions_v1';
  const legacyQuestions = [
    ['What is the CSS box model?','CSS-001'], ['Difference between var, let and const','JAVA-001'],
    ['Explain closures with an example','JAVA-002'], ['What is semantic HTML?','HTML-001'],
    ['List vs tuple in Python','PYTH-001'], ['Reverse a linked list','DATA-001'],
    ['What is normalization in DBMS?','DBMS-001'], ['Process vs thread','OPER-001'],
    ['Tell me about yourself','HRIN-001'], ['Detect a cycle in a graph','DATA-016']
  ];
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
  }
  function migrate() {
    const old = (() => { try { return JSON.parse(localStorage.getItem('prepdeck_dash') || 'null'); } catch (_) { return null; } })();
    const mapped = (old?.bookmarks || []).map(n => legacyQuestions[n - 1]?.[1]).filter(Boolean);
    return {
      version: 1,
      name: localStorage.getItem('prepdeck_student_name') || old?.name || 'Student',
      dailyTarget: Number(old?.goal) > 0 ? Number(old.goal) : 5,
      bookmarks: [...new Set(mapped)], solved: [], statusById: {}, history: []
    };
  }
  let state = read() || migrate();
  state.name ||= localStorage.getItem('prepdeck_student_name') || 'Student';
  state.dailyTarget = Number(state.dailyTarget) > 0 ? Number(state.dailyTarget) : 5;
  state.bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks : [];
  state.solved = Array.isArray(state.solved) ? state.solved : [];
  state.statusById ||= {};
  state.history = Array.isArray(state.history) ? state.history : [];
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  save();
  // Keep the initial bank in LocalStorage too; this can later be replaced by an API-backed repository.
  let questionStore;
  try { questionStore = JSON.parse(localStorage.getItem(QUESTION_KEY) || 'null'); } catch (_) { questionStore = null; }
  // Refresh an earlier non-MCQ seed on existing student browsers.
  if (!Array.isArray(questionStore) || !questionStore.length || !Array.isArray(questionStore[0]?.options)) { questionStore = window.PREPDECK_QUESTIONS || []; localStorage.setItem(QUESTION_KEY, JSON.stringify(questionStore)); }
  const questions = () => questionStore;
  const byId = id => questions().find(q => q.id === id);
  const categoryNames = () => [...new Set(questions().map(q => q.category))];
  const isBookmarked = id => state.bookmarks.includes(id);
  function toggleBookmark(id) {
    state.bookmarks = isBookmarked(id) ? state.bookmarks.filter(x => x !== id) : [...state.bookmarks, id]; save();
    return isBookmarked(id);
  }
  function record(id, status) {
    if (!byId(id) || !['solved', 'struggled'].includes(status)) return false;
    const previous = state.statusById[id];
    if (previous === status) return false;
    state.statusById[id] = status;
    if (status === 'solved' && !state.solved.includes(id)) state.solved.push(id);
    if (status === 'struggled') state.solved = state.solved.filter(x => x !== id);
    state.history.unshift({ id, status, time: Date.now(), date: today() });
    localStorage.setItem('prepdeck_notif_read', 'false');
    state.history = state.history.slice(0, 500);
    save(); return previous !== status;
  }
  function setDailyTarget(n) { state.dailyTarget = Math.max(1, Math.min(50, Math.floor(n))); save(); }
  function solvedCount(category) { return state.solved.filter(id => !category || byId(id)?.category === category).length; }
  function todayDone() { return state.history.filter(e => e.status === 'solved' && e.date === today()).length; }
  function recentIds(limit = 10) { return [...new Set(state.history.slice(0, limit).map(e => e.id))]; }
  window.PrepDeck = {
    get state() { return state; }, questions, byId, categories: categoryNames,
    isBookmarked, toggleBookmark, record, setDailyTarget, solvedCount, todayDone, recentIds, save
  };
})();
