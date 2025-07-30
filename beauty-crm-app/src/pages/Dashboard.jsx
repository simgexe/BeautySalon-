import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, appointmentService, paymentService } from '../api/api';

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
      // API'den verileri çek
      const [customersRes, appointmentsRes, paymentsRes] = await Promise.all([
        customerService.getAll(),
        appointmentService.getAll(),
        paymentService.getAll()
      ]);

      // Bugünün randevularını filtrele
      const today = new Date().toDateString();
      const todayAppointments = appointmentsRes.data.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === today
      );

      // Bu ayın ödemelerini hesapla
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

  const cards = [
    {
      label: 'Müşteriler',
      icon: '👥',
      path: '/customers',
      color: '#f8fafc',
      iconBg: '#e2e8f0'
    },
    {
      label: 'Randevular',
      icon: '📅',
      path: '/appointments',
      color: '#f0f9ff',
      iconBg: '#dbeafe'
    },
    {
      label: 'Ödemeler',
      icon: '💳',
      path: '/payments',
      color: '#f0fdf4',
      iconBg: '#dcfce7'
    },
    {
      label: 'Hizmetler',
      icon: '💇‍♀️',
      path: '/services',
      color: '#f9fafb',
      iconBg: '#f3f4f6'    
    }
  ];

  if (stats.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <p style={{ color: '#666', fontSize: '18px' }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px 30px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#333',
          margin: 0
        }}>
          Beauty Salon
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#666', fontSize: '16px' }}>Admin</span>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#666',
            fontSize: '14px'
          }}>
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#333',
            margin: '0 0 10px 0'
          }}>
            Dashboard
          </h2>
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
            Güzellik salonu yönetim sistemi
          </p>
        </div>

        {/* Main Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '40px 30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: card.iconBg,
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                fontSize: '36px'
              }}>
                {card.icon}
              </div>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: '600', 
                color: '#333',
                margin: 0
              }}>
                {card.label}
              </h3>
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                👥
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 5px 0', 
                  color: '#666', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Toplam Müşteri
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>
                  {stats.totalClients}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                📅
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 5px 0', 
                  color: '#666', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Bugünün Randevuları
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>
                  {stats.todayAppointments}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#dcfce7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                💰
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 5px 0', 
                  color: '#666', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Aylık Gelir
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>
                  ₺{stats.monthlyRevenue.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;