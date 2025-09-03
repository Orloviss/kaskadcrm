import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ArchivedOrderDetails.scss';

const ArchivedOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Загружаем архивный заказ из localStorage
    const stored = localStorage.getItem('archivedOrders');
    if (stored) {
      const archivedOrders = JSON.parse(stored);
      // Ищем заказ по id (преобразуем orderId в число для сравнения)
      const foundOrder = archivedOrders.find(o => o.id === parseInt(orderId));
      if (foundOrder) {
        setOrder(foundOrder);
        
        // Загружаем расходы заказа (ключ по id, с фолбэком по номеру)
        const byId = localStorage.getItem(`expenses_${foundOrder.id}`);
        const byNumber = localStorage.getItem(`expenses_${foundOrder.orderNumber}`);
        const savedExpenses = byId || byNumber;
        if (savedExpenses) {
          setExpenses(JSON.parse(savedExpenses));
        }
      } else {
        console.log('Заказ не найден в архиве:', orderId);
        navigate('/archive');
      }
    } else {
      console.log('Архив заказов пуст');
      navigate('/archive');
    }
  }, [orderId, navigate]);

  const handleBackToArchive = () => {
    navigate('/archive');
  };

  if (!order) {
    return (
      <div className="archived-order-details">
        <div className="details-header">
          <h2>Загрузка...</h2>
        </div>
        <div className="order-info">
          <p>Заказ загружается...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="archived-order-details">
      <div className="details-header">
        <h2>Заказ №{order.orderNumber}</h2>
        <button className="back-btn" onClick={handleBackToArchive}>
          ← Назад в архив
        </button>
      </div>

      <div className="order-info">
        <div className="info-section">
          <label>Название:</label>
          <div className="info-value">{order.title}</div>
        </div>

        <div className="info-section">
          <label>Адрес:</label>
          <div className="info-value">{order.address}</div>
        </div>

        <div className="info-row">
          <div className="info-section">
            <label>Имя клиента:</label>
            <div className="info-value">{order.clientName}</div>
          </div>
          <div className="info-section">
            <label>Телефон:</label>
            <div className="info-value">{order.clientPhone}</div>
          </div>
        </div>

        <div className="info-row">
          <div className="info-section">
            <label>Дата договора:</label>
            <div className="info-value">
              {new Date(order.contractDate).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <div className="info-section">
            <label>Дата сдачи:</label>
            <div className="info-value">
              {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>

        <div className="info-section">
          <label>Сумма договора:</label>
          <div className="info-value">
            {order.contractAmount.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div className="info-row">
          <div className="info-section">
            <label>Предоплата:</label>
            <div className="info-value">
              {order.prepayment.toLocaleString('ru-RU')} ₽
            </div>
          </div>
          <div className="info-section">
            <label>Остаток:</label>
            <div className="info-value">
              {order.remainingAmount.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>

        <div className="info-section">
          <label>Ответственный:</label>
          <div className="info-value">{order.responsible}</div>
        </div>

   
        {/* Себестоимость и таблица расходов (всегда показываем таблицу) */}
        <div className="cost-section">
          <div className="cost-header">
            <h3>Себестоимость: {expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString('ru-RU')} ₽</h3>
          </div>

          <div className="expenses-table">
            <div className="table-header">
              <div className="header-cell">Категория</div>
              <div className="header-cell">Сумма</div>
            </div>

            {expenses.length === 0 ? (
              <div className="table-row">
                <div className="table-cell" style={{ gridColumn: '1 / span 2', opacity: 0.7 }}>
                  Нет расходов
                </div>
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="table-row">
                  <div className="table-cell">{expense.category}</div>
                  <div className="table-cell">{expense.amount.toLocaleString('ru-RU')} ₽</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivedOrderDetails;
