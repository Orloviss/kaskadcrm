const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../crm.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    description TEXT,
    photo TEXT,
    date TEXT,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS measurements_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица заказов (серверное хранение)
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_number TEXT NOT NULL,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    contract_date TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    contract_amount REAL NOT NULL,
    prepayment REAL NOT NULL,
    responsible TEXT NOT NULL,
    completed_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Заполнить дефолтными категориями, если таблица пуста
  db.get('SELECT COUNT(*) as cnt FROM categories', (err, row) => {
    if (row && row.cnt === 0) {
      const income = [
        'Клиенты наличные',
        'Клиенты расч. Счёт',
        'Другие приходы'
      ];
      const expense = [
        'Стройдвор',
        'ЦМФ',
        'КДМ',
        'ВТС',
        'Стекло Дима',
        'Стекло другое',
        'Макмарт',
        'Другие'
      ];
      income.forEach(name => db.run('INSERT INTO categories (name, type) VALUES (?, ?)', [name, 'income']));
      expense.forEach(name => db.run('INSERT INTO categories (name, type) VALUES (?, ?)', [name, 'expense']));
    }
  });

  console.log('Database tables created successfully');
});

module.exports = db;