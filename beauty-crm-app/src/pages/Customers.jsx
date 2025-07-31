
import React, { useState, useEffect } from 'react';
import { customerService } from '../api/api';

import Layout from '../components/layout/Layout';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import { FormGroup, FormActions, Input, Textarea } from '../components/common';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data);
      setFilteredCustomers(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Müşterileri yüklerken hata:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.customerId, formData);
      } else {
        await customerService.create(formData);
      }
      fetchCustomers();
      closeModal();
    } catch (error) {
      console.error('Müşteri kaydederken hata:', error);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await customerService.delete(customerId);
        fetchCustomers();
      } catch (error) {
        console.error('Müşteri silerken hata:', error);
      }
    }
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      notes: customer.notes || ''
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ fullName: '', phoneNumber: '', notes: '' });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCustomer(null);
    setFormData({ fullName: '', phoneNumber: '', notes: '' });
  };

  // Tablo sütunları tanımı
  const columns = [
    {
      title: 'Ad Soyad',
      key: 'fullName'
    },
    {
      title: 'Telefon',
      key: 'phoneNumber'
    },
    {
      title: 'Notlar',
      key: 'notes',
      render: (value) => value || '-'
    }
  ];

  // Tablo için veri hazırlama (id ekliyoruz)
  const tableData = filteredCustomers.map(customer => ({
    ...customer,
    id: customer.customerId
  }));

  return (
    <Layout>
      {/* Page Header */}
      <PageHeader
        title="Müşteriler"
        buttonText="Yeni Müşteri"
        onButtonClick={openAddModal}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Müşteri ara..."
      />

      {/* Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage={
          searchQuery 
            ? 'Arama kriterlerine uygun müşteri bulunamadı.' 
            : 'Henüz müşteri kaydı bulunmamaktadır.'
        }
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
      >
        <form onSubmit={handleSubmit}>
          <FormGroup label="Ad Soyad" required>
            <Input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ad soyad giriniz"
            />
          </FormGroup>

          <FormGroup label="Telefon" required>
            <Input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="Telefon numarası giriniz"
            />
          </FormGroup>

          <FormGroup label="Notlar">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notlar (opsiyonel)"
              rows={3}
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            submitText={editingCustomer ? 'Güncelle' : 'Kaydet'}
          />
        </form>
      </Modal>
    </Layout>
  );
};

export default Customers;