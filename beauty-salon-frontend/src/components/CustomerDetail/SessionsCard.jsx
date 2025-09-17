import React, { useState } from 'react';
import { customerServiceSessionService } from '../../api/api';
import styles from './customerDetail.module.css';

const SessionsCard = ({ sessions, onUpdate, onSessionUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({
    remainingSessions: '',
    isActive: true
  });

  // Seans bilgilerini hesapla (sessions boş olsa bile)
  const totalSessions = sessions ? sessions.reduce((sum, session) => sum + session.totalSessions, 0) : 0;
  const usedSessions = sessions ? sessions.reduce((sum, session) => sum + (session.totalSessions - session.remainingSessions), 0) : 0;
  const remainingSessions = sessions ? sessions.reduce((sum, session) => sum + session.remainingSessions, 0) : 0;

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div 
        className={`${styles.functionCard} ${isExpanded ? styles.expanded : ''}`}
        onClick={handleCardClick}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleSection}>
            <span className={styles.cardIcon}>🔄</span>
            <h3 className={styles.cardTitle}>Seans Paketleri</h3>
          </div>
          <span className={styles.badge}>0</span>
          <button className={styles.expandBtn}>
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        {/* Özet Görünüm */}
        <div className={styles.cardSummary}>
          {/* Seans Bilgileri */}
          <div className={styles.sessionSummary}>
            <div className={styles.sessionItem}>
              <span className={styles.sessionLabel}>Toplam Seans:</span>
              <span className={styles.sessionValue}>0</span>
            </div>
            <div className={styles.sessionItem}>
              <span className={styles.sessionLabel}>Kullanılan:</span>
              <span className={styles.sessionValue}>0</span>
            </div>
            <div className={styles.sessionItem}>
              <span className={styles.sessionLabel}>Kalan:</span>
              <span className={styles.sessionValue}>0</span>
            </div>
          </div>
          
          <div className={styles.emptyState}>
            <p>Bu müşterinin seans paketi bulunmamaktadır.</p>
          </div>
        </div>

        {/* Detay Görünüm */}
        <div className={styles.cardDetailed}>
          <div className={styles.emptyState}>
            <p>Bu müşterinin seans paketi bulunmamaktadır.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleEditSession = (session) => {
    setEditingSession(session);
    setEditForm({
      remainingSessions: session.remainingSessions.toString(),
      isActive: session.isActive
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;

    try {
      await customerServiceSessionService.update(editingSession.customerServiceSessionId, {
        remainingSessions: parseInt(editForm.remainingSessions),
        isActive: editForm.isActive,
        completedDate: !editForm.isActive ? new Date().toISOString() : null
      });

      if (onSessionUpdate) {
        onSessionUpdate();
      }
      
      setEditingSession(null);
      alert('Seans paketi başarıyla güncellendi');
    } catch (error) {
      console.error('Seans paketi güncellenirken hata:', error);
      alert('Seans paketi güncellenirken hata oluştu');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Bu seans paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      await customerServiceSessionService.delete(sessionId);
      
      if (onSessionUpdate) {
        onSessionUpdate();
      }
      
      alert('Seans paketi başarıyla silindi');
    } catch (error) {
      console.error('Seans paketi silinirken hata:', error);
      if (error.message.includes('existing appointments')) {
        alert('Bu seans paketinin randevuları var. Önce randevuları silin veya iptal edin.');
      } else {
        alert('Seans paketi silinirken hata oluştu');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditForm({
      remainingSessions: '',
      isActive: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getProgressClass = (progressPercentage) => {
    if (progressPercentage >= 80) return 'high';
    if (progressPercentage >= 50) return 'medium';
    return 'low';
  };

  const getStatusColor = (isActive, remainingSessions) => {
    if (!isActive) return '#6c757d'; // Tamamlanmış
    if (remainingSessions === 0) return '#dc3545'; // Bitti
    if (remainingSessions <= 2) return '#ffc107'; // Az kaldı
    return '#28a745'; // Aktif
  };

  const getStatusText = (isActive, remainingSessions) => {
    if (!isActive) return 'Tamamlandı';
    if (remainingSessions === 0) return 'Bitti';
    if (remainingSessions <= 2) return 'Az Kaldı';
    return 'Aktif';
  };


  return (
    <div 
      className={`${styles.functionCard} ${isExpanded ? styles.expanded : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleSection}>
          <span className={styles.cardIcon}>🔄</span>
          <h3 className={styles.cardTitle}>Seans Paketleri</h3>
        </div>
        <span className={styles.badge}>{sessions.length}</span>
        <button className={styles.expandBtn}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {/* Özet Görünüm */}
      <div className={styles.cardSummary}>
        {/* Seans Bilgileri */}
        <div className={styles.sessionSummary}>
          <div className={styles.sessionItem}>
            <span className={styles.sessionLabel}>Toplam Seans:</span>
            <span className={styles.sessionValue}>{totalSessions}</span>
          </div>
          <div className={styles.sessionItem}>
            <span className={styles.sessionLabel}>Kullanılan:</span>
            <span className={styles.sessionValue}>{usedSessions}</span>
          </div>
          <div className={styles.sessionItem}>
            <span className={styles.sessionLabel}>Kalan:</span>
            <span className={styles.sessionValue}>{remainingSessions}</span>
          </div>
        </div>
        
        <ul className={styles.sessionSummaryList}>
          {sessions.slice(0, 5).map((session) => (
            <li key={session.customerServiceSessionId} className={styles.sessionSummaryListItem}>
              {session.serviceName}
            </li>
          ))}
          {sessions.length > 5 && (
            <li className={styles.sessionSummaryMore}>
              +{sessions.length - 5} paket daha...
            </li>
          )}
        </ul>
      </div>

      {/* Detay Görünüm */}
      <div className={styles.cardDetailed}>
        <div className={styles.sessionsList}>
        {sessions.map((session) => {
          const progressPercentage = session.progressPercentage || 0;
          const progressClass = getProgressClass(progressPercentage);
          const statusColor = getStatusColor(session.isActive, session.remainingSessions);
          const statusText = getStatusText(session.isActive, session.remainingSessions);
          
          return (
            <div key={session.customerServiceSessionId} className={`${styles.sessionItem} ${styles[progressClass]}`}>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionHeader}>
                  <h4>{session.serviceName}</h4>
                  {session.categoryName && (
                    <span className={styles.categoryBadge}>{session.categoryName}</span>
                  )}
                </div>
                
                <div className={styles.sessionProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={`${styles.progressFill} ${styles[progressClass]}`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <span className={styles.progressText}>{progressPercentage.toFixed(1)}%</span>
                </div>
                
                <div className={styles.sessionStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Toplam:</span>
                    <span className={styles.statValue}>{session.totalSessions}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Kullanılan:</span>
                    <span className={styles.statValue}>{session.usedSessions}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Kalan:</span>
                    <span className={styles.statValue}>{session.remainingSessions}</span>
                  </div>
                </div>
                
                <div className={styles.sessionMeta}>
                  <p className={styles.sessionDate}>
                    <span className={styles.metaLabel}>Başlangıç:</span> {formatDate(session.createdDate)}
                  </p>
                  {session.completedDate && (
                    <p className={styles.sessionDate}>
                      <span className={styles.metaLabel}>Tamamlanma:</span> {formatDate(session.completedDate)}
                    </p>
                  )}
                  <p className={styles.sessionStatus}>
                    <span className={styles.metaLabel}>Durum:</span> 
                    <span style={{ color: statusColor, fontWeight: 'bold' }}>
                      {statusText}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className={styles.sessionActions}>
                {editingSession && editingSession.customerServiceSessionId === session.customerServiceSessionId ? (
                  <div className={styles.editForm}>
                    <div className={styles.editFormRow}>
                      <label>Kalan Seans:</label>
                      <input
                        type="number"
                        min="0"
                        max={session.totalSessions}
                        value={editForm.remainingSessions}
                        onChange={(e) => setEditForm({...editForm, remainingSessions: e.target.value})}
                        className={styles.editInput}
                      />
                    </div>
                    <div className={styles.editFormRow}>
                      <label>
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                        />
                        Aktif
                      </label>
                    </div>
                    <div className={styles.editFormActions}>
                      <button 
                        onClick={handleSaveEdit}
                        className={styles.saveButton}
                      >
                        Kaydet
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className={styles.cancelButton}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.sessionInfoText}>
                      <p>📋 Bu seans paketi {session.totalSessions} seans içerir</p>
                      <p>🔄 Her randevu tamamlandığında seans otomatik düşer</p>
                      {session.remainingSessions === 0 && (
                        <p>✅ Tüm seanslar kullanıldı - yeni paket alınabilir</p>
                      )}
                    </div>
                    <div className={styles.sessionActionButtons}>
                      <button
                        onClick={() => handleEditSession(session)}
                        className={styles.editButton}
                        title="Seans paketini düzenle"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.customerServiceSessionId)}
                        className={styles.deleteButton}
                        title="Seans paketini sil"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default SessionsCard;