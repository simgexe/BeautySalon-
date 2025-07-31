// components/dashboard/DashboardCard.jsx
import React from 'react';
import styles from './DashboardCard.module.css';
import commonStyles from '../../styles/common.module.css';

export const DashboardCard = ({ 
  label, 
  icon, 
  onClick, 
  iconBg = '#f3f4f6',
  className = "" 
}) => {
  return (
    <div
      onClick={onClick}
      className={`${commonStyles.card} ${styles.dashboardCard} ${className}`}
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

// components/dashboard/StatCard.jsx
export const StatCard = ({ 
  label, 
  value, 
  icon, 
  iconBg = '#f3f4f6',
  className = "" 
}) => {
  return (
    <div className={`${commonStyles.card} ${styles.statCard} ${className}`}>
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
          <p className={styles.statValue}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

// components/dashboard/DashboardHeader.jsx
export const DashboardHeader = ({ title, subtitle }) => {
  return (
    <div className={styles.dashboardHeader}>
      <h2 className={styles.dashboardTitle}>
        {title}
      </h2>
      {subtitle && (
        <p className={styles.dashboardSubtitle}>
          {subtitle}
        </p>
      )}
    </div>
  );
};