import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Main from './components/Main';
import Orders from './components/Orders';
import Settings from './components/Settings';
import Header from './components/Header';
import './styles/main.scss';

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

function AppRoutes({ isAuth, statsBalance, setStatsBalance }) {
  const location = useLocation();
  let activeTab = 'finances';
  if (location.pathname === '/history') activeTab = 'history';
  else if (location.pathname === '/orders') activeTab = 'orders';
  else if (location.pathname === '/settings') activeTab = 'settings';

  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Header balance={activeTab === 'history' ? statsBalance : undefined} />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/history" element={<Orders setStatsBalance={setStatsBalance} />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomBar activeTab={activeTab} />
    </>
  );
}

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));
  const [statsBalance, setStatsBalance] = useState(null);

  useEffect(() => {
    const onStorage = () => setIsAuth(!!localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const origSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      origSetItem.apply(this, arguments);
      if (key === 'token') setIsAuth(!!value);
    };
    return () => { localStorage.setItem = origSetItem; };
  }, []);

  return (
    <Router>
      <div className="crm-wrapper">
        <AppRoutes isAuth={isAuth} statsBalance={statsBalance} setStatsBalance={setStatsBalance} />
      </div>
    </Router>
  );
}

export default App; 