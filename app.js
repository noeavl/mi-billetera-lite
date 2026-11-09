// app.js — Mi Billetera Lite

import {
  addExpense,
  getAllExpenses,
  deleteExpense
} from './db.js';

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

// Elementos HTML
const form = document.getElementById('expense-form');
const conceptInput = document.getElementById('concept');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const listUl = document.getElementById('expenses-ul');
const emptyState = document.getElementById('empty-state');
const totalEl = document.getElementById('total');
const submitBtn = form.querySelector('button[type="submit"]');

// Estado de conexión
let isOnline = navigator.onLine;

// Indicador offline
const offlineBadge = document.createElement('div');

offlineBadge.id = 'offline-badge';
offlineBadge.textContent =
  '📴 Sin conexión — Los cambios se guardan localmente';

offlineBadge.hidden = isOnline;
offlineBadge.setAttribute('role', 'status');
offlineBadge.setAttribute('aria-live', 'polite');

document.body.prepend(offlineBadge);

// Detectar conexión
window.addEventListener('online', () => {
  isOnline = true;
  offlineBadge.hidden = true;
});

window.addEventListener('offline', () => {
  isOnline = false;
  offlineBadge.hidden = false;
  offlineBadge.textContent =
    '📴 Sin conexión — Los cambios se guardan localmente';
});

// Crear elemento de gasto de forma segura
function renderExpense(expense) {
  const li = document.createElement('li');
  li.className = 'expense-item';
  li.dataset.id = expense.id;

  const info = document.createElement('div');
  info.className = 'expense-info';

  const concept = document.createElement('span');
  concept.className = 'expense-concept';
  concept.textContent = expense.concept;

  const meta = document.createElement('div');
  meta.className = 'expense-meta';

  const category = document.createElement('span');
  category.className = 'expense-category';

  category.textContent =
    `${CATEGORY_ICONS[expense.category]} ${CATEGORIES[expense.category]}`;

  const date = document.createElement('span');
  date.className = 'expense-date';

  const parsedDate = new Date(expense.date);

  date.textContent = Number.isNaN(parsedDate.getTime())
    ? 'Fecha desconocida'
    : fmtDate.format(parsedDate);

  const amount = document.createElement('span');
  amount.className = 'expense-amount';
  amount.textContent = fmtMXN.format(expense.amount);

  info.append(concept, meta);
  meta.append(category, date);
  li.append(info, amount);

  // Botón para eliminar
  const deleteBtn = document.createElement('button');

  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.setAttribute(
    'aria-label',
    `Eliminar gasto ${expense.concept}`
  );

  deleteBtn.addEventListener('click', async () => {
    if (!confirm('¿Deseas eliminar este gasto?')) return;

    deleteBtn.disabled = true;

    try {
      await deleteExpense(expense.id);
      await refreshList();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('No se pudo eliminar el gasto.');
      deleteBtn.disabled = false;
    }
  });

  li.appendChild(deleteBtn);

  return li;
}

// Actualizar total
function updateTotal(expenses) {
  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  totalEl.textContent = fmtMXN.format(total);
}

// Mostrar u ocultar mensaje vacío
function toggleEmptyState(show) {
  emptyState.hidden = !show;
  listUl.hidden = show;
}

// Actualizar historial
async function refreshList() {
  try {
    const expenses = await getAllExpenses();

    listUl.replaceChildren();

    if (expenses.length === 0) {
      toggleEmptyState(true);
    } else {
      toggleEmptyState(false);

      const fragment = document.createDocumentFragment();

      expenses.forEach((expense) => {
        fragment.appendChild(renderExpense(expense));
      });

      listUl.appendChild(fragment);
    }

    updateTotal(expenses);

  } catch (error) {
    console.error('Error cargando gastos:', error);

    alert(
      'No se pudieron cargar los gastos. Intenta recargar la página.'
    );
  }
}

// Guardar gasto
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const concept = conceptInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categorySelect.value;

  if (
    !concept ||
    concept.length > 50 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Object.hasOwn(CATEGORIES, category)
  ) {
    alert('Verifica los datos del gasto.');
    return;
  }

  submitBtn.disabled = true;

  try {
    await addExpense({
      concept,
      amount,
      category
    });

    form.reset();

    await refreshList();

    if (!isOnline) {
      offlineBadge.hidden = false;

      offlineBadge.textContent =
        '📴 Sin conexión — Gasto guardado localmente ✓';
    }

  } catch (error) {
    console.error('Error guardando gasto:', error);

    alert('No se pudo guardar el gasto. Intenta de nuevo.');

  } finally {
    submitBtn.disabled = false;
  }
});

// Inicializar aplicación
refreshList();

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => {
      console.log('Service Worker registrado correctamente');
    })
    .catch((error) => {
      console.error('Error registrando Service Worker:', error);
    });
}