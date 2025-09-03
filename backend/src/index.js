const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const fundsRoutes = require('./routes/funds');
const measurementsRoutes = require('./routes/measurements');
const db = require('./db');

const app = express();
app.use(cors({ 
  origin: ['https://crmkaskad.ru', 'https://www.crmkaskad.ru', 'http://localhost:3000'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Настройка multer для загрузки файлов в uploads на уровень выше backend/src
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/');
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
app.use('/api/measurements', measurementsRoutes);

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

app.use('/api/funds', fundsRoutes);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); console.log("TEST LOG");
