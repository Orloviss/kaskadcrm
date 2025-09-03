import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';
const { API_BASE_URL } = require('../config');
import './OrderModal.scss';
import './CustomSelect.scss';

const roleOptions = [
  { value: 'Дизайнер', label: 'Дизайнер' },
  { value: 'Сборщик', label: 'Сборщик' },
  { value: 'Технолог', label: 'Технолог' },
  { value: 'Установщик', label: 'Установщик' }
];

const roleToUsers = {
  'Дизайнер': [
    { value: 'Миша', label: 'Миша' },
    { value: 'Коля', label: 'Коля' },
    { value: 'Светлана', label: 'Светлана' },
    { value: 'Екатерина', label: 'Екатерина' }
  ],
  'Сборщик': [
    { value: 'Дима', label: 'Дима' },
    { value: 'Ваня', label: 'Ваня' }
  ],
  'Технолог': [
    { value: 'Коля', label: 'Коля' },
    { value: 'Миша', label: 'Миша' }
  ],
  'Установщик': [
    { value: 'Дима', label: 'Дима' },
    { value: 'Ваня', label: 'Ваня' }
  ]
};

function OrderModal({ onClose, onOrderCreate }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [prepayment, setPrepayment] = useState('');
  const [responsibleRole, setResponsibleRole] = useState('');
  const [responsibleUser, setResponsibleUser] = useState('');

  // Автоматически генерируем номер заказа и дату договора при открытии модала
  useEffect(() => {
    const loadAndCompute = async () => {
      try {
        const [activeRes, archiveRes] = await Promise.all([
          fetch(`${API_BASE_URL}/orders`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/orders/archive`, { credentials: 'include' })
        ]);
        const active = await activeRes.json().catch(() => ({ orders: [] }));
        const archived = await archiveRes.json().catch(() => ({ orders: [] }));
        const all = [...(active.orders || []), ...(archived.orders || [])];
        let maxOrderNumber = 0;
        all.forEach(o => {
          const num = parseInt(o.order_number || o.orderNumber, 10);
          if (!isNaN(num) && num > maxOrderNumber) maxOrderNumber = num;
        });
        const nextOrderNumber = (maxOrderNumber + 1).toString().padStart(3, '0');
        setOrderNumber(nextOrderNumber);
      } catch (e) {
        setOrderNumber('001');
      }
      const today = new Date();
      setContractDate(today.toISOString().split('T')[0]);
    };
    loadAndCompute();
  }, []);

  // Вычисляем остаток
  const remainingAmount = contractAmount && prepayment ? 
    Number(contractAmount) - Number(prepayment) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !address || !clientName || !clientPhone || !contractDate || 
        !deliveryDate || !contractAmount || !prepayment || !responsibleRole || !responsibleUser) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (Number(prepayment) > Number(contractAmount)) {
      alert('Предоплата не может быть больше суммы договора');
      return;
    }

    const newOrder = {
      orderNumber,
      title,
      address,
      clientName,
      clientPhone,
      contractDate,
      deliveryDate,
      contractAmount: Number(contractAmount),
      prepayment: Number(prepayment),
      remainingAmount,
      responsible: `${responsibleRole}: ${responsibleUser}`
    };

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newOrder)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Ошибка создания заказа');
        return;
      }
      onOrderCreate(newOrder);
      onClose();
      try { window.dispatchEvent(new Event('orders-updated')); } catch (e) {}
    } catch (err) {
      alert('Ошибка сети при создании заказа');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="order-modal">
        <div className="modal-header">
          <h3>Создать заказ</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Номер заказа</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              readOnly
              className="order-number-input"
            />
          </div>

          <div className="form-group">
            <label>Название заказа *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название заказа"
              required
            />
          </div>

          <div className="form-group">
            <label>Адрес *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Введите адрес"
              rows="2"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Имя клиента *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Имя клиента"
                required
              />
            </div>
            <div className="form-group">
              <label>Телефон *</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Дата договора *</label>
              <input
                type="date"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Дата сдачи *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Сумма договора *</label>
            <input
              type="number"
              value={contractAmount}
              onChange={(e) => setContractAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Предоплата *</label>
              <input
                type="number"
                value={prepayment}
                onChange={(e) => setPrepayment(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                max={contractAmount}
                required
              />
            </div>
            <div className="form-group">
              <label>Остаток</label>
              <input
                type="text"
                value={`${remainingAmount.toFixed(2)} ₽`}
                readOnly
                className="remaining-amount-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ответственный *</label>
            <CustomSelect
              options={roleOptions}
              value={responsibleRole}
              onChange={(value) => {
                setResponsibleRole(value);
                setResponsibleUser('');
              }}
              placeholder="Роль"
              required
            />
          </div>

          {responsibleRole && (
            <div className="form-group">
              <label>Сотрудник *</label>
              <CustomSelect
                options={roleToUsers[responsibleRole] || []}
                value={responsibleUser}
                onChange={(value) => setResponsibleUser(value)}
                placeholder="Выберите сотрудника"
                required
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Отмена
            </button>
            <button type="submit" className="create-btn">
              Создать заказ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderModal;
