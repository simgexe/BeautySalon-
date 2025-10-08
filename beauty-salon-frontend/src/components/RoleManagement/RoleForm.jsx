import React, { useState, useEffect } from 'react';
import { roleService } from '../../api/api';
import styles from './RoleForm.module.css';

const RoleForm = ({ role, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        isActive: role.isActive !== undefined ? role.isActive : true
      });
    }
  }, [role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rol adı gereklidir';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Rol adı en az 2 karakter olmalıdır';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Rol adı en fazla 50 karakter olabilir';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Açıklama en fazla 200 karakter olabilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const roleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive
      };

      if (role) {
        await roleService.updateRole(role.roleId, roleData);
      } else {
        await roleService.createRole(roleData);
      }

      onSave();
    } catch (err) {
      setErrors({ 
        general: err.message || 'Rol kaydedilirken bir hata oluştu' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sistem rollerini düzenlemeyi engelle (Admin, Staff)
  const isSystemRole = role && ['Admin', 'Staff'].includes(role.name);

  return (
    <form onSubmit={handleSubmit} className={styles.roleForm}>
      {errors.general && (
        <div className={styles.errorAlert}>
          <span className={styles.errorIcon}>⚠️</span>
          {errors.general}
        </div>
      )}

      {isSystemRole && (
        <div className={styles.warningAlert}>
          <span className={styles.warningIcon}>ℹ️</span>
          Bu bir sistem rolüdür. Rol adı değiştirilemez.
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Rol Adı <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          placeholder="Örn: Manager, Receptionist"
          disabled={isLoading || isSystemRole}
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Açıklama
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
          placeholder="Rol açıklaması..."
          rows="4"
          disabled={isLoading}
        />
        {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        <span className={styles.charCount}>
          {formData.description.length} / 200
        </span>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>Aktif</span>
        </label>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          İptal
        </button>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Kaydediliyor...
            </>
          ) : (
            role ? 'Güncelle' : 'Kaydet'
          )}
        </button>
      </div>
    </form>
  );
};

export default RoleForm;
