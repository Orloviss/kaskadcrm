import React, { useState, useEffect } from 'react';
import './Settings.scss';
const { API_BASE_URL } = require('../config');

function Settings() {
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [passwords, setPasswords] = useState({ old: '', new1: '', new2: '' });
  const [login, setLogin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Загрузка категорий с backend
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/funds/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIncomeCategories(data.categories.filter(c => c.type === 'income'));
        setExpenseCategories(data.categories.filter(c => c.type === 'expense'));
      }
    } catch {}
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleAddIncomeCat = async () => {
    if (newIncomeCat && !incomeCategories.find(c => c.name === newIncomeCat)) {
      await fetch(`${API_BASE_URL}/funds/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newIncomeCat, type: 'income' })
      });
      setNewIncomeCat('');
      fetchCategories();
    }
  };
  const handleAddExpenseCat = async () => {
    if (newExpenseCat && !expenseCategories.find(c => c.name === newExpenseCat)) {
      await fetch(`${API_BASE_URL}/funds/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newExpenseCat, type: 'expense' })
      });
      setNewExpenseCat('');
      fetchCategories();
    }
  };
  const handleRemoveIncomeCat = async (cat) => {
    await fetch(`${API_BASE_URL}/funds/categories/${cat.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchCategories();
  };
  const handleRemoveExpenseCat = async (cat) => {
    await fetch(`${API_BASE_URL}/funds/categories/${cat.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchCategories();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (!passwords.old || !passwords.new1 || passwords.new1 !== passwords.new2) {
      setError('Проверьте правильность ввода паролей');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new1 })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Пароль успешно изменён');
        setPasswords({ old: '', new1: '', new2: '' });
      } else {
        setError(data.message || 'Ошибка смены пароля');
      }
    } catch {
      setError('Ошибка сервера');
    }
  };
  const handleChangeLogin = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (!login) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newLogin: login })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Логин успешно изменён');
        setLogin('');
      } else {
        setError(data.message || 'Ошибка смены логина');
      }
    } catch {
      setError('Ошибка сервера');
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location = '/login';
  };
  const handleDeleteUser = async () => {
    if (!window.confirm('Удалить пользователя и все его данные?')) return;
    await fetch(`${API_BASE_URL}/auth/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="settings-page">
      <h2>Настройки</h2>
      <div className="settings-section">
        <h3>Категории доходов</h3>
        <div className="cat-list">
          {incomeCategories.map(cat => (
            <span className="cat-item" key={cat.id}>{cat.name} <button onClick={() => handleRemoveIncomeCat(cat)}>×</button></span>
          ))}
        </div>
        <input value={newIncomeCat} onChange={e => setNewIncomeCat(e.target.value)} placeholder="Новая категория" />
        <button onClick={handleAddIncomeCat}>Добавить</button>
      </div>
      <div className="settings-section">
        <h3>Категории расходов</h3>
        <div className="cat-list">
          {expenseCategories.map(cat => (
            <span className="cat-item" key={cat.id}>{cat.name} <button onClick={() => handleRemoveExpenseCat(cat)}>×</button></span>
          ))}
        </div>
        <input value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} placeholder="Новая категория" />
        <button onClick={handleAddExpenseCat}>Добавить</button>
      </div>
      <div className="settings-section">
        <h3>Смена пароля</h3>
        <form onSubmit={handleChangePassword} className="settings-form">
          <input type="password" placeholder="Старый пароль" value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} />
          <input type="password" placeholder="Новый пароль" value={passwords.new1} onChange={e => setPasswords(p => ({ ...p, new1: e.target.value }))} />
          <input type="password" placeholder="Повторите новый пароль" value={passwords.new2} onChange={e => setPasswords(p => ({ ...p, new2: e.target.value }))} />
          <button type="submit">Сменить пароль</button>
        </form>
      </div>
      <div className="settings-section">
        <h3>Смена логина</h3>
        <form onSubmit={handleChangeLogin} className="settings-form">
          <input placeholder="Новый логин" value={login} onChange={e => setLogin(e.target.value)} />
          <button type="submit">Сменить логин</button>
        </form>
      </div>
      {message && <div className="settings-message">{message}</div>}
      {error && <div className="error">{error}</div>}
      <div style={{marginTop: 32, marginBottom: 80}}>
        <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        <button onClick={handleDeleteUser} style={{marginTop: 24, background: '#e74c3c', color: '#fff'}}>Удалить пользователя</button>
      </div>
    </div>
  );
}

export default Settings; 