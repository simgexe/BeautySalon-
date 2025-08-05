// components/DashboardCard.jsx - İyileştirilmiş
import React from 'react';
import styles from './dashboard/DashboardCard.module.css';

export const DashboardCard = ({ 
  label, 
  icon, 
  onClick, 
  iconBg = '#fdf9f3',
  className = "",
  disabled = false,
  variant = "default", // default, outlined, filled
  size = "medium" // small, medium, large
}) => {
  const variantClass = {
    default: styles.dashboardCardDefault,
    outlined: styles.dashboardCardOutlined,
    filled: styles.dashboardCardFilled
  }[variant];

  const sizeClass = {
    small: styles.dashboardCardSmall,
    medium: '', // default
    large: styles.dashboardCardLarge
  }[size];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        ${styles.dashboardCard} 
        ${variantClass}
        ${sizeClass}
        ${disabled ? styles.dashboardCardDisabled : ''}
        ${className}
      `}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={onClick && !disabled ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div 
        className={styles.cardIcon}
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <h3 className={styles.cardLabel}>
        {label}
      </h3>
    </div>
  );
};

export const StatCard = ({ 
  label, 
  value, 
  icon, 
  iconBg = '#fdf9f3',
  className = "",
  variant = "default", // default, outlined, filled
  size = "medium", // small, medium, large
  trend = null, // { value: 12, direction: 'up' | 'down' }
  loading = false
}) => {
  const variantClass = {
    default: styles.statCardDefault,
    outlined: styles.statCardOutlined,
    filled: styles.statCardFilled
  }[variant];

  const sizeClass = {
    small: styles.statCardSmall,
    medium: '', // default
    large: styles.statCardLarge
  }[size];

  if (loading) {
    return (
      <div className={`${styles.statCard} ${variantClass} ${sizeClass} ${className}`}>
        <div className={styles.statContent}>
          <div className={`${styles.statIcon} ${styles.statIconLoading}`}>
            <div className={styles.spinner}></div>
          </div>
          <div className={styles.statInfo}>
            <div className={`${styles.statLabel} ${styles.skeleton}`}></div>
            <div className={`${styles.statValue} ${styles.skeleton}`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.statCard} ${variantClass} ${sizeClass} ${className}`}>
      <div className={styles.statContent}>
        <div 
          className={styles.statIcon}
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <div className={styles.statInfo}>
          <p className={styles.statLabel}>
            {label}
          </p>
          <div className={styles.statValueRow}>
            <p className={styles.statValue}>
              {value}
            </p>
            {trend && (
              <span className={`
                ${styles.statTrend} 
                ${trend.direction === 'up' ? styles.statTrendUp : styles.statTrendDown}
              `}>
                {trend.direction === 'up' ? '↗' : '↘'} {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardHeader = ({ 
  title, 
  subtitle,
  className = "",
  actions = null
}) => {
  return (
    <div className={`${styles.dashboardHeader} ${className}`}>
      <div className={styles.dashboardHeaderContent}>
        <h2 className={styles.dashboardTitle}>
          {title}
        </h2>
        {subtitle && (
          <p className={styles.dashboardSubtitle}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className={styles.dashboardHeaderActions}>
          {actions}
        </div>
      )}
    </div>
  );
}; 