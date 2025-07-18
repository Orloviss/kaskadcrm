import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.scss';

function CustomSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="custom-select" ref={ref}>
      <div className="custom-select__selected" onClick={() => setOpen(v => !v)}>
        {selected ? selected.label : 'Выбрать'}
        <span className="arrow">▼</span>
      </div>
      {open && (
        <div className="custom-select__dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={"custom-select__option" + (opt.value === value ? ' selected' : '')}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect; 