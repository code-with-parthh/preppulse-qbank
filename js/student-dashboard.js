/* PrepDeck dashboard: all learning metrics come from explicit practice history. */
const PAGES = { questionBank: 'question-bank.html', questionDetails: 'question-details.html', login: '../student-login.html' };
const data = window.PrepDeck;
const $ = id => document.getElementById(id);
const qById = id => data.byId(id);
const detailsUrl = id => `${PAGES.questionDetails}?id=${encodeURIComponent(id)}`;
const totalQuestions = () => data.questions().length;
const solvedTotal = () => data.solvedCount();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function timeAgo(t) { const h=Math.max(0,Math.round((Date.now()-t)/3600000)); return h<1?'Just now':h<24?`${h}h ago`:`${Math.round(h/24)}d ago`; }
function toast(msg) { $('toastMsg').textContent=msg; bootstrap.Toast.getOrCreateInstance($('toast'),{delay:2200}).show(); }
function renderHeader() {
  $('studentName').textContent=$('welcomeName').textContent=data.state.name;
  $('avatar').textContent=(data.state.name||'S').charAt(0).toUpperCase();
  $('todayDate').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function renderStats() {
  const struggled=Object.values(data.state.statusById).filter(s=>s==='struggled').length;
  const cards=[['Total Questions',totalQuestions(),'Across 12 categories','bi-collection','ic-lav'],['Solved',solvedTotal(),'Unique questions solved','bi-check2-circle','ic-mint'],['In Progress',struggled,'Marked as struggled','bi-hourglass-split','ic-peach'],['Bookmarked',data.state.bookmarks.length,'Saved for later','bi-bookmark-star','ic-lav']];
  $('stats').innerHTML=cards.map(c=>`<div class="col-6 col-xl-3"><div class="stat"><div class="stat-icon ${c[4]}"><i class="bi ${c[3]}"></i></div><div><p class="stat-label">${c[0]}</p><p class="stat-num">${c[1]}</p><p class="stat-note">${c[2]}</p></div></div></div>`).join('');
}
function renderLearning() {
  const solved=solvedTotal(), struggled=Object.values(data.state.statusById).filter(s=>s==='struggled').length, attempted=Object.keys(data.state.statusById).length, pct=totalQuestions()?Math.round(solved/totalQuestions()*100):0;
  const row=(label,n)=>`<div class="mix"><div class="row-line"><span>${label}</span><b>${n}</b></div><div class="bar"><span style="width:${attempted?n/attempted*100:0}%"></span></div></div>`;
  $('learningBody').innerHTML=row('Questions attempted',attempted)+row('Solved',solved)+row('Struggled',struggled)+`<div class="overall"><div class="row-line"><span>Overall completion</span><span class="pct">${pct}%</span></div><div class="bar"><span style="width:${pct}%"></span></div></div>`;
}
function renderCategories() {
  $('categories').innerHTML=data.categories().map(name=>{const total=data.questions().filter(q=>q.category===name).length,done=data.solvedCount(name),pct=total?Math.round(done/total*100):0;return `<div class="col-md-6"><div class="cat"><div class="t">${esc(name)}</div><div class="m"><span>${done} of ${total} done</span><span>${pct}%</span></div><div class="bar"><span style="width:${pct}%"></span></div></div></div>`;}).join('');
}
function renderActivity() {
  $('activity').innerHTML=data.state.history.slice(0,5).map(a=>{const q=qById(a.id);if(!q)return '';return `<li><div><div class="t">${esc(q.title)}</div><div class="m">${esc(q.category)}, ${timeAgo(a.time)}</div></div><span class="badge-s s-${a.status}">${a.status[0].toUpperCase()+a.status.slice(1)}</span></li>`;}).join('')||'<li class="text-muted">Your practice activity will appear here.</li>';
}
function questionCard(q) {const on=data.isBookmarked(q.id);return `<div class="col-md-6 col-xl-4"><div class="q-card"><div><span class="tag">${esc(q.category)}</span><span class="tag d-${q.difficulty}">${q.difficulty}</span><span class="tag">MCQ</span></div><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><div class="q-foot"><a class="btn-soft" href="${detailsUrl(q.id)}">Start</a><button class="bm ${on?'on':''}" data-bm="${q.id}" aria-label="Toggle bookmark"><i class="bi bi-bookmark${on?'-fill':''}"></i></button></div></div></div>`;}
function renderRecommended() {const recent=data.recentIds(6);$('recommended').innerHTML=data.questions().filter(q=>!recent.includes(q.id)&&!data.state.solved.includes(q.id)).slice(0,6).map(questionCard).join('')||'<p class="text-muted">You have worked through every question. Browse the Question Bank to review them.</p>';}
function renderBookmarks() {const list=data.state.bookmarks.map(qById).filter(Boolean);$('bookmarkList').innerHTML=list.length?list.map(questionCard).join(''):'<p class="text-muted">No bookmarks yet. Tap the bookmark icon on any question to save it here.</p>';}
function renderGoal() {
  const target=data.state.dailyTarget, done=data.todayDone(), pct=Math.min(100,Math.round(done/target*100)), reached=done>=target;
  $('goalBody').innerHTML=`<div class="goal-num">${done}<small> / ${target} today</small></div><div class="bar mt-2"><span style="width:${pct}%"></span></div>${reached?'<div class="goal-msg">Goal reached! Great work, see you tomorrow.</div>':`<p class="text-muted small mt-3 mb-0">${target-done} more to hit today’s goal.</p>`}<div class="goal-ctl"><a class="btn-soft" href="question-bank.html">Practice a question</a><label class="small text-muted" for="goalInput">Daily target</label><input type="number" id="goalInput" min="1" max="50" value="${target}" aria-label="Daily target"><button class="btn-soft" id="saveGoal">Save</button></div>`;
  $('saveGoal').onclick=()=>{const n=parseInt($('goalInput').value,10);if(!n||n<1||n>50)return toast('Enter a target between 1 and 50.');data.setDailyTarget(n);renderGoal();toast('Daily goal saved.');};
}
function renderNotifs() {const unread=localStorage.getItem('prepdeck_notif_read')==='false'&&data.state.history.length>0;$('notifDot').style.display=unread?'block':'none';const items=data.state.history.slice(0,4).map(e=>{const q=qById(e.id);return q?`<div class="notif-item ${unread?'unread':''}">${esc(q.title)} marked ${e.status}<small>${timeAgo(e.time)}</small></div>`:''}).join('');$('notifMenu').innerHTML=`<div class="notif-head">Recent practice${unread?'<button id="markRead">Mark all read</button>':''}</div>${items||'<div class="notif-item">No practice updates yet.</div>'}`;const mark=$('markRead');if(mark)mark.onclick=()=>{localStorage.setItem('prepdeck_notif_read','true');renderNotifs();};}
function renderAll(){renderHeader();renderStats();renderLearning();renderCategories();renderActivity();renderRecommended();renderBookmarks();renderGoal();renderNotifs();}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-bm]');if(!btn)return;data.toggleBookmark(btn.dataset.bm);renderStats();renderRecommended();renderBookmarks();});
document.querySelectorAll('[data-logout]').forEach(a=>a.addEventListener('click',()=>localStorage.removeItem('prepdeck_logged_in')));
const input=$('searchInput'),results=$('searchResults');
input.addEventListener('input',()=>{const term=input.value.trim().toLowerCase();if(!term)return results.classList.add('d-none');const hits=data.questions().filter(q=>(q.title+' '+q.category).toLowerCase().includes(term)).slice(0,6);results.innerHTML=hits.length?hits.map(q=>`<a href="${detailsUrl(q.id)}">${esc(q.title)}<small>${esc(q.category)}</small></a>`).join(''):'<div class="empty">No matching questions.</div>';results.classList.remove('d-none');});
$('searchForm').addEventListener('submit',e=>{e.preventDefault();const term=input.value.trim();if(term)location.href=`${PAGES.questionBank}?search=${encodeURIComponent(term)}`;});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))results.classList.add('d-none');});
function showView(){const hash=location.hash.slice(1)||'dashboard',view=hash==='bookmarks'?'bookmarks':'dashboard';$('view-dashboard').classList.toggle('d-none',view!=='dashboard');$('view-bookmarks').classList.toggle('d-none',view!=='bookmarks');document.querySelectorAll('.nav-item-pd[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===hash));if(hash==='progress')$('learning').scrollIntoView({behavior:'smooth'});const sb=bootstrap.Offcanvas.getInstance($('sidebar'));if(sb)sb.hide();}
window.addEventListener('hashchange',showView);renderAll();showView();
