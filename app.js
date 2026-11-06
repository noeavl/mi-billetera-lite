// app.js — Main application logic
import { addExpense, getAllExpenses } from './db.js';

const CATEGORIES = {
  comida: 'Comida',
  transporte: 'Transporte',
  servicios: 'Servicios',
  ocio: 'Ocio',
  otros: 'Otros'
};

const CATEGORY_ICONS = {
  comida: '🍔',
  transporte: '🚌',
  servicios: '💡',
  ocio: '🎮',
  otros: '📦'
};

const fmtMXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
});

const fmtDate = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const form = document.getElementById('expense-form');
const conceptInput = document.getElementById('concept');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const listUl = document.getElementById('expenses-ul');
const emptyState = document.getElementById('empty-state');
const totalEl = document.getElementById('total');
const submitBtn = form.querySelector('button[type="submit"]');

let isOnline = navigator.onLine;
const offlineBadge = document.createElement('div');
offlineBadge.id = 'offline-badge';
offlineBadge.textContent = '📴 Sin conexión — Los cambios se guardan localmente';
offlineBadge.hidden = true;
offlineBadge.setAttribute('role', 'status');
offlineBadge.setAttribute('aria-live', 'polite');
document.body.prepend(offlineBadge);

window.addEventListener('online', () => {
  isOnline = true;
  offlineBadge.hidden = true;
});

window.addEventListener('offline', () => {
  isOnline = false;
  offlineBadge.hidden = false;
});

function renderExpense(expense) {
  const li = document.createElement('li');
  li.className = 'expense-item';
  li.dataset.id = expense.id;
  li.innerHTML = `
    <div class="expense-info">
      <span class="expense-concept">${escapeHtml(expense.concept)}</span>
      <div class="expense-meta">
        <span class="expense-category">${CATEGORY_ICONS[expense.category]} ${CATEGORIES[expense.category]}</span>
        <span class="expense-date">${fmtDate.format(new Date(expense.date))}</span>
      </div>
    </div>
    <span class="expense-amount">${fmtMXN.format(expense.amount)}</span>
  `;
  return li;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
}

function updateTotal(expenses) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalEl.textContent = fmtMXN.format(total);
}

function toggleEmptyState(show) {
  emptyState.hidden = !show;
  listUl.hidden = show;
}

async function refreshList() {
  try {
    const expenses = await getAllExpenses();
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    listUl.innerHTML = '';
    if (expenses.length === 0) {
      toggleEmptyState(true);
    } else {
      toggleEmptyState(false);
      expenses.forEach(expense => listUl.appendChild(renderExpense(expense)));
    }
    updateTotal(expenses);
  } catch (err) {
    console.error('Error loading expenses:', err);
    alert('No se pudieron cargar los gastos. Intenta recargar la página.');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const concept = conceptInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!concept || isNaN(amount) || amount <= 0 || !category) return;

  submitBtn.disabled = true;
  try {
    await addExpense({ concept, amount, category });
    form.reset();
    await refreshList();
    if (!isOnline) {
      offlineBadge.textContent = '📴 Sin conexión — Gasto guardado localmente ✓';
      setTimeout(() => { if (!isOnline) offlineBadge.textContent = '📴 Sin conexión — Los cambios se guardan localmente'; }, 3000);
    }
  } catch (err) {
    console.error('Error saving expense:', err);
    alert('No se pudo guardar el gasto. Intenta de nuevo.');
  } finally {
    submitBtn.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', refreshList);