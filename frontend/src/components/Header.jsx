import React from 'react';

function Header({ balance }) {
  let balanceClass = 'stats-balance';
  if (typeof balance === 'number') {
    balanceClass += balance >= 0 ? ' positive' : ' negative';
  }
  return (
    <header className="crm-header">
      <div className="crm-logo">
        <img src="/img/logo.png" alt="logo" style={{height:32}} /> CRM
      </div>
      {typeof balance === 'number' && (
        <div className={balanceClass}> <b>{balance} ₽</b></div>
      )}
    </header>
  );
}

export default Header; 