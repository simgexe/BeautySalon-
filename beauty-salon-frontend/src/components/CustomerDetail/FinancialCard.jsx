import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../../api/api';
import Modal from '../common/Modal/Modal';
import { FormGroup, FormActions, Input } from '../common/Form';
import styles from './customerDetail.module.css';

const FinancialCard = ({ customerDetail, onUpdate }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDebtEditModal, setShowDebtEditModal] = useState(false);
  const [debtEditForm, setDebtEditForm] = useState({
    totalDebt: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!customerDetail) return null;

  const formatCurrency = (amount) => {
    return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePaymentAction = () => {
    // Payments sayfasına yönlendir
    navigate('/payments');
  };

  const handleDebtAction = () => {
    // Borç düzenleme modal'ını aç
    setDebtEditForm({
      totalDebt: customerDetail.totalDebt?.toString() || '0',
      notes: ''
    });
    setShowDebtEditModal(true);
  };

  const handleDebtEditSubmit = async () => {
    if (!debtEditForm.totalDebt) {
      alert('Borç miktarı gereklidir');
      return;
    }

    setIsSubmitting(true);
    try {
      // Borç düzenleme işlemi - burada manuel bir ödeme kaydı oluşturabiliriz
      // veya mevcut borcu güncelleyebiliriz
      const debtDifference = parseFloat(debtEditForm.totalDebt) - (customerDetail.totalDebt || 0);
      
      if (debtDifference !== 0) {
        // Borç farkı için ödeme kaydı oluştur
        await paymentService.create({
          customerId: customerDetail.customerId,
          amountPaid: Math.abs(debtDifference),
          paymentDate: new Date().toISOString(),
          paymentMethod: 1, // Nakit
          status: debtDifference > 0 ? 1 : 2, // Borç artışı: Pending, Borç azalışı: Paid
          paymentNotes: debtEditForm.notes || `Manuel borç düzenlemesi: ${debtDifference > 0 ? 'Borç artırıldı' : 'Borç azaltıldı'}`
        });
      }

      setShowDebtEditModal(false);
      if (onUpdate) {
        onUpdate();
      }
      alert('Borç durumu başarıyla güncellendi');
    } catch (error) {
      console.error('Borç düzenlenirken hata:', error);
      alert('Borç düzenlenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDebtEditModal = () => {
    setShowDebtEditModal(false);
    setDebtEditForm({
      totalDebt: '',
      notes: ''
    });
  };

  const { totalDebt, totalPaid, netDebt, paymentHistory } = customerDetail;

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
          <div className={`${styles.balanceItem} ${netDebt >= 0 ? styles.positive : styles.negative}`}>
            <div className={styles.balanceAmount}>
              {netDebt >= 0 ? formatCurrency(netDebt) : `-${formatCurrency(netDebt)}`}
            </div>
            <div>Kalan Borç</div>
          </div>
          <div className={`${styles.balanceItem} ${styles.negative}`}>
            <div className={styles.balanceAmount}>
              {formatCurrency(totalDebt)}
            </div>
            <div>Toplam Tutar</div>
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
            <span>Toplam Tutar:</span>
            <strong>{formatCurrency(totalDebt)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Ödenen:</span>
            <strong style={{ color: '#28a745' }}>
              {formatCurrency(totalPaid)}
            </strong>
          </div>
          <div className={styles.summaryRow}>
            <span><strong>Kalan Borç:</strong></span>
            <strong style={{ color: netDebt >= 0 ? '#28a745' : '#dc3545' }}>
              {netDebt >= 0 ? '+' : '-'} {formatCurrency(netDebt)}
            </strong>
          </div>
        </div>

        {paymentHistory && paymentHistory.length > 0 && (
          <div className={styles.paymentList}>
            <h5 style={{ color: '#721c24', marginBottom: '10px' }}>
              💳 Son Ödemeler
            </h5>
            {paymentHistory.slice(0, 5).map((payment, index) => (
              <div key={index} className={styles.paymentItem}>
                <div>
                  <strong>{payment.appointmentInfo || 'Genel Ödeme'}</strong>
                  <br />
                  <small>
                    {formatDate(payment.paymentDate)} - {payment.paymentMethod}
                  </small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: payment.status === 'Ödendi' ? '#28a745' : '#dc3545' }}>
                    {formatCurrency(payment.amountPaid)}
                  </strong>
                  <br />
                  <small style={{ color: '#666' }}>{payment.status}</small>
                </div>
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

      {/* Borç Düzenleme Modal */}
      <Modal
        isOpen={showDebtEditModal}
        onClose={closeDebtEditModal}
        title="Borç Durumunu Düzenle"
        size="medium"
        animation="slideUp"
      >
        <div className={styles.debtEditForm}>
          <FormGroup label="Toplam Borç Miktarı" required>
            <Input
              type="number"
              step="0.01"
              value={debtEditForm.totalDebt}
              onChange={(e) => setDebtEditForm({...debtEditForm, totalDebt: e.target.value})}
              placeholder="Borç miktarını giriniz"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Notlar">
            <Input
              type="text"
              value={debtEditForm.notes}
              onChange={(e) => setDebtEditForm({...debtEditForm, notes: e.target.value})}
              placeholder="Borç düzenleme notları (opsiyonel)"
              disabled={isSubmitting}
            />
          </FormGroup>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #e9ecef'
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Mevcut Durum:</h5>
            <p style={{ margin: '0', color: '#6c757d' }}>
              Toplam Borç: <strong>{formatCurrency(totalDebt || 0)}</strong><br/>
              Toplam Ödenen: <strong>{formatCurrency(totalPaid || 0)}</strong><br/>
              Net Borç: <strong style={{ color: netDebt >= 0 ? '#28a745' : '#dc3545' }}>
                {netDebt >= 0 ? '+' : '-'} {formatCurrency(netDebt || 0)}
              </strong>
            </p>
          </div>

          <FormActions
            onCancel={closeDebtEditModal}
            onSubmit={handleDebtEditSubmit}
            submitText="Borcu Güncelle"
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
      </Modal>
    </div>
  );
};

export default FinancialCard;