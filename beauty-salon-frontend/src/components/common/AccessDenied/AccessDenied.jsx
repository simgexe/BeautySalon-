import React from 'react';
import Layout from '../../Layout/Layout';
import styles from './AccessDenied.module.css';

const AccessDenied = ({ 
  title = "Erişim Reddedildi", 
  message = "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
  additionalInfo = null 
}) => {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.icon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        {additionalInfo && (
          <div className={styles.additionalInfo}>
            <h3>Önemli Bilgiler:</h3>
            <ul>
              {additionalInfo.map((info, index) => (
                <li key={index}>{info}</li>
              ))}
            </ul>
          </div>
        )}
        <div className={styles.actions}>
          <button 
            className={styles.backButton}
            onClick={() => window.history.back()}
          >
            Geri Dön
          </button>
          <button 
            className={styles.homeButton}
            onClick={() => window.location.href = '/'}
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AccessDenied;
