// pages/Dashboard.jsx - Güncellenmiş
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, appointmentService, paymentService } from '../api/api';
import { testApiConnection } from '../utils/apiTest';
import { FaCalendarAlt, FaMoneyBillWave, FaLayerGroup, FaUserFriends, FaExclamationTriangle } from 'react-icons/fa';

// Layout ve Component import'ları
import Layout from '../components/Layout/Layout';
import { DashboardCard, StatCard } from '../components/DashboardCard';
import Modal from '../components/common/Modal/Modal';

// Sayfa özel stilleri
import dashboardStyles from './dashboard.module.css';

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
      console.log('🔄 Dashboard verileri yükleniyor...');
      
      // API bağlantısını test et
      const apiTest = await testApiConnection();
      console.log('📊 API Test Sonuçları:', apiTest);
      
      if (apiTest.errors.length > 0) {
        const errorMessage = apiTest.errors.length === 3 
          ? 'API sunucusu çalışmıyor. Lütfen API sunucusunu başlatın.'
          : `API bağlantı sorunu: ${apiTest.errors.join(', ')}`;
        setApiError(errorMessage);
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const [customersRes, appointmentsRes, paymentsRes] = await Promise.all([
        customerService.getAll(),
        appointmentService.getAll(),
        paymentService.getAll()
      ]);

      console.log('📈 API Verileri:', {
        customers: customersRes.data?.length || 0,
        appointments: appointmentsRes.data?.length || 0,
        payments: paymentsRes.data?.length || 0
      });

      const today = new Date().toDateString();
      const todayAppointments = appointmentsRes.data?.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === today
      ) || [];
      setTodaysAppointments(todayAppointments);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyPayments = paymentsRes.data?.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               payment.status === 'Paid';
      }) || [];

      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => 
        sum + (payment.amountPaid || 0), 0
      );

      setStats({
        totalClients: customersRes.data?.length || 0,
        todayAppointments: todayAppointments.length,
        monthlyRevenue: monthlyRevenue,
        isLoading: false
      });
      
      setApiError(null);
    } catch (error) {
      console.error('❌ Dashboard verilerini yüklerken hata:', error);
      const errorMessage = error.message.includes('fetch') || error.message.includes('bağlanılamıyor')
        ? 'API sunucusuna bağlanılamıyor. Lütfen API sunucusunun çalıştığından emin olun.'
        : `Veri yükleme hatası: ${error.message}`;
      setApiError(errorMessage);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const mainCards = [
    {
      label: 'Müşteriler',
      icon: <FaUserFriends size={50} />,
      path: '/customers',
      iconBg: 'rgba(156, 57, 64, 0.12)'
    },
    {
      label: 'Randevular',
      icon: <FaCalendarAlt size={50} />,
      path: '/appointments',
      iconBg: 'rgba(156, 57, 64, 0.12)'
    },
    {
      label: 'Ödemeler',
      icon: <FaMoneyBillWave size={50} />,
      path: '/payments',
      iconBg: 'rgba(156, 57, 64, 0.12)'
    },
    {
      label: 'Hizmetler',
      icon: <FaLayerGroup size={50} />,
      path: '/services',
      iconBg: 'rgba(156, 57, 64, 0.12)'    
    }
  ];

  const statCards = [
    {
      label: 'Toplam Müşteri',
      value: stats.totalClients,
      icon: <FaUserFriends size={50} />,
      iconBg: 'rgba(156, 57, 64, 0.12)',
      
    },
    {
      label: 'Bugünün Randevuları',
      value: stats.todayAppointments,
      icon: <FaCalendarAlt size={50} />,
      iconBg: 'rgba(156, 57, 64, 0.12)',
    
      onClick: () => setShowTodayModal(true)
    },
    {
      label: 'Aylık Gelir',
      value: `₺${stats.monthlyRevenue.toLocaleString('tr-TR')}`,
      icon: <FaMoneyBillWave size={50} />,
      iconBg: 'rgba(156, 57, 64, 0.12)',
      
    }
  ];

  // Loading state
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
        <p className={dashboardStyles.welcomeSubtitle}>
          İşletmenizi kolayca yönetin ve takip edin
        </p>
      </div>

      <div className={dashboardStyles.dashboardContainer}>
        {/* Main Navigation Cards - 2x2 grid */}
        <div className={dashboardStyles.dashboardGrid}>
          {mainCards.map((card, index) => (
            <DashboardCard
              key={index}
              label={card.label}
              icon={card.icon}
              iconBg={card.iconBg}
              onClick={() => navigate(card.path)}
              className={dashboardStyles.mainCard}
            />
          ))}
        </div>

        {/* Statistics Cards - 3'lü yan yana düzen */}
        <div className={dashboardStyles.statsBottomGrid}>
          {statCards.map((stat, index) => {
            const card = (
              <StatCard
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
               
                className={`${dashboardStyles.statCard} ${stat.className}`}
              />
            );
            return stat.onClick ? (
              <div key={index} onClick={stat.onClick} className={dashboardStyles.clickableStat}>
                {card}
              </div>
            ) : card;
          })}
        </div>
      </div>

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
                    {new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={dashboardStyles.todayInfo}>
                    <span className={dashboardStyles.todayCustomer}>{apt.customerName || 'Müşteri'}</span>
                    <span className={dashboardStyles.todayService}>{apt.serviceName || '-'}</span>
                  </div>
                </div>
                <span className={`${dashboardStyles.statusBadge} ${dashboardStyles['status' + (apt.status || '')]}`}>
                  {apt.status}
                </span>
              </div>
            ))
          )}
          <div className={dashboardStyles.todayActions}>
            <button
              type="button"
              className={dashboardStyles.gotoAppointmentsBtn}
              onClick={() => { setShowTodayModal(false); navigate('/appointments'); }}
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