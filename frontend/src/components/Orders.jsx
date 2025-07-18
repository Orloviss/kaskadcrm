import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import CustomCheckbox from './CustomCheckbox';
import CustomSelect from './CustomSelect';
import './CustomCheckbox.scss';
import './CustomSelect.scss';
const { API_BASE_URL, UPLOADS_BASE_URL } = require('../config');

const categories = [
  'Мебель',
  'Оплата заказов',
  'оплата налога'
];
const roles = [
  { value: 'admin', label: 'Админ' },
  { value: 'designer', label: 'Дизайнер' }
];
const sortOptions = [
  { value: 'date_desc', label: 'По дате: новые → старые' },
  { value: 'date_asc', label: 'По дате: старые → новые' },
  { value: 'amount_asc', label: 'По сумме: по возрастанию' },
  { value: 'amount_desc', label: 'По сумме: по убыванию' }
];
const typeOptions = [
  { value: 'add', label: 'Доход' },
  { value: 'remove', label: 'Расход' }
];

function Orders({ setStatsBalance }) {
  const location = useLocation();
  if (location.pathname === '/orders') {
    return (
      <div className="main-container"><div style={{padding: 32, textAlign: 'center', color: '#888', fontSize: '1.2rem'}}>Будет добавлено позже</div></div>
    );
  }

  // ВСЕ хуки в начале!
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    categories: [],
    roles: [],
    users: [],
    types: [],
    sort: 'date_desc'
  });
  const [pendingFilters, setPendingFilters] = useState({
    dateFrom: '',
    dateTo: '',
    categories: [],
    roles: [],
    users: [],
    types: [],
    sort: 'date_desc'
  });

  // Собираем список пользователей из транзакций
  const users = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (tx.username) map[tx.username] = true;
    });
    return Object.keys(map);
  }, [transactions]);

  useEffect(() => {
    if (location.pathname === '/stats') {
      fetch(`${API_BASE_URL}/funds/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setTransactions(data.transactions || []));
    }
  }, [location.pathname]);

  // Фильтрация и сортировка
  const filtered = transactions
    .filter(tx => {
      if (pendingFilters.dateFrom && tx.date < pendingFilters.dateFrom) return false;
      if (pendingFilters.dateTo && tx.date > pendingFilters.dateTo) return false;
      if (pendingFilters.categories.length && !pendingFilters.categories.includes(tx.category)) return false;
      if (pendingFilters.roles.length && !pendingFilters.roles.includes(tx.role)) return false;
      if (pendingFilters.users.length && !pendingFilters.users.includes(tx.username)) return false;
      if (pendingFilters.types && pendingFilters.types.length && !pendingFilters.types.includes(tx.type)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (pendingFilters.sort) {
        case 'date_desc':
          return (b.date || b.created_at || '').localeCompare(a.date || a.created_at || '');
        case 'date_asc':
          return (a.date || a.created_at || '').localeCompare(b.date || b.created_at || '');
        case 'amount_asc':
          return a.amount - b.amount;
        case 'amount_desc':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

  // Баланс по отфильтрованным транзакциям
  const balance = filtered.reduce((sum, tx) => {
    if (tx.type === 'add') return sum + Number(tx.amount);
    if (tx.type === 'remove') return sum - Number(tx.amount);
    return sum;
  }, 0);

  useEffect(() => {
    if (location.pathname === '/stats' && setStatsBalance) setStatsBalance(balance);
  }, [balance, location.pathname, setStatsBalance]);

  // При открытии панели фильтров копировать filters в pendingFilters
  const openFilters = () => {
    setPendingFilters(filters);
    setShowFilters(true);
  };

  // Сброс фильтров (только pendingFilters, не закрывает панель)
  const resetPendingFilters = () => setPendingFilters({
    dateFrom: '',
    dateTo: '',
    categories: [],
    roles: [],
    users: [],
    types: [],
    sort: 'date_desc'
  });

  return (
    <div className="main-container">
    <div className="orders-list">
      <div className="stats-toolbar">
        <CustomSelect
          options={sortOptions}
          value={filters.sort}
          onChange={val => setFilters(f => ({ ...f, sort: val }))}
        />
        <button className="filters-btn" onClick={openFilters}>Фильтры</button>
      </div>
      <div className="orders-filters-drawer" style={{right: showFilters ? 0 : '-120vw'}}>
        <div className="filters-title">Фильтры <button className="close-btn" onClick={() => setShowFilters(false)}>×</button></div>
        {/* Категории */}
        <div className="filters-block">
          <div className="filters-label">Категории</div>
          <div className="filters-checkboxes">
            {categories.map(cat => (
              <CustomCheckbox
                key={cat}
                label={cat}
                value={cat}
                checked={pendingFilters.categories.includes(cat)}
                onChange={e => {
                  const val = e.target.value;
                  setPendingFilters(f => ({
                    ...f,
                    categories: f.categories.includes(val)
                      ? f.categories.filter(c => c !== val)
                      : [...f.categories, val]
                  }));
                }}
              />
            ))}
          </div>
        </div>
        {/* Роли */}
        <div className="filters-block">
          <div className="filters-label">Роли</div>
          <div className="filters-checkboxes">
            {roles.map(r => (
              <CustomCheckbox
                key={r.value}
                label={r.label}
                value={r.value}
                checked={pendingFilters.roles.includes(r.value)}
                onChange={e => {
                  const val = e.target.value;
                  setPendingFilters(f => ({
                    ...f,
                    roles: f.roles.includes(val)
                      ? f.roles.filter(c => c !== val)
                      : [...f.roles, val]
                  }));
                }}
              />
            ))}
          </div>
        </div>
        {/* Пользователи */}
        <div className="filters-block">
          <div className="filters-label">Пользователи</div>
          <div className="filters-checkboxes">
            {users.map(u => (
              <CustomCheckbox
                key={u}
                label={u}
                value={u}
                checked={pendingFilters.users.includes(u)}
                onChange={e => {
                  const val = e.target.value;
                  setPendingFilters(f => ({
                    ...f,
                    users: f.users.includes(val)
                      ? f.users.filter(c => c !== val)
                      : [...f.users, val]
                  }));
                }}
              />
            ))}
          </div>
        </div>
        {/* Тип */}
        <div className="filters-block">
          <div className="filters-label">Тип</div>
          <div className="filters-checkboxes">
            {typeOptions.map(t => (
              <CustomCheckbox
                key={t.value}
                label={t.label}
                value={t.value}
                checked={pendingFilters.types && pendingFilters.types.includes(t.value)}
                onChange={e => {
                  const val = e.target.value;
                  setPendingFilters(f => ({
                    ...f,
                    types: f.types && f.types.includes(val)
                      ? f.types.filter(c => c !== val)
                      : [...(f.types || []), val]
                  }));
                }}
              />
            ))}
          </div>
        </div>
        {/* Дата */}
        <div className="filters-block">
          <div className="filters-label">Дата</div>
          <div style={{display:'flex',gap:8}}>
            <input type="date" value={pendingFilters.dateFrom} onChange={e => setPendingFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            <input type="date" value={pendingFilters.dateTo} onChange={e => setPendingFilters(f => ({ ...f, dateTo: e.target.value }))} />
          </div>
        </div>
        <div className='filter-buttons'>
          <button className="reset-btn" type="button" onClick={resetPendingFilters}>Сбросить фильтр</button>
          <button className="apply-btn" type="button" onClick={() => { setFilters(pendingFilters); setShowFilters(false); }}>Применить фильтры</button>
        </div>
      </div>
      {showFilters && <div className="filters-backdrop" onClick={() => setShowFilters(false)}></div>}
      {filtered.length === 0 ? (
        <div style={{padding: 32, textAlign: 'center', color: '#888'}}>Ничего не найдено, попробуйте изменить фильтры</div>
      ) : (
        filtered.map(tx => (
          <div className="order-items">
          <div className="order-item" key={tx.id} onClick={() => setSelected(tx)}>
           <div className="left__col">
           <span className={tx.type === 'add' ? 'dot-income' : 'dot-expense'}></span>
           <span className="order-amount">{tx.amount} ₽</span>
           </div>
         <div className="right__col">
         <span className="order-date">{tx.date || tx.created_at?.slice(0,10)}</span>
         </div>
          </div>
          </div>
        ))
      )}
      {selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{selected.type === 'add' ? 'Доход' : 'Расход'}</h3>
            <div>Дата: {selected.date || selected.created_at?.slice(0,10)}</div>
            <div>Категория: {selected.category}</div>
            <div>Сумма: {selected.amount} ₽</div>
            <div>Описание: {selected.description}</div>
            {selected.photo && (
              <div className='modalImage'>
                <img src={`${UPLOADS_BASE_URL}/${selected.photo}`} alt="Фото" style={{ cursor:'pointer'}} onClick={() => setLightbox(selected.photo)} />
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setSelected(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      {lightbox && (
        <div className="modal-backdrop" onClick={() => setLightbox(null)}>
          <div className="modal" style={{background:'none', boxShadow:'none', display:'flex',alignItems:'center',justifyContent:'center'}}>
            <img src={`${UPLOADS_BASE_URL}/${lightbox}`} alt="Фото" style={{maxWidth:'90vw', maxHeight:'80vh', borderRadius:8, boxShadow:'0 2px 16px rgba(0,0,0,0.3)'}} />
          </div>
        </div>
      )}
      {/* nav.bottom-bar удалён, теперь глобальный */}
    </div>
    </div>
  );
}

export default Orders; 