import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomSelect from './CustomSelect';
import './CustomSelect.scss';
const { API_BASE_URL } = require('../config');

const roleOptions = [
  { value: 'Админ', label: 'Админ' },
  { value: 'Дизайнер', label: 'Дизайнер' }
];
const SECRET_ANSWER = '$22hs8931!';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (question !== SECRET_ANSWER) {
      setError('Ответ на вопрос неверный');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, question })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError(data.message || 'Ошибка регистрации');
      }
    } catch {
      setError('Ошибка сервера');
    }
  };

  return (
    <div className="auth-container">
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
        <label>Роль
          <CustomSelect options={roleOptions} value={role} onChange={setRole} />
        </label>
        <input placeholder="Ключ" value={question} onChange={e => setQuestion(e.target.value)} />
        <button type="submit">Зарегистрироваться</button>
        {error && <div className="error">{error}</div>}
      </form>
      <div className="auth-link">Есть аккаунт? <Link to="/login">Войти</Link></div>
    </div>
  );
}

export default Register; 