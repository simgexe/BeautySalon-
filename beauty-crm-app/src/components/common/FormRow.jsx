import React from 'react';
import commonStyles from '../../styles/common.module.css';

const FormRow = ({ children, className = "" }) => {
  return (
    <div className={`${commonStyles.formRow} ${className}`}>
      {children}
    </div>
  );
};

export default FormRow;