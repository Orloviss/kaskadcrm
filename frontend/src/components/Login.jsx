import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
const { API_BASE_URL } = require('../config');

function Login({ checkAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        // Добавляем небольшую задержку, чтобы cookie успел установиться
        setTimeout(async () => {
          await checkAuth();
          navigate('/');
        }, 100);
      } else {
        setError(data.message || 'Ошибка входа');
      }
    } catch {
      setError('Ошибка сервера');
    }
  };

  return (
    <div className="auth-container">
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Войти</button>
        {error && <div className="error">{error}</div>}
      </form>
      <div className="auth-link">Нет аккаунта? <Link to="/register">Регистрация</Link></div>
    </div>
  );
}

export default Login; 