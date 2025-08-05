// pages/Customers.jsx - Yeni Component'lerle Güncellenmiş
import React, { useState, useEffect } from 'react';
import { customerService } from '../api/api';

// Layout ve Component import'ları
import Layout from '../components/Layout/Layout';
import PageHeader from '../components/common/PageHeader';
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
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [searchQuery, customers, sortConfig]);

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

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(customer =>
        customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber.includes(searchQuery)
      );
    }

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (sortConfig.direction === 'asc') {
          return aValue.toString().localeCompare(bValue.toString(), 'tr', { numeric: true });
        } else {
          return bValue.toString().localeCompare(aValue.toString(), 'tr', { numeric: true });
        }
      });
    }

    setFilteredCustomers(filtered);
  };

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.phoneNumber.trim()) {
      alert('Ad soyad ve telefon alanları zorunludur.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const customerData = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        notes: formData.notes.trim() || null
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
      alert('Müşteri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
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

  // Tablo sütunları tanımı
  const columns = [
    {
      title: 'Ad Soyad',
      key: 'fullName',
      sortable: true,
      render: (value, customer) => (
        <div className={customerStyles.customerName}>
          <span className={customerStyles.nameText}>{value}</span>
          {customer.notes && (
            <span className={customerStyles.hasNotes} title="Bu müşterinin notu var">
              📝
            </span>
          )}
        </div>
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
      {/* Page Header */}
      <PageHeader
        title="Müşteriler"
        buttonText="Yeni Müşteri"
        onButtonClick={openAddModal}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Ad soyad veya telefon ile ara..."
        className={customerStyles.pageHeader}
      />

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
        <form onSubmit={handleSubmit} className={customerStyles.customerForm}>
          <FormGroup 
            label="Ad Soyad" 
            required
            hint="Müşterinin tam adını giriniz"
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
          >
            <Input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
            submitText={editingCustomer ? 'Değişiklikleri Kaydet' : 'Müşteriyi Ekle'}
            isSubmitting={isSubmitting}
            layout="end"
            submitVariant="primary"
            showCancel={true}
          />
        </form>
      </Modal>
    </Layout>
  );
};

export default Customers;