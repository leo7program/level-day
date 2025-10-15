/* Level Day — script.js (versão aprimorada)
   - salva no localStorage
   - presets iniciais
   - pontos, streak, gráfico (Chart.js)
   - proteção contra erros
*/
const STORAGE_KEY = 'levelday_v2';
const DEFAULT_PRESETS = [
  { id: 'arrumar-cama', title: 'Arrumar a cama', points: 1, emoji: '🛏️' },
  { id: 'banho-gelado', title: 'Tomar banho gelado', points: 2, emoji: '🚿' },
  { id: 'agradecer-5', title: 'Agradecer por 5 coisas', points: 1, emoji: '🙏' },
  { id: 'academia', title: 'Ir para a academia', points: 2, emoji: '🏋️' },
  { id: 'ler-10', title: 'Ler 10 minutos', points: 1, emoji: '📚' },
  { id: 'meditar-5', title: 'Meditar 5 minutos', points: 1, emoji: '🧘' },
];

let state = { presets: [], entries: {} }; // entries: { 'YYYY-MM-DD': [ {id,title,points} ] }
let chart = null;

function todayISO(){ return new Date().toISOString().slice(0,10); }
function loadState(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ console.error('loadState', e); return null; } }
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){ console.error('saveState', e); } }

document.addEventListener('DOMContentLoaded', () => {
  const s = loadState();
  if(s){ state = s; } else { state.presets = DEFAULT_PRESETS.slice(); state.entries = {}; saveState(); }

  // dom
  const dateInput = document.getElementById('dateInput');
  const presetList = document.getElementById('presetList');
  const entriesList = document.getElementById('entriesList');
  const entriesDate = document.getElementById('entriesDate');
  const dayPoints = document.getElementById('dayPoints');
  const streakCount = document.getElementById('streakCount');
  const totalPointsText = document.getElementById('totalPointsText');
  const totalPointsRing = document.getElementById('totalPoints');
  const ringValue = document.getElementById('ringValue');

  // controls
  dateInput.value = todayISO();
  document.getElementById('todayBtn').addEventListener('click', ()=>{ dateInput.value = todayISO(); render(); });
  document.getElementById('addForm').addEventListener('submit', (e)=>{ e.preventDefault(); onAddPreset(); });
  document.getElementById('exportBtn').addEventListener('click', onExport);
  document.getElementById('importFile').addEventListener('change', onImport);
  document.getElementById('resetBtn').addEventListener('click', onReset);
  document.getElementById('shufflePresets').addEventListener('click', ()=>{ shuffle(state.presets); renderPresets(); });

  dateInput.addEventListener('change', render);

  // initial
  renderPresets();
  render();

  // functions
  function renderPresets(){
    presetList.innerHTML = '';
    state.presets.forEach(p => {
      const el = document.createElement('div');
      el.className = 'preset-item';
      el.innerHTML = `
        <div class="preset-emoji">${p.emoji||'✨'}</div>
        <div class="preset-meta">
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="points">${p.points} ponto(s)</div>
        </div>
        <button data-id="${p.id}">Marcar</button>
      `;
      el.querySelector('button').addEventListener('click', ()=> markDone(p));
      presetList.appendChild(el);
    });
  }

  function markDone(preset){
    const day = dateInput.value;
    if(!state.entries[day]) state.entries[day] = [];
    state.entries[day].push({ id: preset.id + '-' + Date.now(), title: preset.title, points: preset.points });
    saveState(); render();
  }

  function onAddPreset(){
    const newTitle = document.getElementById('newTitle');
    const newPoints = document.getElementById('newPoints');
    const t = newTitle.value.trim();
    if(!t) return;
    const pts = Number(newPoints.value) || 1;
    const id = t.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    state.presets.unshift({ id, title: t, points: pts, emoji: '⭐' });
    newTitle.value = '';
    newPoints.value = '1';
    saveState();
    renderPresets();
  }

  function render(){
    const day = dateInput.value;
    entriesDate.textContent = day;
    const list = state.entries[day] || [];
    entriesList.innerHTML = '';
    list.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div style="font-weight:600">${escapeHtml(item.title)}</div>
          <small>${item.points} ponto(s)</small>
        </div>
        <div><button class="btn small ghost" data-id="${item.id}">Remover</button></div>
      `;
      li.querySelector('button').addEventListener('click', ()=>{ removeEntry(day, item.id); });
      entriesList.appendChild(li);
    });
    if(list.length === 0) entriesList.innerHTML = '<li style="opacity:.85">Nenhuma entrada registrada neste dia.</li>';

    dayPoints.textContent = pointsForDate(day);
    const streak = calcStreak();
    streakCount.textContent = `${streak} 🔥`;
    const total = totalPoints();
    totalPointsText.textContent = `${total} pontos`;
    totalPointsRing.textContent = total;

    // update ring (stroke-dashoffset)
    const pct = Math.min(100, Math.round((total / Math.max(1, 100)) * 100)); // visual scale (100 pontos => 100%)
    const circumference = 100;
    const offset = ((100 - pct) / 100) * circumference;
    // set stroke-dasharray to reflect percentage (we'll map to stroke-dashoffset)
    // easier approach: set stroke-dasharray via attribute
    if(ringValue){
      ringValue.style.strokeDasharray = '100';
      ringValue.style.strokeDashoffset = offset;
      ringValue.style.transition = 'stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)';
      ringValue.style.stroke = 'url(#)'; // placeholder; visual is controlled by CSS
    }

    drawChart();
  }

  function removeEntry(day, id){
    state.entries[day] = (state.entries[day] || []).filter(x=> x.id !== id);
    if(state.entries[day] && state.entries[day].length === 0) delete state.entries[day];
    saveState(); render();
  }

  function pointsForDate(dateISO){
    return (state.entries[dateISO] || []).reduce((s,i)=> s + (i.points || 0), 0);
  }

  function calcStreak(){
    let count = 0;
    let d = new Date();
    while(true){
      const iso = d.toISOString().slice(0,10);
      if((state.entries[iso] || []).length > 0){ count++; d.setDate(d.getDate()-1); } else break;
    }
    return count;
  }

  function totalPoints(){
    return Object.keys(state.entries).reduce((s, day) => s + pointsForDate(day), 0);
  }

  // chart
  function drawChart(){
    try{
      const canvas = document.getElementById('progressChart');
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const end = new Date(document.getElementById('dateInput').value + 'T00:00:00');
      const days = [];
      for(let i = 13; i >= 0; i--){
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        days.push(d.toISOString().slice(0,10));
      }
      const labels = days.map(d => d.slice(5).replace('-', '/'));
      const data = days.map(d => pointsForDate(d));

      if(chart){
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
        return;
      }

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Pontos',
            data,
            backgroundColor: data.map(v => v === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.9)'),
            borderRadius: 6,
            maxBarThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision:0 } }
          }
        }
      });

    } catch(err){
      console.error('drawChart error', err);
    }
  }

  // export/import/reset
  function onExport(){
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'levelday-export.json'; a.click(); URL.revokeObjectURL(url);
  }
  function onImport(e){
    const file = e.target.files[0]; if(!file) return;
    const r = new FileReader(); r.onload = ()=>{
      try{
        const data = JSON.parse(r.result);
        if(data.presets) state.presets = data.presets;
        if(data.entries) state.entries = data.entries;
        saveState(); renderPresets(); render(); alert('Importado com sucesso!');
      }catch(err){ alert('Arquivo inválido'); }
    }; r.readAsText(file);
  }
  function onReset(){
    if(!confirm('Tem certeza? Isso apagará todos os dados locais.')) return;
    state.presets = DEFAULT_PRESETS.slice();
    state.entries = {};
    saveState();
    renderPresets();
    render();
  }

  // helpers
  function escapeHtml(unsafe){ return String(unsafe).replace(/[&<"'>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; }); }
  function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
});
