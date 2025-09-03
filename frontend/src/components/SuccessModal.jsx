import React from 'react';
import './SuccessModal.scss';

function SuccessModal({ onClose, message }) {
  return (
    <div className="modal-backdrop">
      <div className="success-modal">
        <div className="success-icon">✅</div>
        <h3>Успешно!</h3>
        <p>{message}</p>
        <button className="close-btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;
