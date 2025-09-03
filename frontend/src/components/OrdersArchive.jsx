import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const { API_BASE_URL } = require('../config');
import './OrdersArchive.scss';

const OrdersArchive = () => {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/orders/archive`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setArchivedOrders(data.orders || []))
      .catch(() => setArchivedOrders([]));
  }, []);

  const handleOrderClick = (orderId) => {
    console.log('Клик по заказу в архиве:', orderId);
    navigate(`/archive/${orderId}`);
  };

  const handleBackToOrders = () => {
    navigate('/orders');
  };

  return (
    <div className="orders-archive">
      <div className="archive-header">
        <h1>Архив заказов</h1>
        <button className="back-btn" onClick={handleBackToOrders}>
          ← Назад к заказам
        </button>
      </div>

      {archivedOrders.length === 0 ? (
        <div className="empty-state">
          <p>В архиве пока нет завершенных заказов</p>
        </div>
      ) : (
        <div className="orders-table">
          <div className="table-header">
            <div className="header-cell">№</div>
            <div className="header-cell">Название</div>
            <div className="header-cell">Дата сдачи</div>
          </div>
          
          {archivedOrders.map((order) => (
            <div 
              key={order.id} 
              className="table-row"
              onClick={() => handleOrderClick(order.id)}
            >
              <div className="table-cell">{order.orderNumber}</div>
              <div className="table-cell" title={order.title}>
                {order.title && order.title.length > 8 ? `${order.title.slice(0, 8)}…` : order.title}
              </div>
              <div className="table-cell">
                {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersArchive;
