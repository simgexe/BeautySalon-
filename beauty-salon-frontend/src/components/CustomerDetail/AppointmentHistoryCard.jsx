import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './customerDetail.module.css';

const AppointmentHistoryCard = ({ appointmentHistory, onUpdate }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!appointmentHistory) return null;

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
    
    return appointmentHistory.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getMonth() === thisMonth && aptDate.getFullYear() === thisYear;
    }).length;
  };

  // Son randevuyu al
  const getLastAppointment = () => {
    return appointmentHistory.length > 0 ? appointmentHistory[0] : null;
  };

  // Gelecek randevuları al
  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointmentHistory.filter(apt => new Date(apt.appointmentDate) >= now);
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNewAppointment = () => {
    // Appointments sayfasına yönlendir
    navigate('/appointments');
  };

  const lastAppointment = getLastAppointment();
  const upcomingAppointments = getUpcomingAppointments();
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
            {appointmentHistory.length}
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
            <span>Gelecek:</span>
            <span>
              {upcomingAppointments.length} randevu
            </span>
          </div>
        </div>
      </div>

      {/* Detaylı Görünüm */}
      <div className={styles.cardDetailed}>
        <h4 style={{ marginBottom: '15px', color: '#8B4B6B' }}>
          Son Randevular
        </h4>

        {appointmentHistory.length > 0 ? (
          <div className={styles.timeline}>
            {appointmentHistory.slice(0, 5).map((appointment, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineDate}>
                  {formatDateTime(appointment.appointmentDate)}
                </div>
                <div className={styles.timelineService}>
                  {appointment.serviceName}
                  {appointment.serviceCategory && ` - ${appointment.serviceCategory}`}
                </div>
                <div className={styles.timelineDetail}>
                  {appointment.customerServiceSessionId && (
                    <>Seans Paketi #{appointment.customerServiceSessionId} | </>
                  )}
                  {appointment.totalSessions > 0 && (
                    <>Seans: {appointment.totalSessions - appointment.remainingSessions}/{appointment.totalSessions} | </>
                  )}
                  {formatCurrency(appointment.agreedPrice)} - {appointment.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Henüz randevu geçmişi bulunmuyor
          </div>
        )}

        {upcomingAppointments.length > 0 && (
          <div className={styles.upcomingAppointments}>
            <h5 style={{ marginBottom: '10px', color: '#0c5460' }}>
              Gelecek Randevular
            </h5>
            <div style={{ fontSize: '0.9rem' }}>
              {upcomingAppointments.slice(0, 3).map((appointment, index) => (
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
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '15px' 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className={`${styles.actionBtn} ${styles.btnInfo}`}
            onClick={handleNewAppointment}
            style={{ width: '200px' }}
          >
            Yeni Randevu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHistoryCard;