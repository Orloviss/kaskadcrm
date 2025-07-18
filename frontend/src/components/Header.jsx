import React from 'react';

function Header({ balance }) {
  return (
    <header className="crm-header">
      <div className="crm-logo">
        <img src="/img/logo.png" alt="logo" style={{height:32}} /> CRM
      </div>
      {typeof balance === 'number' && (
        <div className="stats-balance">Баланс: <b>{balance} ₽</b></div>
      )}
    </header>
  );
}

export default Header; 