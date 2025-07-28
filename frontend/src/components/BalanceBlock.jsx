import React from 'react';
const { formatCurrency } = require('../utils/formatters');

function BalanceBlock({ transactions }) {
  // Вычисляем общий баланс
  const totalBalance = transactions.reduce((sum, tx) => {
    if (tx.type === 'add') return sum + Number(tx.amount);
    if (tx.type === 'remove') return sum - Number(tx.amount);
    return sum;
  }, 0);

  // Группируем транзакции по пользователям
  const userBalances = transactions.reduce((acc, tx) => {
    const username = tx.username || 'Неизвестный';
    if (!acc[username]) {
      acc[username] = { income: 0, expense: 0 };
    }
    if (tx.type === 'add') {
      acc[username].income += Number(tx.amount);
    } else if (tx.type === 'remove') {
      acc[username].expense += Number(tx.amount);
    }
    return acc;
  }, {});

  // Вычисляем баланс для каждого пользователя
  const userBalanceList = Object.entries(userBalances).map(([username, balances]) => ({
    username,
    balance: balances.income - balances.expense
  }));

  return (
    <div className="balance-block">
      <div className="balance-item total">
        <div className="balance-label">Общий баланс</div>
        <div className="balance-amount">{formatCurrency(totalBalance)}</div>
      </div>
      
      {userBalanceList.map(({ username, balance }) => (
        <div key={username} className="balance-item">
          <div className="balance-label">Баланс {username}</div>
          <div className="balance-amount">{formatCurrency(balance)}</div>
        </div>
      ))}
    </div>
  );
}

export default BalanceBlock; 