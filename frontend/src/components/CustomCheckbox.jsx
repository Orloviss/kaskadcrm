import React from 'react';
import './CustomCheckbox.scss';

function CustomCheckbox({ label, checked, onChange, value }) {
  return (
    <label className="custom-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} value={value} />
      <span className="checkmark"></span>
      {label}
    </label>
  );
}

export default CustomCheckbox; 