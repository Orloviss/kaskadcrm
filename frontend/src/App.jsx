import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Main from './components/Main';
import { OrdersHistory, OrdersStub } from './components/Orders';
import Settings from './components/Settings';
import Header from './components/Header';
const { clearAuthCookies } = require('./utils/auth');
import './styles/main.scss';
const { API_BASE_URL } = require('./config');

function BottomBar({ activeTab }) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-bar">
      <button className={activeTab === 'finances' ? 'active' : ''} onClick={() => navigate('/')}>Главная</button>
      <button className={activeTab === 'history' ? 'active' : ''} onClick={() => navigate('/history')}>Финансы</button>
      <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => navigate('/orders')}>Заказы</button>
      <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => navigate('/settings')}>Настройки</button>
    </nav>
  );
}

function AppRoutes({ isAuth, totalIncome, totalExpense, transactions, setTransactions, checkAuth }) {
  const location = useLocation();
  let activeTab = 'finances';
  if (location.pathname === '/history') activeTab = 'history';
  else if (location.pathname === '/orders') activeTab = 'orders';
  else if (location.pathname === '/settings') activeTab = 'settings';

  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <Routes>
        <Route path="/login" element={<Login checkAuth={checkAuth} />} />
        <Route path="/register" element={<Register checkAuth={checkAuth} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Header totalIncome={totalIncome} totalExpense={totalExpense} />
      <Routes>
        <Route path="/" element={<Main transactions={transactions} setTransactions={setTransactions} />} />
        <Route path="/history" element={<OrdersHistory transactions={transactions} setTransactions={setTransactions} />} />
        <Route path="/orders" element={<OrdersStub />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomBar activeTab={activeTab} />
    </>
  );
}

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Проверка авторизации через cookie
  const checkAuth = () => {
    console.log('🔍 Проверяем авторизацию...');
    setAuthLoading(true);
    
    // Добавляем таймаут для предотвращения зависания
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const authPromise = fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
      .then(res => {
        console.log('📡 Ответ сервера:', res.status, res.statusText);
        if (res.ok) {
          console.log('✅ Авторизация успешна');
          return res.json();
        } else if (res.status === 401) {
          console.log('🚨 Ошибка 401 - очищаем cookies');
          // Автоматически очищаем cookies при ошибке 401
          clearAuthCookies();
          throw new Error('Unauthorized');
        }
        console.log('❌ Неизвестная ошибка:', res.status);
        return Promise.reject();
      });
    
    return Promise.race([authPromise, timeoutPromise])
      .then(() => {
        console.log('✅ Устанавливаем статус авторизован');
        setIsAuth(true);
      })
      .catch((error) => {
        console.log('❌ Ошибка авторизации:', error.message);
        setIsAuth(false);
        
        // Если это ошибка 401 и мы не на странице логина/регистрации, перенаправляем на логин
        if (error.message === 'Unauthorized' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          console.log('🔄 Перенаправляем на страницу логина...');
          // Добавляем небольшую задержку для предотвращения циклических перезагрузок
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      })
      .finally(() => {
        console.log('🏁 Завершаем проверку авторизации');
        setAuthLoading(false);
      });
  };

  useEffect(() => {
    // Не проверяем авторизацию, если пользователь на страницах логина/регистрации
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      checkAuth();
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    fetch(`${API_BASE_URL}/funds/all`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
      });
  }, [isAuth]);

  useEffect(() => {
    let income = 0, expense = 0;
    // Всегда используем все транзакции для общего баланса в шапке
    transactions.forEach(tx => {
      if (tx.type === 'add') income += Number(tx.amount);
      if (tx.type === 'remove') expense += Number(tx.amount);
    });
    setTotalIncome(income);
    setTotalExpense(expense);
  }, [transactions]);

  if (authLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <Router>
      <div className="crm-wrapper">
        <AppRoutes 
          isAuth={isAuth} 
          totalIncome={totalIncome} 
          totalExpense={totalExpense} 
          transactions={transactions} 
          setTransactions={setTransactions}
          checkAuth={checkAuth} 
        />
      </div>
    </Router>
  );
}

export default App; 