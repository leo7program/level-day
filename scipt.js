/* Level Day - script.js (vanilla JS)
   - salva no localStorage
   - presets iniciais
   - marca conquistas, calcula pontos, streak
   - redesenha gráfico (Chart.js)
*/

const STORAGE_KEY = 'levelday_v1_static';

const DEFAULT_PRESETS = [
  { id: 'arrumar-cama', title: 'Arrumar a cama', points: 1, emoji: '🛏️' },
  { id: 'banho-gelado', title: 'Tomar banho gelado', points: 2, emoji: '🚿' },
  { id: 'agradecer-5', title: 'Agradecer por 5 coisas', points: 1, emoji: '🙏' },
  { id: 'academia', title: 'Ir para a academia', points: 2, emoji: '🏋️' },
  { id: 'ler-10', title: 'Ler 10 minutos', points: 1, emoji: '📚' },
  { id: 'meditar-5', title: 'Meditar 5 minutos', points: 1, emoji: '🧘' },
];

let state = {
  presets: [],
  entries: {}, // { 'YYYY-MM-DD': [ {id,title,points} ] }
};

// ---- helpers ----
function todayISO() { return new Date().toISOString().slice(0,10); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ console.error('loadState error', e); return null; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ---- main init after DOM ready ----
document.addEventListener('DOMContentLoaded', () => {
  const s = loadState();
  if(s){ state = s; }
  else{ state.presets = DEFAULT_PRESETS.slice(); state.entries = {}; saveState(); }

  // dom refs
  window.dateInput = document.getElementById('dateInput');
  window.presetList = document.getElementById('presetList');
  window.entriesList = document.getElementById('entriesList');
  window.entriesDate = document.getElementById('entriesDate');
  window.dayPoints = document.getElementById('dayPoints');
  window.streakCount = document.getElementById('streakCount');
  window.todayBtn = document.getElementById('todayBtn');
  window.addForm = document.getElementById('addForm');
  window.newTitle = document.getElementById('newTitle');
  window.newPoints = document.getElementById('newPoints');
  window.exportBtn = document.getElementById('exportBtn');
  window.importFile = document.getElementById('importFile');
  window.resetBtn = document.getElementById('resetBtn');

  // set date
  dateInput.value = todayISO();

  // events
  dateInput.addEventListener('change', render);
  todayBtn.addEventListener('click', ()=>{ dateInput.value = todayISO(); render(); });
  addForm.addEventListener('submit', onAddPreset);
  exportBtn.addEventListener('click', onExport);
  importFile.addEventListener('change', onImport);
  resetBtn.addEventListener('click', onReset);

  renderPresets();
  render();
});

// ---- presets rendering ----
function renderPresets(){
  presetList.innerHTML = '';
  state.presets.forEach(p => {
    const el = document.createElement('div');
    el.className = 'presetItem';
    el.innerHTML = `
      <div class="presetEmoji">${p.emoji||'✨'}</div>
      <div style="min-width:0">
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="points">${p.points} ponto(s)</div>
      </div>
      <button data-id="${p.id}">Marcar</button>
    `;
    const btn = el.querySelector('button');
    btn.addEventListener('click', ()=> markDone(p));
    presetList.appendChild(el);
  });
}

// ---- mark done / add / remove ----
function markDone(preset){
  const day = dateInput.value;
  if(!state.entries[day]) state.entries[day]=[];
  state.entries[day].push({ id: preset.id+'-'+Date.now(), title: preset.title, points: preset.points });
  saveState(); render();
}

function onAddPreset(e){
  e.preventDefault();
  const t = newTitle.value.trim();
  const pts = Number(newPoints.value)||1;
  if(!t) return;
  const id = t.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now();
  const p = { id, title: t, points: pts, emoji: '⭐' };
  state.presets.unshift(p);
  newTitle.value=''; newPoints.value='1';
  saveState(); renderPresets();
}

// ---- render page ----
function render(){
  const day = dateInput.value;
  entriesDate.textContent = day;
  const list = state.entries[day]||[];
  entriesList.innerHTML = '';
  list.forEach(item =>{
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(item.title)}</div>
        <div style="font-size:12px;opacity:.9">${item.points} ponto(s)</div>
      </div>
      <div><button class="btn ghost small" data-id="${item.id}">Remover</button></div>
    `;
    li.querySelector('button').addEventListener('click', ()=>{ removeEntry(day,item.id); });
    entriesList.appendChild(li);
  });
  if(list.length===0){ entriesList.innerHTML = '<li style="opacity:.8">Nenhuma entrada registrada neste dia.</li>'; }

  dayPoints.textContent = pointsForDate(day);
  streakCount.textContent = calcStreak();
  drawChart();
}

function removeEntry(day,id){
  state.entries[day] = (state.entries[day]||[]).filter(x=>x.id!==id);
  if(state.entries[day] && state.entries[day].length===0) delete state.entries[day];
  saveState(); render();
}

function pointsForDate(dateISO){
  return (state.entries[dateISO]||[]).reduce((s,i)=>s+(i.points||0),0);
}

function calcStreak(){
  let count = 0;
  let d = new Date();
  while(true){
    const iso = d.toISOString().slice(0,10);
    if((state.entries[iso]||[]).length>0){ count++; d.setDate(d.getDate()-1); } else break;
  }
  return count;
}

// ---- chart (last 14 days) ----
let chart = null;
function drawChart(){
  try{
    const canvas = document.getElementById('progressChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const end = new Date(dateInput.value+'T00:00:00');
    const days = [];
    for(let i=13;i>=0;i--){ const d = new Date(end); d.setDate(end.getDate()-i); const iso = d.toISOString().slice(0,10); days.push(iso); }
    const labels = days.map(d=>d.slice(5).replace('-','/'));
    const data = days.map(d=> pointsForDate(d));

    if(chart){
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
      return;
    }

    chart = new Chart(ctx,{
      type:'line',
      data:{ labels, datasets:[{ label:'Pontos', data, fill:true, tension:0.4, backgroundColor:'rgba(139,92,246,0.15)', borderColor:'rgba(99,102,241,0.95)', pointRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } }
    });
  } catch(err){
    console.error('drawChart error', err);
  }
}

// ---- export / import / reset ----
function onExport(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='levelday-export.json'; a.click(); URL.revokeObjectURL(url);
}
function onImport(e){
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader(); r.onload = ()=>{
    try{ const data = JSON.parse(r.result); if(data.presets) state.presets = data.presets; if(data.entries) state.entries = data.entries; saveState(); renderPresets(); render(); alert('Importado com sucesso!'); }
    catch(err){ alert('Arquivo inválido'); }
  }; r.readAsText(file);
}
function onReset(){
  if(!confirm('Tem certeza? Isso apagará todos os dados locais.')) return;
  state.presets = DEFAULT_PRESETS.slice(); state.entries = {}; saveState(); renderPresets(); render();
}

// ---- small util ----
function escapeHtml(unsafe){
  return unsafe.replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; });
}
