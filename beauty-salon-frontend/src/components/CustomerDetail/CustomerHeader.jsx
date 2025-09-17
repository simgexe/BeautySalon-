import React from 'react';
import styles from './customerDetail.module.css';

const CustomerHeader = ({ customer }) => {
  if (!customer) return null;

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
        {customer.notes && (
          <span> |  {customer.notes}</span>
        )}
      </div>
      
      <div className={styles.quickInfo}>
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {customer.netDebt >= 0 ? formatCurrency(customer.netDebt) : `-${formatCurrency(customer.netDebt)}`}
          </div>
          <div className={styles.infoLabel}>Net Borç</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {formatCurrency(customer.totalDebt)}
          </div>
          <div className={styles.infoLabel}>Toplam Borç</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {formatCurrency(customer.totalPaid)}
          </div>
          <div className={styles.infoLabel}>Toplam Ödenen</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {customer.remainingSessions}
          </div>
          <div className={styles.infoLabel}>Kalan Seans</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {customer.totalSessions}
          </div>
          <div className={styles.infoLabel}>Toplam Seans</div>
        </div>
        
        <div className={styles.infoBox}>
          <div className={styles.infoValue}>
            {customer.totalAppointments}
          </div>
          <div className={styles.infoLabel}>Toplam Randevu</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHeader;