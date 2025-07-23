const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // Change in production

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'No token' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

router.post('/add', authMiddleware, upload.single('photo'), (req, res) => {
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  const { amount, type, category, description, date } = req.body;
  const title = typeof req.body.title === 'string' ? req.body.title : '';
  const photo = req.file ? req.file.filename : null;
  if (!amount || isNaN(amount) || !type) return res.status(400).json({ message: 'Invalid data' });
  const sql = 'INSERT INTO funds (user_id, amount, type, category, description, photo, date, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const params = [req.user.id, amount, type, category, description, photo, date, title];
  console.log('SQL:', sql);
  console.log('PARAMS:', params);
  db.run(sql, params, function(err) {
    if (err) {
      console.error('DB Error:', err.message);
      return res.status(500).json({ message: 'DB error', error: err.message });
    }
    res.json({ success: true });
  });
});

router.post('/remove', authMiddleware, (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ message: 'Invalid amount' });
  db.run('INSERT INTO funds (user_id, amount, type) VALUES (?, ?, ?)', [req.user.id, amount, 'remove'], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ success: true });
  });
});

router.get('/balance', authMiddleware, (req, res) => {
  db.all('SELECT * FROM funds WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    let balance = 0;
    rows.forEach(row => {
      if (row.type === 'add') balance += row.amount;
      else if (row.type === 'remove') balance -= row.amount;
    });
    res.json({ balance });
  });
});

router.get('/all', authMiddleware, (req, res) => {
  db.all(`SELECT funds.*, users.username, users.role FROM funds LEFT JOIN users ON funds.user_id = users.id WHERE funds.user_id = ? OR 1=1 ORDER BY date DESC, created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ transactions: rows });
  });
});

router.get('/photo/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  res.sendFile(filePath);
});

// Категории CRUD
router.get('/categories', authMiddleware, (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ categories: rows });
  });
});
router.post('/categories', authMiddleware, (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Missing fields' });
  db.run('INSERT INTO categories (name, type) VALUES (?, ?)', [name, type], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ id: this.lastID, name, type });
  });
});
router.delete('/categories/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ success: true });
  });
});

router.delete('/delete/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM funds WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ success: true });
  });
});

module.exports = router; 