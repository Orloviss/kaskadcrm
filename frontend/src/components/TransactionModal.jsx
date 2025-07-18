import React, { useState, useEffect } from 'react';

function TransactionModal({ type, onClose }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('http://localhost:4000/api/funds/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('type', type === 'income' ? 'add' : 'remove');
    formData.append('category', category);
    formData.append('description', description);
    formData.append('date', date);
    if (photo) formData.append('photo', photo);
    try {
      const res = await fetch('http://localhost:4000/api/funds/add', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1000);
      } else {
        const data = await res.json();
        setError(data.message || 'Ошибка');
      }
    } catch {
      setError('Ошибка сети');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{type === 'income' ? 'Добавить доход' : 'Добавить расход'}</h3>
        <form onSubmit={handleSubmit}>
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
          </label>
          <div className="modal-actions">
            <button type="submit">Сохранить</button>
            <button type="button" onClick={onClose}>Отмена</button>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">Сохранено!</div>}
        </form>
      </div>
    </div>
  );
}

export default TransactionModal; 