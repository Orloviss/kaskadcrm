import React, { useState } from 'react';
import TransactionModal from './TransactionModal';
import { useNavigate } from 'react-router-dom';

const categories = [
  'Мебель',
  'Оплата заказов',
  'оплата налога'
];

function Main({ activeTab, setActiveTab }) {
  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const navigate = useNavigate();

  return (
    <div className="main-container">
      {/* <Header /> удалено, теперь Header глобальный */}
      <div className="funds-actions">
        <button className="add-btn" onClick={() => setModalType('income')}>Добавить доход</button>
        <button className="remove-btn" onClick={() => setModalType('expense')}>Добавить расход</button>
      </div>
      {modalType && (
        <TransactionModal
          type={modalType}
          categories={categories}
          onClose={() => setModalType(null)}
        />
      )}
      {/* nav.bottom-bar удалён, теперь глобальный */}
    </div>
  );
}

export default Main; 