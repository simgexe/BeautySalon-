// components/common/Input.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const Input = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  className = "",
  error = false,
  disabled = false,
  ...props 
}) => {
  const inputClass = `${commonStyles.input} ${className} ${
    error ? 'error-border' : ''
  }`;

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={inputClass}
      style={{
        borderColor: error ? 'var(--color-danger)' : undefined
      }}
      {...props}
    />
  );
};

export default Input;