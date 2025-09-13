import React from 'react';
import styles from './customerDetail.module.css';

const SessionsCard = ({ activeSessions, onUseSession }) => {
  if (!activeSessions || activeSessions.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>🔄 Aktif Seanslar</h3>
        </div>
        <div className={styles.emptyState}>
          <p>Bu müşterinin aktif seansı bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3> Aktif Seanslar</h3>
        <span className={styles.badge}>{activeSessions.length}</span>
      </div>
      <div className={styles.sessionsList}>
        {activeSessions.map((session) => (
          <div key={session.appointmentId} className={styles.sessionItem}>
            <div className={styles.sessionInfo}>
              <h4>{session.serviceName}</h4>
              <p className={styles.sessionDetails}>
                {session.remainingSessions} / {session.totalSessions} seans kaldı
              </p>
              <p className={styles.sessionDate}>
                Başlangıç: {new Date(session.appointmentDate).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div className={styles.sessionActions}>
              <button
                onClick={() => onUseSession(session.appointmentId)}
                className={styles.useSessionBtn}
                disabled={session.remainingSessions <= 0}
              >
                Seans Kullan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionsCard;