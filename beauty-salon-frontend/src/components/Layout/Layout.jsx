// components/layout/Layout.jsx - İyileştirilmiş
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Layout.module.css';
import { FaHome, FaUserFriends, FaCalendarAlt, FaFileInvoiceDollar, FaChartLine, FaLayerGroup, FaBoxOpen, FaUserCog, FaUserShield, FaReceipt, FaWeight } from 'react-icons/fa';
import { FaHeartbeat } from 'react-icons/fa';

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
  const { logout, user } = useAuth();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const [drawerOpen, setDrawerOpen] = useState(isDashboard);

  // Rota değişince varsayılan davranış: dashboard açık, diğer sayfalar kapalı
  useEffect(() => {
    setDrawerOpen(isDashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Sayfa başlığı - rota bazlı
  const routeTitleMap = {
    '/': 'Anasayfa',
    '/dashboard': 'Anasayfa',
    '/customers': 'Müşteriler',
    '/appointments': 'Randevular',
    '/payments': 'Ödemeler',
    
    '/reports': 'Raporlar',
    '/expenses': 'Giderler',
    '/services': 'Hizmetler',
    '/session-packages': 'Seans Paketleri',
    '/users': 'Kullanıcı Yönetimi',
    '/roles': 'Rol Yönetimi',
    '/laser-tracking': 'Lazer Takip',
    '/regional-thinning': 'Bölgesel İncelme',
  };
  const currentTitle = routeTitleMap[location.pathname] || logoText || 'Beauty Salon';

  const handleLogoClick = () => {
    navigate(logoHref);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <div className={`${styles.layoutContainer} ${drawerOpen ? styles.drawerActive : ''} ${className}`}>
      {/* Header */}
      <header className={`${styles.header} ${headerClassName}`}>
        <div 
          className={`${styles.headerContent} ${styles.headerContentCustom}`}
          data-max-width={maxWidth}
        >
          <div className={styles.headerLeft}>
            {/* Drawer toggle */}
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Menüyü aç/kapat"
              onClick={() => setDrawerOpen((v) => !v)}
            >
              ☰
            </button>
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
          </div>
          
          <div className={styles.headerActions}>
            {!isDashboard && showBackButton && (
              <button
                onClick={handleBackClick}
                className={styles.dashboardBtn}
                type="button"
                aria-label="Anasayfaya dön"
              >
                <span className={styles.backIcon}>←</span>
                <span className={styles.backText}>Anasayfaya Dön</span>
              </button>
            )}
            
            {user && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.firstName} {user.lastName}</span>
                <span className={styles.userRole}>({user.roleName})</span>
              </div>
            )}
            
            {headerActions}
          </div>
        </div>
      </header>

      {/* Drawer */}
      <aside className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.brand}>Beauty Salon</span>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Kapat"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${location.pathname === '/' || location.pathname === '/dashboard' ? styles.active : ''}`} onClick={() => navigateTo('/')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#F1E3FF', color: '#A855F7' }}><FaHome /></span>
            <span className={styles.navLabel}>Anasayfa</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/customers') ? styles.active : ''}`} onClick={() => navigateTo('/customers')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#F1E3FF', color: '#A855F7' }}><FaUserFriends /></span>
            <span className={styles.navLabel}>Müşteriler</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/appointments') ? styles.active : ''}`} onClick={() => navigateTo('/appointments')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#EFE7FF', color: '#8B5CF6' }}><FaCalendarAlt /></span>
            <span className={styles.navLabel}>Randevular</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/payments') ? styles.active : ''}`} onClick={() => navigateTo('/payments')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#FFE7E7', color: '#F43F5E' }}><FaFileInvoiceDollar /></span>
            <span className={styles.navLabel}>Ödemeler</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/reports') ? styles.active : ''}`} onClick={() => navigateTo('/reports')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#E7FFF3', color: '#22C55E' }}><FaChartLine /></span>
            <span className={styles.navLabel}>Raporlar</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/expenses') ? styles.active : ''}`} onClick={() => navigateTo('/expenses')}>
            <span className={`${styles.navIcon} ${styles.navIconBox}`} style={{ backgroundColor: '#FFECEC', color: '#F43F5E' }}><FaReceipt /></span>
            <span className={styles.navLabel}>Giderler</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/services') ? styles.active : ''}`} onClick={() => navigateTo('/services')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#E6F4FF', color: '#38BDF8' }}><FaLayerGroup /></span>
            <span className={styles.navLabel}>Hizmetler</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/laser-tracking') ? styles.active : ''}`} onClick={() => navigateTo('/laser-tracking')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#FFEFF7', color: '#EC4899' }}><FaHeartbeat /></span>
            <span className={styles.navLabel}>Lazer Takip</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/regional-thinning') ? styles.active : ''}`} onClick={() => navigateTo('/regional-thinning')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#F0F9FF', color: '#0EA5E9' }}><FaWeight /></span>
            <span className={styles.navLabel}>Bölgesel Takip</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/session-packages') ? styles.active : ''}`} onClick={() => navigateTo('/session-packages')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#FFEAEA', color: '#F87171' }}><FaBoxOpen /></span>
            <span className={styles.navLabel}>Seans Paketleri</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/users') ? styles.active : ''}`} onClick={() => navigateTo('/users')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#E6EEFF', color: '#60A5FA' }}><FaUserCog /></span>
            <span className={styles.navLabel}>Kullanıcı Yönetimi</span>
          </button>
          <button className={`${styles.navItem} ${location.pathname.startsWith('/roles') ? styles.active : ''}`} onClick={() => navigateTo('/roles')}>
            <span className={`${styles.navIcon} ${styles.navIconCircle}`} style={{ backgroundColor: '#FFF7E6', color: '#F59E0B' }}><FaUserShield /></span>
            <span className={styles.navLabel}>Rol Yönetimi</span>
          </button>
        </nav>
        <div className={styles.drawerFooter}>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>Çıkış</button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {drawerOpen && <div className={styles.overlay} onClick={() => setDrawerOpen(false)}></div>}

      {/* Main Content */}
      <main 
        className={`${styles.mainContent} ${styles.mainContentCustom} ${drawerOpen ? styles.mainShiftMobile : ''} ${mainClassName}`}
        data-max-width={maxWidth}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;