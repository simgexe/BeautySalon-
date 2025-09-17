import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../api/api';
import Layout from '../components/Layout/Layout';
import CustomerHeader from '../components/CustomerDetail/CustomerHeader';
import FinancialCard from '../components/CustomerDetail/FinancialCard';
import SessionsCard from '../components/CustomerDetail/SessionsCard';
import AppointmentHistoryCard from '../components/CustomerDetail/AppointmentHistoryCard';
import styles from '../components/CustomerDetail/customerDetail.module.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customerDetail, setCustomerDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Veri yükleme
  const fetchCustomerData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Yeni CustomerDetailDto'yu kullan
      const response = await customerService.getById(id);
      setCustomerDetail(response);

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

  // Yeniden veri yükleme fonksiyonu (alt componentler için)
  const handleDataUpdate = () => {
    fetchCustomerData();
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

  if (!customerDetail) {
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
          customer={customerDetail}
        />

        {/* Kart grid sistemi */}
        <div className={styles.cardsGrid}>
          <FinancialCard 
            customerDetail={customerDetail}
            onUpdate={handleDataUpdate}
          />
          
          <SessionsCard 
            sessions={customerDetail.sessions}
            onUpdate={handleDataUpdate}
            onSessionUpdate={handleDataUpdate}
          />
          
          <AppointmentHistoryCard 
            appointmentHistory={customerDetail.appointmentHistory}
            onUpdate={handleDataUpdate}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDetail;