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
  { value: 'Админ', label: 'Админ' },
  { value: 'Дизайнер', label: 'Дизайнер' }
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

// Новый компонент для истории
function OrdersHistory({ transactions, setTransactions }) {
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    incomeCategory: '',
    expenseCategory: '',
    role: '',
    user: '',
    sort: 'date_desc'
  });
  const [pendingFilters, setPendingFilters] = useState({
    dateFrom: '',
    dateTo: '',
    incomeCategory: '',
    expenseCategory: '',
    role: '',
    user: '',
    sort: 'date_desc'
  });
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [activeTypeTab, setActiveTypeTab] = useState('add');
  const users = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (tx.username) map[tx.username] = true;
    });
    return Object.keys(map);
  }, [transactions]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/funds/categories`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setIncomeCategories((data.categories || []).filter(c => c.type === 'income').map(c => c.name));
        setExpenseCategories((data.categories || []).filter(c => c.type === 'expense').map(c => c.name));
      });
  }, []);

  const filtered = transactions
    .filter(tx => {
      if (tx.type !== activeTypeTab) return false;
      if (pendingFilters.dateFrom && tx.date < pendingFilters.dateFrom) return false;
      if (pendingFilters.dateTo && tx.date > pendingFilters.dateTo) return false;
      if (pendingFilters.incomeCategory && tx.type === 'add' && tx.category !== pendingFilters.incomeCategory) return false;
      if (pendingFilters.expenseCategory && tx.type === 'remove' && tx.category !== pendingFilters.expenseCategory) return false;
      if (pendingFilters.role && tx.role !== pendingFilters.role) return false;
      if (pendingFilters.user && tx.username !== pendingFilters.user) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
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

  // Общая сумма по фильтру и вкладке
  const totalFiltered = filtered.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const openFilters = () => {
    setPendingFilters(filters);
    setShowFilters(true);
  };
  const resetPendingFilters = () => setPendingFilters({
    dateFrom: '',
    dateTo: '',
    incomeCategory: '',
    expenseCategory: '',
    role: '',
    user: '',
    sort: 'date_desc'
  });

  // Функция для форматирования даты в виде '19 июля 2025'
  function formatDateRu(dateStr) {
    if (!dateStr) return '';
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const [year, month, day] = dateStr.split('-');
    return `${Number(day)} ${months[Number(month)-1]} ${year}`;
  }

  return (
    <div className="main-container">
      <div className="orders-list">
        <div className="stats-toolbar">
        
          <CustomSelect
            options={sortOptions}
            value={filters.sort}
            onChange={val => {
              setFilters(f => ({ ...f, sort: val }));
              setPendingFilters(p => ({ ...p, sort: val }));
            }}
          />
          <button className="filters-btn" onClick={openFilters}>Фильтры</button>
        </div>
        <div class="order__tabs">
        <div style={{display:'flex',gap:8,marginBottom:8}}>
            <button className={activeTypeTab==='add'? 'active' : ''} style={{padding:'0.5rem 1.2rem',border:'none',background:activeTypeTab==='add'?'#4caf50':'rgb(225 225 225)',color:activeTypeTab==='add'?'#fff':'#333',fontWeight:600,cursor:'pointer'}} onClick={()=>setActiveTypeTab('add')}>Доход</button>
            <button className={activeTypeTab==='remove'? 'active' : ''} style={{padding:'0.5rem 1.2rem',border:'none',background:activeTypeTab==='remove'?'#d32f2f':'rgb(225 225 225)',color:activeTypeTab==='remove'?'#fff':'#333',fontWeight:600,cursor:'pointer'}} onClick={()=>setActiveTypeTab('remove')}>Расход</button>
          </div>
          {/* Общая сумма по фильтру и вкладке */}
          <div style={{marginBottom:8, marginTop:8, fontWeight:600, fontSize:'1.3rem', textAlign: 'center', color:'#333'}}>
            Всего: {totalFiltered} ₽
          </div>
        </div>
        <div className="orders-filters-drawer" style={{right: showFilters ? 0 : '-120vw'}}>
          <div className="filters-title">Фильтры <button className="close-btn" onClick={() => setShowFilters(false)}>×</button></div>
          {/* Категории доходов */}
          <div className="filters-block">
            <div className="filters-label">Категория дохода</div>
            <CustomSelect
              options={incomeCategories.map(cat => ({ value: cat, label: cat }))}
              value={pendingFilters.incomeCategory}
              onChange={val => setPendingFilters(f => ({ ...f, incomeCategory: val }))}
            />
          </div>
          {/* Категории расходов */}
          <div className="filters-block">
            <div className="filters-label">Категория расхода</div>
            <CustomSelect
              options={expenseCategories.map(cat => ({ value: cat, label: cat }))}
              value={pendingFilters.expenseCategory}
              onChange={val => setPendingFilters(f => ({ ...f, expenseCategory: val }))}
            />
          </div>
          {/* Роли */}
          <div className="filters-block">
            <div className="filters-label">Роль</div>
            <CustomSelect
              options={roles}
              value={pendingFilters.role}
              onChange={val => setPendingFilters(f => ({ ...f, role: val }))}
            />
          </div>
          {/* Пользователи */}
          <div className="filters-block">
            <div className="filters-label">Пользователь</div>
            <CustomSelect
              options={users.map(u => ({ value: u, label: u }))}
              value={pendingFilters.user}
              onChange={val => setPendingFilters(f => ({ ...f, user: val }))}
            />
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
          <div className="order-items">
            {Object.entries(filtered.reduce((acc, tx) => {
              const date = (tx.date || tx.created_at || '').slice(0, 10);
              if (!acc[date]) acc[date] = [];
              acc[date].push(tx);
              return acc;
            }, {})).map(([date, txs]) => {
              const daySum = txs.reduce((sum, tx) => tx.type === 'add' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);
              return (
                <div key={date} style={{marginBottom: '0'}}>
                  <div className="date__row" style={{fontWeight: 600, fontSize: '1.1rem', margin: '0.5rem 0', display:'flex', alignItems:'center', gap:12}}>
                    {formatDateRu(date)}
                    <span style={{color:'#388e3c', fontWeight:500, fontSize:'1rem'}}> {daySum} ₽</span>
                  </div>
                  {txs.map(tx => (
                    <div className="order-item" key={tx.id} onClick={() => setSelected(tx)}>
                      <div className="left__col" style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontWeight:600, fontSize:'1.05rem'}}>{tx.title || 'Без названия'}</span>
                        </div>
                       
                        <div style={{fontSize:'0.95rem', color:'#888'}}>{tx.category}</div>
                        <div style={{fontSize:'0.95rem', color:'#666', marginTop:2}}>
                          {(tx.description && tx.description.length > 32) ? tx.description.slice(0,32) + '...' : tx.description || ''}
                        </div>
                      </div>
                      <div className="right__col">
                      <div style={{fontSize:'1.2rem', fontWeight:500, margin:'2px 0'}}>{tx.amount} ₽</div>
                      </div>
                      {/* Дату внутри записи убираем */}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {selected && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>{selected.type === 'add' ? 'Доход' : 'Расход'}</h3>
              <div><b>Название:</b> {selected.title || 'Без названия'}</div>
              <div><b>Сумма:</b> {selected.amount} ₽</div>
              <div><b>Категория:</b> {selected.category}</div>
              <div><b>Описание:</b> {selected.description}</div>
              <div><b>Дата:</b> {selected.date || selected.created_at?.slice(0,10)}</div>
              <div><b>Пользователь:</b> {selected.username || '-'}</div>
              <div><b>Роль:</b> {selected.role || '-'}</div>
              {selected.photo && (
                <div className='modalImage'>
                  <img src={`${UPLOADS_BASE_URL}/${selected.photo}`} alt="Фото" style={{ cursor:'pointer'}} onClick={() => setLightbox(selected.photo)} />
                </div>
              )}
              <div className="modal-actions">
                <button onClick={() => setSelected(null)}>Закрыть</button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Удалить эту транзакцию?')) return;
                    await fetch(`${API_BASE_URL}/funds/delete/${selected.id}`, {
                      method: 'DELETE',
                      credentials: 'include'
                    });
                    setSelected(null);
                    // Обновить список транзакций
                    setTransactions(ts => ts.filter(tx => tx.id !== selected.id));
                  }}
                  style={{marginLeft: 12, background: '#e74c3c', color: '#fff'}}>
                  Удалить транзакцию
                </button>
              </div>
            </div>
          </div>
        )}
        {lightbox && (
          <div className="modal-backdrop" onClick={() => setLightbox(null)}>
            <div className="modal" style={{background:'none', boxShadow:'none', display:'flex',alignItems:'center',justifyContent:'center'}}>
              <img src={`${UPLOADS_BASE_URL}/${lightbox}`} alt="Фото" style={{maxWidth:'90vw', maxHeight:'80vh', boxShadow:'0 2px 16px rgba(0,0,0,0.3)'}} />
            </div>
          </div>
        )}
        {/* nav.bottom-bar удалён, теперь глобальный */}
      </div>
    </div>
  );
}

// Заглушка для заказов
function OrdersStub() {
  return (
    <div className="main-container"><div style={{padding: 32, textAlign: 'center', color: '#888', fontSize: '1.2rem'}}>Будет добавлено позже</div></div>
  );
}

// Экспорт по умолчанию — всегда OrdersHistory (для вкладки Финансы)
export default OrdersHistory; 