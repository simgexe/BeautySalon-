
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const Select = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Seçin...",
  required = false,
  className = "",
  error = false,
  disabled = false,
  ...props 
}) => {
  const selectClass = `${commonStyles.select} ${className}`;

  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={selectClass}
      style={{
        borderColor: error ? 'var(--color-danger)' : undefined
      }}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option, index) => (
        <option key={option.value || index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;