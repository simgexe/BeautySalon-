
// components/common/Textarea.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const Textarea = ({ 
  placeholder, 
  value, 
  onChange, 
  rows = 3,
  required = false,
  className = "",
  error = false,
  disabled = false,
  ...props 
}) => {
  const textareaClass = `${commonStyles.input} ${className}`;

  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      required={required}
      disabled={disabled}
      className={textareaClass}
      style={{ 
        resize: 'vertical',
        borderColor: error ? 'var(--color-danger)' : undefined
      }}
      {...props}
    />
  );
};

export default Textarea;