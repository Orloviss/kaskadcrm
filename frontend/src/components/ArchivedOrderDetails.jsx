import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const { API_BASE_URL } = require('../config');
import './ArchivedOrderDetails.scss';

const ArchivedOrderDetails = ({ isAdmin }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Загружаем заказ с сервера и показываем, даже если completedAt отсутствует
    fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.order) {
          setOrder(data.order);
          const byId = localStorage.getItem(`expenses_${data.order.id}`);
          const byNumber = localStorage.getItem(`expenses_${data.order.orderNumber}`);
          const savedExpenses = byId || byNumber;
          if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        } else {
          console.log('Заказ не найден:', orderId);
          navigate('/archive');
        }
      })
      .catch(() => {
        console.log('Не удалось загрузить заказ');
        navigate('/archive');
      });
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
        <div>
          <button className="back-btn" onClick={handleBackToArchive}>
            ← Назад в архив
          </button>
          {isAdmin && (
            <button
              className="back-btn"
              style={{ marginLeft: 10, background: '#4caf50' }}
              onClick={async () => {
                try {
                  await fetch(`${API_BASE_URL}/orders/${orderId}/unarchive`, { method: 'POST', credentials: 'include' });
                  try { window.dispatchEvent(new Event('orders-updated')); } catch (e) {}
                  navigate('/orders');
                } catch (e) {}
              }}
            >
              Вернуть в работу
            </button>
          )}
        </div>
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
