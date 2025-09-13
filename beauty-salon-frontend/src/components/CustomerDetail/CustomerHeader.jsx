import React from 'react';
import styles from './customerDetail.module.css';

const CustomerHeader = ({ customer, stats }) => {
  if (!customer || !stats) return null;

  const formatCurrency = (amount) => {
    return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={styles.customerHeader}>
      <div className={styles.customerName}>
        {customer.fullName}
      </div>
      
      <div className={styles.customerContact}>
        {customer.phoneNumber && (
          <span>📞 {customer.phoneNumber}</span>
        )}
        {customer.email && (
          <span> | 📧 {customer.email}</span>
        )}
      </div>
      
      <div className={styles.quickInfo}>
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {stats.balance >= 0 ? formatCurrency(stats.balance) : `-${formatCurrency(stats.balance)}`}
          </div>
          <div className={styles.infoLabel}>Bakiye</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {formatCurrency(stats.debt)}
          </div>
          <div className={styles.infoLabel}>Borç</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {stats.remainingSessions}
          </div>
          <div className={styles.infoLabel}>Kalan Seans</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {stats.totalAppointments}
          </div>
          <div className={styles.infoLabel}>Toplam Randevu</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHeader;