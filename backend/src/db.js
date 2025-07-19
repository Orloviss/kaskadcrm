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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT
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