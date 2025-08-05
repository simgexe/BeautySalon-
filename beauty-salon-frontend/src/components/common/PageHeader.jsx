// components/common/PageHeader.jsx
import React from 'react';
import styles from './PageHeader.module.css';

const PageHeader = ({ 
  title, 
  subtitle,
  buttonText, 
  onButtonClick, 
  showSearch = false, 
  searchValue = '', 
  onSearchChange,
  searchPlaceholder = "Ara...",
  children,
  className = "",
  actions = null,
  loading = false
}) => {
  return (
    <div className={`${styles.pageHeader} ${className}`}>
      {/* Title Section */}
      <div className={styles.titleSection}>
        <h1 className={styles.pageTitle}>
          {title}
        </h1>
        {subtitle && (
          <p className={styles.pageSubtitle}>
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Actions Section */}
      <div className={styles.actionsSection}>
        {/* Search Input */}
        {showSearch && (
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className={styles.searchInput}
              disabled={loading}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        )}
        
        {/* Custom children (filters, etc.) */}
        {children && (
          <div className={styles.customActions}>
            {children}
          </div>
        )}
        
        {/* Custom actions */}
        {actions && (
          <div className={styles.headerActions}>
            {actions}
          </div>
        )}
        
        {/* Primary Action Button */}
        {buttonText && onButtonClick && (
          <button
            onClick={onButtonClick}
            className={styles.primaryButton}
            disabled={loading}
            type="button"
          >
            <span className={styles.buttonIcon}>+</span>
            <span className={styles.buttonText}>{buttonText}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;