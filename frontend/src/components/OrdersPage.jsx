import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.scss';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // Загружаем заказы из localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      setOrders(parsedOrders);
    }
    // Подписываемся на обновления заказов
    const onUpdate = () => {
      const updated = localStorage.getItem('orders') || '[]';
      setOrders(JSON.parse(updated));
    };
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
                <div className="table-cell order-title">
                  {order.title}
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