const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret"; // Change in production

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token" });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

router.post("/register", (req, res) => {
  const { username, password, role, question } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });
  if (question !== "$22hs8931!")
    return res.status(400).json({ message: "Ответ на вопрос неверный" });
  
  // Приводим логин к нижнему регистру
  const normalizedUsername = username.toLowerCase();
  
  db.get("SELECT * FROM users WHERE LOWER(username) = ?", [normalizedUsername], (err, user) => {
    if (user) return res.status(400).json({ message: "User exists" });
    const hash = bcrypt.hashSync(password, 8);
    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [normalizedUsername, hash, role || "admin"],
      function (err) {
        if (err) return res.status(500).json({ message: "DB error" });
        const token = jwt.sign(
          { id: this.lastID, username: normalizedUsername, role: role || "admin" },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        // Универсальные опции для cookie
        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
        const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
        const cookieOptions = {
          httpOnly: true,
          path: '/',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
        };
        if (!isLocal && isHttps) {
          cookieOptions.secure = true;
          cookieOptions.sameSite = 'none';
          cookieOptions.domain = '.crmkaskad.ru';
        }
        res.cookie('token', token, cookieOptions);
        res.json({ role: role || "admin" });
      }
    );
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  // Приводим логин к нижнему регистру
  const normalizedUsername = username.toLowerCase();
  
  db.get("SELECT * FROM users WHERE LOWER(username) = ?", [normalizedUsername], (err, user) => {
    if (!user) return res.status(400).json({ message: "Проверьте данные" });
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ message: "Проверьте данные" });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    // Универсальные опции для cookie
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    };
    if (!isLocal && isHttps) {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'none';
      cookieOptions.domain = '.crmkaskad.ru';
    }
    res.cookie('token', token, cookieOptions);
    res.json({ role: user.role });
  });
});

// Смена пароля
router.post("/change-password", authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ message: "Missing fields" });
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!bcrypt.compareSync(oldPassword, user.password))
      return res.status(400).json({ message: "Wrong old password" });
    const hash = bcrypt.hashSync(newPassword, 8);
    db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      [hash, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ success: true });
      }
    );
  });
});
// Смена логина
router.post("/change-login", authMiddleware, (req, res) => {
  const { newLogin } = req.body;
  if (!newLogin) return res.status(400).json({ message: "Missing fields" });
  
  // Приводим новый логин к нижнему регистру
  const normalizedNewLogin = newLogin.toLowerCase();
  
  db.get("SELECT * FROM users WHERE LOWER(username) = ?", [normalizedNewLogin], (err, user) => {
    if (user) return res.status(400).json({ message: "Login taken" });
    db.run(
      "UPDATE users SET username = ? WHERE id = ?",
      [normalizedNewLogin, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ success: true });
      }
    );
  });
});

// Проверка авторизации
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Выход
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.delete('/delete', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    db.run('DELETE FROM funds WHERE user_id = ?', [userId], function(err2) {
      if (err2) return res.status(500).json({ message: 'DB error' });
      res.json({ success: true });
    });
  });
});

module.exports = router;
