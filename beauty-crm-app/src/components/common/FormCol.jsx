
// components/common/FormCol.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const FormCol = ({ children, className = "" }) => {
  return (
    <div className={`${commonStyles.formCol} ${className}`}>
      {children}
    </div>
  );
};

export default FormCol;