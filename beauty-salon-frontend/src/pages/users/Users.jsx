import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, serviceCategoryService } from '../../api/api';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Table from '../../components/common/Table/Table';
import Modal from '../../components/common/Modal/Modal';
import { FormGroup, FormRow, FormActions, Input } from '../../components/common/Form';
import AccessDenied from '../../components/common/AccessDenied/AccessDenied';

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    roleIds: [],
    serviceCategoryIds: [],
    isActive: true
  });

  // Form'u temizle
  const resetForm = () => {
    setFormData({
      username: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      roleIds: [],
      serviceCategoryIds: [],
      isActive: true
    });
    setFormErrors({});
    setSelectedUser(null);
  };
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Şifre sıfırlama state'leri
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
      loadRoles();
      loadCategories();
    }
  }, [isAdmin]);

  // Form data'yı user'a göre güncelle
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        username: selectedUser.username || '',
        phoneNumber: selectedUser.phoneNumber || '',
        password: '',
        confirmPassword: '',
        firstName: selectedUser.firstName || '',
        lastName: selectedUser.lastName || '',
        roleIds: selectedUser.roles?.map(r => r.roleId) || [],
        serviceCategoryIds: selectedUser.serviceCategories?.map(c => c.categoryId) || [],
        isActive: selectedUser.isActive !== undefined ? selectedUser.isActive : true
      });
    } else {
      setFormData({
        username: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        roleIds: [],
        serviceCategoryIds: [],
        isActive: true
      });
    }
    setFormErrors({});
  }, [selectedUser]);

  // Admin yetki kontrolü
  if (!isAdmin()) {
    return (
      <AccessDenied 
        title="Erişim Reddedildi"
        message="Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece admin kullanıcılar kullanıcı yönetimi sayfasına erişebilir."
        additionalInfo={[
          "Kullanıcı yönetimi sadece admin yetkisine sahip kullanıcılar tarafından yapılabilir.",
          "Yeni kullanıcı eklemek, mevcut kullanıcıları düzenlemek ve silmek için admin yetkisi gereklidir.",
          "Kullanıcı rolleri ve hizmet kategorileri sadece admin tarafından atanabilir."
        ]}
      />
    );
  }

  const loadRoles = async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Roller yüklenirken hata:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await serviceCategoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    }
  };

  const handleAddUser = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    // Form'u kullanıcı bilgileriyle doldur
    setFormData({
      username: user.username || '',
      phoneNumber: user.phoneNumber || '',
      password: '', // Edit'te şifre boş
      confirmPassword: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roleIds: user.roles?.map(r => r.roleId) || [],
      serviceCategoryIds: user.serviceCategories?.map(sc => sc.categoryId) || [],
      isActive: user.isActive
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Kullanıcı silinirken bir hata oluştu');
    }
  };

  const handleResetPassword = (user) => {
    setResetUser(user);
    setResetPassword('');
    setShowResetModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!resetPassword || resetPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsResetLoading(true);
    try {
      const { authService } = await import('../../api/api');
      await authService.resetPassword(resetUser.username, resetPassword);
      alert('Şifre başarıyla sıfırlandı');
      setShowResetModal(false);
      setResetUser(null);
      setResetPassword('');
    } catch (err) {
      alert(err.message || 'Şifre sıfırlanırken bir hata oluştu');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Gerçek zamanlı validasyon
    let error = '';
    if (name === 'username') {
      error = validateUsername(value);
    } else if (name === 'phoneNumber') {
      error = validatePhoneNumber(value);
    } else if (name === 'email') {
      error = validateEmail(value);
    } else if (name === 'password') {
      error = validatePassword(value, !selectedUser); // Yeni kullanıcı için zorunlu
    } else if (name === 'confirmPassword') {
      error = value !== formData.password ? 'Şifreler eşleşmiyor' : null;
    }

    // Hata mesajını güncelle
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));

    if (formErrors.roleIds) {
      setFormErrors(prev => ({ ...prev, roleIds: '' }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      serviceCategoryIds: prev.serviceCategoryIds.includes(categoryId)
        ? prev.serviceCategoryIds.filter(id => id !== categoryId)
        : [...prev.serviceCategoryIds, categoryId]
    }));
  };

  // Telefon numarası validasyon fonksiyonu
  const validatePhoneNumber = (phone) => {
    // Türkiye telefon numarası formatları: 05551234567, 5551234567, +905551234567
    const phoneRegex = /^(\+90|0)?5\d{9}$/;
    const cleanPhone = phone.replace(/\s/g, ''); // Boşlukları temizle
    
    if (!cleanPhone) {
      return 'Telefon numarası gereklidir';
    }
    
    if (!phoneRegex.test(cleanPhone)) {
      return 'Geçerli bir Türkiye telefon numarası giriniz (örn: 0555 123 45 67)';
    }
    
    return null;
  };

  // Email validasyon fonksiyonu
  const validateEmail = (email) => {
    if (!email) return null; // Email opsiyonel
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Geçerli bir email adresi giriniz';
    }
    return null;
  };

  // Şifre validasyon fonksiyonu
  const validatePassword = (password, isRequired = false) => {
    if (!password) {
      return isRequired ? 'Şifre gereklidir' : null;
    }
    
    if (password.length < 6) {
      return 'Şifre en az 6 karakter olmalıdır';
    }
    
    if (password.length > 50) {
      return 'Şifre en fazla 50 karakter olabilir';
    }
    
    // Güçlü şifre kontrolü (opsiyonel)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (password.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers) {
      return null; // Güçlü şifre
    }
    
    return null; // Temel şifre yeterli
  };

  // Kullanıcı adı validasyon fonksiyonu
  const validateUsername = (username) => {
    if (!username.trim()) {
      return 'Kullanıcı adı gereklidir';
    }
    
    if (username.length < 3) {
      return 'Kullanıcı adı en az 3 karakter olmalıdır';
    }
    
    if (username.length > 20) {
      return 'Kullanıcı adı en fazla 20 karakter olabilir';
    }
    
    // Sadece harf, rakam ve alt çizgi kabul et
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    // Kullanıcı adı validasyonu
    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      newErrors.username = usernameError;
    }

    // Telefon numarası validasyonu
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) {
      newErrors.phoneNumber = phoneError;
    }

    // Şifre validasyonu
    const passwordError = validatePassword(formData.password, !selectedUser);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    // Şifre tekrarı validasyonu
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (formData.roleIds.length === 0) {
      newErrors.roleIds = 'En az bir rol seçmelisiniz';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsFormLoading(true);

    try {
      const userData = {
        username: formData.username.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        roleIds: formData.roleIds,
        serviceCategoryIds: formData.serviceCategoryIds,
        isActive: formData.isActive
      };

      // Şifre eklenmişse dahil et
      if (formData.password) {
        userData.password = formData.password;
      }

      if (selectedUser) {
        await userService.updateUser(selectedUser.userId, userData);
      } else {
        await userService.createUser(userData);
      }

    setShowModal(false);
    resetForm();
    await loadUsers();
    } catch (err) {
      setFormErrors({ 
        general: err.message || 'Kullanıcı kaydedilirken bir hata oluştu' 
      });
    } finally {
      setIsFormLoading(false);
    }
  };


  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm)
  );

  if (!isAdmin()) {
    return (
      <Layout>
        <div className="pageContainer">
          <div className="card">
            <h2>Erişim Engellendi</h2>
            <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pageContainer">
        <div className="card card-gradient mb-md">
          <div className="section-header">
            <div>
              <h2 className="section-title">Kullanıcı Yönetimi</h2>
              <p className="section-subtitle">Sistem kullanıcılarını yönetin</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FormGroup style={{ margin: 0, minWidth: '300px' }}>
            <Input
              type="text"
              placeholder="Kullanıcı ara (ad, soyad, telefon...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>
              <AddButton onClick={handleAddUser}>+ Yeni Kullanıcı</AddButton>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alertError">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <Table
          title="Kullanıcı Listesi"
          showWrapper={true}
          showRecordCount={true}
          columns={[
              {
                key: 'username',
                title: 'Kullanıcı Adı',
                render: (value) => <strong>{value}</strong>
              },
              {
                key: 'fullName',
                title: 'Ad Soyad',
                render: (value, user) => `${user.firstName} ${user.lastName}`
              },
              { key: 'phoneNumber', title: 'Telefon' },
              {
                key: 'roles',
                title: 'Roller',
                render: (roles) => (
                  <div>
                    {roles.map(role => (
                      <span key={role.roleId} className="badge badge-primary">
                        {role.name}
                      </span>
                    ))}
                  </div>
                )
              },
              {
                key: 'serviceCategories',
                title: 'Uzmanlık Kategorileri',
                render: (categories) => (
                  categories && categories.length > 0 ? (
                    <div>
                      {categories.map(cat => (
                        <span key={cat.categoryId} className="badge badge-secondary">
                          {cat.categoryName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  )
                )
              },
              {
                key: 'isActive',
                title: 'Durum',
                render: (isActive) => (
                  <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                    {isActive ? 'Aktif' : 'Pasif'}
                  </span>
                )
              },
              {
                key: 'lastLoginAt',
                title: 'Son Giriş',
                render: (value) => value 
                  ? new Date(value).toLocaleString('tr-TR', {
                      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                    })
                  : 'Hiç giriş yapmadı'
              }
            ]}
            data={filteredUsers.map(user => ({ ...user, id: user.userId }))}
            isLoading={isLoading}
            onEdit={(user) => handleEditUser(user)}
            onDelete={(user) => handleDeleteUser(user.userId)}
            actions={true}
            editButtonText="Düzenle"
            deleteButtonText="Sil"
            showDeleteButton={(user) => user.username !== 'admin'}
            customActions={(user) => (
              <button
                onClick={() => handleResetPassword(user)}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}
                title="Şifre Sıfırla"
              >
                🔑 Sıfırla
              </button>
            )}
            emptyMessage={searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kullanıcı bulunmamaktadır'}
            hover={true}
          />

        <Modal
          isOpen={showModal}
          title={selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          size="medium"
          animation="slideUp"
        >
          <form onSubmit={handleFormSubmit} style={{ padding: '20px' }}>
            {formErrors.general && (
              <div className="alert alertError">
                <span>⚠️</span>
                {formErrors.general}
              </div>
            )}

            <FormRow gap="medium">
              <FormGroup 
                label="Kullanıcı Adı" 
                required 
                error={formErrors.username}
              >
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  placeholder="Kullanıcı adı"
                  disabled={isFormLoading}
                  error={formErrors.username}
                  maxLength={20}
                  autoFocus={!selectedUser}
                />
                {!formErrors.username && formData.username && formData.username.length >= 3 && (
                  <small style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                    ✓ Geçerli kullanıcı adı
                  </small>
                )}
              </FormGroup>

              <FormGroup 
                label="Telefon" 
                required 
                error={formErrors.phoneNumber}
              >
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  placeholder="0555 123 45 67"
                  disabled={isFormLoading}
                  error={formErrors.phoneNumber}
                  maxLength={15}
                />
                {!formErrors.phoneNumber && formData.phoneNumber && (
                  <small style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                    ✓ Geçerli telefon numarası
                  </small>
                )}
              </FormGroup>
            </FormRow>

            <FormRow gap="medium">
              <FormGroup 
                label="Ad" 
                required 
                error={formErrors.firstName}
              >
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  placeholder="Ad"
                  disabled={isFormLoading}
                  error={formErrors.firstName}
                />
              </FormGroup>

              <FormGroup 
                label="Soyad" 
                required 
                error={formErrors.lastName}
              >
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  placeholder="Soyad"
                  disabled={isFormLoading}
                  error={formErrors.lastName}
                />
              </FormGroup>
            </FormRow>

            <FormRow gap="medium">
              <FormGroup 
                label={`Şifre ${!selectedUser ? '' : '(Değiştirmek için doldurun)'}`}
                required={!selectedUser}
                error={formErrors.password}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="Şifre"
                  disabled={isFormLoading}
                  error={formErrors.password}
                  maxLength={50}
                  icon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isFormLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer',
                        opacity: isFormLoading ? 0.3 : 0.6,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = isFormLoading ? '0.3' : '0.6'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  }
                  iconPosition="right"
                />
                {!formErrors.password && formData.password && formData.password.length >= 6 && (
                  <small style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                    ✓ Geçerli şifre
                  </small>
                )}
              </FormGroup>

              <FormGroup 
                label="Şifre Tekrarı" 
                required={!selectedUser}
                error={formErrors.confirmPassword}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  placeholder="Şifre tekrarı"
                  disabled={isFormLoading}
                  error={formErrors.confirmPassword}
                  maxLength={50}
                />
                {!formErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <small style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                    ✓ Şifreler eşleşiyor
                  </small>
                )}
              </FormGroup>
            </FormRow>

            <FormGroup 
              label="Roller" 
              required 
              error={formErrors.roleIds}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '2px solid #e5e7eb'
              }}>
                {roles.map(role => (
                  <label 
                    key={role.roleId} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.roleId)}
                      onChange={() => handleRoleToggle(role.roleId)}
                      disabled={isFormLoading}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <strong style={{
                        color: '#1a1a1a',
                        fontSize: '14px'
                      }}>{role.name}</strong>
                      {role.description && (
                        <span style={{
                          color: '#6b7280',
                          fontSize: '12px'
                        }}>- {role.description}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </FormGroup>

            {/* ServiceCategory Seçimi - Sadece Specialist rolü seçiliyse göster */}
            {formData.roleIds.includes(4) && (
              <FormGroup 
                label="Uzmanlık Kategorileri (Specialist için)"
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb'
                }}>
                  {categories.map(category => (
                    <label 
                      key={category.categoryId} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={formData.serviceCategoryIds.includes(category.categoryId)}
                        onChange={() => handleCategoryToggle(category.categoryId)}
                        disabled={isFormLoading}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <strong style={{
                          color: '#1a1a1a',
                          fontSize: '14px'
                        }}>{category.categoryName}</strong>
                      </span>
                    </label>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>⚠️ Henüz kategori eklenmemiş</p>
                )}
              </FormGroup>
            )}

            <FormGroup>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f9fafb'}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  disabled={isFormLoading}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>Aktif</span>
              </label>
            </FormGroup>

            <FormActions
            onCancel={() => setShowModal(false)}
              onSubmit={handleFormSubmit}
              submitText={selectedUser ? 'Güncelle' : 'Kaydet'}
              cancelText="İptal"
              isSubmitting={isFormLoading}
              align="end"
          />
          </form>
        </Modal>

        {/* Şifre Sıfırlama Modal */}
        <Modal
          isOpen={showResetModal}
          title={`Şifre Sıfırla - ${resetUser?.username}`}
          onClose={() => {
            setShowResetModal(false);
            setResetUser(null);
            setResetPassword('');
          }}
          size="small"
          animation="slideUp"
        >
          <form onSubmit={handleResetPasswordSubmit} style={{ padding: '20px' }}>
            <FormGroup 
              label="Yeni Şifre" 
              required
            >
              <Input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="En az 6 karakter"
                disabled={isResetLoading}
                maxLength={50}
              />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                Bu kullanıcının şifresi sıfırlanacak ve yeni şifre ile giriş yapabilecek.
              </small>
            </FormGroup>

            <FormActions
              onCancel={() => {
                setShowResetModal(false);
                setResetUser(null);
                setResetPassword('');
              }}
              onSubmit={handleResetPasswordSubmit}
              submitText="Şifreyi Sıfırla"
              cancelText="İptal"
              isSubmitting={isResetLoading}
              align="end"
            />
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Users;


