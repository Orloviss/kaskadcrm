const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER,
    type TEXT,
    category TEXT,
    description TEXT,
    photo TEXT,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
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
});

module.exports = db; 