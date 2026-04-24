/* ═══════════════════════════════════════════
   FINANZAS APP — app.js
   Full state management + all page renderers
═══════════════════════════════════════════ */

// ── CONSTANTS ──────────────────────────────
const STORE_KEY = 'finanzasApp_v1';
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ACCOUNT_TYPES = ['Corriente','Ahorros','Efectivo','Tarjeta de crédito','Inversión','Otro'];

const COLORS = ['#c8ff5a','#5af5c8','#f55a8a','#f5c85a','#a78bfa','#60a5fa','#fb923c','#34d399','#f472b6','#94a3b8'];

const ICONS = ['💰','🏦','💳','🪙','💵','📱','🚍','🥗','💪','🩺','☀️','🎉','🎓','✈️','🏠','🛒','⚡','🎮','📚','🎵','🐶','👗','💊','🧴','🍕','☕','🏋️','💻','🔧','🎯'];

const TIPS = [
  { icon:'💡', title:'Regla del 50/30/20', body:'Destina el 50% de tus ingresos a necesidades, el 30% a deseos y el 20% a ahorro e inversión. Es el punto de partida más sólido para una vida financiera sana.', tag:'Presupuesto' },
  { icon:'🎯', title:'Págate a ti primero', body:'Antes de cualquier gasto, separa tu ahorro el mismo día que cobras. Lo que no ves, no lo gastas. Automatizar el ahorro es la diferencia entre querer ahorrar y realmente ahorrar.', tag:'Ahorro' },
  { icon:'📊', title:'Fondo de emergencia', body:'Apunta a tener entre 3 y 6 meses de gastos básicos en una cuenta separada. Este colchón te protege de imprevistos sin endeudarte.', tag:'Emergencias' },
  { icon:'🚫', title:'Cuidado con las deudas de consumo', body:'Las tarjetas de crédito con interés alto son el enemigo número uno del patrimonio. Si tienes deuda, págala antes de cualquier "inversión". Ninguna inversión rinde más que el 30-60% anual que cobran.', tag:'Deuda' },
  { icon:'📈', title:'El interés compuesto es tu aliado', body:'Invertir aunque sea una cantidad pequeña desde temprano tiene un impacto enorme a largo plazo. RD$1,000 mensuales invertidos al 8% anual se convierten en más de RD$1.4M en 30 años.', tag:'Inversión' },
  { icon:'🧾', title:'Registra todo, sin excepción', body:'El simple acto de anotar cada gasto cambia tu comportamiento. No necesitas un sistema perfecto, necesitas consistencia. Lo que se mide, mejora.', tag:'Hábitos' },
  { icon:'🛒', title:'Espera 48 horas antes de comprar', body:'Para cualquier compra no esencial mayor de RD$500, espera dos días. Si después de 48 horas todavía lo quieres y puedes pagarlo, cómpralo. Elimina el 80% de las compras impulsivas.', tag:'Consumo' },
  { icon:'🏦', title:'Diversifica tus cuentas', body:'Ten al menos una cuenta de ahorro separada de la corriente. Lo ideal: una para gastos diarios, una para emergencias, y una para metas específicas. La separación visual crea disciplina.', tag:'Cuentas' },
  { icon:'🔄', title:'Revisa tu presupuesto mensualmente', body:'Un presupuesto que no se revisa deja de funcionar. Al inicio de cada mes toma 10 minutos para ver qué funcionó, qué no, y ajusta. La flexibilidad es parte de la disciplina.', tag:'Revisión' },
  { icon:'💬', title:'Habla de dinero sin tabú', body:'El silencio sobre las finanzas personales es costoso. Aprende de quienes manejan bien su dinero, compara precios, negocia. La información financiera que compartes y recibes tiene valor real.', tag:'Mentalidad' },
];

const QUOTES = [
  { text: 'No es cuánto ganas, sino cuánto <em>guardas</em> lo que determina tu riqueza.', author: '— Robert Kiyosaki' },
  { text: 'Un presupuesto te dice a dónde va tu dinero en vez de preguntarte <em>a dónde fue</em>.', author: '— Dave Ramsey' },
  { text: 'La riqueza no es tener mucho dinero. Es tener <em>muchas opciones</em>.', author: '— Chris Rock' },
  { text: 'El dinero no compra la felicidad, pero la <em>falta de dinero</em> compra la miseria.', author: '— Daniel Kahneman' },
  { text: 'Invierte en ti mismo. Tu carrera es el <em>motor de tu riqueza</em>.', author: '— Paul Clitheroe' },
  { text: 'El secreto de hacerse rico es no gastar más de lo que <em>ganas</em>.', author: '— Benjamin Franklin' },
  { text: 'No ahorres lo que te queda después de gastar; <em>gasta lo que queda después de ahorrar</em>.', author: '— Warren Buffett' },
  { text: 'Las finanzas personales son un <em>80% comportamiento</em> y un 20% conocimiento.', author: '— Dave Ramsey' },
];

// ── STATE ──────────────────────────────────
let state = loadState();
let currentPage = 'dashboard';
let currentMonth = getMonthKey();
let openCards = new Set(state.openCards || []);
let activeModal = null;
let editTarget = null;
let quoteIndex = 0;
let toastTimer = null;

function defaultState() {
  return {
    theme: 'dark',
    income: {},          // { 'YYYY-MM': number }
    defaultIncome: 0,
    categories: defaultCategories(),
    expenses: {},        // { 'YYYY-MM': { catId: [{desc,amount,date}] } }
    goals: defaultGoals(),
    accounts: defaultAccounts(),
    notes: [],
    openCards: [],
    quoteIndex: 0,
  };
}

function defaultCategories() {
  return [];
}

function defaultGoals() {
  return [];
}

function defaultAccounts() {
  return [];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    // Merge missing keys
    const def = defaultState();
    for (const k of Object.keys(def)) { if (s[k] === undefined) s[k] = def[k]; }
    return s;
  } catch { return defaultState(); }
}

function saveState() {
  state.openCards = [...openCards];
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// ── HELPERS ────────────────────────────────
function getMonthKey(offset=0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function parseMonthKey(key) {
  const [y,m] = key.split('-').map(Number);
  return { year:y, month:m-1 };
}

function monthLabel(key) {
  const { year, month } = parseMonthKey(key);
  return `${MONTHS[month]} ${year}`;
}

function fmt(n) { return Math.round(n).toLocaleString('es-DO'); }
function fmtFull(n) { return `RD$${fmt(n)}`; }

function todayStr() {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth()+1}`;
}

function uid() { return Math.random().toString(36).slice(2,9); }

function getIncome(monthKey) {
  return state.income[monthKey] ?? state.defaultIncome;
}

function getExpenses(monthKey) {
  return state.expenses[monthKey] || {};
}

function getCatSpent(catId, monthKey) {
  const exps = getExpenses(monthKey)[catId] || [];
  return exps.reduce((a,e) => a + e.amount, 0);
}

function getTotalSpent(monthKey) {
  return state.categories.reduce((a, cat) => a + getCatSpent(cat.id, monthKey), 0);
}

// ── THEME ──────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  state.theme = t;
  saveState();
}

// ── TOAST ──────────────────────────────────
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── MODALS ─────────────────────────────────
function openModal(id) {
  closeModal();
  activeModal = id;
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function closeModal() {
  if (activeModal) {
    const el = document.getElementById(activeModal);
    if (el) el.classList.remove('show');
    activeModal = null;
    editTarget = null;
  }
}

// ── NAV ────────────────────────────────────
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  if (page === 'gastos')    renderGastos();
  if (page === 'metas')     renderMetas();
  if (page === 'cuentas')   renderCuentas();
  if (page === 'consejos')  renderConsejos();
  if (page === 'notas')     renderNotas();
}

// ══════════════════════════════════════════
// PAGE: DASHBOARD
// ══════════════════════════════════════════
function renderDashboard() {
  const mk = currentMonth;
  const income = getIncome(mk);
  const spent = getTotalSpent(mk);
  const remaining = income - spent;
  const pct = income > 0 ? Math.min((spent/income)*100,100) : 0;
  const isWarn = pct >= 80;
  const isOver = spent > income;

  // Hero
  document.getElementById('db-income-label').textContent = monthLabel(mk);
  document.getElementById('db-spent').textContent = fmt(spent);
  document.getElementById('db-income').textContent = fmt(income);
  const remEl = document.getElementById('db-remaining');
  remEl.className = isOver ? 'dh-sub danger' : isWarn ? 'dh-sub warn' : 'dh-sub ok';
  remEl.textContent = isOver
    ? `⚠ ${fmtFull(Math.abs(remaining))} excedido`
    : `${fmtFull(remaining)} disponibles`;
  const bar = document.getElementById('db-bar');
  bar.style.width = pct+'%';
  bar.className = `dh-bar-fill${isOver?' danger':isWarn?' warn':''}`;
  document.getElementById('db-bar-pct').textContent = Math.round(pct)+'%';
  document.getElementById('db-bar-income').textContent = fmtFull(income);

  // Stats
  const catCount = state.categories.length;
  const overBudget = state.categories.filter(c => getCatSpent(c.id,mk) > c.budget).length;
  const goalsActive = state.goals.filter(g=>g.status==='active').length;
  const totalBalance = state.accounts.reduce((a,acc)=>a+acc.balance,0);

  document.getElementById('db-stat-saved').textContent = fmtFull(Math.max(remaining,0));
  document.getElementById('db-stat-over').textContent = overBudget > 0 ? `${overBudget} categoría${overBudget>1?'s':''}` : 'Ninguna ✓';
  document.getElementById('db-stat-over').className = 'stat-val ' + (overBudget>0?'danger':'ok');
  document.getElementById('db-stat-goals').textContent = `${goalsActive} activa${goalsActive!==1?'s':''}`;
  document.getElementById('db-stat-balance').textContent = fmtFull(totalBalance);

  // Chart
  renderDashboardChart(mk);

  // Accounts mini
  renderAccountsMini();
}

function renderDashboardChart(mk) {
  const wrap = document.getElementById('db-chart');
  const cats = [...state.categories].sort((a,b) => getCatSpent(b.id,mk) - getCatSpent(a.id,mk)).slice(0,6);
  const maxSpent = Math.max(...cats.map(c => Math.max(getCatSpent(c.id,mk), c.budget)), 1);

  wrap.innerHTML = cats.map(cat => {
    const spent = getCatSpent(cat.id, mk);
    const pct = (spent/maxSpent)*100;
    const isOver = spent > cat.budget;
    const color = isOver ? '#f55a8a' : cat.color;
    return `<div class="bc-row">
      <span class="bc-label">${cat.icon} ${cat.name}</span>
      <div class="bc-track"><div class="bc-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="bc-val">${fmt(spent)}</span>
    </div>`;
  }).join('') || '<div class="exp-empty">Sin gastos registrados</div>';
}

function renderAccountsMini() {
  const wrap = document.getElementById('db-accounts-mini');
  if (!state.accounts.length) { wrap.innerHTML = '<div class="text-muted text-sm">Sin cuentas añadidas</div>'; return; }
  wrap.innerHTML = state.accounts.map(acc => `
    <div class="acc-chip">
      <div class="acc-chip-name">${acc.icon} ${acc.name}</div>
      <div class="acc-chip-val" style="color:${acc.color}">${fmtFull(acc.balance)}</div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════
// PAGE: GASTOS
// ══════════════════════════════════════════
let gastosMonth = currentMonth;

function renderGastos() {
  // Month nav
  document.getElementById('gastos-month-label').textContent = monthLabel(gastosMonth);

  // Income bar
  const income = getIncome(gastosMonth);
  document.getElementById('gastos-income-val').textContent = fmtFull(income);

  // Edit income btn
  document.getElementById('gastos-income-edit').onclick = () => {
    document.getElementById('modal-income-val').value = income;
    openModal('modal-income');
  };

  // Categories
  const container = document.getElementById('gastos-cats');
  container.innerHTML = '';

  if (!state.categories.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-title">Sin categorías</div><div class="empty-text">Crea tu primera categoría con el botón +</div></div>`;
    return;
  }

  state.categories.forEach(cat => {
    const spent = getCatSpent(cat.id, gastosMonth);
    const pct = cat.budget > 0 ? Math.min((spent/cat.budget)*100,100) : 0;
    const remaining = cat.budget - spent;
    const isOver = spent > cat.budget;
    const isNear = !isOver && pct >= 80;
    const isOpen = openCards.has(cat.id);
    const exps = (getExpenses(gastosMonth)[cat.id] || []);
    const statusClass = isOver ? 'danger' : isNear ? 'warn' : 'ok';
    const barColor = isOver ? '#f55a8a' : isNear ? '#f5c85a' : cat.color;

    const div = document.createElement('div');
    div.className = `cat-card${isOver?' over':isNear?' near':''}${isOpen?' open':''}`;
    div.id = `cat-${cat.id}`;
    div.innerHTML = `
      <div class="cat-header" onclick="toggleCat('${cat.id}')">
        <div class="cat-icon" style="background:${cat.color}22">${cat.icon}</div>
        <div class="cat-info">
          <div class="cat-name">${cat.name}</div>
          <div class="cat-sub">Límite: ${fmtFull(cat.budget)}</div>
        </div>
        <div class="cat-amounts">
          <div class="cat-spent" style="color:${barColor}">${fmtFull(spent)}</div>
          <div class="cat-budget-lbl">/ ${fmtFull(cat.budget)}</div>
        </div>
        <span class="cat-chevron">▾</span>
      </div>
      <div class="cat-bar-strip">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <div class="cat-bar-meta">
          <span class="${statusClass}">${isOver ? '⚠ +'+fmtFull(Math.abs(remaining))+' excedido' : fmtFull(remaining)+' restantes'}</span>
          <span class="text-muted">${Math.round(pct)}%</span>
        </div>
      </div>
      <div class="cat-body" id="body-${cat.id}" style="${isOpen?'max-height:700px;border-top-color:var(--border)':''}">
        <div class="cat-body-inner">
          <div class="add-exp-row">
            <input class="input exp-desc-inp" id="exp-desc-${cat.id}" type="text" placeholder="Descripción..." maxlength="50">
            <input class="input exp-amt-inp"  id="exp-amt-${cat.id}"  type="number" placeholder="DOP" min="1">
            <button class="btn btn-primary btn-sm exp-add-btn" onclick="addExpense('${cat.id}')">+</button>
          </div>
          <div class="exp-list" id="exp-list-${cat.id}">
            ${exps.length === 0
              ? '<div class="exp-empty">Sin gastos aún</div>'
              : exps.map((e,i) => `
                <div class="exp-item">
                  <span class="exp-desc">${e.desc}</span>
                  <span class="exp-date">${e.date}</span>
                  <span class="exp-amount" style="color:${cat.color}">${fmtFull(e.amount)}</span>
                  <button class="exp-del" onclick="deleteExpense('${cat.id}',${i})">✕</button>
                </div>`).join('')}
          </div>
        </div>
        <div class="cat-actions">
          <button class="btn btn-ghost btn-sm" onclick="editCategory('${cat.id}')">✏ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory('${cat.id}')">🗑 Eliminar</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function toggleCat(id) {
  const card = document.getElementById(`cat-${id}`);
  const body = document.getElementById(`body-${id}`);
  const isOpen = openCards.has(id);
  if (isOpen) {
    openCards.delete(id);
    card.classList.remove('open');
    body.style.maxHeight = '0';
    body.style.borderTopColor = 'transparent';
  } else {
    openCards.add(id);
    card.classList.add('open');
    body.style.maxHeight = '700px';
    body.style.borderTopColor = 'var(--border)';
  }
  saveState();
}

function addExpense(catId) {
  const descEl = document.getElementById(`exp-desc-${catId}`);
  const amtEl  = document.getElementById(`exp-amt-${catId}`);
  const desc   = descEl.value.trim() || 'Sin descripción';
  const amount = parseFloat(amtEl.value);
  if (!amount || amount <= 0) { toast('Ingresa un monto válido','error'); return; }

  if (!state.expenses[gastosMonth]) state.expenses[gastosMonth] = {};
  if (!state.expenses[gastosMonth][catId]) state.expenses[gastosMonth][catId] = [];
  state.expenses[gastosMonth][catId].unshift({ desc, amount, date: todayStr() });
  saveState();
  descEl.value = ''; amtEl.value = '';
  renderGastos();
  if (currentPage === 'dashboard') renderDashboard();
  toast(`+${fmtFull(amount)} registrado ✓`, 'success');
  // Keep open
  openCards.add(catId);
}

function deleteExpense(catId, idx) {
  state.expenses[gastosMonth][catId].splice(idx, 1);
  saveState();
  renderGastos();
  if (currentPage === 'dashboard') renderDashboard();
  toast('Gasto eliminado');
}

// Category CRUD
function openAddCategory() {
  editTarget = null;
  document.getElementById('modal-cat-title').textContent = 'Nueva categoría';
  document.getElementById('modal-cat-name').value = '';
  document.getElementById('modal-cat-budget').value = '';
  document.getElementById('modal-cat-icon-sel').textContent = '📦';
  selectedCatIcon = '📦';
  selectedCatColor = COLORS[0];
  renderIconGrid();
  renderColorSwatches();
  openModal('modal-cat');
}

function editCategory(id) {
  const cat = state.categories.find(c=>c.id===id);
  if (!cat) return;
  editTarget = id;
  document.getElementById('modal-cat-title').textContent = 'Editar categoría';
  document.getElementById('modal-cat-name').value = cat.name;
  document.getElementById('modal-cat-budget').value = cat.budget;
  document.getElementById('modal-cat-icon-sel').textContent = cat.icon;
  selectedCatIcon = cat.icon;
  selectedCatColor = cat.color;
  renderIconGrid();
  renderColorSwatches();
  openModal('modal-cat');
}

function deleteCategory(id) {
  if (!confirm('¿Eliminar esta categoría y todos sus gastos?')) return;
  state.categories = state.categories.filter(c=>c.id!==id);
  // Remove expenses
  Object.keys(state.expenses).forEach(mk => { delete state.expenses[mk][id]; });
  saveState();
  renderGastos();
  toast('Categoría eliminada');
}

function saveCategory() {
  const name   = document.getElementById('modal-cat-name').value.trim();
  const budget = parseFloat(document.getElementById('modal-cat-budget').value);
  if (!name)            { toast('Ingresa un nombre','error'); return; }
  if (!budget || budget < 0) { toast('Ingresa un límite válido','error'); return; }

  if (editTarget) {
    const cat = state.categories.find(c=>c.id===editTarget);
    cat.name   = name;
    cat.budget = budget;
    cat.icon   = selectedCatIcon;
    cat.color  = selectedCatColor;
  } else {
    state.categories.push({ id:uid(), name, icon:selectedCatIcon, color:selectedCatColor, budget, group:'custom' });
  }
  saveState();
  closeModal();
  renderGastos();
  toast(editTarget ? 'Categoría actualizada ✓' : 'Categoría creada ✓', 'success');
}

// Income modal
function saveIncome() {
  const val = parseFloat(document.getElementById('modal-income-val').value);
  if (!val || val <= 0) { toast('Ingresa un ingreso válido','error'); return; }
  state.income[gastosMonth] = val;
  saveState();
  closeModal();
  renderGastos();
  if (currentPage === 'dashboard') renderDashboard();
  toast('Ingreso actualizado ✓', 'success');
}

// ══════════════════════════════════════════
// PAGE: METAS
// ══════════════════════════════════════════
function renderMetas() {
  const container = document.getElementById('metas-list');
  container.innerHTML = '';

  if (!state.goals.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">Sin metas de ahorro</div><div class="empty-text">Crea tu primera meta con el botón +</div></div>`;
    return;
  }

  state.goals.forEach(g => {
    const pct = g.target > 0 ? Math.min((g.saved/g.target)*100,100) : 0;
    const missing = Math.max(g.target - g.saved, 0);
    const isDone = g.saved >= g.target;
    const monthsLeft = isDone ? 0 : missing > 0 ? '~' + Math.ceil(missing/1000) + ' meses est.' : '—';

    const div = document.createElement('div');
    div.className = `goal-card${isDone?' done':''}`;
    div.innerHTML = `
      <div class="gc-header">
        <div class="gc-left">
          <div class="gc-icon-name"><span class="gc-icon">${g.icon}</span><span class="gc-name">${g.name}</span></div>
          <div class="gc-desc">${g.desc||''}</div>
        </div>
        <span class="gc-badge ${g.status}">${isDone?'✅ Completada':g.status==='paused'?'⏸ Pausada':'▶ Activa'}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${isDone?'#c8ff5a':g.color}"></div></div>
      <div class="gc-amounts">
        <span>Ahorrado: <strong style="color:${g.color}">${fmtFull(g.saved)}</strong></span>
        <span>Meta: ${fmtFull(g.target)}</span>
      </div>
      <div class="gc-amounts mt-4">
        <span class="text-muted">${Math.round(pct)}% completado</span>
        <span class="text-muted">${isDone ? '🎉 Meta alcanzada' : 'Faltan: '+fmtFull(missing)}</span>
      </div>
      ${!isDone ? `
      <div class="gc-add-row">
        <input class="input" id="goal-add-${g.id}" type="number" placeholder="Abonar monto...">
        <button class="btn btn-primary btn-sm" onclick="addToGoal('${g.id}')">+ Abonar</button>
      </div>` : ''}
      <div class="gc-actions">
        <button class="btn btn-ghost btn-sm" onclick="editGoal('${g.id}')">✏ Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleGoalStatus('${g.id}')">${g.status==='paused'?'▶ Reanudar':'⏸ Pausar'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">🗑</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function addToGoal(id) {
  const inp = document.getElementById(`goal-add-${id}`);
  const val = parseFloat(inp.value);
  if (!val || val <= 0) { toast('Ingresa un monto válido','error'); return; }
  const goal = state.goals.find(g=>g.id===id);
  goal.saved = Math.min(goal.saved + val, goal.target);
  saveState();
  inp.value = '';
  renderMetas();
  toast(`+${fmtFull(val)} abonado ✓`, 'success');
}

function toggleGoalStatus(id) {
  const g = state.goals.find(g=>g.id===id);
  g.status = g.status === 'paused' ? 'active' : 'paused';
  saveState();
  renderMetas();
}

function deleteGoal(id) {
  if (!confirm('¿Eliminar esta meta?')) return;
  state.goals = state.goals.filter(g=>g.id!==id);
  saveState();
  renderMetas();
  toast('Meta eliminada');
}

function openAddGoal() {
  editTarget = null;
  document.getElementById('modal-goal-title').textContent = 'Nueva meta';
  document.getElementById('modal-goal-name').value = '';
  document.getElementById('modal-goal-target').value = '';
  document.getElementById('modal-goal-saved').value = '';
  document.getElementById('modal-goal-desc').value = '';
  document.getElementById('modal-goal-icon-sel').textContent = '🎯';
  selectedGoalIcon = '🎯';
  selectedGoalColor = COLORS[0];
  renderGoalIconGrid();
  renderGoalColorSwatches();
  openModal('modal-goal');
}

function editGoal(id) {
  const g = state.goals.find(g=>g.id===id);
  if (!g) return;
  editTarget = id;
  document.getElementById('modal-goal-title').textContent = 'Editar meta';
  document.getElementById('modal-goal-name').value = g.name;
  document.getElementById('modal-goal-target').value = g.target;
  document.getElementById('modal-goal-saved').value = g.saved;
  document.getElementById('modal-goal-desc').value = g.desc||'';
  document.getElementById('modal-goal-icon-sel').textContent = g.icon;
  selectedGoalIcon = g.icon;
  selectedGoalColor = g.color;
  renderGoalIconGrid();
  renderGoalColorSwatches();
  openModal('modal-goal');
}

function saveGoal() {
  const name   = document.getElementById('modal-goal-name').value.trim();
  const target = parseFloat(document.getElementById('modal-goal-target').value);
  const saved  = parseFloat(document.getElementById('modal-goal-saved').value)||0;
  const desc   = document.getElementById('modal-goal-desc').value.trim();
  if (!name)   { toast('Ingresa un nombre','error'); return; }
  if (!target) { toast('Ingresa una meta válida','error'); return; }

  if (editTarget) {
    const g = state.goals.find(g=>g.id===editTarget);
    Object.assign(g, {name, target, saved, desc, icon:selectedGoalIcon, color:selectedGoalColor});
  } else {
    state.goals.push({ id:uid(), name, icon:selectedGoalIcon, color:selectedGoalColor, target, saved, desc, status:'active' });
  }
  saveState();
  closeModal();
  renderMetas();
  toast(editTarget ? 'Meta actualizada ✓' : 'Meta creada ✓', 'success');
}

// ══════════════════════════════════════════
// PAGE: CUENTAS
// ══════════════════════════════════════════
function renderCuentas() {
  const total = state.accounts.reduce((a,acc)=>a+acc.balance,0);
  document.getElementById('cuentas-total').textContent = fmtFull(total);
  document.getElementById('cuentas-count').textContent = `${state.accounts.length} cuenta${state.accounts.length!==1?'s':''}`;

  const container = document.getElementById('cuentas-list');
  container.innerHTML = '';

  if (!state.accounts.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏦</div><div class="empty-title">Sin cuentas</div><div class="empty-text">Añade tus cuentas para ver tu balance total</div></div>`;
    return;
  }

  state.accounts.forEach(acc => {
    const div = document.createElement('div');
    div.className = 'account-card';
    div.innerHTML = `
      <div class="acc-icon-wrap" style="background:${acc.color}22">${acc.icon}</div>
      <div class="acc-info">
        <div class="acc-name">${acc.name}</div>
        <div class="acc-type text-muted text-sm">${acc.type}</div>
      </div>
      <div class="acc-balance" style="color:${acc.color}">${fmtFull(acc.balance)}</div>
      <div class="acc-actions">
        <button class="btn-icon" onclick="editAccount('${acc.id}')" title="Editar">✏</button>
        <button class="btn-icon" onclick="deleteAccount('${acc.id}')" title="Eliminar" style="color:var(--red)">🗑</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function openAddAccount() {
  editTarget = null;
  document.getElementById('modal-acc-title').textContent = 'Nueva cuenta';
  document.getElementById('modal-acc-name').value = '';
  document.getElementById('modal-acc-balance').value = '';
  document.getElementById('modal-acc-type').value = 'Corriente';
  document.getElementById('modal-acc-icon-sel').textContent = '🏦';
  selectedAccIcon = '🏦';
  selectedAccColor = COLORS[1];
  renderAccIconGrid();
  renderAccColorSwatches();
  openModal('modal-acc');
}

function editAccount(id) {
  const acc = state.accounts.find(a=>a.id===id);
  if (!acc) return;
  editTarget = id;
  document.getElementById('modal-acc-title').textContent = 'Editar cuenta';
  document.getElementById('modal-acc-name').value = acc.name;
  document.getElementById('modal-acc-balance').value = acc.balance;
  document.getElementById('modal-acc-type').value = acc.type;
  document.getElementById('modal-acc-icon-sel').textContent = acc.icon;
  selectedAccIcon = acc.icon;
  selectedAccColor = acc.color;
  renderAccIconGrid();
  renderAccColorSwatches();
  openModal('modal-acc');
}

function deleteAccount(id) {
  if (!confirm('¿Eliminar esta cuenta?')) return;
  state.accounts = state.accounts.filter(a=>a.id!==id);
  saveState();
  renderCuentas();
  toast('Cuenta eliminada');
}

function saveAccount() {
  const name    = document.getElementById('modal-acc-name').value.trim();
  const balance = parseFloat(document.getElementById('modal-acc-balance').value)||0;
  const type    = document.getElementById('modal-acc-type').value;
  if (!name) { toast('Ingresa un nombre','error'); return; }

  if (editTarget) {
    const acc = state.accounts.find(a=>a.id===editTarget);
    Object.assign(acc, {name, balance, type, icon:selectedAccIcon, color:selectedAccColor});
  } else {
    state.accounts.push({ id:uid(), name, icon:selectedAccIcon, color:selectedAccColor, type, balance });
  }
  saveState();
  closeModal();
  renderCuentas();
  toast(editTarget ? 'Cuenta actualizada ✓' : 'Cuenta añadida ✓', 'success');
}

// ══════════════════════════════════════════
// PAGE: CONSEJOS
// ══════════════════════════════════════════
function renderConsejos() {
  const q = QUOTES[quoteIndex % QUOTES.length];
  document.getElementById('tip-quote-text').innerHTML = q.text;
  document.getElementById('tip-quote-author').textContent = q.author;

  const container = document.getElementById('tips-list');
  container.innerHTML = TIPS.map(t => `
    <div class="tip-card fade-up">
      <div class="tc-header"><span class="tc-icon">${t.icon}</span><span class="tc-title">${t.title}</span></div>
      <div class="tc-body">${t.body}</div>
      <span class="tc-tag">${t.tag}</span>
    </div>
  `).join('');
}

function nextQuote() {
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  state.quoteIndex = quoteIndex;
  saveState();
  renderConsejos();
}

// ══════════════════════════════════════════
// PAGE: NOTAS
// ══════════════════════════════════════════
function renderNotas() {
  const container = document.getElementById('notas-list');
  const notes = [...state.notes].sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0));

  if (!notes.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">Sin notas</div><div class="empty-text">Escribe una nota rápida arriba</div></div>`;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="note-card${n.pinned?' pinned':''}">
      <div class="note-text">${escapeHtml(n.text)}</div>
      <div class="note-meta">
        <span class="note-date">${n.date}</span>
        <div class="note-actions">
          <button class="note-pin${n.pinned?' pinned':''}" onclick="togglePin('${n.id}')" title="${n.pinned?'Desfijar':'Fijar'}">📌</button>
          <button class="note-del" onclick="deleteNote('${n.id}')">✕</button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function addNote() {
  const ta = document.getElementById('nota-textarea');
  const text = ta.value.trim();
  if (!text) { toast('Escribe algo primero','error'); return; }
  const d = new Date();
  state.notes.unshift({
    id: uid(), text,
    date: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
    pinned: false
  });
  saveState();
  ta.value = '';
  renderNotas();
  toast('Nota guardada ✓', 'success');
}

function togglePin(id) {
  const n = state.notes.find(n=>n.id===id);
  if (n) { n.pinned = !n.pinned; saveState(); renderNotas(); }
}

function deleteNote(id) {
  state.notes = state.notes.filter(n=>n.id!==id);
  saveState();
  renderNotas();
  toast('Nota eliminada');
}

// ══════════════════════════════════════════
// ICON + COLOR PICKERS
// ══════════════════════════════════════════
let selectedCatIcon = '📦', selectedCatColor = COLORS[0];
let selectedGoalIcon = '🎯', selectedGoalColor = COLORS[0];
let selectedAccIcon  = '🏦', selectedAccColor  = COLORS[1];

function renderIconGrid(targetId='modal-cat-icons', selVar='selectedCatIcon', selElId='modal-cat-icon-sel') {
  const grid = document.getElementById(targetId);
  if (!grid) return;
  const sel = eval(selVar);
  grid.innerHTML = ICONS.map(ic => `
    <div class="icon-opt${ic===sel?' selected':''}" onclick="selectIcon('${ic}','${selVar}','${selElId}','${targetId}')">${ic}</div>
  `).join('');
}

function renderGoalIconGrid() { renderIconGrid('modal-goal-icons','selectedGoalIcon','modal-goal-icon-sel'); }
function renderAccIconGrid()  { renderIconGrid('modal-acc-icons','selectedAccIcon','modal-acc-icon-sel'); }

function selectIcon(ic, selVar, selElId, gridId) {
  if (selVar==='selectedCatIcon')  selectedCatIcon  = ic;
  if (selVar==='selectedGoalIcon') selectedGoalIcon = ic;
  if (selVar==='selectedAccIcon')  selectedAccIcon  = ic;
  document.getElementById(selElId).textContent = ic;
  renderIconGrid(gridId, selVar, selElId);
}

function renderColorSwatches(targetId='modal-cat-colors', selVar='selectedCatColor') {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  const sel = eval(selVar);
  wrap.innerHTML = COLORS.map(c => `
    <div class="color-swatch${c===sel?' selected':''}" style="background:${c}" onclick="selectColor('${c}','${selVar}','${targetId}')"></div>
  `).join('');
}

function renderGoalColorSwatches() { renderColorSwatches('modal-goal-colors','selectedGoalColor'); }
function renderAccColorSwatches()  { renderColorSwatches('modal-acc-colors','selectedAccColor'); }

function selectColor(c, selVar, targetId) {
  if (selVar==='selectedCatColor')  selectedCatColor  = c;
  if (selVar==='selectedGoalColor') selectedGoalColor = c;
  if (selVar==='selectedAccColor')  selectedAccColor  = c;
  renderColorSwatches(targetId, selVar);
}

// ── MONTH NAV ──────────────────────────────
let monthOffset = 0;
function changeGastosMonth(dir) {
  monthOffset += dir;
  gastosMonth = getMonthKey(monthOffset);
  renderGastos();
}

// ── RESET ──────────────────────────────────
function confirmReset() {
  const mk = gastosMonth;
  if (state.expenses[mk]) {
    state.expenses[mk] = {};
    saveState();
  }
  closeModal();
  renderGastos();
  if (currentPage === 'dashboard') renderDashboard();
  toast('Gastos del mes reseteados ✓', 'success');
}

// ── INIT ───────────────────────────────────
function init() {
  // Theme
  applyTheme(state.theme||'dark');
  quoteIndex = state.quoteIndex || 0;

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('theme-toggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  });
  document.getElementById('theme-toggle').textContent = state.theme === 'dark' ? '🌙' : '☀️';

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  });

  // Navigate to dashboard
  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
