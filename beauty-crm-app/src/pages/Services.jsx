import React, { useState, useEffect } from 'react';
import { serviceService, categoryService } from '../api/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'service' veya 'category'
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

  const handleDeleteService = async (id) => {
    if (window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      try {
        await serviceService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Hizmet silerken hata:', error);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Kategoriye bağlı hizmetler etkilenebilir.')) {
      try {
        await categoryService.delete(id);
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <p style={{ color: '#666' }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: 0 }}>
          Hizmetler
        </h1>
        <button
          onClick={() => activeTab === 'services' ? openServiceModal() : openCategoryModal()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          + Yeni {activeTab === 'services' ? 'Hizmet' : 'Kategori'}
        </button>
      </div>

      {/* Tab Menu */}
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

      {/* Hizmetler Tablosu */}
      {activeTab === 'services' && (
        <>
          {/* Arama ve Filtre */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Hizmet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                minWidth: '200px'
              }}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Hizmet Adı</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Kategori</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Fiyat</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#666', fontWeight: '600' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                      {searchQuery || selectedCategory ? 'Arama kriterlerine uygun hizmet bulunamadı.' : 'Henüz hizmet kaydı bulunmamaktadır.'}
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.serviceId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '16px', color: '#333' }}>{service.serviceName}</td>
                      <td style={{ padding: '16px', color: '#666' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {service.categoryName || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#333', fontWeight: '500' }}>
                        ₺{service.price.toLocaleString('tr-TR')}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => openServiceModal(service)}
                          style={{
                            padding: '6px 12px',
                            marginRight: '8px',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#4F46E5',
                            cursor: 'pointer'
                          }}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.serviceId)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Kategoriler Tablosu */}
      {activeTab === 'categories' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Kategori Adı</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Hizmet Sayısı</th>
                <th style={{ padding: '16px', textAlign: 'right', color: '#666', fontWeight: '600' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    Henüz kategori kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const serviceCount = services.filter(s => s.categoryId === category.categoryId).length;
                  return (
                    <tr key={category.categoryId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '16px', color: '#333' }}>{category.categoryName}</td>
                      <td style={{ padding: '16px', color: '#666' }}>
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
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => openCategoryModal(category)}
                          style={{
                            padding: '6px 12px',
                            marginRight: '8px',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#4F46E5',
                            cursor: 'pointer'
                          }}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.categoryId)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#333' }}>
              {modalType === 'service' 
                ? (editingItem ? 'Hizmet Düzenle' : 'Yeni Hizmet')
                : (editingItem ? 'Kategori Düzenle' : 'Yeni Kategori')}
            </h2>

            {modalType === 'service' ? (
              <form onSubmit={handleServiceSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    Hizmet Adı *
                  </label>
                  <input
                    type="text"
                    value={serviceForm.serviceName}
                    onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    Kategori *
                  </label>
                  <select
                    value={serviceForm.categoryId}
                    onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(category => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#666',
                      cursor: 'pointer'
                    }}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {editingItem ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCategorySubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.categoryName}
                    onChange={(e) => setCategoryForm({ categoryName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#666',
                      cursor: 'pointer'
                    }}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {editingItem ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;