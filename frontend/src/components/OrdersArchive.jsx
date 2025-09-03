import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersArchive.scss';

const OrdersArchive = () => {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем архивные заказы из localStorage
    const stored = localStorage.getItem('archivedOrders');
    console.log('Загружаем архивные заказы:', stored);
    if (stored) {
      const orders = JSON.parse(stored);
      console.log('Архивные заказы:', orders);
      setArchivedOrders(orders);
    } else {
      console.log('Архивные заказы не найдены');
    }
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
              <div className="table-cell">{order.title}</div>
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
