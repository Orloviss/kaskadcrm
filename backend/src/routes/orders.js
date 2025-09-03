const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'No token' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

function mapOrderRow(row) {
  if (!row) return null;
  const contractAmount = Number(row.contract_amount);
  const prepayment = Number(row.prepayment);
  return {
    id: row.id,
    userId: row.user_id,
    orderNumber: row.order_number,
    title: row.title,
    address: row.address,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    contractDate: row.contract_date,
    deliveryDate: row.delivery_date,
    contractAmount,
    prepayment,
    remainingAmount: isNaN(contractAmount) || isNaN(prepayment) ? 0 : contractAmount - prepayment,
    responsible: row.responsible,
    completedAt: row.completed_at,
    createdAt: row.created_at
  };
}

// Получить все активные заказы
router.get('/', authMiddleware, (req, res) => {
  db.all('SELECT * FROM orders WHERE completed_at IS NULL ORDER BY delivery_date ASC, created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    const mapped = (rows || []).map(mapOrderRow);
    res.json({ orders: mapped });
  });
});

// Получить архивные заказы
router.get('/archive', authMiddleware, (req, res) => {
  db.all('SELECT * FROM orders WHERE completed_at IS NOT NULL ORDER BY completed_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    const mapped = (rows || []).map(mapOrderRow);
    res.json({ orders: mapped });
  });
});

// Получить один заказ
router.get('/:id', authMiddleware, (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ order: mapOrderRow(row) });
  });
});

// Создать заказ
router.post('/', authMiddleware, (req, res) => {
  const {
    orderNumber,
    title,
    address,
    clientName,
    clientPhone,
    contractDate,
    deliveryDate,
    contractAmount,
    prepayment,
    responsible
  } = req.body;
  // Валидация: допускаем 0 для числовых значений
  const hasEmpty = [orderNumber, title, address, clientName, clientPhone, contractDate, deliveryDate, responsible]
    .some(v => v === undefined || v === null || String(v).trim() === '');
  const hasInvalidNumbers = [contractAmount, prepayment]
    .some(v => v === undefined || v === null || isNaN(Number(v)));
  if (hasEmpty || hasInvalidNumbers) {
    return res.status(400).json({ message: 'Missing or invalid fields' });
  }
  const sql = `INSERT INTO orders (user_id, order_number, title, address, client_name, client_phone, contract_date, delivery_date, contract_amount, prepayment, responsible)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [req.user.id, orderNumber, title, address, clientName, clientPhone, contractDate, deliveryDate, Number(contractAmount), Number(prepayment), responsible];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ id: this.lastID });
  });
});

// Обновить заказ
router.put('/:id', authMiddleware, (req, res) => {
  const {
    title,
    address,
    clientName,
    clientPhone,
    contractDate,
    deliveryDate,
    contractAmount,
    prepayment,
    responsible
  } = req.body;
  const sql = `UPDATE orders SET title=?, address=?, client_name=?, client_phone=?, contract_date=?, delivery_date=?, contract_amount=?, prepayment=?, responsible=? WHERE id=?`;
  const params = [title, address, clientName, clientPhone, contractDate, deliveryDate, contractAmount, prepayment, responsible, req.params.id];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ success: true });
  });
});

// Перенос в архив
router.post('/:id/archive', authMiddleware, (req, res) => {
  db.run('UPDATE orders SET completed_at = ? WHERE id = ?', [new Date().toISOString(), req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ success: true });
  });
});

// Удалить заказ
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json({ success: true });
  });
});

module.exports = router;


