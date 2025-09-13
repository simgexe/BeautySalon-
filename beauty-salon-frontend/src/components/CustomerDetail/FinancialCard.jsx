import React, { useState } from 'react';
import styles from './customerDetail.module.css';

const FinancialCard = ({ balance, payments, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!balance) return null;

  const formatCurrency = (amount) => {
    return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Borç detaylarını hesapla (ödenmemiş randevular)
  const calculateDebtDetails = () => {
    if (!payments) return [];

    return payments
      .filter(payment => payment.status === 'Pending' || payment.status === 'Cancelled')
      .slice(0, 5) // Son 5 borç
      .map(payment => ({
        serviceName: payment.serviceName || 'Genel Ödeme',
        amount: payment.amountPaid,
        date: payment.paymentDate,
        appointmentDate: payment.appointmentDate
      }));
  };

  const debtDetails = calculateDebtDetails();
  const currentBalance = balance.currentBalance || 0;
  const totalDebt = balance.totalDebt || 0;
  const totalPaid = balance.totalPaid || 0;
  const totalAgreed = balance.totalAgreed || 0;

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePaymentAction = () => {
    // Ödeme alma modal'ını aç
    console.log('Ödeme al butonu tıklandı');
    // onUpdate(); // Veri güncellemesi için
  };

  const handleDebtAction = () => {
    // Borç düzenleme modal'ını aç
    console.log('Borç düzenle butonu tıklandı');
    // onUpdate(); // Veri güncellemesi için
  };

  return (
    <div 
      className={`${styles.functionCard} ${isExpanded ? styles.expanded : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleSection}>
          <div className={styles.cardIcon}>💰</div>
          <div className={styles.cardTitle}>Finansal Durum</div>
        </div>
        <button className={styles.expandBtn}>
          ↓
        </button>
      </div>

      {/* Özet Görünüm */}
      <div className={styles.cardSummary}>
        <div className={styles.balanceGrid}>
          <div className={`${styles.balanceItem} ${currentBalance >= 0 ? styles.positive : styles.negative}`}>
            <div className={styles.balanceAmount}>
              {currentBalance >= 0 ? formatCurrency(currentBalance) : `-${formatCurrency(currentBalance)}`}
            </div>
            <div>Bakiye</div>
          </div>
          <div className={`${styles.balanceItem} ${styles.negative}`}>
            <div className={styles.balanceAmount}>
              {formatCurrency(totalDebt)}
            </div>
            <div>Borç</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
          Detaylar için tıklayın
        </div>
      </div>

      {/* Detaylı Görünüm */}
      <div className={styles.cardDetailed}>
        <h4 style={{ marginBottom: '15px', color: '#8B4B6B' }}>
          Detaylı Mali Durum
        </h4>

        <div className={styles.summaryTable}>
          <div className={styles.summaryRow}>
            <span>Toplam Hizmet Bedeli:</span>
            <strong>{formatCurrency(totalAgreed)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Toplam Ödenen:</span>
            <strong style={{ color: '#28a745' }}>
              {formatCurrency(totalPaid)}
            </strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Mevcut Bakiye:</span>
            <strong style={{ color: currentBalance >= 0 ? '#28a745' : '#dc3545' }}>
              {currentBalance >= 0 ? '+' : '-'} {formatCurrency(currentBalance)}
            </strong>
          </div>
          <div className={styles.summaryRow}>
            <span><strong>Net Borç:</strong></span>
            <strong style={{ color: '#dc3545' }}>
              {formatCurrency(totalDebt)}
            </strong>
          </div>
        </div>

        {debtDetails.length > 0 && (
          <div className={styles.debtList}>
            <h5 style={{ color: '#721c24', marginBottom: '10px' }}>
              ⚠️ Borç Detayları
            </h5>
            {debtDetails.map((debt, index) => (
              <div key={index} className={styles.debtItem}>
                <div>
                  <strong>{debt.serviceName}</strong>
                  <br />
                  <small>
                    {debt.appointmentDate ? 
                      formatDate(debt.appointmentDate) : 
                      formatDate(debt.date)
                    }
                  </small>
                </div>
                <strong>{formatCurrency(debt.amount)}</strong>
              </div>
            ))}
          </div>
        )}

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px', 
            marginTop: '15px' 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={handlePaymentAction}
          >
            Ödeme Al
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.btnWarning}`}
            onClick={handleDebtAction}
          >
            Borç Düzenle
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialCard;