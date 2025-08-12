// components/layout/Layout.jsx - İyileştirilmiş
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

// AddButton Component
export const AddButton = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  ...props 
}) => {
  return (
    <button 
      className={`${styles.addButton} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
};

const Layout = ({ 
  children,
  className = "",
  headerClassName = "",
  mainClassName = "",
  showBackButton = true,
  logoText = "Beauty Salon",
  logoHref = "/",
  maxWidth = "1200px",
  headerActions = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Sayfa başlığı - rota bazlı
  const routeTitleMap = {
    '/': 'Dashboard',
    '/dashboard': 'Anasayfa',
    '/customers': 'Müşteriler',
    '/appointments': 'Randevular',
    '/payments': 'Ödemeler',
    '/services': 'Hizmetler',
  };
  const currentTitle = routeTitleMap[location.pathname] || logoText || 'Beauty Salon';

  const handleLogoClick = () => {
    navigate(logoHref);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className={`${styles.layoutContainer} ${className}`}>
      {/* Header */}
      <header className={`${styles.header} ${headerClassName}`}>
        <div 
          className={styles.headerContent}
          style={{ maxWidth }}
        >
          <h1 
            className={styles.logo}
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
              }
            }}
          >
            {currentTitle}
          </h1>
          
          <div className={styles.headerActions}>
            {headerActions}
            
            {!isDashboard && showBackButton && (
              <button
                onClick={handleBackClick}
                className={styles.dashboardBtn}
                type="button"
                aria-label="Dashboard'a dön"
              >
                <span className={styles.backIcon}>←</span>
                <span className={styles.backText}>Dashboard'a Dön</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={`${styles.mainContent} ${mainClassName}`}
        style={{ maxWidth }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;