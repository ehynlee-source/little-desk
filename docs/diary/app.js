import { api, currentUser, observeSession, login, logout, errorMessage } from './firebase.js';
const $ = (s) => document.querySelector(s);
const moods = { happy:['☀','행복해요'], calm:['☘','평온해요'], normal:['◡','그저 그래요'], sad:['☂','슬퍼요'], tired:['☾','지쳤어요'] };
const now = new Date();
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = localDate(now);
let entries = [], selectedDate = '', month = new Date(now.getFullYear(), now.getMonth(), 1), editingId = null, readingId = null, mood = 'calm', savedDraft = '', saving = false;
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = (s) => new Date(`${s}T12:00:00`).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'});
const badge = (m) => `<span class="mood-badge">${moods[m][0]} ${moods[m][1]}</span>`;
let toastTimer;
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000); }
async function refresh() { if(!currentUser())return;entries=await api('/api/entries'); render(); }
function renderCalendar() {
  $('#calendar-title').textContent=`${month.getFullYear()}년 ${month.getMonth()+1}월`;
  const dates = new Set(entries.map(e=>e.date));
  const start = month.getDay(), end = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  $('#calendar-days').innerHTML = '<span></span>'.repeat(start)+Array.from({length:end},(_,i)=>{
    const d = localDate(new Date(month.getFullYear(),month.getMonth(),i+1));
    return `<button data-date="${d}" class="${d===today?'today ':''}${d===selectedDate?'selected ':''}${dates.has(d)?'has-entry':''}" aria-label="${dateLabel(d)}${dates.has(d)?', 기록 있음':''}" aria-pressed="${d===selectedDate}">${i+1}</button>`;
  }).join('');
}
function render() {
  $('#total-count').textContent=entries.length; $('#stat-total').textContent=entries.length;
  $('#stat-month').textContent=entries.filter(e=>e.date.startsWith(today.slice(0,7))).length;
  const counts=Object.keys(moods).map(m=>[m,entries.filter(e=>e.mood===m).length]).sort((a,b)=>b[1]-a[1]);
  $('#stat-mood').textContent=entries.length?`${moods[counts[0][0]][0]} ${moods[counts[0][0]][1]}`:'아직 기록 전';
  const query=$('#search').value.trim().toLowerCase(), filter=$('#mood-filter').value;
  let list=entries.filter(e=>(!selectedDate||e.date===selectedDate)&&(!filter||e.mood===filter)&&(!query||`${e.title} ${e.content}`.toLowerCase().includes(query)));
  if($('#sort').value==='asc') list=[...list].reverse();
  $('#visible-count').textContent=list.length;
  $('#view-name').textContent=selectedDate? selectedDate===today?'오늘의 기록':'날짜별 기록':'모든 일기';
  $('#list-title').firstChild.textContent=selectedDate?'그날의 이야기 ':'나의 모든 이야기 ';
  $('#active-filter').innerHTML=selectedDate?`<button class="filter-chip" id="clear-date">${dateLabel(selectedDate)} <span>×</span></button>`:'';
  $('#all-entries').classList.toggle('active',!selectedDate); $('#today-entries').classList.toggle('active',selectedDate===today);
  if(list.length) $('#entries').innerHTML=list.map(e=>`<button class="entry-card" data-id="${e.id}"><div class="card-meta"><span>${dateLabel(e.date)}</span>${badge(e.mood)}</div><h3>${escape(e.title)}</h3><p>${escape(e.content)}</p><div class="card-bottom"><span>${e.content.length.toLocaleString()}자의 마음</span><span>이야기 읽기 ↗</span></div></button>`).join('');
  else $('#entries').innerHTML=`<div class="empty"><span class="empty-symbol">▤</span><h3>${query||filter?'찾는 이야기가 아직 없어요':selectedDate?'이날의 이야기를 남겨볼까요?':'첫 번째 조각을 남겨보세요'}</h3><p>${query||filter?'검색어나 기분 필터를 바꿔보세요.':'사소한 순간도 좋아요.<br>오늘의 나를 기억할 수 있는 작은 기록을 시작해보세요.'}</p>${query||filter?'<button class="secondary" id="reset-filters">필터 초기화</button>':'<button class="primary" id="empty-new">＋ 일기 쓰기</button>'}</div>`;
  renderCalendar();
}
function renderMoods() { $('#mood-picker').innerHTML=Object.entries(moods).map(([key,[icon,label]])=>`<button type="button" class="mood-option ${mood===key?'selected':''}" data-mood="${key}" aria-pressed="${mood===key}">${icon} ${label}</button>`).join(''); }
function draft() {return JSON.stringify([$('#entry-date').value,$('#entry-title').value,$('#entry-content').value,mood]);}
function openEditor(entry) {
  if(!currentUser())return toast('먼저 Google 계정으로 로그인해 주세요.');
  editingId=entry?.id??null; mood=entry?.mood||'calm';
  $('#entry-date').value=entry?.date||selectedDate||today; $('#entry-title').value=entry?.title||''; $('#entry-content').value=entry?.content||'';
  $('#editor-title').textContent=entry?'그날의 이야기를 다듬어요':'오늘은 어떤 하루였나요?';
  $('#form-error').textContent=''; $('#char-count').textContent=`${$('#entry-content').value.length.toLocaleString()}자`; renderMoods(); savedDraft=draft(); $('#editor').showModal();
}
function closeEditor() {if(saving)return;if(draft()!==savedDraft&&!confirm('저장하지 않은 내용이 있어요. 작성을 닫을까요?'))return;$('#editor').close();}
function openReader(id) { const entry=entries.find(e=>e.id===id); if(!entry)return;readingId=id;$('#reader-meta').innerHTML=`${dateLabel(entry.date)} ${badge(entry.mood)}`;$('#reader-title').textContent=entry.title;$('#reader-content').textContent=entry.content;$('#reader').showModal(); }
$('#header-date').textContent=now.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
document.querySelectorAll('.new-entry').forEach(b=>b.addEventListener('click',()=>openEditor()));
$('#prev-month').onclick=()=>{month.setMonth(month.getMonth()-1);renderCalendar();}; $('#next-month').onclick=()=>{month.setMonth(month.getMonth()+1);renderCalendar();};
$('#calendar-days').onclick=e=>{const b=e.target.closest('[data-date]');if(b){selectedDate=selectedDate===b.dataset.date?'':b.dataset.date;render();}};
$('#all-entries').onclick=()=>{selectedDate='';$('#search').value='';$('#mood-filter').value='';render();}; $('#today-entries').onclick=()=>{selectedDate=today;render();};
$('#active-filter').onclick=()=>{selectedDate='';render();};
$('#search').oninput=render; $('#mood-filter').onchange=render; $('#sort').onchange=render;
$('#entries').onclick=e=>{const card=e.target.closest('[data-id]');if(card)openReader(card.dataset.id);if(e.target.closest('#empty-new'))openEditor();if(e.target.closest('#reset-filters')){$('#search').value='';$('#mood-filter').value='';render();}};
$('#mood-picker').onclick=e=>{const b=e.target.closest('[data-mood]');if(b){mood=b.dataset.mood;renderMoods();}};
$('#entry-content').oninput=()=>{$('#char-count').textContent=`${$('#entry-content').value.length.toLocaleString()}자`;};
$('#close-editor').onclick=closeEditor;$('#cancel-editor').onclick=closeEditor;$('#editor').oncancel=e=>{e.preventDefault();closeEditor();};
$('#close-reader').onclick=()=>$('#reader').close();
$('#edit-entry').onclick=()=>{const entry=entries.find(e=>e.id===readingId);$('#reader').close();openEditor(entry);};
$('#delete-entry').onclick=()=>$('#delete-dialog').showModal();$('#cancel-delete').onclick=()=>$('#delete-dialog').close();
$('#confirm-delete').onclick=async()=>{const b=$('#confirm-delete');b.disabled=true;try{await api(`/api/entries/${readingId}`,{method:'DELETE'});$('#delete-dialog').close();$('#reader').close();await refresh();toast('기록을 삭제했어요.');}catch(e){toast(e.message);}finally{b.disabled=false;}};
$('#entry-form').onsubmit=async e=>{
  e.preventDefault();if(saving)return;saving=true;$('#save-entry').disabled=true;$('#save-entry').textContent='저장하는 중…';$('#form-error').textContent='';
  try {await api(editingId?`/api/entries/${editingId}`:'/api/entries',{method:editingId?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:$('#entry-date').value,title:$('#entry-title').value,content:$('#entry-content').value,mood})});$('#editor').close();selectedDate='';$('#search').value='';$('#mood-filter').value='';await refresh();toast('오늘의 조각을 소중히 저장했어요.');}
  catch(error){$('#form-error').textContent=error.message;}finally{saving=false;$('#save-entry').disabled=false;$('#save-entry').textContent='기록 저장하기 ↗';}
};
window.addEventListener('beforeunload',e=>{if($('#editor').open&&draft()!==savedDraft){e.preventDefault();e.returnValue='';}});
render();
const resetPrivateUI=()=>{
 entries=[];editingId=null;readingId=null;savedDraft='';
 for(const id of ['editor','reader','delete-dialog'])$('#'+id).close();
 $('#entry-form').reset();$('#reader-title').textContent='';$('#reader-content').textContent='';$('#reader-meta').textContent='';$('#search').value='';selectedDate='';render();
};
$('#google-login').onclick=async()=>{const b=$('#google-login');b.disabled=true;try{await login()}catch(e){toast(errorMessage(e))}finally{b.disabled=false}};
$('#google-logout').onclick=async()=>{if(saving)return toast('저장이 끝난 후 로그아웃해 주세요.');if($('#editor').open&&draft()!==savedDraft&&!confirm('저장하지 않은 내용을 지우고 로그아웃할까요?'))return;try{await logout();resetPrivateUI();toast('로그아웃했습니다.')}catch(e){toast(errorMessage(e))}};
$('#backup').onclick=async e=>{e.preventDefault();try{const list=await api('/api/entries');const blob=new Blob([JSON.stringify({version:2,exported_at:new Date().toISOString(),entries:list},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='oneul-diary-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){toast(e.message)}};
observeSession(user=>{
 resetPrivateUI();$('#google-login').disabled=false;$('#google-login').hidden=!!user;$('#google-logout').hidden=!user;
 $('#session-status').textContent=user?'Google 로그인 완료 · 나의 비공개 기록':'Google 로그인 후 일기를 작성하고 다른 기기에서도 이어볼 수 있어요.';
 document.querySelectorAll('.new-entry').forEach(b=>b.disabled=!user);
},list=>{entries=list;render()},error=>{toast(errorMessage(error));$('#session-status').textContent='연결을 확인하고 다시 로그인해 주세요.'});
