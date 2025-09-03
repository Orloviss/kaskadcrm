import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const { API_BASE_URL } = require('../config');
import './OrdersPage.scss';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // Загружаем заказы с сервера
  useEffect(() => {
    const loadOrders = () => {
      fetch(`${API_BASE_URL}/orders`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setOrders(data.orders || []))
        .catch(() => setOrders([]));
    };
    loadOrders();
    // Подписываемся на обновления заказов
    const onUpdate = () => loadOrders();
    window.addEventListener('orders-updated', onUpdate);
    return () => window.removeEventListener('orders-updated', onUpdate);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleArchiveClick = () => {
    navigate('/archive');
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h2>Заказы в работе</h2>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Заказов пока нет</h3>
          <p>Создайте первый заказ на главной странице</p>
        </div>
      ) : (
        <div className="orders-table">
          <div className="table-header">
            <div className="header-cell">№</div>
            <div className="header-cell">Название</div>
            <div className="header-cell">Дата сдачи</div>
          </div>
          
          <div className="table-body">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="table-row"
                onClick={() => handleOrderClick(order.id)}
              >
                <div className="table-cell order-number">
                  {order.orderNumber}
                </div>
                <div className="table-cell order-title" title={order.title}>
                  {order.title && order.title.length > 8 ? `${order.title.slice(0, 8)}…` : order.title}
                </div>
                <div className="table-cell delivery-date">
                  {formatDate(order.deliveryDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="orders-actions">
        <button className="archive-btn" onClick={handleArchiveClick}>
          Архив заказов
        </button>
      </div>
    </div>
  );
}

export default OrdersPage; 