// pages/Services.jsx - Yeni Component'lerle Güncellenmiş
import React, { useState, useEffect, useCallback } from 'react';
import { serviceService, categoryService } from '../api/api';

// Layout ve Component import'ları
import Layout, { AddButton } from '../components/Layout/Layout';
import Table from '../components/common/Table/Table';
import Modal from '../components/common/Modal/Modal';
import { FormGroup, FormActions, Input, Select } from '../components/common/Form';

// Sayfa özel stilleri
import serviceStyles from './services.module.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  
  const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    price: '',
    categoryId: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    categoryName: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Form validasyonu
  const validateServiceForm = () => {
    const errors = {};
    
    // Hizmet adı validasyonu
    if (!serviceForm.serviceName.trim()) {
      errors.serviceName = 'Hizmet adı gereklidir';
    } else if (serviceForm.serviceName.trim().length < 2) {
      errors.serviceName = 'Hizmet adı en az 2 karakter olmalıdır';
    }
    
    // Fiyat validasyonu
    if (!serviceForm.price) {
      errors.price = 'Fiyat gereklidir';
    } else {
      const price = parseFloat(serviceForm.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Geçerli bir fiyat giriniz';
      }
    }
    
    // Kategori validasyonu
    if (!serviceForm.categoryId) {
      errors.categoryId = 'Kategori seçimi gereklidir';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCategoryForm = () => {
    const errors = {};
    
    // Kategori adı validasyonu
    if (!categoryForm.categoryName.trim()) {
      errors.categoryName = 'Kategori adı gereklidir';
    } else if (categoryForm.categoryName.trim().length < 2) {
      errors.categoryName = 'Kategori adı en az 2 karakter olmalıdır';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterAndSortServices = useCallback(() => {
    let filtered = [...services];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(service => service.categoryId === parseInt(selectedCategory));
    }

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'price') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        } else {
          aValue = aValue?.toString() || '';
          bValue = bValue?.toString() || '';
        }
        
        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    setFilteredServices(filtered);
  }, [services, selectedCategory, sortConfig]);

  useEffect(() => {
    filterAndSortServices();
  }, [filterAndSortServices]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceService.getAll(),
        categoryService.getAll()
      ]);
      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Veri yüklerken hata:', error);
      setServices([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  const handleServiceSubmit = async () => {
    if (!validateServiceForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const data = {
        serviceName: serviceForm.serviceName.trim(),
        price: parseFloat(serviceForm.price),
        categoryId: parseInt(serviceForm.categoryId)
      };
      
      if (editingItem) {
        await serviceService.update(editingItem.serviceId, data);
      } else {
        await serviceService.create(data);
      }
      
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Hizmet kaydederken hata:', error);
      alert('Hizmet kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async () => {
    if (!validateCategoryForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const data = {
        categoryName: categoryForm.categoryName.trim()
      };
      
      if (editingItem) {
        await categoryService.update(editingItem.categoryId, data);
      } else {
        await categoryService.create(data);
      }
      
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Kategori kaydederken hata:', error);
      alert('Kategori kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    const service = services.find(s => s.serviceId === serviceId);
    const serviceName = service ? service.serviceName : 'Bu hizmet';
    
    if (window.confirm(`${serviceName}'i silmek istediğinizden emin misiniz?\n\nBu hizmete ait randevular etkilenebilir.`)) {
      try {
        await serviceService.delete(serviceId);
        await fetchData();
      } catch (error) {
        console.error('Hizmet silerken hata:', error);
        alert('Hizmet silinirken bir hata oluştu. Bu hizmete ait randevular olabilir.');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(c => c.categoryId === categoryId);
    const categoryName = category ? category.categoryName : 'Bu kategori';
    const relatedServices = services.filter(s => s.categoryId === categoryId);
    
    if (relatedServices.length > 0) {
      alert(`${categoryName} kategorisini silemezsiniz.\n\nBu kategoriye ait ${relatedServices.length} hizmet bulunmaktadır. Önce bu hizmetleri silin veya başka kategoriye taşıyın.`);
      return;
    }
    
    if (window.confirm(`${categoryName} kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await categoryService.delete(categoryId);
        await fetchData();
      } catch (error) {
        console.error('Kategori silerken hata:', error);
        alert('Kategori silinirken bir hata oluştu.');
      }
    }
  };

  const openServiceModal = (service = null) => {
    setModalType('service');
    setEditingItem(service);
    if (service) {
      setServiceForm({
        serviceName: service.serviceName || '',
        price: service.price || '',
        categoryId: service.categoryId || ''
      });
    } else {
      setServiceForm({ serviceName: '', price: '', categoryId: '' });
    }
    setShowAddModal(true);
  };

  const openCategoryModal = (category = null) => {
    setModalType('category');
    setEditingItem(category);
    if (category) {
      setCategoryForm({ categoryName: category.categoryName || '' });
    } else {
      setCategoryForm({ categoryName: '' });
    }
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setServiceForm({ serviceName: '', price: '', categoryId: '' });
    setCategoryForm({ categoryName: '' });
  };

  // Calculate statistics
  const stats = {
    totalServices: services.length,
    totalCategories: categories.length,
    averagePrice: services.length > 0 ? services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length : 0,
    mostExpensivePrice: services.length > 0 ? Math.max(...services.map(s => s.price || 0)) : 0
  };

  // Services table columns
  const serviceColumns = [
    {
      title: 'Hizmet Adı',
      key: 'serviceName',
      sortable: true,
      render: (value) => (
        <span className={serviceStyles.serviceName}>
          {value}
        </span>
      )
    },
    {
      title: 'Kategori',
      key: 'categoryName',
      sortable: true,
      render: (value) => (
        <span className={serviceStyles.categoryBadge}>
          {value || 'Kategorisiz'}
        </span>
      )
    },
    {
      title: 'Fiyat',
      key: 'price',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span className={serviceStyles.priceCell}>
          ₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  // Categories table columns
  const categoryColumns = [
    {
      title: 'Kategori Adı',
      key: 'categoryName',
      sortable: true,
      render: (value) => (
        <span className={serviceStyles.categoryName}>
          {value}
        </span>
      )
    },
    {
      title: 'Hizmet Sayısı',
      key: 'serviceCount',
      sortable: false,
      render: (_, category) => {
        const serviceCount = services.filter(s => s.categoryId === category.categoryId).length;
        return (
          <span className={serviceStyles.serviceCountBadge}>
            {serviceCount} hizmet
          </span>
        );
      }
    },
    {
      title: 'Toplam Değer',
      key: 'totalValue',
      align: 'right',
      sortable: false,
      render: (_, category) => {
        const categoryServices = services.filter(s => s.categoryId === category.categoryId);
        const totalValue = categoryServices.reduce((sum, s) => sum + (s.price || 0), 0);
        return (
          <span className={serviceStyles.totalValueCell}>
            ₺{totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    }
  ];

  // Category options for select
  const categoryOptions = categories.map(cat => ({
    value: cat.categoryId,
    label: cat.categoryName
  }));

  // Filter options for category filter
  const filterOptions = categories.map(cat => ({
    value: cat.categoryId,
    label: cat.categoryName
  }));

  // Table data with id
  const serviceTableData = filteredServices.map(service => ({
    ...service,
    id: service.serviceId
  }));

  const categoryTableData = categories.map(category => ({
    ...category,
    id: category.categoryId
  }));

  return (
    <Layout className={serviceStyles.serviceLayout}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        
      </div>

      {/* Statistics Bar */}
      <div className={serviceStyles.statsBar}>
        <div className={serviceStyles.statItem}>
          <span className={serviceStyles.statValue}>{stats.totalServices}</span>
          <span className={serviceStyles.statLabel}>Toplam Hizmet</span>
        </div>
        <div className={serviceStyles.statItem}>
          <span className={serviceStyles.statValue}>{stats.totalCategories}</span>
          <span className={serviceStyles.statLabel}>Kategori</span>
        </div>
        <div className={serviceStyles.statItem}>
          <span className={serviceStyles.statValue}>
            ₺{stats.averagePrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </span>
          <span className={serviceStyles.statLabel}>Ortalama Fiyat</span>
        </div>
        <div className={serviceStyles.statItem}>
          <span className={serviceStyles.statValue}>
            ₺{stats.mostExpensivePrice.toLocaleString('tr-TR')}
          </span>
          <span className={serviceStyles.statLabel}>En Yüksek Fiyat</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={serviceStyles.tabNavigation}>
        <div className={serviceStyles.tabButtons}>
          <button
            onClick={() => setActiveTab('services')}
            className={`${serviceStyles.tabButton} ${activeTab === 'services' ? serviceStyles.tabButtonActive : ''}`}
          >
            <span className={serviceStyles.tabIcon}>🛍️</span>
            Hizmetler
            <span className={serviceStyles.tabCount}>({services.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`${serviceStyles.tabButton} ${activeTab === 'categories' ? serviceStyles.tabButtonActive : ''}`}
          >
            <span className={serviceStyles.tabIcon}>📂</span>
            Kategoriler
            <span className={serviceStyles.tabCount}>({categories.length})</span>
          </button>
        </div>
        <AddButton onClick={() => activeTab === 'services' ? openServiceModal() : openCategoryModal()}>
          + Yeni {activeTab === 'services' ? 'Hizmet' : 'Kategori'}
        </AddButton>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <>
          {/* Filters */}
          <div className={serviceStyles.filterContainer}>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={filterOptions}
              placeholder="Tüm Kategoriler"
              className={serviceStyles.filterSelect}
            />
          </div>

          <Table
            columns={serviceColumns}
            data={serviceTableData}
            isLoading={isLoading}
            emptyMessage={
              selectedCategory 
                ? 'Bu kategoride hizmet bulunamadı.' 
                : 'Henüz hizmet kaydı bulunmamaktadır. İlk hizmeti eklemek için "Yeni Hizmet" butonuna tıklayın.'
            }
            onEdit={openServiceModal}
            onDelete={handleDeleteService}
            sortable={true}
            onSort={handleSort}
            sortConfig={sortConfig}
            hover={true}
            className={serviceStyles.serviceTable}
            editButtonText="Düzenle"
            deleteButtonText="Sil"
          />
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Table
          columns={categoryColumns}
          data={categoryTableData}
          isLoading={isLoading}
          emptyMessage="Henüz kategori kaydı bulunmamaktadır. İlk kategoriyi eklemek için 'Yeni Kategori' butonuna tıklayın."
          onEdit={openCategoryModal}
          onDelete={handleDeleteCategory}
          hover={true}
          className={serviceStyles.categoryTable}
          editButtonText="Düzenle"
          deleteButtonText="Sil"
        />
      )}

      {/* Service Modal */}
      <Modal
        isOpen={showAddModal && modalType === 'service'}
        onClose={closeModal}
        title={editingItem ? 'Hizmet Bilgilerini Düzenle' : 'Yeni Hizmet Ekle'}
        size="medium"
        animation="slideUp"
        className={serviceStyles.serviceModal}
      >
        <div className={serviceStyles.serviceForm}>
          <FormGroup 
            label="Hizmet Adı" 
            required
            hint="Müşterilere sunulan hizmetin adı"
            error={formErrors.serviceName}
          >
            <Input
              value={serviceForm.serviceName}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
              placeholder="Örn: Saç Kesimi, Makyaj, Cilt Bakımı"
              required
              disabled={isSubmitting}
              maxLength={100}
            />
          </FormGroup>

          <FormGroup 
            label="Fiyat (₺)" 
            required
            hint="Hizmetin standart fiyatı"
            error={formErrors.price}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              value={serviceForm.price}
              onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
              placeholder="Örn: 150.00"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup 
            label="Kategori" 
            required
            hint="Hizmetin hangi kategoride olduğu"
            error={formErrors.categoryId}
          >
            <Select
              value={serviceForm.categoryId}
              onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
              options={categoryOptions}
              placeholder="Kategori Seçin"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            onSubmit={handleServiceSubmit}
            submitText={editingItem ? 'Değişiklikleri Kaydet' : 'Hizmeti Ekle'}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showAddModal && modalType === 'category'}
        onClose={closeModal}
        title={editingItem ? 'Kategori Bilgilerini Düzenle' : 'Yeni Kategori Ekle'}
        size="small"
        animation="slideUp"
        className={serviceStyles.categoryModal}
      >
        <div className={serviceStyles.categoryForm}>
          <FormGroup 
            label="Kategori Adı" 
            required
            hint="Hizmetleri gruplamak için kullanılan kategori adı"
            error={formErrors.categoryName}
          >
            <Input
              value={categoryForm.categoryName}
              onChange={(e) => setCategoryForm({ categoryName: e.target.value })}
              placeholder="Örn: Saç Bakımı, Cilt Bakımı, Makyaj"
              required
              disabled={isSubmitting}
              maxLength={50}
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            onSubmit={handleCategorySubmit}
            submitText={editingItem ? 'Değişiklikleri Kaydet' : 'Kategoriyi Ekle'}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default Services;