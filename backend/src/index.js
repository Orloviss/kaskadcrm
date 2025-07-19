const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const fundsRoutes = require('./routes/funds');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Настройка multer для загрузки файлов в uploads на уровень выше backend/src
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/');
    console.log('Multer destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.originalname;
    console.log('Multer filename:', filename);
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Роуты
app.use('/api/auth', authRoutes);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  const JWT_SECRET = "your_jwt_secret";
  require('jsonwebtoken').verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

app.post('/api/funds/add', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('=== REQUEST RECEIVED ===');
    console.log('File received:', req.file);
    console.log('Body received:', req.body);
    console.log('User:', req.user);
    const { amount, type, category, description, date } = req.body;
    const photo = req.file ? req.file.filename : null;
    const userId = req.user.id;
    db.run(
      'INSERT INTO funds (user_id, amount, type, category, description, photo, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, amount, type, category, description, photo, date],
      function(err) {
        if (err) {
          console.error('DB Error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        console.log('Transaction saved with ID:', this.lastID);
        res.json({ success: true, id: this.lastID, photo: photo });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.use('/api/funds', fundsRoutes);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 