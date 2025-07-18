const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const fundsRoutes = require('./routes/funds');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 