import React from 'react';
import styles from './FilterBar.module.css';

const FilterBar = ({ children, className = '' }) => {
  return (
    <div className={`${styles.filterBar} ${className}`}>
      {children}
    </div>
  );
};

export default FilterBar;


