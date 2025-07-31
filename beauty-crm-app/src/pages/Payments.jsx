// pages/Payments.jsx - Refactored Version
import React, { useState, useEffect } from 'react';
import { paymentService, customerService, appointmentService } from '../api/api';

import Layout from '../components/layout/Layout';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import { FormGroup, FormActions, Input, Select } from '../components/common';
import commonStyles from '../styles/common.module.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    appointmentId: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().slice(0, 16),
    status: 'Paid'
  });

  const paymentMethods = [
    { value: 'Cash', label: 'Nakit' },
    { value: 'CreditCard', label: 'Kredi Kartı' },
    { value: 'DebitCard', label: 'Banka Kartı' },
    { value: 'BankTransfer', label: 'Havale' }
  ];

  const paymentStatuses = [
    { value: 'Pending', label: 'Bekliyor', color: '#F59E0B' },
    { value: 'Paid', label: 'Ödendi', color: '#10B981' },
    { value: 'Cancelled', label: 'İptal', color: '#EF4444' },
    { value: 'Refunded', label: 'İade', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, filterStatus, filterMethod]);

  const fetchData = async () => {
    try {
      const [paymentsRes, customersRes, appointmentsRes] = await Promise.all([
        paymentService.getAll(),
        customerService.getAll(),
        appointmentService.getAll()
      ]);
      
      setPayments(paymentsRes.data);
      setCustomers(customersRes.data);
      setAppointments(appointmentsRes.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Veri yüklerken hata:', error);
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchQuery.trim()) {
      filtered = filtered.filter(payment =>
        payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    if (filterMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filterMethod);
    }

    setFilteredPayments(filtered);
  };

  const openAddModal = () => {
    setEditingPayment(null);
    setFormData({
      customerId: '',
      appointmentId: '',
      amountPaid: '',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().slice(0, 16),
      status: 'Paid'
    });
    setShowAddModal(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormData({
      customerId: payment.customerId.toString(),
      appointmentId: payment.appointmentId?.toString() || '',
      amountPaid: payment.amountPaid.toString(),
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date(payment.paymentDate).toISOString().slice(0, 16),
      status: payment.status
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingPayment(null);
    setFormData({
      customerId: '',
      appointmentId: '',
      amountPaid: '',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().slice(0, 16),
      status: 'Paid'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        customerId: formData.customerId,
        appointmentId: formData.appointmentId || null,
        amountPaid: formData.amountPaid,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        status: formData.status
      };

      if (editingPayment) {
        await paymentService.update(editingPayment.paymentId, paymentData);
      } else {
        await paymentService.create(paymentData);
      }
      
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Ödeme kaydederken hata:', error);
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) {
      try {
        await paymentService.delete(paymentId);
        fetchData();
      } catch (error) {
        console.error('Ödeme silerken hata:', error);
      }
    }
  };

  const showCustomerBalance = async (customerId) => {
    try {
      const response = await paymentService.getCustomerBalance(customerId);
      setSelectedCustomerBalance(response.data);
      setShowBalanceModal(true);
    } catch (error) {
      console.error('Müşteri bakiye bilgisi alınırken hata:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = paymentStatuses.find(s => s.value === status);
    return statusConfig?.color || '#6B7280';
  };

  const getMethodLabel = (method) => {
    const methodConfig = paymentMethods.find(m => m.value === method);
    return methodConfig?.label || method;
  };

  const getCustomerAppointments = (customerId) => {
    return appointments.filter(apt => apt.customerId === parseInt(customerId));
  };

  // Table columns
  const columns = [
    {
      title: 'Müşteri',
      key: 'customerName',
      render: (value, payment) => (
        <div>
          <div style={{ color: '#333', fontWeight: '500' }}>
            {value}
          </div>
          <button
            onClick={() => showCustomerBalance(payment.customerId)}
            style={{
              fontSize: '12px',
              color: '#4F46E5',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Bakiye Görüntüle
          </button>
        </div>
      )
    },
    {
      title: 'Hizmet',
      key: 'serviceName',
      render: (value) => value || 'Genel Ödeme'
    },
    {
      title: 'Tutar',
      key: 'amountPaid',
      align: 'left',
      render: (value) => `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
    },
    {
      title: 'Tarih',
      key: 'paymentDate',
      render: (value) => new Date(value).toLocaleDateString('tr-TR')
    },
    {
      title: 'Yöntem',
      key: 'paymentMethod',
      render: (value) => getMethodLabel(value)
    },
    {
      title: 'Durum',
      key: 'status',
      render: (value) => {
        const statusConfig = paymentStatuses.find(s => s.value === value);
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: `${getStatusColor(value)}20`,
            color: getStatusColor(value),
            border: `1px solid ${getStatusColor(value)}40`
          }}>
            {statusConfig?.label || value}
          </span>
        );
      }
    }
  ];

  // Prepare options
  const customerOptions = customers.map(customer => ({
    value: customer.customerId,
    label: customer.fullName
  }));

  const statusFilterOptions = paymentStatuses.map(status => ({
    value: status.value,
    label: status.label
  }));

  const methodFilterOptions = paymentMethods.map(method => ({
    value: method.value,
    label: method.label
  }));

  // Table data with id
  const tableData = filteredPayments.map(payment => ({
    ...payment,
    id: payment.paymentId
  }));

  return (
    <Layout>
      {/* Page Header */}
      <PageHeader
        title="Ödemeler"
        buttonText="Yeni Ödeme"
        onButtonClick={openAddModal}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Müşteri veya hizmet ara..."
      >
        {/* Filter Selects */}
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={statusFilterOptions}
          placeholder="Tüm Durumlar"
          className={commonStyles.filterSelect}
        />
        <Select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          options={methodFilterOptions}
          placeholder="Tüm Yöntemler"
          className={commonStyles.filterSelect}
        />
      </PageHeader>

      {/* Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage={
          searchQuery || filterStatus || filterMethod 
            ? 'Arama kriterlerine uygun ödeme bulunamadı.' 
            : 'Henüz ödeme kaydı bulunmamaktadır.'
        }
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingPayment ? 'Ödeme Düzenle' : 'Yeni Ödeme'}
      >
        <form onSubmit={handleSubmit}>
          <FormGroup label="Müşteri" required>
            <Select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={customerOptions}
              placeholder="Müşteri Seçin"
              required
            />
          </FormGroup>

          <FormGroup label="Randevu (Opsiyonel)">
            <Select
              value={formData.appointmentId}
              onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
              options={formData.customerId ? getCustomerAppointments(formData.customerId).map(apt => ({
                value: apt.appointmentId,
                label: `${apt.serviceName || 'Bilinmeyen Hizmet'} - ${new Date(apt.appointmentDate).toLocaleDateString('tr-TR')}`
              })) : []}
              placeholder="Genel Ödeme"
            />
          </FormGroup>

          <FormGroup label="Tutar (₺)" required>
            <Input
              type="number"
              step="0.01"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
              placeholder="Tutar giriniz"
              required
            />
          </FormGroup>

          <FormGroup label="Ödeme Yöntemi">
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={paymentMethods}
            />
          </FormGroup>

          <FormGroup label="Ödeme Tarihi">
            <Input
              type="datetime-local"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Durum">
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={paymentStatuses}
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            submitText={editingPayment ? 'Güncelle' : 'Kaydet'}
          />
        </form>
      </Modal>

      {/* Customer Balance Modal */}
      <Modal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        title="Müşteri Bakiyesi"
      >
        {selectedCustomerBalance && (
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>
              {selectedCustomerBalance.customerName}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#666' }}>Toplam Anlaşmalı:</span>
                <p style={{ fontWeight: '500', margin: '4px 0', color: '#333' }}>
                  ₺{selectedCustomerBalance.totalAgreedAmount.toLocaleString('tr-TR')}
                </p>
              </div>
              <div>
                <span style={{ color: '#666' }}>Toplam Ödenen:</span>
                <p style={{ fontWeight: '500', margin: '4px 0', color: '#10B981' }}>
                  ₺{selectedCustomerBalance.totalPaidAmount.toLocaleString('tr-TR')}
                </p>
              </div>
              <div>
                <span style={{ color: '#666' }}>Bekleyen:</span>
                <p style={{ fontWeight: '500', margin: '4px 0', color: '#F59E0B' }}>
                  ₺{selectedCustomerBalance.pendingAmount.toLocaleString('tr-TR')}
                </p>
              </div>
              <div>
                <span style={{ color: '#666' }}>Kalan Borç:</span>
                <p style={{ fontWeight: '500', margin: '4px 0', color: '#EF4444' }}>
                  ₺{selectedCustomerBalance.remainingDebt.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
            
            {selectedCustomerBalance.overPaid > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#dbeafe',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '14px', color: '#1e40af' }}>
                  Kredi: ₺{selectedCustomerBalance.overPaid.toLocaleString('tr-TR')}
                </span>
              </div>
            )}
            
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
              <p style={{ margin: '2px 0' }}>Toplam Ödeme Sayısı: {selectedCustomerBalance.totalPayments}</p>
              {selectedCustomerBalance.lastPaymentDate && (
                <p style={{ margin: '2px 0' }}>
                  Son Ödeme: {new Date(selectedCustomerBalance.lastPaymentDate).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Payments;