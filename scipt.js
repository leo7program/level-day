const STORAGE_KEY = 'levelday_users';
let currentUser = null;
let state = { presets: [], entries: {} };
let chart = null;

const DEFAULT_PRESETS = [
  { id:'arrumar-cama', title:'Arrumar a cama', points:1, emoji:'🛏️' },
  { id:'banho-gelado', title:'Tomar banho gelado', points:2, emoji:'🚿' },
  { id:'agradecer-5', title:'Agradecer por 5 coisas', points:1, emoji:'🙏' },
  { id:'academia', title:'Ir para academia', points:2, emoji:'🏋️' },
];

document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');
  const todayDate = document.getElementById('todayDate');

  const presetList = document.getElementById('presetList');
  const entriesList = document.getElementById('entriesList');
  const dayPoints = document.getElementById('dayPoints');
  const totalPointsText = document.getElementById('totalPointsText');
  const addForm = document.getElementById('addForm');
  const newTitle = document.getElementById('newTitle');
  const newPoints = document.getElementById('newPoints');

  const congratsModal = document.getElementById('congratsModal');
  const closeCongrats = document.getElementById('closeCongrats');

  const today = new Date().toISOString().slice(0,10);
  todayDate.textContent = today;

  loginBtn.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    if (!user || !pass) { loginError.textContent = 'Preencha usuário e senha'; return; }

    let users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (users[user] && users[user].password !== pass) { loginError.textContent='Senha incorreta'; return; }
    if (!users[user]) users[user]={password:pass,state:{ presets:DEFAULT_PRESETS.slice(), entries:{} }};

    currentUser = user;
    state = users[user].state;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(users));

    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');

    render();
  });

  logoutBtn.addEventListener('click', ()=>{ saveUser(); currentUser=null; state={ presets:[], entries:{} }; appScreen.classList.add('hidden'); loginScreen.classList.remove('hidden'); });

  addForm.addEventListener('submit', e=>{ e.preventDefault(); const t=newTitle.value.trim(); const pts=Number(newPoints.value); if(!t) return; const id=t.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now(); state.presets.unshift({id,title:t,points:pts,emoji:'⭐'}); newTitle.value=''; newPoints.value='1'; saveUser(); renderPresets(); });

  function renderPresets(){ presetList.innerHTML=''; state.presets.forEach(p=>{ const div=document.createElement('div'); div.innerHTML=`<span>${p.emoji} ${p.title}</span><button>✔️</button>`; div.querySelector('button').addEventListener('click', ()=>{ markDone(p); showCongrats(); }); presetList.appendChild(div); }); }

  function markDone(p){ if(!state.entries[today]) state.entries[today]=[]; state.entries[today].push({id:p.id+'-'+Date.now(),title:p.title,points:p.points}); saveUser(); render(); }

  function render(){ const list=state.entries[today]||[]; entriesList.innerHTML=''; list.forEach(item=>{ const li=document.createElement('li'); li.textContent=`${item.title} (${item.points} pts)`; entriesList.appendChild(li); }); dayPoints.textContent=list.reduce((a,b)=>a+b.points,0); const totalPoints=Object.values(state.entries).flat().reduce((a,b)=>a+b.points,0); totalPointsText.textContent=totalPoints; renderChart(); renderPresets(); }

  function renderChart(){ const labels=[]; const data=[]; for(let i=13;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const dayStr=d.toISOString().slice(0,10); labels.push(dayStr.slice(5)); const pts=(state.entries[dayStr]||[]).reduce((a,b)=>a+b.points,0); data.push(pts); } if(chart) chart.destroy(); const ctx=document.getElementById('progressChart').getContext('2d'); chart=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'Pontos',data,backgroundColor:'rgba(99,102,241,0.8)'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}}); }

  function saveUser(){ let users=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); users[currentUser].state=state; localStorage.setItem(STORAGE_KEY,JSON.stringify(users)); }

  function showCongrats(){ congratsModal.classList.remove('hidden'); setTimeout(()=> congratsModal.classList.add('hidden'),2000); }

  closeCongrats.addEventListener('click', ()=> congratsModal.classList.add('hidden'));
});
