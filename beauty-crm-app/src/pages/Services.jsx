// pages/Services.jsx - Refactored Version
import React, { useState, useEffect } from 'react';
import { serviceService, categoryService } from '../api/api';

import Layout from '../components/layout/Layout';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import { FormGroup, FormActions, Input, Select } from '../components/common';
import commonStyles from '../styles/common.module.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    price: '',
    categoryId: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    categoryName: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, selectedCategory]);

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceService.getAll(),
        categoryService.getAll()
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Veri yüklerken hata:', error);
      setIsLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(service => service.categoryId === parseInt(selectedCategory));
    }

    setFilteredServices(filtered);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...serviceForm,
        price: parseFloat(serviceForm.price),
        categoryId: parseInt(serviceForm.categoryId)
      };
      
      if (editingItem) {
        await serviceService.update(editingItem.serviceId, data);
      } else {
        await serviceService.create(data);
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Hizmet kaydederken hata:', error);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await categoryService.update(editingItem.categoryId, categoryForm);
      } else {
        await categoryService.create(categoryForm);
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Kategori kaydederken hata:', error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      try {
        await serviceService.delete(serviceId);
        fetchData();
      } catch (error) {
        console.error('Hizmet silerken hata:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Kategoriye bağlı hizmetler etkilenebilir.')) {
      try {
        await categoryService.delete(categoryId);
        fetchData();
      } catch (error) {
        console.error('Kategori silerken hata:', error);
      }
    }
  };

  const openServiceModal = (service = null) => {
    setModalType('service');
    setEditingItem(service);
    if (service) {
      setServiceForm({
        serviceName: service.serviceName,
        price: service.price,
        categoryId: service.categoryId
      });
    }
    setShowAddModal(true);
  };

  const openCategoryModal = (category = null) => {
    setModalType('category');
    setEditingItem(category);
    if (category) {
      setCategoryForm({ categoryName: category.categoryName });
    }
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setServiceForm({ serviceName: '', price: '', categoryId: '' });
    setCategoryForm({ categoryName: '' });
  };

  // Services table columns
  const serviceColumns = [
    {
      title: 'Hizmet Adı',
      key: 'serviceName'
    },
    {
      title: 'Kategori',
      key: 'categoryName',
      render: (value) => (
        <span className={commonStyles.categoryBadge}>
          {value || '-'}
        </span>
      )
    },
    {
      title: 'Fiyat',
      key: 'price',
      align: 'left',
      render: (value) => `₺${value.toLocaleString('tr-TR')}`
    }
  ];

  // Categories table columns
  const categoryColumns = [
    {
      title: 'Kategori Adı',
      key: 'categoryName'
    },
    {
      title: 'Hizmet Sayısı',
      key: 'serviceCount',
      render: (_, category) => {
        const serviceCount = services.filter(s => s.categoryId === category.categoryId).length;
        return (
          <span style={{
            padding: '4px 8px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {serviceCount} hizmet
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
    <Layout>
      {/* Page Header */}
      <PageHeader
        title="Hizmetler"
        buttonText={`Yeni ${activeTab === 'services' ? 'Hizmet' : 'Kategori'}`}
        onButtonClick={() => activeTab === 'services' ? openServiceModal() : openCategoryModal()}
      />

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('services')}
          style={{
            padding: '12px 0',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: activeTab === 'services' ? '#4F46E5' : '#666',
            borderBottom: activeTab === 'services' ? '2px solid #4F46E5' : 'none',
            marginBottom: '-2px',
            fontWeight: activeTab === 'services' ? '600' : 'normal'
          }}
        >
          Hizmetler
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '12px 0',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: activeTab === 'categories' ? '#4F46E5' : '#666',
            borderBottom: activeTab === 'categories' ? '2px solid #4F46E5' : 'none',
            marginBottom: '-2px',
            fontWeight: activeTab === 'categories' ? '600' : 'normal'
          }}
        >
          Kategoriler
        </button>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <>
          {/* Filters */}
          <div className={commonStyles.filterContainer}>
            <Input
              placeholder="Hizmet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={commonStyles.filterInput}
            />
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={filterOptions}
              placeholder="Tüm Kategoriler"
              className={commonStyles.filterSelect}
            />
          </div>

          <Table
            columns={serviceColumns}
            data={serviceTableData}
            isLoading={isLoading}
            emptyMessage={
              searchQuery || selectedCategory 
                ? 'Arama kriterlerine uygun hizmet bulunamadı.' 
                : 'Henüz hizmet kaydı bulunmamaktadır.'
            }
            onEdit={openServiceModal}
            onDelete={handleDeleteService}
          />
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Table
          columns={categoryColumns}
          data={categoryTableData}
          isLoading={isLoading}
          emptyMessage="Henüz kategori kaydı bulunmamaktadır."
          onEdit={openCategoryModal}
          onDelete={handleDeleteCategory}
        />
      )}

      {/* Service Modal */}
      <Modal
        isOpen={showAddModal && modalType === 'service'}
        onClose={closeModal}
        title={editingItem ? 'Hizmet Düzenle' : 'Yeni Hizmet'}
      >
        <form onSubmit={handleServiceSubmit}>
          <FormGroup label="Hizmet Adı" required>
            <Input
              value={serviceForm.serviceName}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
              placeholder="Hizmet adı giriniz"
              required
            />
          </FormGroup>

          <FormGroup label="Kategori" required>
            <Select
              value={serviceForm.categoryId}
              onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
              options={categoryOptions}
              placeholder="Kategori Seçin"
              required
            />
          </FormGroup>

          <FormGroup label="Fiyat (₺)" required>
            <Input
              type="number"
              step="0.01"
              value={serviceForm.price}
              onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
              placeholder="Fiyat giriniz"
              required
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            submitText={editingItem ? 'Güncelle' : 'Kaydet'}
          />
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showAddModal && modalType === 'category'}
        onClose={closeModal}
        title={editingItem ? 'Kategori Düzenle' : 'Yeni Kategori'}
      >
        <form onSubmit={handleCategorySubmit}>
          <FormGroup label="Kategori Adı" required>
            <Input
              value={categoryForm.categoryName}
              onChange={(e) => setCategoryForm({ categoryName: e.target.value })}
              placeholder="Kategori adı giriniz"
              required
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            submitText={editingItem ? 'Güncelle' : 'Kaydet'}
          />
        </form>
      </Modal>
    </Layout>
  );
};

export default Services;