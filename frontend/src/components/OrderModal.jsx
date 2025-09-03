import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';
import './OrderModal.scss';
import './CustomSelect.scss';

const roles = [
  { value: 'Дизайнер', label: 'Дизайнер' },
  { value: 'Сборщик', label: 'Сборщик' },
  { value: 'Установщик', label: 'Установщик' }
];

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
  const [responsible, setResponsible] = useState('');

  // Автоматически генерируем номер заказа и дату договора при открытии модала
  useEffect(() => {
    // Получаем все заказы (активные и архивные) для генерации уникального номера
    const savedOrders = localStorage.getItem('orders') || '[]';
    const savedArchivedOrders = localStorage.getItem('archivedOrders') || '[]';
    
    const activeOrders = JSON.parse(savedOrders);
    const archivedOrders = JSON.parse(savedArchivedOrders);
    
    // Объединяем все заказы и находим максимальный номер
    const allOrders = [...activeOrders, ...archivedOrders];
    
    let maxOrderNumber = 0;
    allOrders.forEach(order => {
      const orderNum = parseInt(order.orderNumber);
      if (orderNum > maxOrderNumber) {
        maxOrderNumber = orderNum;
      }
    });
    
    // Генерируем следующий номер
    const nextOrderNumber = maxOrderNumber + 1;
    setOrderNumber(nextOrderNumber.toString().padStart(3, '0'));
    
    // Устанавливаем текущую дату как дату договора
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setContractDate(todayString);
  }, []);

  // Вычисляем остаток
  const remainingAmount = contractAmount && prepayment ? 
    Number(contractAmount) - Number(prepayment) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title || !address || !clientName || !clientPhone || !contractDate || 
        !deliveryDate || !contractAmount || !prepayment || !responsible) {
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
      responsible,
      createdAt: new Date().toISOString()
    };

    onOrderCreate(newOrder);
    onClose();
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
                placeholder="+7 (999) 999-99-99"
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
              options={roles}
              value={responsible}
              onChange={(value) => setResponsible(value)}
              placeholder="Выберите ответственного"
              required
            />
          </div>

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
