/* Level Day - script.js (vanilla JS)
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
todayBtn.addEventListener('click', ()=>{dateInput.value = todayISO(); render();});
addForm.addEventListener('submit', onAddPreset);
exportBtn.addEventListener('click', onExport);
importFile.addEventListener('change', onImport);
resetBtn.addEventListener('click', onReset);


renderPresets();
render();
}


function renderPresets(){
presetList.innerHTML = '';
state.presets.forEach(p => {
const el = document.createElement('div');
el.className = 'presetItem';
el.innerHTML = `<div class="emoji">${p.emoji||'✨'}</div>
<div>
<div class="title">${p.title}</div>
<div class="points">${p.points} ponto(s)</div>
</div>
<button data-id="${p.id}">Marcar</button>`;
const btn = el.querySelector('button');
btn.addEventListener('click', ()=> markDone(p));
presetList.appendChild(el);
});
}


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


function render(){
const day = dateInput.value;
entriesDate.textContent = day;
const list = state.entries[day]||[];
entriesList.innerHTML = '';
list.forEach(item =>{
const li = document.createElement('li');
li.innerHTML = `<div><div style="font-weight:600">${item.title}</div><div style="font-size:12px;opacity:.9">${item.points}
