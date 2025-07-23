import React from 'react';

function Header({ totalIncome, totalExpense }) {
  let balanceBlock = null;
  if (typeof totalIncome === 'number' && typeof totalExpense === 'number') {
    const balance = totalIncome - totalExpense;
    let balanceClass = 'stats-balance';
    if (typeof balance === 'number') {
      balanceClass += balance >= 0 ? ' positive' : ' negative';
    }
    balanceBlock = <div className={balanceClass}><b>{balance} ₽</b></div>;
  }
  return (
    <header className="crm-header">
      <div className="crm-logo">
        <img src="/img/logo.png" alt="logo" style={{height:32}} /> CRM
      </div>
      {balanceBlock}
    </header>
  );
}

export default Header; 