// db.js — IndexedDB seguro para Mi Billetera Lite

const DB_NAME = 'mi-billetera-db';
const DB_VERSION = 2;
const STORE_NAME = 'expenses';

let dbPromise = null;

// Abrir base de datos
function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador no soporta IndexedDB'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });

        store.createIndex('by_date', 'date', {
          unique: false
        });

        store.createIndex('by_category', 'category', {
          unique: false
        });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Error al abrir IndexedDB'));
    };

    request.onblocked = () => {
      console.warn('La apertura de IndexedDB está bloqueada por otra pestaña.');
    };
  });

  return dbPromise;
}

// Validar información del gasto
function validateExpense(expense) {
  if (!expense || typeof expense !== 'object') {
    throw new Error('El gasto no es válido');
  }

  const concept = String(expense.concept || '').trim();
  const amount = Number(expense.amount);
  const category = String(expense.category || '');

  const validCategories = [
    'comida',
    'transporte',
    'servicios',
    'ocio',
    'otros'
  ];

  if (!concept || concept.length > 50) {
    throw new Error('El concepto debe tener entre 1 y 50 caracteres');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('El monto debe ser mayor que cero');
  }

  if (!validCategories.includes(category)) {
    throw new Error('La categoría no es válida');
  }

  return {
    concept,
    amount: Math.round(amount * 100) / 100,
    category,
    date: expense.date || new Date().toISOString()
  };
}

// Agregar gasto
export async function addExpense(expense) {
  const data = validateExpense(expense);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    let expenseId;

    const request = store.add(data);

    request.onsuccess = () => {
      expenseId = request.result;
    };

    request.onerror = () => {
      reject(request.error);
    };

    tx.oncomplete = () => {
      resolve(expenseId);
    };

    tx.onerror = () => {
      reject(tx.error || new Error('Error al guardar el gasto'));
    };

    tx.onabort = () => {
      reject(tx.error || new Error('La operación fue cancelada'));
    };
  });
}

// Obtener todos los gastos
export async function getAllExpenses() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    let expenses = [];

    request.onsuccess = () => {
      expenses = request.result;
    };

    request.onerror = () => {
      reject(request.error);
    };

    tx.oncomplete = () => {
      expenses.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      resolve(expenses);
    };

    tx.onerror = () => {
      reject(tx.error || new Error('Error al consultar los gastos'));
    };

    tx.onabort = () => {
      reject(tx.error || new Error('Consulta cancelada'));
    };
  });
}

// Obtener un gasto por ID
export async function getExpenseById(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(Number(id));

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Editar gasto
export async function updateExpense(id, expense) {
  const db = await openDB();
  const data = validateExpense(expense);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getRequest = store.get(Number(id));

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        tx.abort();
        reject(new Error('El gasto no existe'));
        return;
      }

      store.put({
        ...getRequest.result,
        ...data,
        id: Number(id)
      });
    };

    getRequest.onerror = () => reject(getRequest.error);

    tx.oncomplete = () => resolve(true);

    tx.onerror = () => {
      reject(tx.error || new Error('Error al actualizar el gasto'));
    };

    tx.onabort = () => {
      reject(tx.error || new Error('Actualización cancelada'));
    };
  });
}

// Eliminar un gasto
export async function deleteExpense(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.delete(Number(id));

    tx.oncomplete = () => resolve(true);

    tx.onerror = () => {
      reject(tx.error || new Error('Error al eliminar el gasto'));
    };

    tx.onabort = () => {
      reject(tx.error || new Error('Eliminación cancelada'));
    };
  });
}

// Eliminar todos los gastos
export async function clearAllExpenses() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.clear();

    tx.oncomplete = () => resolve(true);

    tx.onerror = () => {
      reject(tx.error || new Error('Error al limpiar los gastos'));
    };

    tx.onabort = () => {
      reject(tx.error || new Error('Operación cancelada'));
    };
  });
}