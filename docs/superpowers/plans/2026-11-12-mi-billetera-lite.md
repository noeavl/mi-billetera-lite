# Mi Billetera Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Progressive Web App for offline-first daily expense tracking with installability, local persistence, and mobile-first responsive design.

**Architecture:** Single-page vanilla JS application (no build step) using the App Shell pattern. Service Worker caches static assets (HTML, CSS, JS, icons) with Cache First strategy. Expenses stored in IndexedDB (preferred over LocalStorage for larger datasets and transaction support). All logic in one ES module for simplicity.

**Tech Stack:** HTML5, CSS3 (custom properties, flex/grid), Vanilla ES6+ JavaScript, IndexedDB (idb library via CDN or native), Service Worker, Web App Manifest. Deployed to GitHub Pages.

**Spec:** /Users/noeabelvargaslopez/Documents/mi-billetera-lite/ (this plan implements the spec provided in the user prompt)

## Global Constraints

- No build step, no bundler, no framework — plain static files only
- Must work on HTTPS (localhost for dev, GitHub Pages for prod)
- Mobile-first responsive design (breakpoint at 480px, 768px)
- Spanish (Mexico) locale: currency MXN, date format DD/MM/YYYY
- IndexedDB database name: `mi-billetera-db`, version: 1, store: `expenses`
- Service Worker scope: `/`, cache name pattern: `mi-billetera-v<version>`
- Manifest: `display: "standalone"`, `theme_color: "#2E7D32"`, `background_color: "#FFFFFF"`, icons 192x192 and 512x512 maskable

## Review Focus

1. **Offline-first load**: App Shell must render fully from cache on first revisit with zero network — test by going offline in DevTools before any fetch
2. **IndexedDB persistence offline**: Write/read must succeed in offline mode; closing/reopening tab offline must show previously added expenses
3. **Installability criteria**: Manifest + SW registration + HTTPS must pass Lighthouse PWA audit (green badge)
4. **Currency/number formatting**: MXN amounts must format correctly (comma for decimals, dot for thousands) per es-MX locale
5. **Touch usability**: Form inputs, buttons, and list items must meet 48x48dp minimum touch targets on mobile

---

### Task 1: Project Scaffold & Manifest

**Files:**
- Create: `index.html`
- Create: `manifest.json`
- Create: `icons/icon-192.png` (maskable)
- Create: `icons/icon-512.png` (maskable)

**Interfaces:**
- Consumes: (none — first task)
- Produces: `manifest.json` referenced by `index.html`, icons referenced by manifest

- [ ] **Step 1: Write `manifest.json`**

```json
{
  "name": "Mi Billetera Lite",
  "short_name": "Billetera",
  "description": "Registro de gastos offline-first",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#2E7D32",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ],
  "categories": ["finance", "productivity"],
  "lang": "es-MX"
}
```

- [ ] **Step 2: Create placeholder SVG icons and convert to PNG (192, 512)**

Use a simple green wallet SVG → `terminal` with `rsvg-convert` or online tool; save as `icons/icon-192.png` and `icons/icon-512.png`.

- [ ] **Step 3: Write minimal `index.html` shell**

```html
<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#2E7D32">
  <meta name="description" content="Registro de gastos offline-first">
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="icons/icon-192.png">
  <title>Mi Billetera Lite</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="app-header">
    <h1>Mi Billetera Lite</h1>
    <div class="total" id="total">$0.00 MXN</div>
  </header>
  <main class="app-main">
    <form id="expense-form" class="expense-form" novalidate>
      <div class="field">
        <label for="concept">Concepto</label>
        <input type="text" id="concept" name="concept" required maxlength="50" placeholder="Ej: Café">
      </div>
      <div class="field">
        <label for="amount">Monto (MXN)</label>
        <input type="number" id="amount" name="amount" required step="0.01" min="0.01" placeholder="0.00">
      </div>
      <div class="field">
        <label for="category">Categoría</label>
        <select id="category" name="category" required>
          <option value="">Seleccionar…</option>
          <option value="comida">🍔 Comida</option>
          <option value="transporte">🚌 Transporte</option>
          <option value="servicios">💡 Servicios</option>
          <option value="ocio">🎮 Ocio</option>
          <option value="otros">📦 Otros</option>
        </select>
      </div>
      <button type="submit" class="btn-primary">Guardar</button>
    </form>
    <section class="expenses-list" aria-label="Historial de gastos">
      <ul id="expenses-ul"></ul>
      <p id="empty-state" class="empty-state" hidden>Sin gastos registrados</p>
    </section>
  </main>
  <script type="module" src="app.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(console.error);
    }
  </script>
</body>
</html>
```

- [ ] **Step 4: Verify manifest loads**

Run: `npx serve .` → open `http://localhost:3000` → DevTools Application → Manifest shows all fields, icons load, no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html manifest.json icons/
git commit -m "feat: add project scaffold, manifest, and icons"
```

---

### Task 2: Styles (Mobile-First Responsive CSS)

**Files:**
- Create: `styles.css`

**Interfaces:**
- Consumes: `index.html` class/id structure
- Produces: Visual design tokens and layout for all components

- [ ] **Step 1: Write `styles.css` with design tokens and mobile-first rules**

```css
:root {
  --color-primary: #2E7D32;
  --color-primary-dark: #1B5E20;
  --color-primary-light: #4CAF50;
  --color-bg: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text: #212121;
  --color-text-secondary: #757575;
  --color-border: #E0E0E0;
  --color-danger: #C62828;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --radius: 12px;
  --spacing: 16px;
  --spacing-sm: 8px;
  --font-size-base: 16px;
  --touch-target: 48px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: var(--font-size-base); -webkit-text-size-adjust: 100%; }

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--color-primary);
  color: white;
  padding: calc(var(--spacing) * 1.5) var(--spacing);
  text-align: center;
  box-shadow: var(--shadow-md);
}

.app-header h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 4px; }

.total { font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }

.app-main { flex: 1; padding: var(--spacing); max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: var(--spacing); }

.expense-form {
  background: var(--color-surface);
  padding: var(--spacing);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.field { display: flex; flex-direction: column; gap: 4px; }

.field label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); }

.field input, .field select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background: white;
  min-height: var(--touch-target);
}

.field input:focus, .field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.2);
}

.field input::placeholder { color: var(--color-text-secondary); }

.btn-primary {
  width: 100%;
  padding: 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  min-height: var(--touch-target);
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:active { background: var(--color-primary-dark); }

.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.expenses-list { flex: 1; overflow-y: auto; }

#expenses-ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }

.expense-item {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--spacing-sm) var(--spacing);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
  min-height: var(--touch-target);
}

.expense-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }

.expense-concept { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.expense-meta { display: flex; gap: 12px; font-size: 0.75rem; color: var(--color-text-secondary); }

.expense-category { text-transform: capitalize; }

.expense-date { font-variant-numeric: tabular-nums; }

.expense-amount { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-primary-dark); white-space: nowrap; }

.empty-state { text-align: center; color: var(--color-text-secondary); padding: var(--spacing) 0; }

@media (min-width: 480px) {
  .app-header h1 { font-size: 1.5rem; }
  .total { font-size: 2rem; }
  .app-main { padding: calc(var(--spacing) * 1.5); }
  .expense-form { padding: calc(var(--spacing) * 1.5); }
}

@media (min-width: 768px) {
  .app-main { max-width: 520px; }
  .expense-item { padding: var(--spacing) calc(var(--spacing) * 1.5); }
}
```

- [ ] **Step 2: Visual verification**

Run: `npx serve .` → open on mobile viewport (DevTools device toolbar) → verify touch targets ≥48px, no horizontal scroll, form stacks vertically, list items readable.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: add mobile-first responsive styles"
```

---

### Task 3: IndexedDB Layer (Data Persistence)

**Files:**
- Create: `db.js`

**Interfaces:**
- Consumes: (none)
- Produces: `db.js` exporting `openDB()`, `addExpense(expense)`, `getAllExpenses()`, `deleteExpense(id)`, `clearAllExpenses()`

- [ ] **Step 1: Write `db.js` using native IndexedDB (no external deps)**

```javascript
// db.js — IndexedDB wrapper for expenses
const DB_NAME = 'mi-billetera-db';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_date', 'date', { unique: false });
      }
    };
  });

  return dbPromise;
}

export async function addExpense(expense) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({
      ...expense,
      date: expense.date || new Date().toISOString()
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllExpenses() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('by_date');
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteExpense(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllExpenses() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

- [ ] **Step 2: Unit test in DevTools console**

Run: `npx serve .` → open console → `await import('./db.js')` → `await addExpense({concept:'Test', amount:10, category:'comida'})` → `await getAllExpenses()` → verify array with one item.

- [ ] **Step 3: Commit**

```bash
git add db.js
git commit -m "feat: add IndexedDB persistence layer"
```

---

### Task 4: App Logic (Form, List, Total, Formatters)

**Files:**
- Create: `app.js`

**Interfaces:**
- Consumes: `db.js` (addExpense, getAllExpenses), `index.html` DOM elements
- Produces: Interactive expense tracker with live total and persisted list

- [ ] **Step 1: Write `app.js` with formatters, form handler, list renderer, total updater**

```javascript
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
  const expenses = await getAllExpenses();
  listUl.innerHTML = '';
  if (expenses.length === 0) {
    toggleEmptyState(true);
  } else {
    toggleEmptyState(false);
    expenses.forEach(expense => listUl.appendChild(renderExpense(expense)));
  }
  updateTotal(expenses);
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
  } catch (err) {
    console.error('Error saving expense:', err);
    alert('No se pudo guardar el gasto. Intenta de nuevo.');
  } finally {
    submitBtn.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', refreshList);
```

- [ ] **Step 2: Functional test**

Run: `npx serve .` → add 3 expenses → verify list shows newest first, total sums correctly, Mexican format ($1,234.56 MXN), categories show icons, empty state hides.

- [ ] **Step 3: Persistence test**

Refresh page → expenses remain. Close tab, reopen → expenses remain.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: add app logic with formatters and IndexedDB integration"
```

---

### Task 5: Service Worker (App Shell Caching)

**Files:**
- Create: `sw.js`

**Interfaces:**
- Consumes: Static asset list (index.html, styles.css, app.js, db.js, manifest.json, icons)
- Produces: Offline-capable SW with install/activate/fetch handlers

- [ ] **Step 1: Write `sw.js` with versioned cache, install (precache), activate (cleanup), fetch (cache-first)**

```javascript
// sw.js — Service Worker for Mi Billetera Lite
const CACHE_VERSION = 'v1';
const CACHE_NAME = `mi-billetera-${CACHE_VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/db.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
```

- [ ] **Step 2: Register SW verification**

Run: `npx serve .` → DevTools Application → Service Workers → shows "mi-billetera-v1" registered, status "activated", no errors.

- [ ] **Step 3: Offline load test**

DevTools Network → Offline checked → Refresh (F5) → Page loads fully (styles, JS, icons) → no dinosaur, console shows no failed fetches for cached assets.

- [ ] **Step 4: Commit**

```bash
git add sw.js
git commit -m "feat: add Service Worker with App Shell caching"
```

---

### Task 6: Offline Data Operations & UX Polish

**Files:**
- Modify: `app.js` (add offline detection, pending sync indicator)
- Modify: `styles.css` (add offline badge styles)

**Interfaces:**
- Consumes: `navigator.onLine`, `db.js`
- Produces: Graceful offline UX — form works offline, shows sync status

- [ ] **Step 1: Add offline detection and pending indicator to `app.js`**

```javascript
// Add at top of app.js after imports
let isOnline = navigator.onLine;
const offlineBadge = document.createElement('div');
offlineBadge.id = 'offline-badge';
offlineBadge.textContent = '📴 Sin conexión — Los cambios se guardan localmente';
offlineBadge.hidden = true;
document.body.prepend(offlineBadge);

window.addEventListener('online', () => {
  isOnline = true;
  offlineBadge.hidden = true;
});

window.addEventListener('offline', () => {
  isOnline = false;
  offlineBadge.hidden = false;
});

// In form submit handler, after successful addExpense:
if (!isOnline) {
  offlineBadge.textContent = '📴 Sin conexión — Gasto guardado localmente ✓';
  setTimeout(() => { if (!isOnline) offlineBadge.textContent = '📴 Sin conexión — Los cambios se guardan localmente'; }, 3000);
}
```

- [ ] **Step 2: Add offline badge styles to `styles.css`**

```css
#offline-badge {
  background: #FFF3E0;
  color: #E65100;
  padding: 8px var(--spacing);
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 1px solid #FFE0B2;
  z-index: 100;
}
```

- [ ] **Step 3: Full offline persistence test**

1. Go online, load app
2. DevTools Network → Offline
3. Add expense "Taxis, $150, Transporte"
4. Verify appears in list, total updates
5. Close tab, reopen (still offline)
6. Verify expense persists, total correct

- [ ] **Step 4: Commit**

```bash
git add app.js styles.css
git commit -m "feat: add offline UX indicator and verify offline persistence"
```

---

### Task 7: Lighthouse PWA Audit & Deploy Prep

**Files:**
- Modify: `index.html` (add meta tags for PWA)
- Create: `README.md` (deployment instructions)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Audit-ready PWA, deployment docs

- [ ] **Step 1: Add remaining PWA meta tags to `index.html`**

```html
<!-- Add in <head> -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Billetera">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

- [ ] **Step 2: Run Lighthouse PWA audit**

Run: `npx serve .` → Chrome DevTools → Lighthouse → Category: PWA → Device: Mobile → Generate report → Verify:
- ✅ Installable
- ✅ Service Worker registered
- ✅ Manifest valid
- ✅ Works offline
- ✅ Redirects HTTP → HTTPS (on GitHub Pages)

- [ ] **Step 3: Create `README.md` with deploy steps**

```markdown
# Mi Billetera Lite

PWA de gastos offline-first.

## Desarrollo local
```bash
npx serve .
# abre http://localhost:3000
```

## Despliegue a GitHub Pages
1. Push a repositorio GitHub
2. Settings → Pages → Source: "Deploy from a branch" → Branch: main / (root)
3. Espera a que termine el workflow
4. URL: https://<usuario>.github.io/<repo>/

## Verificación PWA
- Chrome DevTools → Lighthouse → PWA badge verde
- Network → Offline → F5 → Carga completa
- Agregar gasto offline → Cerrar/abrir pestaña → Persiste
```

- [ ] **Step 4: GitHub repo creation & push**

```bash
git init
git add .
git commit -m "feat: complete Mi Billetera Lite PWA"
git branch -M main
git remote add origin https://github.com/<usuario>/mi-billetera-lite.git
git push -u origin main
```

- [ ] **Step 5: Enable GitHub Pages & verify production URL**

Settings → Pages → Deploy from main branch → Visit `https://<usuario>.github.io/mi-billetera-lite/` → Run Lighthouse again on production URL.

- [ ] **Step 6: Final acceptance checklist**

| Criterion | Test | Pass? |
|-----------|------|-------|
| Install prompt | Chrome desktop/Android shows install | [ ] |
| Lighthouse PWA | Green badge / all checks pass | [ ] |
| Offline load | F5 offline → no dinosaur | [ ] |
| Offline persist | Add offline → close/reopen → data there | [ ] |
| Mobile responsive | DevTools device toolbar → no horiz scroll | [ ] |
| MXN formatting | $1,234.56 MXN format correct | [ ] |

- [ ] **Step 7: Final commit & tag**

```bash
git add README.md
git commit -m "docs: add README and deployment guide"
git tag v1.0.0
git push origin main --tags
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-12-mi-billetera-lite.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Native**, because the tasks are tightly coupled (each builds on the previous), the codebase is small (~7 files), and a single session can hold the full context. A shipped mistake would only cost a re-run of 1-2 tasks. Does the plan capture what you want, and which approach should we use?