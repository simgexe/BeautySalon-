
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, appointmentService, paymentService } from '../api/api';
import { testApiConnection } from '../utils/apiTest';
import { FaCalendarAlt, FaMoneyBillWave, FaLayerGroup, FaUserFriends, FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';

import Layout from '../components/Layout/Layout';
import Modal from '../components/common/Modal/Modal';
import dashboardStyles from './dashboard.module.css';

// Dashboard Card Components
export const DashboardCard = ({ 
  label, 
  icon, 
  value,
  onClick, 
  iconBg = '#fdf9f3',
  className = "",
  disabled = false,
  variant = "default", // default, outlined, filled
  size = "medium" // small, medium, large
}) => {
  const variantClass = {
    default: dashboardStyles.dashboardCardDefault,
    outlined: dashboardStyles.dashboardCardOutlined,
    filled: dashboardStyles.dashboardCardFilled
  }[variant];

  const sizeClass = {
    small: dashboardStyles.dashboardCardSmall,
    medium: '', // default
    large: dashboardStyles.dashboardCardLarge
  }[size];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        ${dashboardStyles.dashboardCard} 
        ${variantClass}
        ${sizeClass}
        ${disabled ? dashboardStyles.dashboardCardDisabled : ''}
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
        className={dashboardStyles.cardIcon}
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      {className.includes('statCard') ? (
        <div className={dashboardStyles.statTextWrapper}>
          <h3 className={dashboardStyles.cardLabel}>
            {label}
            {value && (
              <span className={dashboardStyles.statValue}>
                {value}
              </span>
            )}
          </h3>
        </div>
      ) : (
        <div className={dashboardStyles.cardContentContainer}>
          <h3 className={dashboardStyles.cardLabel}>
            {label}
          </h3>
          {value && (
            <div className={dashboardStyles.cardValue}>
              {value}
            </div>
          )}
        </div>
      )}
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
    default: dashboardStyles.statCardDefault,
    outlined: dashboardStyles.statCardOutlined,
    filled: dashboardStyles.statCardFilled
  }[variant];

  const sizeClass = {
    small: dashboardStyles.statCardSmall,
    medium: '', // default
    large: dashboardStyles.statCardLarge
  }[size];

  if (loading) {
    return (
      <div className={`${dashboardStyles.statCard} ${variantClass} ${sizeClass} ${className}`}>
        <div className={dashboardStyles.statContent}>
          <div className={`${dashboardStyles.statIcon} ${dashboardStyles.statIconLoading}`}>
            <div className={dashboardStyles.spinner}></div>
          </div>
          <div className={dashboardStyles.statInfo}>
            <div className={`${dashboardStyles.statLabel} ${dashboardStyles.skeleton}`}></div>
            <div className={`${dashboardStyles.statValue} ${dashboardStyles.skeleton}`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${dashboardStyles.statCard} ${variantClass} ${sizeClass} ${className}`}>
      <div className={dashboardStyles.statContent}>
        <div 
          className={dashboardStyles.statIcon}
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <div className={dashboardStyles.statInfo}>
          <p className={dashboardStyles.statLabel}>
            {label}
          </p>
          <div className={dashboardStyles.statValueRow}>
            <p className={dashboardStyles.statValue}>
              {value}
            </p>
            {trend && (
              <span className={`
                ${dashboardStyles.statTrend} 
                ${trend.direction === 'up' ? dashboardStyles.statTrendUp : dashboardStyles.statTrendDown}
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
    <div className={`${dashboardStyles.dashboardHeader} ${className}`}>
      <div className={dashboardStyles.dashboardHeaderContent}>
        <h2 className={dashboardStyles.dashboardTitle}>
          {title}
        </h2>
        {subtitle && (
          <p className={dashboardStyles.dashboardSubtitle}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className={dashboardStyles.dashboardHeaderActions}>
          {actions}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    isLoading: true
  });
  const [apiError, setApiError] = useState(null);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [todaysAppointments, setTodaysAppointments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📄 Dashboard verileri yükleniyor...');
      
      const apiTest = await testApiConnection();
      
      if (apiTest.errors.length > 0) {
        const errorMessage = apiTest.errors.length === 3 
          ? 'API sunucusu çalışmıyor. Lütfen API sunucusunu başlatın.'
          : 'API sunucusuna bağlanılamıyor. Lütfen API sunucusunun çalıştığından emin olun.';
        setApiError(errorMessage);
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // API çalışıyorsa verileri yükle
      const [customersResponse, appointmentsResponse, paymentsResponse] = await Promise.allSettled([
        customerService.getAll(),
        appointmentService.getAll(),
        paymentService.getAll()
      ]);

      let totalClients = 0;
      let todayAppointments = 0;
      let monthlyRevenue = 0;

      if (customersResponse.status === 'fulfilled') {
        totalClients = customersResponse.value.length;
      }

      if (appointmentsResponse.status === 'fulfilled') {
        const today = new Date();
        const todayStr = today.toDateString();
        
        const todaysApts = appointmentsResponse.value.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate.toDateString() === todayStr;
        });
        
        todayAppointments = todaysApts.length;
        setTodaysAppointments(todaysApts);
      }

      if (paymentsResponse.status === 'fulfilled') {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        monthlyRevenue = paymentsResponse.value
          .filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
          })
          .reduce((sum, payment) => sum + payment.amount, 0);
      }

      setStats({
        totalClients,
        todayAppointments,
        monthlyRevenue,
        isLoading: false
      });

      setApiError(null);

    } catch (error) {
      console.error('📛 Dashboard veri yükleme hatası:', error);
      setApiError('Veri yükleme hatası oluştu.');
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (stats.isLoading) {
    return (
      <Layout className={dashboardStyles.dashboardLayout}>
        <div className={dashboardStyles.loadingContainer}>
          <div className={dashboardStyles.spinner}></div>
          <p className={dashboardStyles.loadingText}>Anasayfa yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className={dashboardStyles.dashboardLayout}>
      {/* API Error Alert */}
      {apiError && (
        <div className={dashboardStyles.errorAlert}>
          <FaExclamationTriangle />
          <span>{apiError}</span>
          <button 
            onClick={fetchDashboardData}
            className={dashboardStyles.retryButton}
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Welcome Message */}
      <div className={dashboardStyles.welcomeMessage}>
        <h2 className={dashboardStyles.welcomeTitle}>
          Beauty Salon Yönetim Paneli
        </h2>
      </div>

      <div className={dashboardStyles.dashboardContainer}>
        {/* Dashboard Grid */}
        <div className={dashboardStyles.dashboardGrid}>
          {/* Müşteriler - Sol üst */}
          <DashboardCard
            label="Müşteriler"
            icon={<FaUserFriends size={40} />}
            iconBg="rgba(156, 57, 64, 0.12)"
            onClick={() => navigate('/customers')}
            className={dashboardStyles.mainCard}
          />

          {/* Randevular - Sağ üst */}
          <DashboardCard
            label="Randevular"
            icon={<FaCalendarAlt size={40} />}
            iconBg="rgba(156, 57, 64, 0.12)"
            onClick={() => navigate('/appointments')}
            className={dashboardStyles.mainCard}
          />

          {/* Ödemeler - En sağ üst */}
          <DashboardCard
            label="Ödemeler"
            icon={<FaMoneyBillWave size={40} />}
            iconBg="rgba(156, 57, 64, 0.12)"
            onClick={() => navigate('/payments')}
            className={dashboardStyles.mainCard}
          />

          {/* Hizmetler - Sol alt */}
          <DashboardCard
            label="Hizmetler"
            icon={<FaLayerGroup size={40} />}
            iconBg="rgba(156, 57, 64, 0.12)"
            onClick={() => navigate('/services')}
            className={dashboardStyles.mainCard}
          />

          {/* Seans Paketleri - Sağ alt */}
          <DashboardCard
            label="Seans Paketleri"
            icon={<FaBoxOpen size={40} />}
            iconBg="rgba(156, 57, 64, 0.12)"
            onClick={() => navigate('/session-packages')}
            className={dashboardStyles.mainCard}
          />

          {/* Stat Cards Container - Sağda dikey */}
          <div className={dashboardStyles.statCardsContainer}>
            {/* Toplam Müşteri */}
            <DashboardCard
              label="Toplam Müşteri"
              icon={<FaUserFriends size={24} />}
              iconBg="rgba(156, 57, 64, 0.12)"
              value={stats.totalClients}
              className={dashboardStyles.statCard}
            />

            {/* Bugünün Randevuları */}
            <DashboardCard
              label="Bugünün Randevuları                 "
              icon={<FaCalendarAlt size={24} />}
              iconBg="rgba(156, 57, 64, 0.12)"
              value={stats.todayAppointments}
              onClick={() => setShowTodayModal(true)}
              className={dashboardStyles.statCard}
            />

            {/* Aylık Gelir */}
            <DashboardCard
              label="Aylık Gelir                      "
              icon={<FaMoneyBillWave size={24} />}
              iconBg="rgba(156, 57, 64, 0.12)"
              value={`₺${stats.monthlyRevenue.toLocaleString('tr-TR')}`}
              className={dashboardStyles.statCard}
            />
          </div>
        </div>
      </div>

      {/* Bugünün Randevuları Modal */}
      <Modal
        isOpen={showTodayModal}
        onClose={() => setShowTodayModal(false)}
        title="Bugünün Randevuları"
        size="medium"
        animation="slideUp"
      >
        <div className={dashboardStyles.todayList}>
          {todaysAppointments.length === 0 ? (
            <p className={dashboardStyles.emptyToday}>Bugün randevu yok.</p>
          ) : (
            todaysAppointments.map((apt) => (
              <div key={apt.appointmentId} className={dashboardStyles.todayItem}>
                <div className={dashboardStyles.todayLeft}>
                  <div className={dashboardStyles.todayTime}>
                    {new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className={dashboardStyles.todayInfo}>
                    <span className={dashboardStyles.todayCustomer}>
                      {apt.customerName || 'Müşteri'}
                    </span>
                    <span className={dashboardStyles.todayService}>
                      {apt.serviceName || '-'}
                    </span>
                  </div>
                </div>
                <span className={`${dashboardStyles.statusBadge} ${dashboardStyles.statusScheduled}`}>
                  Planlı
                </span>
              </div>
            ))
          )}
          <div className={dashboardStyles.todayActions}>
            <button
              type="button"
              className={dashboardStyles.gotoAppointmentsBtn}
              onClick={() => { 
                setShowTodayModal(false); 
                navigate('/appointments'); 
              }}
            >
              Randevulara Git
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Dashboard;