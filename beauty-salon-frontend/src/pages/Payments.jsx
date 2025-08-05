// pages/Payments.jsx - Yeni Component'lerle Güncellenmiş
import React, { useState, useEffect } from 'react';
import { paymentService, customerService, appointmentService } from '../api/api';

// Layout ve Component import'ları
import Layout from '../components/Layout/Layout';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table/Table';
import Modal from '../components/common/Modal/Modal';
import { FormGroup, FormActions, Input, Select } from '../components/common/Form';

// Sayfa özel stilleri
import paymentStyles from './payments.module.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
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
    filterAndSortPayments();
  }, [payments, searchQuery, filterStatus, filterMethod, sortConfig]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [paymentsRes, customersRes, appointmentsRes] = await Promise.all([
        paymentService.getAll(),
        customerService.getAll(),
        appointmentService.getAll()
      ]);
      
      setPayments(paymentsRes.data || []);
      setCustomers(customersRes.data || []);
      setAppointments(appointmentsRes.data || []);
    } catch (error) {
      console.error('Veri yüklerken hata:', error);
      setPayments([]);
      setCustomers([]);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(payment =>
        payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    // Method filter
    if (filterMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filterMethod);
    }

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Special handling for date and amount fields
        if (sortConfig.key === 'paymentDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key === 'amountPaid') {
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

    setFilteredPayments(filtered);
  };

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
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
    
    if (!formData.customerId || !formData.amountPaid) {
      alert('Müşteri ve tutar alanları zorunludur.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentData = {
        customerId: parseInt(formData.customerId),
        appointmentId: formData.appointmentId ? parseInt(formData.appointmentId) : null,
        amountPaid: parseFloat(formData.amountPaid),
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        status: formData.status
      };

      if (editingPayment) {
        await paymentService.update(editingPayment.paymentId, paymentData);
      } else {
        await paymentService.create(paymentData);
      }
      
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Ödeme kaydederken hata:', error);
      alert('Ödeme kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (paymentId) => {
    const payment = payments.find(p => p.paymentId === paymentId);
    const paymentInfo = payment ? `${payment.customerName} - ₺${payment.amountPaid}` : 'Bu ödeme';
    
    if (window.confirm(`${paymentInfo} kaydını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      try {
        await paymentService.delete(paymentId);
        await fetchData();
      } catch (error) {
        console.error('Ödeme silerken hata:', error);
        alert('Ödeme silinirken bir hata oluştu.');
      }
    }
  };

  const showCustomerBalance = async (customerId) => {
    try {
      setIsBalanceLoading(true);
      const response = await paymentService.getCustomerBalance(customerId);
      setSelectedCustomerBalance(response.data);
      setShowBalanceModal(true);
    } catch (error) {
      console.error('Müşteri bakiye bilgisi alınırken hata:', error);
      alert('Bakiye bilgisi alınırken bir hata oluştu.');
    } finally {
      setIsBalanceLoading(false);
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

  // Calculate statistics
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
    paidCount: payments.filter(p => p.status === 'Paid').length,
    pendingCount: payments.filter(p => p.status === 'Pending').length
  };

  // Table columns
  const columns = [
    {
      title: 'Müşteri',
      key: 'customerName',
      sortable: true,
      render: (value, payment) => (
        <div className={paymentStyles.customerCell}>
          <div className={paymentStyles.customerName}>
            {value}
          </div>
          <button
            onClick={() => showCustomerBalance(payment.customerId)}
            className={paymentStyles.balanceButton}
            disabled={isBalanceLoading}
            type="button"
          >
            {isBalanceLoading ? '...' : '💰 Bakiye'}
          </button>
        </div>
      )
    },
    {
      title: 'Hizmet',
      key: 'serviceName',
      sortable: true,
      render: (value) => (
        <span className={paymentStyles.serviceCell}>
          {value || 'Genel Ödeme'}
        </span>
      )
    },
    {
      title: 'Tutar',
      key: 'amountPaid',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span className={paymentStyles.amountCell}>
          ₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: 'Tarih',
      key: 'paymentDate',
      sortable: true,
      render: (value) => (
        <div className={paymentStyles.dateCell}>
          <div className={paymentStyles.date}>
            {new Date(value).toLocaleDateString('tr-TR')}
          </div>
          <div className={paymentStyles.time}>
            {new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    {
      title: 'Yöntem',
      key: 'paymentMethod',
      sortable: true,
      render: (value) => (
        <span className={paymentStyles.methodBadge}>
          {getMethodLabel(value)}
        </span>
      )
    },
    {
      title: 'Durum',
      key: 'status',
      sortable: true,
      render: (value) => {
        const statusConfig = paymentStatuses.find(s => s.value === value);
        return (
          <span 
            className={paymentStyles.statusBadge}
            style={{
              backgroundColor: `${getStatusColor(value)}20`,
              color: getStatusColor(value),
              borderColor: `${getStatusColor(value)}40`
            }}
          >
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
    <Layout className={paymentStyles.paymentLayout}>
      {/* Page Header */}
      <PageHeader
        title="Ödemeler"
        buttonText="Yeni Ödeme"
        onButtonClick={openAddModal}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Müşteri veya hizmet ara..."
        className={paymentStyles.pageHeader}
      >
        {/* Filter Selects */}
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={statusFilterOptions}
          placeholder="Tüm Durumlar"
          className={paymentStyles.filterSelect}
        />
        <Select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          options={methodFilterOptions}
          placeholder="Tüm Yöntemler"
          className={paymentStyles.filterSelect}
        />
      </PageHeader>

      {/* Statistics Bar */}
      <div className={paymentStyles.statsBar}>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>{stats.totalPayments}</span>
          <span className={paymentStyles.statLabel}>Toplam Ödeme</span>
        </div>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>
            ₺{stats.totalAmount.toLocaleString('tr-TR')}
          </span>
          <span className={paymentStyles.statLabel}>Toplam Tutar</span>
        </div>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>{stats.paidCount}</span>
          <span className={paymentStyles.statLabel}>Ödenen</span>
        </div>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>{stats.pendingCount}</span>
          <span className={paymentStyles.statLabel}>Bekleyen</span>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage={
          searchQuery || filterStatus || filterMethod 
            ? 'Arama kriterlerine uygun ödeme bulunamadı.' 
            : 'Henüz ödeme kaydı bulunmamaktadır. İlk ödemeyi eklemek için "Yeni Ödeme" butonuna tıklayın.'
        }
        onEdit={openEditModal}
        onDelete={handleDelete}
        sortable={true}
        onSort={handleSort}
        sortConfig={sortConfig}
        hover={true}
        className={paymentStyles.paymentTable}
        editButtonText="Düzenle"
        deleteButtonText="Sil"
      />

      {/* Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingPayment ? 'Ödeme Bilgilerini Düzenle' : 'Yeni Ödeme Ekle'}
        size="medium"
        animation="slideUp"
        className={paymentStyles.paymentModal}
      >
        <form onSubmit={handleSubmit} className={paymentStyles.paymentForm}>
          <FormGroup label="Müşteri" required>
            <Select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={customerOptions}
              placeholder="Müşteri Seçin"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup 
            label="Randevu" 
            hint="Belirli bir randevu için ödeme (opsiyonel)"
          >
            <Select
              value={formData.appointmentId}
              onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
              options={formData.customerId ? getCustomerAppointments(formData.customerId).map(apt => ({
                value: apt.appointmentId,
                label: `${apt.serviceName || 'Bilinmeyen Hizmet'} - ${new Date(apt.appointmentDate).toLocaleDateString('tr-TR')}`
              })) : []}
              placeholder="Genel Ödeme"
              disabled={isSubmitting || !formData.customerId}
            />
          </FormGroup>

          <FormGroup label="Tutar (₺)" required>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
              placeholder="Örn: 150.00"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Ödeme Yöntemi">
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={paymentMethods}
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Ödeme Tarihi ve Saati">
            <Input
              type="datetime-local"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Durum">
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={paymentStatuses}
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            submitText={editingPayment ? 'Değişiklikleri Kaydet' : 'Ödemeyi Ekle'}
            isSubmitting={isSubmitting}
            layout="end"
            submitVariant="primary"
          />
        </form>
      </Modal>

      {/* Customer Balance Modal */}
      <Modal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        title="Müşteri Bakiye Durumu"
        size="medium"
        className={paymentStyles.balanceModal}
      >
        {selectedCustomerBalance && (
          <div className={paymentStyles.balanceContent}>
            <h3 className={paymentStyles.balanceCustomerName}>
              {selectedCustomerBalance.customerName}
            </h3>
            
            <div className={paymentStyles.balanceGrid}>
              <div className={paymentStyles.balanceItem}>
                <span className={paymentStyles.balanceLabel}>Toplam Anlaşmalı:</span>
                <span className={paymentStyles.balanceValue}>
                  ₺{selectedCustomerBalance.totalAgreedAmount.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className={paymentStyles.balanceItem}>
                <span className={paymentStyles.balanceLabel}>Toplam Ödenen:</span>
                <span className={`${paymentStyles.balanceValue} ${paymentStyles.balancePositive}`}>
                  ₺{selectedCustomerBalance.totalPaidAmount.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className={paymentStyles.balanceItem}>
                <span className={paymentStyles.balanceLabel}>Bekleyen:</span>
                <span className={`${paymentStyles.balanceValue} ${paymentStyles.balanceWarning}`}>
                  ₺{selectedCustomerBalance.pendingAmount.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className={paymentStyles.balanceItem}>
                <span className={paymentStyles.balanceLabel}>Kalan Borç:</span>
                <span className={`${paymentStyles.balanceValue} ${paymentStyles.balanceNegative}`}>
                  ₺{selectedCustomerBalance.remainingDebt.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
            
            {selectedCustomerBalance.overPaid > 0 && (
              <div className={paymentStyles.balanceCredit}>
                <span className={paymentStyles.balanceCreditLabel}>💳 Kredi:</span>
                <span className={paymentStyles.balanceCreditValue}>
                  ₺{selectedCustomerBalance.overPaid.toLocaleString('tr-TR')}
                </span>
              </div>
            )}
            
            <div className={paymentStyles.balanceFooter}>
              <p>Toplam Ödeme Sayısı: <strong>{selectedCustomerBalance.totalPayments}</strong></p>
              {selectedCustomerBalance.lastPaymentDate && (
                <p>
                  Son Ödeme: <strong>
                    {new Date(selectedCustomerBalance.lastPaymentDate).toLocaleDateString('tr-TR')}
                  </strong>
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