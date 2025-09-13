import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService, paymentService, appointmentService } from '../api/api';
import Layout from '../components/Layout/Layout';
import CustomerHeader from '../components/CustomerDetail/CustomerHeader';
import FinancialCard from '../components/CustomerDetail/FinancialCard';
import SessionsCard from '../components/CustomerDetail/SessionsCard';
import AppointmentHistoryCard from '../components/CustomerDetail/AppointmentHistoryCard';
import styles from '../components/CustomerDetail/customerDetail.module.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Veri yükleme
  const fetchCustomerData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Paralel olarak tüm verileri çek
      const [
        customerResponse, 
        appointmentsResponse, 
        paymentsResponse, 
        balanceResponse,
        activeSessionsResponse
      ] = await Promise.all([
        customerService.getById(id),
        customerService.getCustomerAppointments ? customerService.getCustomerAppointments(id) : appointmentService.getCustomerAppointments(id),
        customerService.getCustomerPayments ? customerService.getCustomerPayments(id) : paymentService.getCustomerPayments(id),
        paymentService.getCustomerBalance(id),
        customerService.getActiveSessions(id)
      ]);

      setCustomer(customerResponse);
      setAppointments(appointmentsResponse || []);
      setPayments(paymentsResponse || []);
      setActiveSessions(activeSessionsResponse || []);
      setBalance({
        currentBalance: (balanceResponse.totalPaidAmount || 0) - (balanceResponse.totalAgreedAmount || 0),
        totalDebt: balanceResponse.remainingDebt || 0,
        totalPaid: balanceResponse.totalPaidAmount || 0,
        totalAgreed: balanceResponse.totalAgreedAmount || 0
      });

    } catch (error) {
      console.error('Müşteri verileri yüklenirken hata:', error);
      setError('Müşteri bilgileri yüklenirken bir hata oluştu.');
      
      // 404 ise müşteriler sayfasına yönlendir
      if (error.response?.status === 404) {
        navigate('/customers', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]); 

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id, fetchCustomerData]);

  // İstatistikleri hesapla
  const calculateStats = () => {
    if (!customer || !appointments || !payments) return null;

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'Completed').length;
    const remainingSessions = appointments.reduce((sum, apt) => sum + (apt.remainingSessions || 0), 0);
    
    return {
      totalAppointments,
      completedAppointments,
      remainingSessions,
      balance: balance?.currentBalance || 0,
      debt: balance?.totalDebt || 0
    };
  };

  // Randevu geçmişini hazırla
  const prepareAppointmentHistory = () => {
    if (!appointments) return { past: [], upcoming: [] };

    const now = new Date();
    const past = appointments
      .filter(apt => new Date(apt.appointmentDate) < now)
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
      .slice(0, 10); // Son 10 randevu

    const upcoming = appointments
      .filter(apt => new Date(apt.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    return { past, upcoming };
  };

  // Yeniden veri yükleme fonksiyonu (alt componentler için)
  const handleDataUpdate = () => {
    fetchCustomerData();
  };

  // Seans kullanma fonksiyonu
  const handleUseSession = async (appointmentId) => {
    try {
      await appointmentService.completeSession(appointmentId);
      // Verileri yeniden yükle
      await fetchCustomerData();
    } catch (error) {
      console.error('Seans kullanılırken hata:', error);
      alert('Seans kullanılırken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <Layout className={styles.customerDetailLayout}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Müşteri bilgileri yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout className={styles.customerDetailLayout}>
        <div className={styles.errorContainer}>
          <h2>Hata</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/customers')}
            className={styles.backButton}
          >
            Müşteriler Listesine Dön
          </button>
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout className={styles.customerDetailLayout}>
        <div className={styles.notFoundContainer}>
          <h2>Müşteri Bulunamadı</h2>
          <p>Aradığınız müşteri bulunamadı.</p>
          <button 
            onClick={() => navigate('/customers')}
            className={styles.backButton}
          >
            Müşteriler Listesine Dön
          </button>
        </div>
      </Layout>
    );
  }

  const stats = calculateStats();
  const appointmentHistory = prepareAppointmentHistory();

  return (
    <Layout className={styles.customerDetailLayout}>
      <div className={styles.container}>
        {/* Geri butonu */}
        <button 
          onClick={() => navigate('/customers')}
          className={styles.backButton}
        >
          ← Müşteriler Listesi
        </button>

        {/* Müşteri başlık bilgileri */}
        <CustomerHeader 
          customer={customer}
          stats={stats}
        />

        {/* Kart grid sistemi */}
        <div className={styles.cardsGrid}>
          <FinancialCard 
            balance={balance}
            payments={payments}
            onUpdate={handleDataUpdate}
          />
          
          <SessionsCard 
            activeSessions={activeSessions}
            onUseSession={handleUseSession}
          />
          
          <AppointmentHistoryCard 
            appointmentHistory={appointmentHistory}
            onUpdate={handleDataUpdate}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDetail;