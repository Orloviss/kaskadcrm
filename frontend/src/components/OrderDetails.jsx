import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomSelect from './CustomSelect';
const { API_BASE_URL } = require('../config');
import MeasurementsModal from './MeasurementsModal';
import ExpensesModal from './ExpensesModal';
import './OrderDetails.scss';
import './CustomSelect.scss';

const roles = [
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

function OrderDetails({ isAdmin }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [designer, setDesigner] = useState('');
  const [assembler, setAssembler] = useState('');
  const [technologist, setTechnologist] = useState('');
  const [installer, setInstaller] = useState('');

  useEffect(() => {
    // Загружаем заказ с сервера
    fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.order) {
          setOrder(data.order);
          setEditedOrder({ ...data.order });
        }
      });

    // Загружаем расходы заказа (по id заказа)
    const savedExpensesById = localStorage.getItem(`expenses_${orderId}`);
    if (savedExpensesById) {
      setExpenses(JSON.parse(savedExpensesById));
    }
  }, [orderId]);

  // Инициализируем разбиение ответственного на роли и имена
  useEffect(() => {
    const source = isEditing ? editedOrder : order;
    if (!source || !source.responsible) return;
    const chunks = String(source.responsible).split(';').map(s => s.trim());
    const getVal = (label) => {
      const line = chunks.find(c => c.startsWith(label+':'));
      if (!line) return '';
      return line.split(':').slice(1).join(':').trim();
    };
    if (!designer) setDesigner(getVal('Дизайнер'));
    if (!assembler) setAssembler(getVal('Сборщик'));
    if (!technologist) setTechnologist(getVal('Технолог'));
    if (!installer) setInstaller(getVal('Установщик'));
  }, [order, editedOrder, isEditing]);

  const handleSave = () => {
    if (!editedOrder) return;
    const payload = {
      title: editedOrder.title,
      address: editedOrder.address,
      clientName: editedOrder.clientName,
      clientPhone: editedOrder.clientPhone,
      contractDate: editedOrder.contractDate,
      deliveryDate: editedOrder.deliveryDate,
      contractAmount: editedOrder.contractAmount,
      prepayment: editedOrder.prepayment,
      responsible: editedOrder.responsible
    };
    fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(() => {
        setOrder(editedOrder);
        setIsEditing(false);
        try { window.dispatchEvent(new Event('orders-updated')); } catch (e) {}
      })
      .catch(() => alert('Ошибка сохранения'));
  };

  const handleComplete = async () => {
    if (!order) return;

    // Перемещаем заказ в архив на сервере
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/archive`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    try { window.dispatchEvent(new Event('orders-updated')); } catch (e) {}
    
    // Перенаправляем в архив
    navigate('/archive');
  };

  const handleDelete = async () => {
    if (!order) return;

    if (window.confirm('Вы уверены, что хотите полностью удалить этот заказ? Это действие нельзя отменить.')) {
      // Удаляем заказ из localStorage
      const savedOrders = localStorage.getItem('orders') || '[]';
      const orders = JSON.parse(savedOrders);
      const updatedOrders = orders.filter(o => o.id !== parseInt(orderId));
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      // Удаляем все расходы заказа
      localStorage.removeItem(`expenses_${order.id}`);
      
      // Удаляем все фото заказа на сервере
      try {
        await fetch(`${API_BASE_URL}/measurements/${order.orderNumber}`, { method: 'DELETE', credentials: 'include' });
      } catch (e) {}
      
      // Удаляем заказ на сервере
      try {
        await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (e) {}
      
      // Уведомляем об изменении и возвращаемся на страницу заказов
      try { window.dispatchEvent(new Event('orders-updated')); } catch (e) {}
      navigate('/orders');
    }
  };

  const handleFieldChange = (field, value) => {
    if (!editedOrder) return;
    
    setEditedOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpenseAdd = (newExpense) => {
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    
    // Сохраняем расходы в localStorage
    if (order && typeof order.id !== 'undefined') {
      localStorage.setItem(`expenses_${order.id}`, JSON.stringify(updatedExpenses));
    }
  };

  const handleExpenseDelete = (expenseId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот расход?')) {
      const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
      setExpenses(updatedExpenses);
      
      // Сохраняем обновленные расходы в localStorage
      if (order && typeof order.id !== 'undefined') {
        localStorage.setItem(`expenses_${order.id}`, JSON.stringify(updatedExpenses));
      }
    }
  };

  // Вычисляем общую себестоимость
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (!order) {
    return <div className="order-details">Заказ не найден</div>;
  }

  const currentOrder = isEditing ? editedOrder : order;

  return (
    <div className="order-details">
      <div className="details-header">
        <div className="header-top">
          <h2>Заказ №{order.orderNumber}</h2>
        </div>
        <div className="header-actions">
          {isAdmin && (
            !isEditing ? (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
            ) : (
              <>
                <button className="save-btn" onClick={handleSave}>
                  Сохранить
                </button>
                <button className="cancel-btn" onClick={() => {
                  setIsEditing(false);
                  setEditedOrder({ ...order });
                }}>
                  Отмена
                </button>
              </>
            )
          )}
          {isAdmin && (
            <button className="complete-btn" onClick={handleComplete}>
              Завершить
            </button>
          )}
        </div>
      </div>

      <div className="details-content">
        <div className="form-group">
          <label>Название заказа</label>
          {isAdmin && isEditing ? (
            <input
              type="text"
              value={currentOrder.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
            />
          ) : (
            <div className="field-value">{currentOrder.title}</div>
          )}
        </div>

        <div className="form-group">
          <label>Адрес</label>
          {isAdmin && isEditing ? (
            <textarea
              value={currentOrder.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              rows="2"
            />
          ) : (
            <div className="field-value">{currentOrder.address}</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Имя клиента</label>
            {isAdmin && isEditing ? (
              <input
                type="text"
                value={currentOrder.clientName}
                onChange={(e) => handleFieldChange('clientName', e.target.value)}
              />
            ) : (
              <div className="field-value">{currentOrder.clientName}</div>
            )}
          </div>
          <div className="form-group">
            <label>Телефон</label>
            {isAdmin && isEditing ? (
              <input
                type="tel"
                value={currentOrder.clientPhone}
                onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
              />
            ) : (
              <div className="field-value">{currentOrder.clientPhone}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата договора</label>
            {isAdmin && isEditing ? (
              <input
                type="date"
                value={currentOrder.contractDate}
                onChange={(e) => handleFieldChange('contractDate', e.target.value)}
              />
            ) : (
              <div className="field-value">{new Date(currentOrder.contractDate).toLocaleDateString('ru-RU')}</div>
            )}
          </div>
          <div className="form-group">
            <label>Дата сдачи</label>
            {isAdmin && isEditing ? (
              <input
                type="date"
                value={currentOrder.deliveryDate}
                onChange={(e) => handleFieldChange('deliveryDate', e.target.value)}
              />
            ) : (
              <div className="field-value">{new Date(currentOrder.deliveryDate).toLocaleDateString('ru-RU')}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Сумма договора</label>
          {isAdmin && isEditing ? (
            <input
              type="number"
              value={currentOrder.contractAmount}
              onChange={(e) => handleFieldChange('contractAmount', Number(e.target.value))}
              min="0"
              step="0.01"
            />
          ) : (
            <div className="field-value">{Number(currentOrder.contractAmount || 0).toLocaleString('ru-RU')} ₽</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Предоплата</label>
            {isAdmin && isEditing ? (
              <input
                type="number"
                value={currentOrder.prepayment}
                onChange={(e) => handleFieldChange('prepayment', Number(e.target.value))}
                min="0"
                step="0.01"
                max={currentOrder.contractAmount}
              />
            ) : (
              <div className="field-value">{Number(currentOrder.prepayment || 0).toLocaleString('ru-RU')} ₽</div>
            )}
          </div>
          <div className="form-group">
            <label>Остаток</label>
            <div className="field-value remaining-amount">
              {Number((currentOrder.contractAmount || 0) - (currentOrder.prepayment || 0)).toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Ответственные</label>
          {isAdmin && isEditing ? (
            <>
              <CustomSelect
                options={roleToUsers['Дизайнер']}
                value={designer}
                onChange={(value) => {
                  setDesigner(value);
                  const parts = [];
                  if (value) parts.push(`Дизайнер: ${value}`);
                  if (assembler) parts.push(`Сборщик: ${assembler}`);
                  if (technologist) parts.push(`Технолог: ${technologist}`);
                  if (installer) parts.push(`Установщик: ${installer}`);
                  handleFieldChange('responsible', parts.join('; '));
                }}
                placeholder="Дизайнер"
              />
              <div style={{ marginTop: 8 }}>
                <CustomSelect
                  options={roleToUsers['Сборщик']}
                  value={assembler}
                  onChange={(value) => {
                    setAssembler(value);
                    const parts = [];
                    if (designer) parts.push(`Дизайнер: ${designer}`);
                    if (value) parts.push(`Сборщик: ${value}`);
                    if (technologist) parts.push(`Технолог: ${technologist}`);
                    if (installer) parts.push(`Установщик: ${installer}`);
                    handleFieldChange('responsible', parts.join('; '));
                  }}
                  placeholder="Сборщик"
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <CustomSelect
                  options={roleToUsers['Технолог']}
                  value={technologist}
                  onChange={(value) => {
                    setTechnologist(value);
                    const parts = [];
                    if (designer) parts.push(`Дизайнер: ${designer}`);
                    if (assembler) parts.push(`Сборщик: ${assembler}`);
                    if (value) parts.push(`Технолог: ${value}`);
                    if (installer) parts.push(`Установщик: ${installer}`);
                    handleFieldChange('responsible', parts.join('; '));
                  }}
                  placeholder="Технолог"
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <CustomSelect
                  options={roleToUsers['Установщик']}
                  value={installer}
                  onChange={(value) => {
                    setInstaller(value);
                    const parts = [];
                    if (designer) parts.push(`Дизайнер: ${designer}`);
                    if (assembler) parts.push(`Сборщик: ${assembler}`);
                    if (technologist) parts.push(`Технолог: ${technologist}`);
                    if (value) parts.push(`Установщик: ${value}`);
                    handleFieldChange('responsible', parts.join('; '));
                  }}
                  placeholder="Установщик"
                />
              </div>
            </>
          ) : (
            <div className="field-value">{currentOrder.responsible}</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group measurements">
            <label>Замеры</label>
            <button 
              className="measurements-btn"
              onClick={() => setShowMeasurementsModal(true)}
            >
              Открыть замеры
            </button>
          </div>
          <div className="form-group expenses">
            <label>Расходы</label>
            <button 
              className="expenses-btn"
              onClick={() => setShowExpensesModal(true)}
            >
              Добавить расход
            </button>
          </div>
        </div>

        {/* Блок себестоимости */}
        <div className="cost-section">
          <div className="cost-header">
            <h3>Себестоимость: {totalExpenses.toLocaleString('ru-RU')} ₽</h3>
          </div>
          
          {expenses.length > 0 ? (
            <div className="expenses-table">
              <div className="table-header">
                <div className="header-cell">Категория</div>
                <div className="header-cell">Сумма</div>
                <div className="header-cell">Действия</div>
              </div>
              
              {expenses.map((expense) => (
                <div key={expense.id} className="table-row">
                  <div className="table-cell">{expense.category}</div>
                  <div className="table-cell">{expense.amount.toLocaleString('ru-RU')} ₽</div>
                  <div className="table-cell">
                    <button 
                      className="delete-expense-btn"
                      onClick={() => handleExpenseDelete(expense.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-expenses">
              <p>Расходы не добавлены</p>
            </div>
          )}
        </div>

        {/* Кнопка удаления заказа */}
        {isAdmin && (
          <div className="delete-order-section">
            <button className="delete-order-btn" onClick={handleDelete}>
              Удалить заказ
            </button>
          </div>
        )}
      </div>



      {showMeasurementsModal && (
        <MeasurementsModal
          onClose={() => setShowMeasurementsModal(false)}
          orderId={order.orderNumber}
        />
      )}

      {showExpensesModal && (
        <ExpensesModal
          onClose={() => setShowExpensesModal(false)}
          onExpenseAdd={handleExpenseAdd}
          orderId={order.id}
        />
      )}
    </div>
  );
}

export default OrderDetails;
