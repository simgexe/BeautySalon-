
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, appointmentService, paymentService } from '../../api/api';
import { testApiConnection } from '../../utils/apiTest';
import { FaCalendarAlt, FaMoneyBillWave, FaLayerGroup, FaUserFriends, FaExclamationTriangle, FaBoxOpen, FaUsers, FaUserShield, FaChartLine, FaReceipt, FaHeartbeat, FaWeight } from 'react-icons/fa';

import Layout from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import dashboardStyles from './dashboard.module.css';

// Dashboard Card Components
export const DashboardCard = ({ 
  label, 
  icon, 
  value,
  onClick, 
  iconBg = '#fdf9f3',
  iconColor = undefined,
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
        className={`${dashboardStyles.cardIcon} ${dashboardStyles.cardIconCustom}`}
        data-bg-color={iconBg}
        style={{ backgroundColor: iconBg, color: iconColor }}
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
          className={`${dashboardStyles.statIcon} ${dashboardStyles.statIconCustom}`}
          data-bg-color={iconBg}
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
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

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
      const [customersResponse, appointmentsResponse, paymentsResponse, expensesResponse, upcomingAppointmentsResponse] = await Promise.allSettled([
        customerService.getAll(),
        appointmentService.getAll(),
        paymentService.getAll(),
        import('../../api/api').then(api => api.expenseService.getAll()),
        appointmentService.getUpcomingAppointments()
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
        
        const grossRevenue = paymentsResponse.value
          .filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            // Status hem sayısal (2) hem string ("Paid") olabilir
            const isPaid = payment.status === 2 || payment.status === 'Paid';
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear &&
                   isPaid;
          })
          .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

        // Aylık giderleri hesapla
        let monthlyExpenses = 0;
        if (expensesResponse.status === 'fulfilled') {
          monthlyExpenses = expensesResponse.value
            .filter(expense => {
              const expenseDate = new Date(expense.expenseDate);
              return expenseDate.getMonth() === currentMonth && 
                     expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        }

        // Net gelir = Brüt gelir - Giderler
        monthlyRevenue = grossRevenue - monthlyExpenses;
      }

      // Yaklaşan randevular
      if (upcomingAppointmentsResponse.status === 'fulfilled') {
        const items = Array.isArray(upcomingAppointmentsResponse.value) ? upcomingAppointmentsResponse.value : [];
        setUpcomingAppointments(items.slice(0, 3));
      } else if (appointmentsResponse.status === 'fulfilled') {
        const now = new Date();
        const upcoming = appointmentsResponse.value
          .filter(a => new Date(a.appointmentDate) > now)
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
          .slice(0, 3);
        setUpcomingAppointments(upcoming);
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

      <div className={dashboardStyles.dashboardContainer}>
        {/* Ana yönlendirme kartları */}
        <div className={dashboardStyles.dashboardGrid}>
          
          <DashboardCard
            label="Müşteriler"
            icon={<FaUserFriends size={40} />}
            iconBg="#F1E3FF"
            iconColor="#A855F7"
            onClick={() => navigate('/customers')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Randevular"
            icon={<FaCalendarAlt size={40} />}
            iconBg="#EFE7FF"
            iconColor="#8B5CF6"
            onClick={() => navigate('/appointments')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Ödemeler"
            icon={<FaMoneyBillWave size={40} />}
            iconBg="#FFE7E7"
            iconColor="#F43F5E"
            onClick={() => navigate('/payments')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Raporlar"
            icon={<FaChartLine size={40} />}
            iconBg="#E7FFF3"
            iconColor="#22C55E"
            onClick={() => navigate('/reports')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Giderler"
            icon={<FaReceipt size={40} />}
            iconBg="#FFECEC"
            iconColor="#F43F5E"
            onClick={() => navigate('/expenses')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Hizmetler"
            icon={<FaLayerGroup size={40} />}
            iconBg="#E6F4FF"
            iconColor="#38BDF8"
            onClick={() => navigate('/services')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Seans Paketleri"
            icon={<FaBoxOpen size={40} />}
            iconBg="#FFEAEA"
            iconColor="#F87171"
            onClick={() => navigate('/session-packages')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Lazer Takip"
            icon={<FaHeartbeat size={40} />}
            iconBg="#FFEFF7"
            iconColor="#EC4899"
            onClick={() => navigate('/laser-tracking')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Bölgesel İncelme Takip"
            icon={<FaWeight size={40} />}
            iconBg="#F0F9FF"
            iconColor="#0EA5E9"
            onClick={() => navigate('/regional-thinning')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Kullanıcı Yönetimi"
            icon={<FaUsers size={40} />}
            iconBg="#E6EEFF"
            iconColor="#60A5FA"
            onClick={() => navigate('/users')}
            className={dashboardStyles.mainCard}
          />
          <DashboardCard
            label="Rol Yönetimi"
            icon={<FaUserShield size={40} />}
            iconBg="#FFF7E6"
            iconColor="#F59E0B"
            onClick={() => navigate('/roles')}
            className={dashboardStyles.mainCard}
          />
        </div>

        {/* Yaklaşan Randevular */}
        <div className={dashboardStyles.section}>
          <div className={dashboardStyles.sectionHeader}>
            <h3 className={dashboardStyles.sectionTitle}>Yaklaşan Randevular</h3>
            <button
              type="button"
              className={dashboardStyles.viewAllLink}
              onClick={() => navigate('/appointments')}
            >
              Tüm Randevuları Görüntüle
            </button>
          </div>
          <Table
            columns={[
              {
                title: 'Müşteri',
                key: 'customerName',
                render: (value) => value || '-'
              },
              {
                title: 'Tarih',
                key: 'appointmentDate',
                render: (value) => new Date(value).toLocaleDateString('tr-TR')
              },
              {
                title: 'Saat',
                key: 'appointmentDate',
                render: (value) => new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              },
              {
                title: 'Hizmet',
                key: 'serviceName',
                render: (value) => value || '-'
              },
              {
                title: 'Durum',
                key: 'status',
                render: (value, apt) => {
                  const status = (apt.status === 2 || apt.status === 'Confirmed')
                    ? 'statusConfirmed'
                    : (apt.status === 1 || apt.status === 'Scheduled')
                      ? 'statusScheduled'
                      : (apt.status === 3 || apt.status === 'Completed')
                        ? 'statusCompleted'
                        : (apt.status === 4 || apt.status === 'Cancelled')
                          ? 'statusCancelled'
                          : 'statusDefault';
                  return (
                    <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[status]}`}>
                      {apt.statusDisplay || ''}
                    </span>
                  );
                }
              }
            ]}
            data={upcomingAppointments.map(apt => ({
              ...apt,
              id: apt.appointmentId
            }))}
            emptyMessage="Yaklaşan randevu yok."
            hover={true}
            actions={false}
          />
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