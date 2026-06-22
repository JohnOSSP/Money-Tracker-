/* ═══════════════════════════════════════════
   FINANZAS APP — app.js
   Full state management + all page renderers
═══════════════════════════════════════════ */

// ── CONSTANTS ──────────────────────────────
const STORE_KEY = 'finanzasApp_v1';
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ACCOUNT_TYPES = ['Corriente','Ahorros','Efectivo','Tarjeta de crédito','Inversión','Otro'];

const COLORS = ['#d99a5b','#7fa3ad','#c96a6a','#d9ad5b','#a594c9','#60a5fa','#fb923c','#34d399','#f472b6','#94a3b8'];

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
    assistant: {
      apiKey: '',
      threshold: 0.25,
      lastAlertDate: {},   // { catId: 'YYYY-MM-DD' } last day an alert fired for this category
      lastIncomeAlertDate: '',
      history: [],         // persisted chat messages [{role:'user'|'bot', text}]
      dismissedBannerKey: '' // signal key currently dismissed, to avoid re-showing same banner same day
    },
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

  checkBudgetAlerts();

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
    const color = isOver ? '#c96a6a' : cat.color;
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
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg class="icon"><use href="#ic-coins"/></svg></div><div class="empty-title">Sin categorías</div><div class="empty-text">Crea tu primera categoría con el botón +</div></div>`;
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
    const barColor = isOver ? '#c96a6a' : isNear ? '#d9ad5b' : cat.color;

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
  checkBudgetAlerts();
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
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg class="icon"><use href="#ic-target"/></svg></div><div class="empty-title">Sin metas de ahorro</div><div class="empty-text">Crea tu primera meta con el botón +</div></div>`;
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
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${isDone?'#8fae8a':g.color}"></div></div>
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
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg class="icon"><use href="#ic-bank"/></svg></div><div class="empty-title">Sin cuentas</div><div class="empty-text">Añade tus cuentas para ver tu balance total</div></div>`;
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
        <button class="btn-icon" onclick="deleteAccount('${acc.id}')" title="Eliminar" style="color:var(--danger)">🗑</button>
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
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg class="icon"><use href="#ic-note"/></svg></div><div class="empty-title">Sin notas</div><div class="empty-text">Escribe una nota rápida arriba</div></div>`;
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

// ══════════════════════════════════════════
// ASISTENTE FINANCIERO (IA) — gratis vía Gemini
// ══════════════════════════════════════════

// Frases "de pana" según el tipo de categoría que se está excediendo.
// Se elige una al azar y se le pasa a la IA como inspiración de tono,
// no se pega literal (la IA la adapta al contexto real del usuario).
const BRO_VIBES = [
  { match: ['novia','pareja','salida','salidas','cita','citas','amor','jamie'],
    lines: [
      'Tranquilo, ella valora más el detalle que el costo.',
      'Una buena conversación vale más que la cuenta de un restaurante caro.',
      'El gesto pesa más que el precio, no te compliques.',
    ] },
  { match: ['comida','restaurante','restaurantes','delivery','food','comer'],
    lines: [
      'No es que no puedas disfrutar, es cocinar más esta semana y salir el finde con cabeza fría.',
      'Un par de días cocinando en casa y el presupuesto respira solo.',
    ] },
  { match: ['ropa','tenis','moda','estilo'],
    lines: [
      'Tu estilo no se construye en un mes, ve pieza por pieza.',
      'Lo que no compraste hoy lo puedes comprar mejor el próximo mes, sin culpa.',
    ] },
  { match: ['gym','gimnasio','fitness','suplemento','suplementos','proteina','proteína'],
    lines: [
      'Invertir en tu cuerpo está bien, solo cuida que no se desborde el resto del mes.',
    ] },
  { match: ['perfume','fragancia','fragancias'],
    lines: [
      'El negocio de fragancias es inversión, pero que no se mezcle con tu gasto personal.',
    ] },
];

function getBroVibe(catName) {
  const n = (catName||'').toLowerCase();
  for (const v of BRO_VIBES) {
    if (v.match.some(k => n.includes(k))) return v.lines[Math.floor(Math.random()*v.lines.length)];
  }
  return null;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Analiza el ritmo de gasto: compara % del mes transcurrido vs % del presupuesto consumido.
function computeBudgetSignals() {
  const mk = currentMonth;
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth; // 0..1
  const threshold = (state.assistant && state.assistant.threshold) || 0.25;

  const overBudget = [];
  const pacing = [];

  state.categories.forEach(cat => {
    if (!cat.budget || cat.budget <= 0) return;
    const spent = getCatSpent(cat.id, mk);
    const pct = spent / cat.budget;
    if (spent > cat.budget) {
      overBudget.push({ cat, spent, over: spent - cat.budget, pct });
    } else if (pct - monthProgress >= threshold && dayOfMonth <= daysInMonth - 5) {
      // Va muy por delante del ritmo del mes y todavía falta tiempo
      pacing.push({ cat, spent, pct, monthProgress });
    }
  });

  // Ingreso total también puede excederse (todas las categorías sumadas)
  const income = getIncome(mk);
  const totalSpent = getTotalSpent(mk);
  let incomeSignal = null;
  if (income > 0) {
    const pct = totalSpent / income;
    if (totalSpent > income) {
      incomeSignal = { type:'over', spent: totalSpent, income, over: totalSpent - income };
    } else if (pct - monthProgress >= threshold && dayOfMonth <= daysInMonth - 5) {
      incomeSignal = { type:'pace', spent: totalSpent, income, pct, monthProgress };
    }
  }

  return { dayOfMonth, daysInMonth, monthProgress, overBudget, pacing, incomeSignal };
}

function checkBudgetAlerts() {
  const sig = computeBudgetSignals();
  const banner = document.getElementById('budget-alert-banner');
  const ping = document.getElementById('fab-ping');
  if (!banner) return;

  // Prioridad: presupuesto general excedido > categoría excedida > ritmo acelerado
  let key = null, html = '', isPace = false, proactiveCat = null;

  if (sig.incomeSignal && sig.incomeSignal.type === 'over') {
    key = 'income-over-' + todayISO();
    html = bannerMarkup(
      `Excediste tu presupuesto del mes`,
      `Llevas gastado ${fmtFull(sig.incomeSignal.spent)} de ${fmtFull(sig.incomeSignal.income)} y todavía estamos a día ${sig.dayOfMonth} de ${sig.daysInMonth}.`,
      false
    );
  } else if (sig.overBudget.length) {
    const top = sig.overBudget.sort((a,b)=>b.over-a.over)[0];
    key = 'cat-over-' + top.cat.id + '-' + todayISO();
    proactiveCat = top.cat;
    html = bannerMarkup(
      `Excediste el límite de "${top.cat.name}"`,
      `Llevas ${fmtFull(top.spent)}, ${fmtFull(top.over)} por encima del límite de ${fmtFull(top.cat.budget)}.`,
      false
    );
  } else if (sig.incomeSignal && sig.incomeSignal.type === 'pace') {
    key = 'income-pace-' + todayISO();
    isPace = true;
    html = bannerMarkup(
      `Vas muy rápido con tu presupuesto`,
      `A día ${sig.dayOfMonth} de ${sig.daysInMonth} ya gastaste ${Math.round(sig.incomeSignal.pct*100)}% del mes. A este ritmo te vas a quedar corto antes de fin de mes.`,
      true
    );
  } else if (sig.pacing.length) {
    const top = sig.pacing.sort((a,b)=>(b.pct-b.monthProgress)-(a.pct-a.monthProgress))[0];
    key = 'cat-pace-' + top.cat.id + '-' + todayISO();
    isPace = true;
    proactiveCat = top.cat;
    html = bannerMarkup(
      `"${top.cat.name}" se está acelerando`,
      `Ya usaste ${Math.round(top.pct*100)}% del límite y apenas vamos por el día ${sig.dayOfMonth} de ${sig.daysInMonth}.`,
      true
    );
  }

  if (!key) { banner.style.display = 'none'; if (ping) ping.classList.remove('show'); return; }

  // Evitar repetir el mismo banner si ya lo cerró hoy
  if (state.assistant.dismissedBannerKey === key) {
    banner.style.display = 'none';
  } else {
    banner.className = 'alert-banner' + (isPace ? ' pace' : '');
    banner.innerHTML = html;
    banner.style.display = 'flex';
    document.getElementById('alert-banner-dismiss-btn')?.addEventListener('click', () => dismissAlertBanner(key));
    document.getElementById('alert-banner-chat-btn')?.addEventListener('click', () => openAssistant(true));
  }

  if (ping) ping.classList.add('show');

  // Disparo proactivo automático: solo una vez por día por categoría/ingreso, y solo si hay API key configurada
  const dedupeKey = proactiveCat ? proactiveCat.id : 'income';
  const lastDate = state.assistant.lastAlertDate[dedupeKey];
  if (state.assistant.apiKey && lastDate !== todayISO()) {
    state.assistant.lastAlertDate[dedupeKey] = todayISO();
    saveState();
    // Espera breve para no interrumpir justo al guardar el gasto
    setTimeout(() => triggerProactiveAssistant(proactiveCat, sig), 600);
  }
}

function bannerMarkup(title, text, isPace) {
  return `
    <div class="alert-banner-icon"><svg class="icon"><use href="#ic-warn"/></svg></div>
    <div class="alert-banner-body">
      <div class="alert-banner-title">${title}</div>
      <div class="alert-banner-text">${text}</div>
      <div class="alert-banner-actions">
        <button class="btn btn-primary btn-sm" id="alert-banner-chat-btn">Hablar con el asistente</button>
        <button class="btn btn-ghost btn-sm" id="alert-banner-dismiss-btn">Ahora no</button>
      </div>
    </div>
    <button class="alert-banner-close" onclick="dismissAlertBanner('${isPace?'pace':'over'}')"><svg class="icon"><use href="#ic-close"/></svg></button>
  `;
}

function dismissAlertBanner(key) {
  state.assistant.dismissedBannerKey = key;
  saveState();
  const banner = document.getElementById('budget-alert-banner');
  if (banner) banner.style.display = 'none';
}

// ── CHAT UI ──────────────────────────────────
function openAssistant(fromBanner=false) {
  document.getElementById('assist-overlay').classList.add('show');
  const body = document.getElementById('assist-body');
  if (!state.assistant.history.length) {
    appendAssistMsg('bot', `¡Qué tal! Soy tu asistente financiero. Puedo revisar tus categorías, tu presupuesto y darte consejos basados en tus números reales. Pregúntame lo que quieras, o cuéntame qué está pasando con tus gastos.`, false);
  } else {
    renderAssistHistory();
  }
  if (!state.assistant.apiKey) {
    appendAssistMsg('bot', `Para que pueda responderte con IA real necesito una API key gratis de Google Gemini. Toca el ⚙️ arriba para configurarla — toma menos de un minuto.`, false);
  }
  document.getElementById('fab-ping')?.classList.remove('show');
  setTimeout(() => body.scrollTop = body.scrollHeight, 50);
}

function closeAssistant() {
  document.getElementById('assist-overlay').classList.remove('show');
}

function renderAssistHistory() {
  const body = document.getElementById('assist-body');
  body.innerHTML = state.assistant.history.map(m =>
    `<div class="assist-msg ${m.role}">${escapeHtml(m.text)}</div>`
  ).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function appendAssistMsg(role, text, persist=true) {
  const body = document.getElementById('assist-body');
  const div = document.createElement('div');
  div.className = `assist-msg ${role}`;
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  if (persist) {
    state.assistant.history.push({ role, text });
    if (state.assistant.history.length > 40) state.assistant.history = state.assistant.history.slice(-40);
    saveState();
  }
}

function showTyping() {
  const body = document.getElementById('assist-body');
  const div = document.createElement('div');
  div.className = 'assist-msg bot typing';
  div.id = 'assist-typing';
  div.innerHTML = '<span class="assist-dot"></span><span class="assist-dot"></span><span class="assist-dot"></span>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}
function hideTyping() {
  document.getElementById('assist-typing')?.remove();
}

function sendAssistantMessage() {
  const input = document.getElementById('assist-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  appendAssistMsg('user', text);
  runAssistant(text);
}

function triggerProactiveAssistant(cat, sig) {
  openAssistant(true);
  const prompt = cat
    ? `[Mensaje automático del sistema, no del usuario] Detecté que la categoría "${cat.name}" está excedida o adelantada de ritmo. Abre la conversación tú, preguntando qué está pasando con esa categoría, en tono cercano, y da un consejo financiero corto basado en los números reales.`
    : `[Mensaje automático del sistema, no del usuario] Detecté que el presupuesto general del mes está excedido o muy adelantado de ritmo respecto al día del mes. Abre la conversación tú preguntando qué está pasando, en tono cercano, y da un consejo financiero corto.`;
  runAssistant(prompt, true);
}

async function runAssistant(userText, isProactive=false) {
  showTyping();
  try {
    const reply = await callGeminiAPI(userText, isProactive);
    hideTyping();
    appendAssistMsg('bot', reply);
  } catch (err) {
    hideTyping();
    const msg = (err && err.message) ? err.message : 'No pude conectar con el asistente.';
    appendAssistMsg('bot', `⚠ ${msg}`);
  }
}

function buildFinancialContext() {
  const mk = currentMonth;
  const sig = computeBudgetSignals();
  const income = getIncome(mk);
  const totalSpent = getTotalSpent(mk);
  const catLines = state.categories.map(cat => {
    const spent = getCatSpent(cat.id, mk);
    const broHint = getBroVibe(cat.name);
    return `- ${cat.name}: gastado ${fmtFull(spent)} de un límite de ${fmtFull(cat.budget)} (${cat.budget>0?Math.round((spent/cat.budget)*100):0}%)${broHint? ' [posible categoría personal/sentimental, si aplica un consejo de pana usa un tono como: "'+broHint+'" pero adaptado a la situación real]':''}`;
  }).join('\n');
  const goalsLines = state.goals.map(g => `- ${g.name}: ${fmtFull(g.saved||0)} de ${fmtFull(g.target)}`).join('\n') || 'Sin metas activas';
  const accountsTotal = state.accounts.reduce((a,acc)=>a+acc.balance,0);

  return `Eres el asistente financiero personal de John, dentro de su app de finanzas. Hoy es día ${sig.dayOfMonth} de ${sig.daysInMonth} del mes en curso.
Habla en español dominicano, tono de pana cercano y directo, pero profesional cuando das el consejo financiero — nada de relleno corporativo ni emojis en exceso (máximo 1 si aplica). Sé breve: 3-6 líneas normalmente, salvo que pidan más detalle.

DATOS REALES DEL MES:
Ingreso/presupuesto total: ${fmtFull(income)}. Gastado: ${fmtFull(totalSpent)} (${income>0?Math.round((totalSpent/income)*100):0}%).

Categorías:
${catLines || 'Sin categorías configuradas'}

Metas de ahorro:
${goalsLines}

Balance total en cuentas: ${fmtFull(accountsTotal)}

INSTRUCCIONES:
- Si una categoría está excedida o acelerada, dilo claro y da un consejo financiero concreto y accionable (no genérico).
- Si la categoría suena personal/sentimental (salidas con la pareja, citas, etc.), después del consejo financiero puedes cerrar con una frase corta de "pana" que ponga el gasto en perspectiva emocional, sin sonar a sermón.
- No inventes datos que no están arriba. Si te preguntan algo que no puedes saber con estos datos, dilo.
- Nunca uses la palabra "IA" para describirte ni hables de modelos de lenguaje; eres simplemente "tu asistente financiero".`;
}

async function callGeminiAPI(userText, isProactive) {
  const apiKey = state.assistant.apiKey;
  if (!apiKey) {
    throw new Error('Configura tu API key gratis de Gemini tocando el ⚙️ arriba.');
  }
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Construir historial reciente como contexto conversacional (máx 8 últimos)
  const recent = state.assistant.history.slice(-8).filter(m => !(isProactive && m===state.assistant.history[state.assistant.history.length-1]));
  const contents = recent.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
  contents.push({ role:'user', parts:[{ text: userText }] });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildFinancialContext() }] },
      contents,
      generationConfig: { maxOutputTokens: 400, temperature: 0.8 }
    })
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 403) throw new Error('Tu API key no es válida. Revísala en Configurar (⚙️).');
    if (res.status === 429) throw new Error('Llegaste al límite gratuito de Gemini por ahora. Intenta de nuevo en un momento.');
    throw new Error('No pude conectar con el asistente (error ' + res.status + ').');
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('') || 'No tuve una respuesta clara, intenta de nuevo.';
  return text.trim();
}

// ── CONFIGURACIÓN DEL ASISTENTE ──────────────
function openAssistantSettings() {
  document.getElementById('assist-apikey-input').value = state.assistant.apiKey || '';
  document.getElementById('assist-threshold-input').value = state.assistant.threshold || 0.25;
  openModal('modal-assist-settings');
}

function saveAssistantSettings() {
  state.assistant.apiKey = document.getElementById('assist-apikey-input').value.trim();
  state.assistant.threshold = parseFloat(document.getElementById('assist-threshold-input').value);
  saveState();
  closeModal();
  toast(state.assistant.apiKey ? 'Asistente configurado ✓' : 'Configuración guardada', 'success');
  checkBudgetAlerts();
}


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
    document.querySelector('#theme-toggle use').setAttribute('href', state.theme === 'dark' ? '#ic-sun' : '#ic-moon');
  });
  document.querySelector('#theme-toggle use').setAttribute('href', state.theme === 'dark' ? '#ic-moon' : '#ic-sun');

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  });
  document.getElementById('assist-overlay').addEventListener('click', e => {
    if (e.target.id === 'assist-overlay') closeAssistant();
  });

  // Navigate to dashboard
  navigate('dashboard');

  // Revisar señales de presupuesto al abrir la app
  checkBudgetAlerts();
}

document.addEventListener('DOMContentLoaded', init);
