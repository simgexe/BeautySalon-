import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProtectedRoute.module.css';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Loading durumunda spinner göster
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Yükleniyor...</p>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rol kontrolü gerekliyse
  if (requiredRole && user?.roleName !== requiredRole) {
    // Admin olmayan kullanıcı admin sayfalarına erişmeye çalışıyorsa
    if (requiredRole === 'Admin' && user?.roleName !== 'Admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Staff olmayan kullanıcı staff sayfalarına erişmeye çalışıyorsa
    if (requiredRole === 'Staff' && !['Admin', 'Staff'].includes(user?.roleName)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
