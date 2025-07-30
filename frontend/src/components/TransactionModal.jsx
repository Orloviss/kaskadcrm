import React, { useState, useEffect } from 'react';
const { API_BASE_URL } = require('../config');

function TransactionModal({ type, onClose, transactions, setTransactions }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/funds/categories`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          const cats = data.categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));
          setCategories(cats);
          setCategory(cats[0]?.name || '');
        }
      } catch {}
    }
    fetchCategories();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Валидация размера файла
    if (photo && photo.size > 50 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 50MB');
      setIsLoading(false);
      return;
    }
    
    // Валидация типа файла
    if (photo && !photo.type.startsWith('image/')) {
      setError('Разрешены только изображения');
      setIsLoading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('type', type === 'income' ? 'add' : 'remove');
    formData.append('category', category);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('title', title);
    if (photo) formData.append('photo', photo);
    
    try {
      const res = await fetch(`${API_BASE_URL}/funds/add`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        // Добавить новую транзакцию в глобальный список
        if (data.transaction) {
          setTransactions([...transactions, data.transaction]);
        } else {
          // Если сервер не возвращает транзакцию, перезапросить все
          setTransactions(ts => [...ts, {
            amount, type: type === 'income' ? 'add' : 'remove', category, description, date, title, photo: null
          }]);
        }
        setTimeout(onClose, 1000);
      } else {
        setError(data.message || 'Ошибка сервера');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Ошибка сети. Проверьте подключение к интернету.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить эту транзакцию?')) return;
    await fetch(`${API_BASE_URL}/funds/delete/${selected.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setSelected(null);
    if (typeof refresh === 'function') refresh();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{type === 'income' ? 'Добавить доход' : 'Добавить расход'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Название
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </label>
          <label>Дата
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label>Категория
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </label>
          <label>Сумма
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
          </label>
          <label>Описание
            <input value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label>Фото
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
            {photo && (
              <div style={{fontSize: '0.8rem', color: '#666', marginTop: '4px'}}>
                Размер: {(photo.size / 1024 / 1024).toFixed(2)} MB
                {photo.size > 50 * 1024 * 1024 && (
                  <span style={{color: '#e74c3c'}}> (слишком большой)</span>
                )}
              </div>
            )}
            <div style={{fontSize: '0.8rem', color: '#666', marginTop: '4px'}}>
              Максимальный размер: 50MB
            </div>
          </label>
          <div className="modal-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" onClick={onClose} disabled={isLoading}>Отмена</button>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">Сохранено!</div>}
          {selected && (
            <button onClick={handleDelete} style={{marginTop: 12, background: '#e74c3c', color: '#fff'}}>Удалить транзакцию</button>
          )}
        </form>
      </div>
    </div>
  );
}

export default TransactionModal; 