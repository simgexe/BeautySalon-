import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, serviceCategoryService } from '../../api/api';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Table from '../../components/common/Table/Table';
import Modal from '../../components/common/Modal/Modal';
import { FormGroup, FormRow, FormActions, Input } from '../../components/common/Form';

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
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
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

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Hata mesajını temizle
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon numarası gereklidir';
    }

    if (!selectedUser) {
      // Yeni kullanıcı için şifre zorunlu
      if (!formData.password) {
        newErrors.password = 'Şifre gereklidir';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalıdır';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    } else {
      // Mevcut kullanıcı - şifre değiştirilmişse kontrol et
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalıdır';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
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
            emptyMessage={searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kullanıcı bulunmamaktadır'}
            hover={true}
          />

        <Modal
          isOpen={showModal}
          title={selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          onClose={() => setShowModal(false)}
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
                />
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
                />
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
                />
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
      </div>
    </Layout>
  );
};

export default Users;


