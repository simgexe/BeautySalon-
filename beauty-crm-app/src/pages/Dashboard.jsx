// pages/Dashboard.jsx - Refactored with Dashboard Components
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, appointmentService, paymentService } from '../api/api';
import {FaCalendarAlt,FaMoneyBillWave,FaLayerGroup,FaUserFriends} from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import { DashboardCard, StatCard, DashboardHeader } from '../components/dashboard/DashoardCard';
import dashboardStyles from '../components/dashboard/DashboardCard.module.css';
import commonStyles from '../styles/common.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    isLoading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [customersRes, appointmentsRes, paymentsRes] = await Promise.all([
        customerService.getAll(),
        appointmentService.getAll(),
        paymentService.getAll()
      ]);

      const today = new Date().toDateString();
      const todayAppointments = appointmentsRes.data.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === today
      );

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyPayments = paymentsRes.data.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               payment.status === 'Paid';
      });

      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => 
        sum + payment.amountPaid, 0
      );

      setStats({
        totalClients: customersRes.data.length,
        todayAppointments: todayAppointments.length,
        monthlyRevenue: monthlyRevenue,
        isLoading: false
      });
    } catch (error) {
      console.error('Dashboard verilerini yüklerken hata:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const mainCards = [
    {
      label: 'Müşteriler',
      icon: <FaUserFriends size={50} />,
      path: '/customers',
      iconBg: '#e2e8f0'
    },
    {
      label: 'Randevular',
      icon: <FaCalendarAlt size={50} />,
      path: '/appointments',
      iconBg: '#dbeafe'
    },
    {
      label: 'Ödemeler',
      icon: <FaMoneyBillWave size={50} />,
      path: '/payments',
      iconBg: '#dcfce7'
    },
    {
      label: 'Hizmetler',
      icon: <FaLayerGroup size={50} />,
      path: '/services',
      iconBg: '#f3f4f6'    
    }
  ];

  const statCards = [
    {
      label: 'Toplam Müşteri',
      value: stats.totalClients,
      icon: <FaUserFriends size={50} />,
      iconBg: '#e2e8f0'
    },
    {
      label: 'Bugünün Randevuları',
      value: stats.todayAppointments,
      icon: <FaCalendarAlt size={50} />,
      iconBg: '#dbeafe'
    },
    {
      label: 'Aylık Gelir',
      value: `₺${stats.monthlyRevenue.toLocaleString('tr-TR')}`,
      icon: <FaMoneyBillWave size={50} />,
      iconBg: '#dcfce7'
    }
  ];

  if (stats.isLoading) {
    return (
      <Layout>
        <div className={commonStyles.loading}>
          <p style={{ color: '#666', fontSize: '18px' }}>Yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={dashboardStyles.dashboardContainer}>
        {/* Dashboard Header */}
        <DashboardHeader
          title="Dashboard"
          subtitle="Güzellik salonu yönetim sistemi"
        />

        {/* Main Navigation Cards */}
        <div className={dashboardStyles.dashboardGrid}>
          {mainCards.map((card, index) => (
            <DashboardCard
              key={index}
              label={card.label}
              icon={card.icon}
              iconBg={card.iconBg}
              onClick={() => navigate(card.path)}
            />
          ))}
        </div>

        {/* Statistics Cards */}
        <div className={dashboardStyles.statsGrid}>
          {statCards.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconBg={stat.iconBg}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;