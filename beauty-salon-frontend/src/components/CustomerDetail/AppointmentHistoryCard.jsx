import React, { useState } from 'react';
import styles from './customerDetail.module.css';

const AppointmentHistoryCard = ({ appointmentHistory, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!appointmentHistory) return null;

  const { past = [], upcoming = [] } = appointmentHistory;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} - ${date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const formatCurrency = (amount) => {
    return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Bu ay yapılan randevu sayısını hesapla
  const getThisMonthAppointments = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return past.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getMonth() === thisMonth && aptDate.getFullYear() === thisYear;
    }).length;
  };

  // Son randevuyu al
  const getLastAppointment = () => {
    return past.length > 0 ? past[0] : null;
  };

  // Sonraki randevuyu al
  const getNextAppointment = () => {
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  // Ödeme durumunu göster
  const getPaymentStatusDisplay = (appointment) => {
    // Bu bilgi appointment verisinden gelecek
    if (appointment.paymentStatus === 'Paid') return 'Ödendi';
    if (appointment.paymentStatus === 'Pending') return 'Bekliyor';
    if (appointment.paymentStatus === 'Debt') return 'Borçlandı';
    return 'Bilinmiyor';
  };

  // Ödeme yöntemini göster
  const getPaymentMethodDisplay = (appointment) => {
    if (appointment.paymentMethod === 'Cash') return 'Nakit';
    if (appointment.paymentMethod === 'Card') return 'Kart';
    if (appointment.paymentMethod === 'Transfer') return 'Transfer';
    if (appointment.paymentMethod === 'Balance') return 'Bakiyeden';
    return 'Bilinmiyor';
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNewAppointment = () => {
    console.log('Yeni randevu oluştur');
    // onUpdate(); // Veri güncellemesi için
  };

  const handleViewDetails = () => {
    console.log('Geçmiş detayları göster');
  };

  const lastAppointment = getLastAppointment();
  const nextAppointment = getNextAppointment();
  const thisMonthCount = getThisMonthAppointments();

  return (
    <div 
      className={`${styles.functionCard} ${isExpanded ? styles.expanded : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleSection}>
          <div className={styles.cardIcon}>📅</div>
          <div className={styles.cardTitle}>Randevu Geçmişi</div>
        </div>
        <button className={styles.expandBtn}>
          ↓
        </button>
      </div>

      {/* Özet Görünüm */}
      <div className={styles.cardSummary}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div className={styles.statsNumber}>
            {past.length + upcoming.length}
          </div>
          <div style={{ color: '#666', marginBottom: '15px' }}>
            Toplam Randevu
          </div>
        </div>

        <div className={styles.statsInfo}>
          <div className={styles.statsRow}>
            <span>Son randevu:</span>
            <span>
              {lastAppointment ? formatDate(lastAppointment.appointmentDate) : 'Henüz yok'}
            </span>
          </div>
          <div className={styles.statsRow}>
            <span>Bu ay:</span>
            <span>{thisMonthCount} randevu</span>
          </div>
          <div className={styles.statsRow}>
            <span>Sonraki:</span>
            <span>
              {nextAppointment ? formatDate(nextAppointment.appointmentDate) : 'Planlanmadı'}
            </span>
          </div>
        </div>
      </div>

      {/* Detaylı Görünüm */}
      <div className={styles.cardDetailed}>
        <h4 style={{ marginBottom: '15px', color: '#8B4B6B' }}>
          Son Randevular
        </h4>

        {past.length > 0 ? (
          <div className={styles.timeline}>
            {past.slice(0, 5).map((appointment, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineDate}>
                  {formatDateTime(appointment.appointmentDate)}
                </div>
                <div className={styles.timelineService}>
                  {appointment.serviceName}
                  {appointment.categoryName && ` - ${appointment.categoryName}`}
                </div>
                <div className={styles.timelineDetail}>
                  {appointment.totalSessions > 1 && (
                    <>Seans {appointment.totalSessions - appointment.remainingSessions + 1}/{appointment.totalSessions} | </>
                  )}
                  {formatCurrency(appointment.agreedPrice)} ({getPaymentStatusDisplay(appointment)})
                  {appointment.paymentMethod && ` - ${getPaymentMethodDisplay(appointment)}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Henüz randevu geçmişi bulunmuyor
          </div>
        )}

        {upcoming.length > 0 && (
          <div className={styles.upcomingAppointments}>
            <h5 style={{ marginBottom: '10px', color: '#0c5460' }}>
              Gelecek Randevular
            </h5>
            <div style={{ fontSize: '0.9rem' }}>
              {upcoming.slice(0, 3).map((appointment, index) => (
                <div key={index} style={{ marginBottom: index < 2 ? '8px' : '0' }}>
                  <strong>{formatDateTime(appointment.appointmentDate)}</strong> - {appointment.serviceName}
                  {appointment.agreedPrice && (
                    <span style={{ color: '#666', marginLeft: '8px' }}>
                      ({formatCurrency(appointment.agreedPrice)})
                    </span>
                  )}
                </div>
              ))}
            </div>
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
            className={`${styles.actionBtn} ${styles.btnInfo}`}
            onClick={handleNewAppointment}
          >
            Yeni Randevu
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handleViewDetails}
          >
            Geçmiş Detay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHistoryCard;