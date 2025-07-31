// components/common/PageHeader.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const PageHeader = ({ 
  title, 
  buttonText, 
  onButtonClick, 
  showSearch = false, 
  searchValue = '', 
  onSearchChange,
  searchPlaceholder = "Ara...",
  children 
}) => {
  return (
    <div className={commonStyles.pageHeader}>
      <h1 className={commonStyles.pageTitle}>
        {title}
      </h1>
      
      <div className={commonStyles.headerActions}>
        {/* Search Input */}
        {showSearch && (
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className={commonStyles.searchInput}
          />
        )}
        
        {/* Custom children (filters, etc.) */}
        {children}
        
        {/* Action Button */}
        {buttonText && onButtonClick && (
          <button
            onClick={onButtonClick}
            className={commonStyles.btnPrimary}
          >
            + {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;