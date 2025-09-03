import React, { useState } from 'react';
import TransactionModal from './TransactionModal';
import OrderModal from './OrderModal';
import SuccessModal from './SuccessModal';
import BalanceBlock from './BalanceBlock';
import { useNavigate } from 'react-router-dom';

const categories = [
  'Мебель',
  'Оплата заказов',
  'оплата налога'
];

function Main({ activeTab, setActiveTab, transactions, setTransactions, isAdmin }) {
  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleOrderCreate = (newOrder) => {
    // Сохраняем заказ в localStorage
    const savedOrders = localStorage.getItem('orders') || '[]';
    const orders = JSON.parse(savedOrders);
    const updatedOrders = [...orders, { ...newOrder, id: Date.now() }];
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // Закрываем модал создания заказа
    setShowOrderModal(false);
    
    // Показываем модалку успеха
    setShowSuccessModal(true);
  };

  return (
    <div className="main-container">
      {/* <Header /> удалено, теперь Header глобальный */}
      <div className="funds-actions">
        {isAdmin && (
          <button className="add-order-btn" onClick={() => setShowOrderModal(true)}>
            Добавить заказ
          </button>
        )}
        <button className="add-btn" onClick={() => setModalType('income')}>Добавить доход</button>
        <button className="remove-btn" onClick={() => setModalType('expense')}>Добавить расход</button>
      </div>
      
      {/* Блок с балансами */}
      <BalanceBlock transactions={transactions} />
      
      {modalType && (
        <TransactionModal
          type={modalType}
          categories={categories}
          onClose={() => setModalType(null)}
          transactions={transactions}
          setTransactions={setTransactions}
        />
      )}

      {isAdmin && showOrderModal && (
        <OrderModal
          onClose={() => setShowOrderModal(false)}
          onOrderCreate={handleOrderCreate}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          onClose={() => setShowSuccessModal(false)}
          message="Заказ успешно создан!"
        />
      )}
      {/* nav.bottom-bar удалён, теперь глобальный */}
    </div>
  );
}

export default Main; 