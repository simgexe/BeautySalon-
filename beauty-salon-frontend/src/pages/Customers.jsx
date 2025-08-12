// pages/Customers.jsx - Yeni Component'lerle Güncellenmiş
import React, { useState, useEffect } from 'react';
import { customerService } from '../api/api';

// Layout ve Component import'ları
import Layout, { AddButton } from '../components/Layout/Layout';
import Table from '../components/common/Table/Table';
import Modal from '../components/common/Modal/Modal';
import { FormGroup, FormActions, Input, Textarea } from '../components/common/Form';

// Sayfa özel stilleri
import customerStyles from './customers.module.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    notes: ''
  });

  // Telefon numarası validasyon fonksiyonu
  const validatePhoneNumber = (phoneNumber) => {
    // Sadece rakamları al
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Türkiye telefon numarası formatı kontrolü
    // 05xx xxx xx xx veya 5xx xxx xx xx formatı
    if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
      return true;
    }
    if (cleanNumber.length === 10 && !cleanNumber.startsWith('0')) {
      return true;
    }
    
    return false;
  };

  // Telefon numarası formatlama fonksiyonu
  const formatPhoneNumber = (value) => {
    // Sadece rakamları al
    const cleanNumber = value.replace(/\D/g, '');
    
    // Eğer 11 haneli ve 0 ile başlıyorsa
    if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
      return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 7)} ${cleanNumber.slice(7, 9)} ${cleanNumber.slice(9)}`;
    }
    
    // Eğer 10 haneli ve 0 ile başlamıyorsa
    if (cleanNumber.length === 10 && !cleanNumber.startsWith('0')) {
      return `0${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6, 8)} ${cleanNumber.slice(8)}`;
    }
    
    // Diğer durumlar için sadece rakamları döndür
    return cleanNumber;
  };

  // Form validasyonu
  const validateForm = () => {
    const errors = {};
    
    // Ad soyad validasyonu
    if (!formData.fullName.trim()) {
      errors.fullName = 'Ad soyad gereklidir';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Ad soyad en az 2 karakter olmalıdır';
    }
    
    // Telefon numarası validasyonu
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Telefon numarası gereklidir';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Geçerli bir telefon numarası giriniz (Örn: 0532 123 45 67)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];

    if (searchQuery.trim()) {
      filtered = filtered.filter(customer =>
        customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber.includes(searchQuery)
      );
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc'
          ? aValue.toString().localeCompare(bValue.toString(), 'tr', { numeric: true })
          : bValue.toString().localeCompare(aValue.toString(), 'tr', { numeric: true });
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, sortConfig]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await customerService.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Müşterileri yüklerken hata:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const customerData = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        notes: formData.notes.trim()
      };

      if (editingCustomer) {
        await customerService.update(editingCustomer.customerId, customerData);
      } else {
        await customerService.create(customerData);
      }
      
      await fetchCustomers();
      closeModal();
    } catch (error) {
      console.error('Müşteri kaydederken hata:', error);
      alert(`Müşteri kaydedilirken hata: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    const customerName = customer ? customer.fullName : 'Bu müşteri';
    
    if (window.confirm(`${customerName}'yi silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      try {
        await customerService.delete(customerId);
        await fetchCustomers();
      } catch (error) {
        console.error('Müşteri silerken hata:', error);
        alert('Müşteri silinirken bir hata oluştu. Bu müşteriye ait randevular olabilir.');
      }
    }
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName || '',
      phoneNumber: customer.phoneNumber || '',
      notes: customer.notes || ''
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ 
      fullName: '', 
      phoneNumber: '', 
      notes: '' 
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCustomer(null);
    setFormData({ 
      fullName: '', 
      phoneNumber: '', 
      notes: '' 
    });
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    
    setFormData({ ...formData, phoneNumber: formattedValue });
    
    // Real-time validasyon
    if (formattedValue && !validatePhoneNumber(formattedValue)) {
      setFormErrors(prev => ({ ...prev, phoneNumber: 'Geçerli bir telefon numarası giriniz' }));
    } else {
      setFormErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  // Tablo sütunları tanımı
  const columns = [
    {
      title: 'Ad Soyad',
      key: 'fullName',
      sortable: true,
      render: (value) => (
        <span className={customerStyles.nameText}>{value}</span>
      )
    },
    {
      title: 'Telefon',
      key: 'phoneNumber',
      sortable: true,
      render: (value) => (
        <a 
          href={`tel:${value}`} 
          className={customerStyles.phoneLink}
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      )
    },
    {
      title: 'Notlar',
      key: 'notes',
      sortable: false,
      render: (value) => (
        <div className={customerStyles.notesCell}>
          {value ? (
            <span className={customerStyles.notesPreview} title={value}>
              {value.length > 30 ? `${value.substring(0, 30)}...` : value}
            </span>
          ) : (
            <span className={customerStyles.noNotes}>-</span>
          )}
        </div>
      )
    }
  ];

  // Tablo için veri hazırlama
  const tableData = filteredCustomers.map(customer => ({
    ...customer,
    id: customer.customerId
  }));

  return (
    <Layout className={customerStyles.customerLayout}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Input
          placeholder="Ad soyad veya telefon ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />
        <AddButton onClick={openAddModal}>+ Yeni Müşteri</AddButton>
      </div>

      {/* Statistics Bar */}
      <div className={customerStyles.statsBar}>
        <div className={customerStyles.statItem}>
          <span className={customerStyles.statValue}>{customers.length}</span>
          <span className={customerStyles.statLabel}>Toplam Müşteri</span>
        </div>
        <div className={customerStyles.statItem}>
          <span className={customerStyles.statValue}>{filteredCustomers.length}</span>
          <span className={customerStyles.statLabel}>Gösterilen</span>
        </div>
        <div className={customerStyles.statItem}>
          <span className={customerStyles.statValue}>
            {customers.filter(c => c.notes && c.notes.trim()).length}
          </span>
          <span className={customerStyles.statLabel}>Notlu Müşteri</span>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage={
          searchQuery 
            ? `"${searchQuery}" için müşteri bulunamadı.` 
            : 'Henüz müşteri kaydı bulunmamaktadır. İlk müşteriyi eklemek için "Yeni Müşteri" butonuna tıklayın.'
        }
        onEdit={openEditModal}
        onDelete={handleDelete}
        sortable={true}
        onSort={handleSort}
        sortConfig={sortConfig}
        hover={true}
        striped={false}
        className={customerStyles.customerTable}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />

      {/* Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingCustomer ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Ekle'}
        size="medium"
        animation="slideUp"
        className={customerStyles.customerModal}
      >
        <div className={customerStyles.customerForm}>
          <FormGroup 
            label="Ad Soyad" 
            required
            hint="Müşterinin tam adını giriniz"
            error={formErrors.fullName}
          >
            <Input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Örn: Ahmet Yılmaz"
              disabled={isSubmitting}
              maxLength={100}
            />
          </FormGroup>

          <FormGroup 
            label="Telefon Numarası" 
            required
            hint="Müşteri ile iletişim kurmak için kullanılacak"
            error={formErrors.phoneNumber}
          >
            <Input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="Örn: 0532 123 45 67"
              disabled={isSubmitting}
              maxLength={15}
            />
          </FormGroup>

          <FormGroup 
            label="Notlar" 
            hint="Müşteri ile ilgili özel notlar (opsiyonel)"
          >
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Müşteri tercihleri, özel durumlar, hatırlatmalar..."
              rows={4}
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className={customerStyles.charCount}>
              {formData.notes.length}/500 karakter
            </div>
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            onSubmit={handleSubmit}
            submitText={editingCustomer ? 'Değişiklikleri Kaydet' : 'Müşteriyi Ekle'}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
            showCancel={true}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default Customers;