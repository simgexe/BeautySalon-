import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Token'ı localStorage'dan yükle
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  // Login fonksiyonu
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ username, password });
      
      if (response.token) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        // LocalStorage'a kaydet
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return { success: true, user: response.user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Giriş yapılırken bir hata oluştu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register fonksiyonu
  const register = async (userData) => {
    try {
      setIsLoading(true);
      // Default olarak Customer rolü (RoleId = 3) ekle
      const registerData = { ...userData, roleId: 3 };
      const response = await authService.register(registerData);
      
      if (response.token) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        // LocalStorage'a kaydet
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return { success: true, user: response.user };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Kayıt olurken bir hata oluştu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout fonksiyonu
  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Local state'i temizle
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // LocalStorage'ı temizle
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  // Token doğrulama
  const validateToken = async () => {
    try {
      if (!token) return false;
      
      const response = await authService.validateToken();
      return response.isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Kullanıcı rolü kontrolü
  const hasRole = (roleName) => {
    return user?.roleName === roleName;
  };

  // Admin kontrolü
  const isAdmin = () => {
    return hasRole('Admin');
  };

  // Staff kontrolü
  const isStaff = () => {
    return hasRole('Staff') || isAdmin();
  };

  // Specialist kontrolü
  const isSpecialist = () => {
    return hasRole('Specialist') || isAdmin();
  };

  // Kategori bazlı erişim kontrolü
  const hasServiceCategory = (categoryName) => {
    if (isAdmin()) return true; // Admin her şeye erişebilir
    if (!user?.serviceCategories) return false;
    
    return user.serviceCategories.some(cat => 
      cat.categoryName.toLowerCase().includes(categoryName.toLowerCase())
    );
  };

  // Lazer kategorisi kontrolü
  const hasLaserCategory = () => {
    return hasServiceCategory('lazer') || hasServiceCategory('laser');
  };

  // Bölgesel incelme kategorisi kontrolü
  const hasRegionalThinningCategory = () => {
    return hasServiceCategory('bölgesel') || hasServiceCategory('incelme');
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    validateToken,
    hasRole,
    isAdmin,
    isStaff,
    isSpecialist,
    hasServiceCategory,
    hasLaserCategory,
    hasRegionalThinningCategory
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
