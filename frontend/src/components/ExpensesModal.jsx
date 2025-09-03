import React, { useState } from 'react';
import CustomSelect from './CustomSelect';
import './ExpensesModal.scss';
import './CustomSelect.scss';

const expenseCategories = [
  { value: 'Плиты', label: 'Плиты' },
  { value: 'Фасады', label: 'Фасады' },
  { value: 'Фурнитура', label: 'Фурнитура' },
  { value: 'Доставка', label: 'Доставка' },
  { value: 'Работа', label: 'Работа' },
  { value: 'Прочее', label: 'Прочее' }
];

function ExpensesModal({ onClose, onExpenseAdd, orderId }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!category || !amount) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (Number(amount) <= 0) {
      alert('Сумма должна быть больше 0');
      return;
    }

    const newExpense = {
      id: Date.now(),
      category,
      amount: Number(amount),
      orderId,
      createdAt: new Date().toISOString()
    };

    onExpenseAdd(newExpense);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="expenses-modal">
        <div className="modal-header">
          <h3>Добавить расход</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Категория *</label>
            <CustomSelect
              options={expenseCategories}
              value={category}
              onChange={setCategory}
              placeholder="Выберите категорию"
            />
          </div>

          <div className="form-group">
            <label>Сумма (₽) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Введите сумму"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Отмена
            </button>
            <button type="submit" className="submit-btn">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpensesModal;
