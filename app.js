import { accepts, allQuestions, unitStats, validateUnit, cleanProgress, safeRelativePath } from './core.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const main = $('#main');
const KEY='english-atelier-progress-v1';
let progress=cleanProgress(null), units=[], audioLibrary={tracks:[],basePath:'audio/'}, storageWarning=false;
let run=null, flash={index:0,flipped:false}, vocabMode='cards', loadedFiles=new Map(), toastTimer, currentAudioURL=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitURL=(unit,tab='overview')=>`#/unit/${unit.id}/${tab}`;
const wordKey=(u,v)=>`${u.id}:${v.term}`;
const saved=(u,v)=>progress.saved.includes(wordKey(u,v));
function announce(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(progress));}catch{if(!storageWarning){storageWarning=true;announce('Browser storage is unavailable. Export your progress before leaving.');}} updateNav();}
function download(name,value,type='application/json') {const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function getJSON(path){const response=await fetch(path,{cache:'no-cache'});if(!response.ok)throw Error(`Could not load ${path} (HTTP ${response.status}).`);return response.json();}
function stats(u){return unitStats(u,progress.answers);}
function totalStats(){return units.reduce((s,u)=>{const a=stats(u);for(const k of ['total','attempted','correct'])s[k]+=a[k];return s;},{total:0,attempted:0,correct:0});}
function mistakes(u){return allQuestions(u).filter(q=>progress.answers[q.key]?.correct===false);}
function source(u){return `<p class="source-note">${esc(u.source?.title||'Independent study')} · Unit ${u.number}. ${esc(u.source?.note||'')}</p>`;}
function empty(title,text,button='<a class="button" href="#/units">Explore the units <span aria-hidden="true">→</span></a>',icon='Aa'){return `<div class="empty-state"><div class="empty-icon" aria-hidden="true">${icon}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${button}</div>`;}
function heading(title,text,right=''){return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(text)}</p></div>${right}</div>`;}
function updateNav(){
 $('#unit-count').textContent=units.length;
 $('#review-count').textContent=units.reduce((n,u)=>n+mistakes(u).length,0);
 const parts=location.hash.slice(1).split('/').filter(Boolean), section=parts[0]||'home';
 $$('[data-nav]').forEach(a=>{const active=a.dataset.nav===section||(a.dataset.nav==='units'&&section==='unit');a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#unit-nav').innerHTML=units.map(u=>`<a href="${unitURL(u)}" ${parts[1]===u.id?'class="active" aria-current="page"':''}><span class="unit-dot">${u.number.toString().padStart(2,'0')}</span>${esc(u.shortTitle)}</a>`).join('');
}
function setTitle(title){document.title=`${title} · English Atelier`;$('#breadcrumb').textContent=title;}
function unitCard(u){const s=stats(u);return `<article class="unit-card"><div class="card-top"><span class="unit-label">UNIT ${u.number.toString().padStart(2,'0')}</span><span class="unit-emblem" aria-hidden="true">${['Aa','ab','±','&','!'][(u.number-1)%5]}</span></div><h3><a href="${unitURL(u)}">${esc(u.shortTitle)}</a></h3><p>${esc(u.description)}</p><div class="card-meta"><span>◷ ${u.estimatedMinutes||35} min</span><span>${u.vocabulary.length} words & phrases</span><span>${s.total} questions</span></div><div class="card-progress"><div class="progress-track" role="img" aria-label="${s.percent}% of questions correct"><span style="width:${s.percent}%"></span></div><span>${s.attempted?`${s.correct}/${s.total} correct`:'Ready to begin'}</span><span class="arrow" aria-hidden="true">↗</span></div></article>`;}
function dashboard(){
 setTitle('Your workspace');const s=totalStats();const next=units.find(u=>u.id===progress.lastUnit)||units.find(u=>stats(u).correct<stats(u).total)||units[0];
 const collection=units.flatMap(u=>u.vocabulary.map(v=>({u,v})));const day=Math.floor(Date.now()/86400000);const {u:focusUnit,v}=collection[day%collection.length];
 const date=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date());
 main.innerHTML=heading('Make room for better English.','Your next chapter starts with a little curiosity.',`<span class="date-label">${esc(date)}</span>`)+`
 <section class="hero" aria-label="Continue your learning"><div class="hero-copy"><span class="eyebrow">WORDS OPEN WORLDS</span><h1>A little practice.<br>A <em>richer vocabulary.</em></h1><p>Go beyond knowing a word. Learn its meaning, find its rhythm, and make it your own.</p><a class="button" href="${unitURL(next,'lesson')}">${s.attempted?'Continue learning':'Start your first lesson'} <span aria-hidden="true">→</span></a></div><div class="hero-art" aria-hidden="true"><div class="book-stack"><div class="book-back"></div><div class="book-front"><small>THE ART OF EXPRESSION</small><div class="book-aa">Aa</div><div class="book-label">A world<br>of words.</div></div></div><span class="art-star">✳</span><span class="art-loop">a</span></div></section>
 <div class="stats-row"><div class="stat"><span class="stat-symbol" aria-hidden="true">▤</span><div><strong>${units.length}</strong><p>Units to explore</p></div></div><div class="stat"><span class="stat-symbol" aria-hidden="true">✎</span><div><strong>${s.attempted}<span class="muted small"> / ${s.total}</span></strong><p>Questions practised</p></div></div><div class="stat"><span class="stat-symbol" aria-hidden="true">◎</span><div><strong>${s.attempted?Math.round(s.correct/s.attempted*100)+'%':'—'}</strong><p>Latest-answer accuracy</p></div></div></div>
 <div class="section-head"><div><h2>Your learning path</h2><p>Read. Discover. Practise. Make it stick.</p></div><a class="text-button" href="#/units">All units <span aria-hidden="true">↗</span></a></div>
 <div class="course-layout"><div><div class="unit-grid">${units.map(unitCard).join('')}</div><div class="course-banner"><span aria-hidden="true">↗</span><div><strong>Your learning path can keep growing.</strong><p>New units join this space as your course continues.</p></div></div></div><aside class="course-aside"><div class="focus-card"><span class="eyebrow">A WORD TO KEEP</span><div class="quote-icon" aria-hidden="true">“</div><h3 class="focus-word">${esc(v.term)}</h3><span class="part-of-speech">from unit ${focusUnit.number}</span><p class="spaced">${esc(v.definition)}</p><blockquote>${esc(v.example)}</blockquote><button class="text-button" data-save="${esc(wordKey(focusUnit,v))}">${saved(focusUnit,v)?'★ Saved to your words':'☆ Save this word'}</button></div><div class="study-tip"><strong>THE FIVE-MINUTE HABIT</strong>Choose a word, say it aloud, then use it in a sentence about your own life.</div></aside></div>`;
}
function courses(filter='all'){
 setTitle('All units');const list=units.filter(u=>filter==='all'||(filter==='started'?stats(u).attempted>0:stats(u).correct===stats(u).total));
 main.innerHTML=heading('A world of words, one unit at a time.',`${units.length} units · Advanced vocabulary · Learn at your own pace`)+`<div class="filters">${[['all','All units'],['started','In progress'],['complete','Completed']].map(([id,label])=>`<button class="filter ${filter===id?'active':''}" data-course-filter="${id}">${label}</button>`).join('')}</div><div class="unit-grid full-grid">${list.map(unitCard).join('')}</div>${list.length?'':empty('Nothing here yet','Finish a few questions and return to see your progress.','')}`;
}
function unitHeader(u,tab){
 return `<a class="back-link" href="#/units">← All units</a><section class="unit-intro"><span class="eyebrow">UNIT ${u.number.toString().padStart(2,'0')} · ${esc(u.level||'Advanced')}</span><h1>${esc(u.title)}</h1><p>${esc(u.description)}</p><div class="intro-meta"><span>◷ About ${u.estimatedMinutes||35} minutes</span><span>${u.vocabulary.length} words & phrases</span><span>${stats(u).total} practice questions</span><span class="pill">${stats(u).percent}% correct</span></div></section><nav class="tabs" aria-label="Unit sections">${[['overview','Overview'],['lesson','Lesson'],['vocabulary','Vocabulary'],['practice','Practice'],['listening','Listening']].map(([id,label])=>`<a href="${unitURL(u,id)}" ${tab===id?'class="active" aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
function renderUnit(u,tab='overview'){
 progress.lastUnit=u.id;save();setTitle(`Unit ${u.number} · ${u.shortTitle}`);
 main.innerHTML=unitHeader(u,tab)+`<div id="unit-content"></div>`;
 if(tab==='lesson')renderLesson(u);
 else if(tab==='vocabulary')renderVocabulary(u);
 else if(tab==='practice')startPractice(u);
 else if(tab==='listening')renderListening(u);
 else renderOverview(u);
}
function renderOverview(u){
 $('#unit-content').innerHTML=`<div class="two-col"><div><section class="panel"><span class="eyebrow">WHAT YOU WILL LEARN</span><h2 class="spaced">A few words. A lot more expression.</h2><ul class="objectives">${u.objectives.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></section><section class="panel"><h2>Your route through this unit</h2><div class="chapter-path">${[['lesson','Read the lesson',`${u.lessons.length} clear explanations with examples`],['vocabulary','Explore the vocabulary',`${u.vocabulary.length} words and phrases, plus flashcards`],['practice','Put it into practice',`${u.exerciseGroups.length} exercise sets with feedback`],['listening','Listen & notice',u.audio?.activities?.length?'Listening answer sheets and your audio tracks':'Your audio library and space for listening notes']].map(([tab,title,desc],i)=>`<a class="path-step" href="${unitURL(u,tab)}"><span class="step-number">${i+1}</span><div><h3>${title}</h3><p>${desc}</p></div><span class="arrow" aria-hidden="true">→</span></a>`).join('')}</div></section></div><aside><section class="panel"><span class="eyebrow">YOUR PROGRESS</span><h2 class="spaced">${stats(u).correct} <span class="muted">/ ${stats(u).total}</span></h2><p class="small muted">Questions with a correct latest answer. Retrying a question updates its result.</p><div class="progress-track" role="img" aria-label="${stats(u).percent}% correct"><span style="width:${stats(u).percent}%"></span></div><a class="button spaced" href="${unitURL(u,'lesson')}">${progress.lessons[u.id]?'Revisit the lesson':'Begin with the lesson'} →</a></section><div class="note">Take your time. Read an example aloud before moving on to the next word.</div></aside></div>${source(u)}`;
}
function renderLesson(u){
 $('#unit-content').innerHTML=`<div class="two-col"><article><div class="lesson-list">${u.lessons.map((l,i)=>`<section class="lesson-section" id="lesson-${i}"><div><h2>${esc(l.title)}</h2><p>${esc(l.body)}</p><div class="examples">${l.examples.map(e=>`<p>${esc(e)}</p>`).join('')}</div></div></section>`).join('')}</div><section class="panel"><h3>Ready to make these words yours?</h3><p class="small muted">Explore the examples in the vocabulary bank, then check your understanding.</p><div class="settings-actions"><button class="button secondary" data-lesson-read="${u.id}">${progress.lessons[u.id]?'✓ Lesson marked as read':'Mark lesson as read'}</button><a class="button" href="${unitURL(u,'vocabulary')}">Explore vocabulary →</a></div></section></article><aside class="panel sticky lesson-outline"><span class="eyebrow">IN THIS LESSON</span><ol class="lesson-outline">${u.lessons.map((l,i)=>`<li><a href="#lesson-${i}" data-scroll="lesson-${i}">${String(i+1).padStart(2,'0')} &nbsp; ${esc(l.title)}</a></li>`).join('')}</ol><a class="text-button" href="${unitURL(u,'practice')}">Go to practice →</a></aside></div>${source(u)}`;
}
function wordCard(u,v){const key=wordKey(u,v);return `<article class="word-card"><div class="word-head"><h3>${esc(v.term)}</h3><div class="word-actions"><button class="icon-button ${saved(u,v)?'saved':''}" data-save="${esc(key)}" aria-pressed="${saved(u,v)}" aria-label="${saved(u,v)?'Unsave':'Save'} ${esc(v.term)}">${saved(u,v)?'★':'☆'}</button><button class="icon-button" data-speak="${esc(v.term)}" aria-label="Pronounce ${esc(v.term)}">♪</button></div></div><p>${esc(v.definition)}</p><blockquote>“${esc(v.example)}”</blockquote>${v.note?`<div class="word-note">${esc(v.note)}</div>`:''}</article>`;}
function renderVocabulary(u){
 $('#unit-content').innerHTML=`<div class="toolbar"><label class="sr-only" for="vocab-search">Search this unit’s vocabulary</label><input class="input search" type="search" id="vocab-search" placeholder="Search words, meanings or examples…"><div class="tab-tools"><button class="button ${vocabMode==='cards'?'':'secondary'} small" data-vocab-mode="cards" aria-pressed="${vocabMode==='cards'}">Word bank</button><button class="button ${vocabMode==='flash'?'':'secondary'} small" data-vocab-mode="flash" aria-pressed="${vocabMode==='flash'}">Flashcards</button></div></div><div id="vocab-content"></div>`;
 renderWordList(u,'');
 $('#vocab-search').addEventListener('input',event=>{flash={index:0,flipped:false};renderWordList(u,event.target.value);});
}
function filteredWords(u,text){const query=text.toLowerCase().trim();return u.vocabulary.filter(v=>[v.term,v.definition,v.example,v.note||''].join(' ').toLowerCase().includes(query));}
function renderWordList(u,text){
 const words=filteredWords(u,text);const el=$('#vocab-content');
 if(!words.length){el.innerHTML=empty('No words found','Try a shorter word or a different spelling.','');return;}
 if(vocabMode==='flash'){
  flash.index=((flash.index%words.length)+words.length)%words.length;const v=words[flash.index];
  el.innerHTML=`<div class="flash-wrap"><p class="small muted">${flash.index+1} of ${words.length} · Select the card to ${flash.flipped?'see the word':'reveal the meaning'}</p><button class="flashcard" data-flip aria-label="${flash.flipped?'Show word':'Reveal meaning'}"><span class="eyebrow">${flash.flipped?'MEANING & CONTEXT':'DO YOU REMEMBER?'}</span>${flash.flipped?`<span class="definition">${esc(v.definition)}</span><span class="example">“${esc(v.example)}”</span><span class="small muted">${esc(v.note||'')}</span>`:`<span class="term">${esc(v.term)}</span><span class="small muted">Take a moment. What does it mean?</span>`}</button><div class="flash-controls"><button class="button secondary small" data-flash-step="-1">← Previous</button><button class="text-button" data-save="${esc(wordKey(u,v))}">${saved(u,v)?'★ Saved':'☆ Save word'}</button><button class="button secondary small" data-flash-step="1">Next →</button></div></div>`;
 }else el.innerHTML=`<p class="small muted">${words.length} words & phrases · Save the ones you want to revisit.</p><div class="vocab-grid">${words.map(v=>wordCard(u,v)).join('')}</div>`;
}
function renderSaved(){
 setTitle('Saved vocabulary');const rows=units.flatMap(u=>u.vocabulary.filter(v=>saved(u,v)).map(v=>({u,v})));
 main.innerHTML=heading('Words worth keeping.',`${rows.length} saved words and phrases. Revisit them whenever you like.`)+`${rows.length?`<div class="vocab-grid">${rows.map(({u,v})=>`<div><a class="eyebrow" href="${unitURL(u,'vocabulary')}">UNIT ${u.number}</a>${wordCard(u,v)}</div>`).join('')}</div>`:empty('Start your own word collection','Select the star beside any word to keep it here. Then try using it in a sentence about your day.','<a class="button" href="#/units">Find your first word →</a>','☆')}`;
}
function renderReview(){
 setTitle('Review mistakes');const count=units.reduce((n,u)=>n+mistakes(u).length,0);
 main.innerHTML=heading('A second look makes it stick.',`${count} questions to revisit. A correct retry clears a question from this list.`)+`${count?`<div class="panel">${units.filter(u=>mistakes(u).length).map(u=>`<div class="review-row"><div><span class="eyebrow">UNIT ${u.number}</span><h3>${esc(u.shortTitle)}</h3><p>${mistakes(u).length} questions to revisit</p></div><a class="button secondary" href="${unitURL(u,'practice')}?mode=mistakes">Review this unit →</a></div>`).join('')}</div><p class="small muted">This list uses your latest answer for each question, rather than counting every attempt.</p>`:empty('A fresh page','Mistakes are part of learning. When you miss a practice question, it will appear here for another try.','<a class="button" href="#/units">Practise a little →</a>','↺')}`;
}
function startPractice(u,groupId=null,mode=null){
 const params=new URLSearchParams(location.hash.split('?')[1]||'');mode=mode||params.get('mode')||'all';
 const g=u.exerciseGroups.find(g=>g.id===groupId)||u.exerciseGroups[0];
 let questions=mode==='mistakes'?mistakes(u):allQuestions(u).filter(q=>q.group.id===g.id);
 run={unit:u,group:g.id,mode,questions,index:0,checked:{},finished:false};
 $('#unit-content').innerHTML=`<div class="practice-layout"><div id="practice-main"></div><aside class="panel exercise-sidebar"><label for="exercise-set">YOUR PRACTICE SET</label><select class="select" id="exercise-set">${mode==='mistakes'?'<option value="mistakes">Your missed questions</option>':''}${u.exerciseGroups.map(g=>`<option value="${g.id}" ${mode!=='mistakes'&&g.id===run.group?'selected':''}>${esc(g.title)} (${g.questions.length})</option>`).join('')}</select><p class="spaced">Try before you check. Feedback explains why an answer fits, so every attempt moves you forward.</p><a class="text-button" href="${unitURL(u,'lesson')}">Revisit the lesson →</a><hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><p>Written responses ignore capital letters, smart apostrophes and extra spaces. Spelling and word order still matter.</p></aside></div>`;
 $('#exercise-set').addEventListener('change',event=>startPractice(u,event.target.value,event.target.value==='mistakes'?'mistakes':'all'));
 renderQuestion();
}
function renderQuestion(){
 const box=$('#practice-main');if(!box||!run)return;
 if(!run.questions.length){box.innerHTML=empty('All clear for this unit','There are no missed questions to review. Try another practice set.','<button class="button" data-practice-default>Choose a practice set →</button>','✓');return;}
 if(run.finished){renderResult();return;}
 const entry=run.questions[run.index],{question:q,group:g}=entry;const checked=run.checked[entry.key];const answer=Array.isArray(q.answer)?q.answer.join(' / '):q.answer;
 box.innerHTML=`${g.passage?`<details class="reading" open><summary>Read the character sketches</summary><p>${esc(g.passage)}</p></details>`:''}<p class="group-note">${esc(g.instruction)}</p><section class="question-card"><div class="question-meta"><span>${esc(g.title)}</span><span>${run.index+1} / ${run.questions.length}</span></div><div class="progress-track" role="img" aria-label="Question ${run.index+1} of ${run.questions.length}"><span style="width:${run.index/run.questions.length*100}%"></span></div><form id="question-form"><h2 id="question-prompt">${esc(q.prompt)}</h2>${q.type==='choice'?`<fieldset class="options" aria-labelledby="question-prompt" style="border:0;margin:0;padding:0">${q.options.map((option,i)=>`<label class="option ${checked?(accepts(q,option)?'correct':checked.value===option?'incorrect':''):''}"><input type="radio" name="answer" value="${esc(option)}" ${checked?.value===option?'checked':''} ${checked?'disabled':''} required><span>${esc(option)}</span></label>`).join('')}</fieldset>`:`<label class="sr-only" for="written-answer">Your answer</label><input class="input question-text" id="written-answer" name="answer" type="text" placeholder="Type your answer…" autocomplete="off" spellcheck="false" required maxlength="300" value="${esc(checked?.value||'')}" ${checked?'disabled':''}>`}
 ${checked?`<div class="feedback ${checked.correct?'':'wrong'}" role="status"><strong>${checked.correct?'✓ That’s right.':'A useful one to revisit.'}</strong>${checked.correct?'':`<p>Answer: <strong style="display:inline">${esc(answer)}</strong></p>`}<p>${esc(q.explanation)}</p></div>`:'<div id="answer-feedback" aria-live="polite"></div>'}
 <div class="question-footer"><div>${run.index>0?'<button class="text-button" type="button" data-question-prev>← Previous</button>':q.hint?'<button class="text-button" type="button" data-hint>Need a hint?</button>':'<span class="small muted">One question at a time.</span>'}</div>${checked?`<button class="button" type="button" data-question-next>${run.index===run.questions.length-1?'See your results':'Next question'} →</button>`:'<button class="button" type="submit">Check answer →</button>'}</div></form></section>`;
 if(!checked)$('#question-form').addEventListener('submit',event=>{
  event.preventDefault();const value=new FormData(event.currentTarget).get('answer')?.trim();if(!value){announce('Choose or type an answer first.');return;}
  const result={value,correct:accepts(q,value),date:new Date().toISOString()};run.checked[entry.key]=result;progress.answers[entry.key]=result;save();renderQuestion();$('[data-question-next]')?.focus();
 });
}
function renderResult(){
 const answers=Object.values(run.checked),correct=answers.filter(a=>a.correct).length,total=run.questions.length;const missed=run.questions.filter(q=>run.checked[q.key]?.correct===false);
 $('#practice-main').innerHTML=`<section class="empty-state" style="margin:0;max-width:none"><div class="result-circle">${Math.round(correct/total*100)}%</div><span class="eyebrow">PRACTICE COMPLETE</span><h2>${correct===total?'Look at you grow.':'A little more confident.'}</h2><p>${correct} of ${total} answers correct in this round. ${missed.length?'Take another look at the questions below, or revisit them in Review mistakes.':'Take a breath, then try another set when you are ready.'}</p><div class="result-actions"><button class="button" data-retry-set>Try this set again</button>${missed.length?'<button class="button secondary" data-retry-missed>Retry missed questions</button>':''}<a class="button secondary" href="${unitURL(run.unit,'lesson')}">Revisit lesson</a></div></section>${missed.length?`<div class="panel spaced"><h3>Keep these in mind</h3>${missed.map(({question:q})=>`<div class="setting-item"><p class="answer-line">${esc(q.prompt)}</p><p class="answer-line">Your answer: ${esc(run.checked[run.questions.find(e=>e.question===q).key].value)}</p><p class="answer-line"><strong>${esc(Array.isArray(q.answer)?q.answer.join(' / '):q.answer)}</strong></p><p class="small muted">${esc(q.explanation)}</p></div>`).join('')}</div>`:''}`;
}
function audioChoices(){return [...new Set([...audioLibrary.tracks.map(t=>t.file),...loadedFiles.keys()])];}
function selectedTrack(u){return typeof progress.tracks[u.id]==='string'?progress.tracks[u.id]:(u.audio?.track||'');}
function renderListening(u){
 const track=selectedTrack(u),choices=audioChoices();if(track&&!choices.includes(track))choices.push(track);
 $('#unit-content').innerHTML=`<section class="audio-panel"><span class="eyebrow" style="color:#dcb49b">LISTEN CLOSELY</span><h2 class="spaced">A feel for spoken English.</h2><p>Choose the recording that belongs to this unit. Use the player to pause, replay and notice the words in context.</p><div class="audio-controls"><label for="audio-track">Track for Unit ${u.number}<select id="audio-track" class="select"><option value="">Choose a recording…</option>${choices.map(file=>`<option value="${esc(file)}" ${file===track?'selected':''}>${esc(file)}${loadedFiles.has(file)?' · local preview':''}</option>`).join('')}</select></label><label class="button secondary file-picker">Preview local MP3s<input type="file" id="local-audio" accept="audio/*,.mp3,.m4a,.wav,.ogg" multiple aria-label="Select local audio files for preview"></label></div><div id="audio-slot"></div><p class="audio-status" id="audio-status" aria-live="polite">${track?'Loading the selected track…':'Select a track to begin. Recordings are not included in this app download.'}</p></section>
 <div class="note warning">${esc(u.audio?.note||'Track-to-unit mappings have not been verified.')} ${u.audio?.suggestedTrack?`<br>Suggested filename: <strong>${esc(u.audio.suggestedTrack)}</strong>. <button class="text-button" data-suggest-track="${esc(u.audio.suggestedTrack)}">Select this track</button>`:''}</div>
 <details class="reading"><summary>Where should I upload the MP3s on GitHub?</summary><p style="font-family:var(--sans);font-size:13px">Create an <code>audio/</code> folder beside <code>index.html</code>. Upload files with their exact names, for example <code>audio/AV-001-2.mp3</code>. GitHub Pages will serve them with the app. Selecting a local file only previews it in this browser; it does not upload it. Local files must be selected again after reopening the page.</p></details>
 ${(u.audio?.activities||[]).map(a=>listeningActivity(u,a)).join('')}
 <section class="panel"><h2>Your listening notebook</h2><label for="listening-notes" class="small muted">New words, useful phrases, or a short summary in your own words.</label><textarea id="listening-notes" class="input spaced" rows="5" style="width:100%;resize:vertical" maxlength="12000" placeholder="What did you notice?">${esc(typeof progress.listening[`${u.id}:notes`]==='string'?progress.listening[`${u.id}:notes`]:'')}</textarea><p class="small muted">Saved automatically in this browser. Export progress in Settings to keep a backup.</p></section>`;
 $('#audio-track').addEventListener('change',event=>{progress.tracks[u.id]=event.target.value;save();mountAudio(u);});
 $('#local-audio').addEventListener('change',event=>{
  const files=[...event.target.files];for(const file of files){if(loadedFiles.has(file.name))URL.revokeObjectURL(loadedFiles.get(file.name));loadedFiles.set(file.name,URL.createObjectURL(file));}
  if(files.length){progress.tracks[u.id]=files[0].name;save();renderListening(u);announce(`${files.length} file${files.length===1?'':'s'} ready for local preview.`);}
 });
 $('#listening-notes').addEventListener('input',event=>{progress.listening[`${u.id}:notes`]=event.target.value;save();});
 $$('.listen-select').forEach(el=>el.addEventListener('change',event=>{progress.listening[event.target.dataset.key]=event.target.value;save();const status=$(`#status-${event.target.dataset.activity}`);if(status)status.textContent='Answer saved. You can change it after listening again.';}));
 mountAudio(u);
}
function listeningActivity(u,a){
 const hasKey=Array.isArray(a.answerKey)&&a.answerKey.length===a.extracts;
 return `<section class="panel"><span class="eyebrow">LISTENING WORKBOOK</span><h2 class="spaced">${esc(a.title)}</h2><p class="small muted">${esc(a.instruction)}</p>${hasKey?'':`<div class="note">Self-study answer sheet. No verified answer key is available, so these responses are saved without a score.</div>`}${Array.from({length:a.extracts},(_,i)=>{const key=`${u.id}:${a.id}:${i}`;return `<div class="listen-row"><label for="listen-${a.id}-${i}">Extract ${i+1}</label><select class="select listen-select" id="listen-${a.id}-${i}" data-key="${key}" data-activity="${a.id}"><option value="">Choose an answer…</option>${a.options.map(o=>`<option value="${esc(o)}" ${progress.listening[key]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;}).join('')}<p class="listen-status" id="status-${a.id}" aria-live="polite">Responses save automatically.</p>${hasKey?`<button class="button secondary" data-check-listening="${a.id}">Check listening answers</button>`:''}</section>`;
}
function trackPath(track){
 if(track.includes('/'))return safeRelativePath(track)?track:null;
 return safeRelativePath(track)&&safeRelativePath(audioLibrary.basePath+track)?audioLibrary.basePath+track:null;
}
function mountAudio(u){
 const slot=$('#audio-slot'),status=$('#audio-status');if(!slot)return;slot.innerHTML='';currentAudioURL=null;const track=selectedTrack(u);if(!track){status.textContent='Select a track to begin. Recordings are not included in this app download.';return;}
 const path=loadedFiles.get(track)||trackPath(track);if(!path){status.textContent='This track path is invalid. Use a relative path inside your repository.';return;}
 const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.setAttribute('aria-label',`Audio: ${track}`);audio.src=path;currentAudioURL=path;
 audio.addEventListener('loadedmetadata',()=>{status.textContent=`Ready · ${track}${loadedFiles.has(track)?' · local preview':''}. Use the player menu to adjust speed if your browser supports it.`;});
 audio.addEventListener('error',()=>{status.textContent=`Cannot play ${track}. Upload it to ${trackPath(track)||'audio/'} with this exact filename, or select the local file for preview.`;});
 slot.append(audio);status.textContent=loadedFiles.has(track)?`Local preview: ${track}. This file has not been uploaded.`:`Repository path: ${path}. If the file is missing, upload it to this path on GitHub.`;
}
function settings(){
 setTitle('Progress & settings');const s=totalStats();main.innerHTML=heading('Your learning, your pace.','Keep your progress safe and make this space your own.')+`<div class="two-col"><section class="panel"><h2>Progress stays with your browser.</h2><p class="small muted">Your answers, saved words, lesson checkmarks, audio selections and listening notes are stored on this device. There is no account or server database. Export a backup before switching devices or clearing browser data.</p><div class="settings-actions"><button class="button" data-export>Export progress ↓</button><label class="button secondary file-picker">Import progress<input type="file" id="import-progress" accept="application/json,.json" aria-label="Import progress backup"></label></div><div class="setting-item"><h3>A fresh start</h3><p>Reset all written answers, bookmarks, listening notes and track choices saved in this browser. You can export a backup first.</p><button class="button ghost small" data-reset>Reset progress</button></div><div class="setting-item"><h3>Audio folder on GitHub</h3><p>Place recordings in <code>audio/</code> next to <code>index.html</code>. Preserve exact names such as <code>AV-001-2.mp3</code>. The track list is in <code>data/audio-library.json</code>. Track assignments you make here stay in this browser. For a shared default, set <code>audio.track</code> to <code>audio/AV-001-2.mp3</code> in a unit JSON.</p></div><div class="setting-item"><h3>Adding another unit</h3><p>Copy the included <code>unit-template.json</code> to <code>data/unit-6.json</code>, update its content and add it to <code>data/units.json</code>. The app discovers units from that index. The download includes a step-by-step README and a content validator.</p></div></section><aside><section class="panel"><span class="eyebrow">YOUR COLLECTION</span><h2 class="spaced">${s.attempted} questions tried.</h2><p class="small muted">${s.correct} currently correct<br>${progress.saved.length} saved words<br>${units.filter(u=>progress.lessons[u.id]).length} lessons marked as read</p></section><a class="button secondary" href="#/">Back to your workspace →</a></aside></div>`;
 $('#import-progress').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>5*1024*1024)throw Error('This file is too large for a progress backup.');const raw=JSON.parse(await file.text());if(raw.version!==1||!raw.answers||!Array.isArray(raw.saved))throw Error('Choose an English Atelier version 1 progress backup.');
   if(!confirm('Replace the progress in this browser with this backup?'))return;progress=cleanProgress(raw);save();settings();announce('Progress imported. Welcome back.');
  }catch(error){announce(`Import failed: ${error.message}`);}
 });
}
function searchResults(query){
 setTitle('Search');const q=query.trim().toLowerCase();const foundUnits=q?units.filter(u=>[u.title,u.shortTitle,u.description].join(' ').toLowerCase().includes(q)):[];const words=q?units.flatMap(u=>filteredWords(u,q).map(v=>({u,v}))):[];
 main.innerHTML=heading(query?`Results for “${query}”`:'Find a word or a unit.',query?`${foundUnits.length} units and ${words.length} vocabulary matches.`:'Use the search field above to explore the course.')+`${foundUnits.length?`<div class="section-head"><h2>Units</h2></div><div class="unit-grid">${foundUnits.map(unitCard).join('')}</div>`:''}${words.length?`<div class="section-head spaced"><h2>Vocabulary</h2></div><div class="vocab-grid">${words.map(({u,v})=>`<div><a class="eyebrow" href="${unitURL(u,'vocabulary')}">UNIT ${u.number}</a>${wordCard(u,v)}</div>`).join('')}</div>`:''}${q&&!foundUnits.length&&!words.length?empty('No matches yet','Try a shorter word, a meaning or a topic.',''):''}`;
}
function route(){
 if(!units.length)return;
 // Release playback when leaving Listening; local object URLs stay available until reload.
 $$('audio').forEach(a=>a.pause());
 const hash=location.hash.slice(1)||'/';const [path,search='']=hash.split('?');let parts;
 try{parts=path.split('/').filter(Boolean).map(decodeURIComponent);}catch{parts=[];}
 if(parts[0]==='unit'){
  const u=units.find(u=>u.id===parts[1]);if(u){const tab=['overview','lesson','vocabulary','practice','listening'].includes(parts[2])?parts[2]:'overview';renderUnit(u,tab);}else{setTitle('Unit not found');main.innerHTML=empty('That unit is not here yet','Choose a unit from the course to keep learning.');}
 }else if(parts[0]==='units')courses();
 else if(parts[0]==='saved')renderSaved();
 else if(parts[0]==='review')renderReview();
 else if(parts[0]==='settings')settings();
 else if(parts[0]==='search')searchResults(new URLSearchParams(search).get('q')||'');
 else dashboard();
 updateNav();window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});
}
function currentUnit(){const id=location.hash.split('/')[2];return units.find(u=>u.id===id);}
main.addEventListener('click',event=>{
 const button=event.target.closest('button,a');if(!button)return;
 if(button.hasAttribute('data-scroll')){event.preventDefault();document.getElementById(button.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(button.hasAttribute('data-save')){
  const key=button.dataset.save;const exists=progress.saved.includes(key);progress.saved=exists?progress.saved.filter(x=>x!==key):[...progress.saved,key];save();
  $$('[data-save]').filter(b=>b.dataset.save===key).forEach(b=>{const icon=b.classList.contains('icon-button');b.textContent=icon?(exists?'☆':'★'):(exists?'☆ Save this word':'★ Saved to your words');b.classList.toggle('saved',!exists);b.setAttribute('aria-pressed',String(!exists));if(icon)b.setAttribute('aria-label',`${exists?'Save':'Unsave'} ${key.split(':').slice(1).join(':')}`);});
  if(location.hash.startsWith('#/saved'))renderSaved();announce(exists?'Word removed from your collection.':'Word saved. Find it in Saved vocabulary.');return;
 }
 if(button.hasAttribute('data-speak')){
  if(!('speechSynthesis'in window)){announce('Pronunciation is unavailable in this browser.');return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(button.dataset.speak);utterance.lang='en-GB';utterance.rate=.85;utterance.onerror=()=>announce('Pronunciation is unavailable. Try another browser or check your device’s voices.');speechSynthesis.speak(utterance);return;
 }
 if(button.hasAttribute('data-course-filter')){courses(button.dataset.courseFilter);return;}
 const u=currentUnit();
 if(button.hasAttribute('data-lesson-read')&&u){progress.lessons[u.id]=true;save();button.textContent='✓ Lesson marked as read';announce('Lesson marked as read. Ready for a little practice?');return;}
 if(button.hasAttribute('data-vocab-mode')&&u){vocabMode=button.dataset.vocabMode;flash={index:0,flipped:false};renderVocabulary(u);return;}
 if(button.hasAttribute('data-flip')&&u){flash.flipped=!flash.flipped;renderWordList(u,$('#vocab-search').value);$('.flashcard')?.focus();return;}
 if(button.hasAttribute('data-flash-step')&&u){flash.index+=Number(button.dataset.flashStep);flash.flipped=false;renderWordList(u,$('#vocab-search').value);return;}
 if(button.hasAttribute('data-practice-default')&&u){startPractice(u);return;}
 if(button.hasAttribute('data-question-next')&&run){if(run.index===run.questions.length-1){run.finished=true;renderResult();}else{run.index++;renderQuestion();}$('#practice-main')?.scrollIntoView({behavior:'smooth',block:'start'});$('#question-prompt')?.setAttribute('tabindex','-1');$('#question-prompt')?.focus({preventScroll:true});return;}
 if(button.hasAttribute('data-question-prev')&&run){run.index--;renderQuestion();return;}
 if(button.hasAttribute('data-hint')&&run){$('#answer-feedback').innerHTML=`<div class="hint">${esc(run.questions[run.index].question.hint)}</div>`;return;}
 if(button.hasAttribute('data-retry-set')&&run){const {unit,group,mode}=run;startPractice(unit,group,mode);return;}
 if(button.hasAttribute('data-retry-missed')&&run){run.questions=run.questions.filter(q=>run.checked[q.key]?.correct===false);run.index=0;run.checked={};run.finished=false;renderQuestion();return;}
 if(button.hasAttribute('data-suggest-track')&&u){progress.tracks[u.id]=button.dataset.suggestTrack;save();renderListening(u);return;}
 if(button.hasAttribute('data-check-listening')&&u){
  const a=u.audio.activities.find(a=>a.id===button.dataset.checkListening);if(!a?.answerKey)return;
  const answers=Array.from({length:a.extracts},(_,i)=>progress.listening[`${u.id}:${a.id}:${i}`]);if(answers.some(v=>!v)){announce('Choose an answer for every extract first.');return;}
  const n=answers.filter((v,i)=>v===a.answerKey[i]).length;$(`#status-${a.id}`).textContent=`${n} of ${a.extracts} correct. Answers: ${a.answerKey.join(', ')}.`;return;
 }
 if(button.hasAttribute('data-export')){download('english-atelier-progress.json',JSON.stringify({...progress,exportedAt:new Date().toISOString()},null,2));announce('Progress backup downloaded.');return;}
 if(button.hasAttribute('data-reset')){if(confirm('Reset all English Atelier progress in this browser? Export a backup first if you want to keep it.')){progress=cleanProgress(null);save();settings();announce('Your learning space has been reset.');}return;}
});
$('#global-search').addEventListener('submit',event=>{event.preventDefault();location.hash=`/search?q=${encodeURIComponent($('#search').value.trim())}`;});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){event.preventDefault();$('#search').focus();}});
window.addEventListener('hashchange',route);
window.addEventListener('beforeunload',()=>{for(const url of loadedFiles.values())URL.revokeObjectURL(url);});
async function init(){
 try{
  try{progress=cleanProgress(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{progress=cleanProgress(null);}
  const manifest=await getJSON('data/units.json');if(manifest.schemaVersion!==1||!Array.isArray(manifest.units)||!manifest.units.length)throw Error('The unit index must contain at least one unit.');
  const ids=new Set();for(const entry of manifest.units){if(!entry.id||ids.has(entry.id)||!safeRelativePath(entry.file))throw Error('Invalid or duplicate unit index entry.');ids.add(entry.id);}
  const result=await Promise.allSettled(manifest.units.map(async entry=>{const unit=await getJSON(`data/${entry.file}`);const issues=validateUnit(unit);if(unit.id!==entry.id)issues.push('ID differs from the unit index');if(issues.length)throw Error(`${entry.file}: ${issues.join('; ')}`);return unit;}));
  units=result.filter(r=>r.status==='fulfilled').map(r=>r.value).sort((a,b)=>a.number-b.number);
  const failures=result.filter(r=>r.status==='rejected').map(r=>r.reason.message);if(!units.length)throw Error(failures.join(' '));
  try{audioLibrary=await getJSON('data/audio-library.json');if(!Array.isArray(audioLibrary.tracks)||!safeRelativePath(audioLibrary.basePath))throw Error('Invalid audio library');}catch{audioLibrary={basePath:'audio/',tracks:[]};announce('Audio index could not load. You can still preview local files.');}
  route();if(failures.length)announce(`Some units could not load: ${failures.join(' ')}`);
 }catch(error){
  setTitle('Let’s get the app running');main.innerHTML=`<section class="panel"><span class="eyebrow">SETUP HELP</span><h1 class="spaced">Your learning space is almost ready.</h1><p>This app loads unit JSON files, so it needs to run through a web server such as GitHub Pages.</p><ol><li>Upload the extracted app files to your GitHub repository, with <code>index.html</code> at the root.</li><li>Open Settings → Pages. Deploy from your branch and select <code>/ (root)</code>.</li><li>Visit the Pages website URL after GitHub finishes publishing.</li></ol><p>For a local preview, run <code>python -m http.server 8000</code> in the app folder and open <code>http://localhost:8000</code>.</p><p class="error-message">${esc(error.message)}</p><button class="button" data-reload>Try again</button></section>`;
  $('[data-reload]').addEventListener('click',()=>location.reload());
 }
}
init();
