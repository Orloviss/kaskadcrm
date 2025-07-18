import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomSelect from './CustomSelect';
import './CustomSelect.scss';

const roleOptions = [
  { value: 'admin', label: 'Админ' },
  { value: 'designer', label: 'Дизайнер' }
];

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
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
        <button type="submit">Зарегистрироваться</button>
        {error && <div className="error">{error}</div>}
      </form>
      <div className="auth-link">Есть аккаунт? <Link to="/login">Войти</Link></div>
    </div>
  );
}

export default Register; 