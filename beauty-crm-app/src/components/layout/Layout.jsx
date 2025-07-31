// components/layout/Layout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import commonStyles from '../../styles/common.module.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  return (
    <div className={styles.layoutContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Beauty Salon</h1>
          
          {!isDashboard && (
            <button
              onClick={() => navigate('/')}
              className={`${commonStyles.btn} ${styles.dashboardBtn}`}
            >
              ← Dashboard'a Dön
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default Layout;