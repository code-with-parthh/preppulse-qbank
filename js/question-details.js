(() => {
  const data=window.PrepDeck, $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('studentName').textContent=data.state.name;
  const id=new URLSearchParams(location.search).get('id'), list=data.questions(), index=list.findIndex(q=>q.id===id), q=list[index], root=$('questionDetail');
  if (!q) { root.innerHTML='<section class="card-pd"><h1 class="page-title">Question not found</h1><p>This question link is invalid or the question was removed.</p><a class="btn-pd" href="question-bank.html">Back to Question Bank</a></section>'; return; }
  const previous=list[index-1], next=list[index+1];
  let selectedOption='', wasChecked=false, isCorrect=false;
  function render() {
    const status=data.state.statusById[q.id];
    const feedback=wasChecked?`<div class="mcq-feedback ${isCorrect?'correct':'incorrect'}" role="status"><strong>${isCorrect?'Correct!':'Not quite.'}</strong><p><b>Explanation:</b> ${esc(q.explanation)}</p><p class="mb-0"><b>Example:</b> ${esc(q.example)}</p></div>`:'';
    root.innerHTML=`<div class="detail-nav"><a class="btn-soft" href="question-bank.html"><i class="bi bi-arrow-left"></i> All questions</a><span class="text-muted small">Question ${index+1} of ${list.length}</span></div><article class="card-pd question-detail"><div><span class="tag">${esc(q.category)}</span><span class="tag d-${esc(q.difficulty)}">${esc(q.difficulty)}</span><span class="tag">Multiple choice</span>${status?`<span class="badge-s s-${status}">${status==='solved'?'Solved':'Struggled'}</span>`:''}</div><h1>${esc(q.title)}</h1><p>${esc(q.description)}</p><fieldset class="mcq-options"><legend>Choose one answer</legend>${q.options.map(o=>`<label class="mcq-option ${wasChecked&&o.id===q.correctOption?'answer-correct':''} ${wasChecked&&o.id===selectedOption&&!isCorrect?'answer-wrong':''}"><input type="radio" name="answer" value="${esc(o.id)}" ${selectedOption===o.id?'checked':''} ${wasChecked?'disabled':''}><span class="option-letter">${esc(o.id)}</span><span>${esc(o.text)}</span></label>`).join('')}</fieldset><div class="mcq-check-row"><button class="btn-pd" id="checkAnswer" ${wasChecked?'disabled':''}>Check Answer</button><span class="text-muted small">Select an option to see your explanation.</span></div><div id="answerFeedback">${feedback}</div><div class="practice-actions"><button class="btn-pd" id="markSolved" ${!wasChecked||!isCorrect?'disabled':''}><i class="bi bi-check2-circle"></i> Mark as Solved</button><button class="btn-soft" id="markStruggled" ${!wasChecked?'disabled':''}><i class="bi bi-hourglass-split"></i> Mark as Struggled</button><button class="bm ${data.isBookmarked(q.id)?'on':''}" id="bookmark" aria-label="Toggle bookmark"><i class="bi bi-bookmark${data.isBookmarked(q.id)?'-fill':''}"></i> ${data.isBookmarked(q.id)?'Bookmarked':'Bookmark'}</button></div></article><nav class="question-pager" aria-label="Question navigation">${previous?`<a class="btn-soft" href="question-details.html?id=${encodeURIComponent(previous.id)}">← Previous</a>`:'<span></span>'}${next?`<a class="btn-soft" href="question-details.html?id=${encodeURIComponent(next.id)}">Next →</a>`:''}</nav>`;
    document.querySelectorAll('input[name="answer"]').forEach(input=>input.addEventListener('change',()=>{selectedOption=input.value;}));
    $('checkAnswer').addEventListener('click',()=>{if(!selectedOption){$('answerFeedback').innerHTML='<p class="text-danger mt-3">Choose an option first.</p>';return;}wasChecked=true;isCorrect=selectedOption===q.correctOption;render();});
    $('markSolved').addEventListener('click',()=>{if(!isCorrect)return;data.record(q.id,'solved');location.reload();});
    $('markStruggled').addEventListener('click',()=>{if(!wasChecked)return;data.record(q.id,'struggled');location.reload();});
    $('bookmark').addEventListener('click',()=>{data.toggleBookmark(q.id);render();});
  }
  render();
})();
