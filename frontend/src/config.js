// Конфигурация API
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:4000/api' 
  : '/api';

const UPLOADS_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:4000/uploads'
  : '/uploads';

module.exports = { API_BASE_URL, UPLOADS_BASE_URL }; 