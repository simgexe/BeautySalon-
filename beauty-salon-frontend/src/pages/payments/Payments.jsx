
import React, { useState, useEffect, useCallback} from 'react';
import { paymentService, customerService, appointmentService, PaymentStatus, PaymentMethodType } from '../../api/api';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Table from '../../components/common/Table/Table';
import Modal from '../../components/common/Modal/Modal';
import { FormGroup, FormActions, Input, Select } from '../../components/common/Form';
import GradientCard, { GradientCardContent, GradientCardMain, GradientCardActions } from '../../components/common/GradientCard/GradientCard';
import FilterBar from '../../components/common/FilterBar/FilterBar';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import paymentStyles from './payments.module.css';

const Payments = () => {
  const { isAdmin, isSpecialist } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [formData, setFormData] = useState({
    customerId: '',
    appointmentId: '',
    amountPaid: '',
    paymentMethod: PaymentMethodType.Cash,
    paymentDate: new Date().toISOString().slice(0, 16),
    status: PaymentStatus.Pending, 
    paymentNotes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // ✅ Sadece form için gerekli - sayısal enum değerleri
  const paymentMethods = [
    { value: PaymentMethodType.Cash, label: 'Nakit' },
    { value: PaymentMethodType.CreditCard, label: 'Kredi Kartı' },
    { value: PaymentMethodType.DebitCard, label: 'Banka Kartı' },
    { value: PaymentMethodType.BankTransfer, label: 'Havale' }
  ];

  const paymentStatuses = [
    { value: PaymentStatus.Pending, label: 'Bekliyor', color: '#F59E0B' },
    { value: PaymentStatus.Paid, label: 'Ödendi', color: '#10B981' },
    { value: PaymentStatus.Cancelled, label: 'İptal', color: '#EF4444' },
    { value: PaymentStatus.Refunded, label: 'İade', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [paymentsRes, customersRes, appointmentsRes] = await Promise.all([
        paymentService.getAll(),
        customerService.getAll(),
        appointmentService.getAll()
      ]);
     
      setPayments(paymentsRes || []);
      setCustomers(customersRes || []);
      setAppointments(appointmentsRes || []);
    } catch (error) {
      console.error('Veri yüklerken hata:', error);
      setPayments([]);
      setCustomers([]);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toLocalInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Filter payments
  useEffect(() => {
    let filtered = [...payments];

    // Tarih filtresi
    if (dateFilter) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        return paymentDate === dateFilter;
      });
    }

    // Ay filtresi
    if (monthFilter) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const paymentMonth = paymentDate.getMonth() + 1; // getMonth() 0-11 arası döner
        return paymentMonth === parseInt(monthFilter);
      });
    }

    // Yıl filtresi
    if (yearFilter) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const paymentYear = paymentDate.getFullYear();
        return paymentYear === parseInt(yearFilter);
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.customerName?.toLowerCase().includes(query) ||
        payment.serviceName?.toLowerCase().includes(query) ||
        payment.paymentNotes?.toLowerCase().includes(query)
      );
    }

    if (filterStatus) {
      const filterStatusNum = parseInt(filterStatus);
      filtered = filtered.filter(payment => {
        // Backend'den gelen status string olabilir ("Paid") veya sayısal olabilir (2)
        if (typeof payment.status === 'string') {
          // String ise enum değerlerini karşılaştır
          const statusMap = {
            1: 'Pending',
            2: 'Paid',
            3: 'Cancelled',
            4: 'Refunded'
          };
          return payment.status === statusMap[filterStatusNum];
        } else {
          // Sayısal ise direkt karşılaştır
          return payment.status === filterStatusNum;
        }
      });
    }

    if (filterMethod) {
      const filterMethodNum = parseInt(filterMethod);
      filtered = filtered.filter(payment => {
        // Backend'den gelen method string olabilir ("Cash") veya sayısal olabilir (1)
        if (typeof payment.paymentMethod === 'string') {
          // String ise enum değerlerini karşılaştır
          const methodMap = {
            1: 'Cash',
            2: 'CreditCard',
            3: 'DebitCard',
            4: 'BankTransfer'
          };
          return payment.paymentMethod === methodMap[filterMethodNum];
        } else {
          // Sayısal ise direkt karşılaştır
          return payment.paymentMethod === filterMethodNum;
        }
      });
    }

    setFilteredPayments(filtered);
    setPage(1);
  }, [payments, searchQuery, filterStatus, filterMethod, dateFilter, monthFilter, yearFilter]);

  const handleSort = useCallback((field, direction) => {
    setSortConfig({ field, direction });
    
    const sortedData = [...filteredPayments].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      if (field === 'paymentDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (field === 'amountPaid') {
        aValue = typeof aValue === 'number' ? aValue : parseFloat(aValue);
        bValue = typeof bValue === 'number' ? bValue : parseFloat(bValue);
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredPayments(sortedData);
  }, [filteredPayments]);

  const openAddModal = () => {
    setEditingPayment(null);
    setFormData({
      customerId: '',
      appointmentId: '',
      amountPaid: '',
      paymentMethod: PaymentMethodType.Cash, // ✅ API enum kullan
      paymentDate: new Date().toISOString().slice(0, 16),
      status: PaymentStatus.Pending, // ✅ API enum kullan
      paymentNotes: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormData({
      customerId: payment.customerId.toString(),
      appointmentId: payment.appointmentId?.toString() || '',
      amountPaid: payment.amountPaid.toString(),
      paymentMethod: payment.paymentMethod, // ✅ Sayısal enum değeri
      paymentDate: toLocalInput(new Date(payment.paymentDate)),
      status: payment.status, // ✅ Sayısal enum değeri
      paymentNotes: payment.paymentNotes || ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingPayment(null);
    setFormErrors({});
    setFormData({
      customerId: '',
      appointmentId: '',
      amountPaid: '',
      paymentMethod: PaymentMethodType.Cash, // ✅ API enum kullan
      paymentDate: new Date().toISOString().slice(0, 16),
      status: PaymentStatus.Pending, // ✅ API enum kullan
      paymentNotes: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.amountPaid) {
      alert('Müşteri ve tutar alanları zorunludur');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentData = {
        customerId: formData.customerId,
        appointmentId: formData.appointmentId ? parseInt(formData.appointmentId) : null,
        amountPaid: parseFloat(formData.amountPaid),
        paymentMethod: formData.paymentMethod, // ✅ Sayısal enum değeri
        paymentDate: formData.paymentDate,
        status: formData.status, // ✅ Sayısal enum değeri
        paymentNotes: formData.paymentNotes || ''
      };

      if (editingPayment) {
        await paymentService.update(editingPayment.paymentId, paymentData);
      } else {
        // Eğer randevu seçilmişse parçalı ödeme olarak ekle
        if (formData.appointmentId) {
          await paymentService.addPartialPayment(
            parseInt(formData.appointmentId),
            parseFloat(formData.amountPaid),
            formData.paymentMethod,
            formData.paymentNotes
          );
        } else {
          await paymentService.create(paymentData);
        }
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
    // Admin kontrolü
    if (!isAdmin()) {
      toast.error('Bu işlem için admin yetkisi gereklidir');
      return;
    }

    const payment = payments.find(p => p.paymentId === paymentId);
    const paymentInfo = payment ? `${payment.customerName} - ₺${payment.amountPaid}` : 'Bu ödeme';
    
    if (window.confirm(`${paymentInfo} kaydını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      try {
        await paymentService.delete(paymentId);
        toast.success('Ödeme başarıyla silindi');
        await fetchData();
      } catch (error) {
        console.error('Ödeme silerken hata:', error);
        toast.error('Ödeme silinirken bir hata oluştu.');
      }
    }
  };

  const showCustomerBalance = async (customerId) => {
    try {
      setIsBalanceLoading(true);
      const response = await paymentService.getCustomerBalance(customerId);
      setSelectedCustomerBalance(response);
      setShowBalanceModal(true);
    } catch (error) {
      console.error('Müşteri bakiye bilgisi alınırken hata:', error);
      alert('Bakiye bilgisi alınırken bir hata oluştu.');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const toggleNotesExpansion = (paymentId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [paymentId]: !prev[paymentId]
    }));
  };

  // ✅ Helper functions - sadece color için, display API'den gelecek
  const getStatusColor = (status) => {
    const statusConfig = paymentStatuses.find(s => s.value === status);
    return statusConfig?.color || '#6B7280';
  };

  const getCustomerAppointments = (customerId) => {
    return appointments.filter(apt => apt.customerId === parseInt(customerId));
  };

  // ✅ Normalize and calculate statistics (status can be numeric, string, or numeric string)
  // Filtrelenmiş ödemeler üzerinden istatistikleri hesapla
  const normalizedFilteredPayments = filteredPayments.map(p => {
    const statusValue = typeof p.status === 'number' 
      ? p.status 
      : (PaymentStatus[p.status] ?? parseInt(p.status, 10));
    const amountValue = typeof p.amountPaid === 'number' 
      ? p.amountPaid 
      : parseFloat(p.amountPaid);
    return {
      ...p,
      _status: statusValue,
      _amount: Number.isFinite(amountValue) ? amountValue : 0
    };
  });

  const stats = {
    totalPayments: normalizedFilteredPayments.length,
    totalAmount: normalizedFilteredPayments
      .filter(p => p._status === PaymentStatus.Paid)
      .reduce((sum, p) => sum + p._amount, 0),
    // Amount totals per status
    paidAmount: normalizedFilteredPayments
      .filter(p => p._status === PaymentStatus.Paid)
      .reduce((sum, p) => sum + p._amount, 0),
    pendingAmount: normalizedFilteredPayments
      .filter(p => p._status === PaymentStatus.Pending)
      .reduce((sum, p) => sum + p._amount, 0),
    cancelledAmount: normalizedFilteredPayments
      .filter(p => p._status === PaymentStatus.Cancelled)
      .reduce((sum, p) => sum + p._amount, 0),
    refundedAmount: normalizedFilteredPayments
      .filter(p => p._status === PaymentStatus.Refunded)
      .reduce((sum, p) => sum + p._amount, 0)
  };

  // ✅ Table columns - API helper'ları kullanacak şekilde
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
      title: 'Kategori',
      key: 'serviceCategoryName',
      sortable: true,
      render: (value) => (
        <span className={paymentStyles.categoryCell}>
          {value || '-'}
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
      render: (value,row) => (
        <span className={paymentStyles.methodBadge}>
          {row.paymentMethodDisplay} 
        </span>
      )
    },
    {
      title: 'Durum',
      key: 'status',
      sortable: true,
      render: (value,row) => (
        <span 
          className="status-badge"
          style={{
            backgroundColor: `${getStatusColor(value)}20`,
            color: getStatusColor(value),
            borderColor: `${getStatusColor(value)}40`
          }}
        >
          {row.statusDisplay}
        </span>
      )
    },
    {
      title: 'Notlar',
      key: 'paymentNotes',
      sortable: false,
      render: (value, row) => (
        <div className={paymentStyles.notesCell}>
          {value ? (
            <div className={paymentStyles.notesContent}>
              <span className={paymentStyles.notesText} title={value}>
                {expandedNotes[row.paymentId] ? value : (value.length > 50 ? `${value.substring(0, 50)}...` : value)}
              </span>
              {value.length > 50 && (
                <button 
                  className={paymentStyles.notesToggle}
                  onClick={() => toggleNotesExpansion(row.paymentId)}
                  type="button"
                >
                  {expandedNotes[row.paymentId] ? 'Daha Az' : 'Daha Fazla'}
                </button>
              )}
            </div>
          ) : (
            <span className={paymentStyles.noNotes}>-</span>
          )}
        </div>
      )
    }
  ];

  // Prepare options
  const customerOptions = customers.map(customer => ({
    value: customer.customerId,
    label: customer.fullName
  }));

  // Table data with id (paged)
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const tableData = filteredPayments.slice(start, end).map(payment => ({
    ...payment,
    id: payment.paymentId
  }));

  return (
    <Layout className={paymentStyles.paymentLayout}>

      {/* Gradient Card with Info and Filters */}
      <GradientCard className={paymentStyles.infoCard}>
        <GradientCardContent>
          <div className="section-header">
            <div>
              <h2 className="section-title">Ödemeler</h2>
              <p className="section-subtitle">
                {isAdmin() ? (
                  <>Tüm ödemeleri görüntüleyebilir, düzenleyebilir ve silebilirsiniz. Müşteri yeni seans paketi randevusu aldığında otomatik ödeme eklenir. Yeni ödeme butonu ile parçalı ödeme de ekleyebilirsiniz.</>
                ) : isSpecialist() ? (
                  <>Sadece kendi uzmanlık kategorilerinizdeki ödemeleri görüntüleyebilir, düzenleyebilir ve silebilirsiniz. Müşteri bakiyesine tıklayınca müşterinin borç özetini görebilirsiniz.</>
                ) : (
                  <>Müşteri yeni seans paketi randevusu aldığında otomatik ödeme eklenir. Yeni ödeme butonu ile parçalı ödeme de ekleyebilirsiniz. Müşteri bakiyesine tıklayınca müşterinin borç özetini görebilirsiniz.</>
                )}
              </p>
            </div>
            
            <div className="flex flex-end" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Müşteri veya hizmet ara..."
                dateFilter={dateFilter}
                onDateChange={setDateFilter}
                monthFilter={monthFilter}
                onMonthChange={setMonthFilter}
                yearFilter={yearFilter}
                onYearChange={setYearFilter}
                statusFilter={filterStatus}
                onStatusChange={setFilterStatus}
                statusOptions={paymentStatuses.map(s => ({ value: s.value, label: s.label }))}
                statusPlaceholder="Tüm Durumlar"
                methodFilter={filterMethod}
                onMethodChange={setFilterMethod}
                methodOptions={paymentMethods.map(m => ({ value: m.value, label: m.label }))}
                methodPlaceholder="Tüm Yöntemler"
                onClearFilters={() => {
                  setSearchQuery('');
                  setDateFilter('');
                  setMonthFilter('');
                  setYearFilter('');
                  setFilterStatus('');
                  setFilterMethod('');
                }}
                showSearch={true}
                showDate={true}
                showMonth={true}
                showYear={true}
                showStatus={true}
                showMethod={true}
                showCategory={false}
                showSpecialist={false}
                showAmountRange={false}
                showExpenseCategory={false}
              />
              
              <AddButton onClick={openAddModal}>+ Yeni Ödeme</AddButton>
            </div>
          </div>
        </GradientCardContent>
      </GradientCard>

      {/* ✅ Statistics Bar - iptal sayısı eklendi */}
      <div className={paymentStyles.statsBar}>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>{stats.totalPayments}</span>
          <span className={paymentStyles.statLabel}>Toplam Ödeme</span>
        </div>
        
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>₺{stats.paidAmount.toLocaleString('tr-TR')}</span>
          <span className={paymentStyles.statLabel}>Ödenen</span>
        </div>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>₺{stats.pendingAmount.toLocaleString('tr-TR')}</span>
          <span className={paymentStyles.statLabel}>Bekleyen</span>
        </div>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>₺{stats.cancelledAmount.toLocaleString('tr-TR')}</span>
          <span className={paymentStyles.statLabel}>İptal</span>
        </div>
        <div className={paymentStyles.statItem}>
          <span className={paymentStyles.statValue}>
            ₺{stats.refundedAmount.toLocaleString('tr-TR')}
          </span>
          <span className={paymentStyles.statLabel}>İade</span>
        </div>
      </div>

      {/* Table */}
      <Table
        title={
          isAdmin() 
            ? "Tüm Ödemeler" 
            : isSpecialist() 
            ? "Uzmanlık Kategorilerinizdeki Ödemeler" 
            : "Ödeme Listesi"
        }
        showWrapper={true}
        showRecordCount={true}
        showPagination={true}
        page={page}
        pageSize={pageSize}
        total={filteredPayments.length}
        onPageChange={setPage}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          emptyMessage={
            searchQuery || filterStatus || filterMethod 
              ? 'Arama kriterlerine uygun ödeme bulunamadı.' 
              : isSpecialist() 
              ? 'Uzmanlık kategorilerinizde henüz ödeme kaydı bulunmamaktadır.'
              : 'Henüz ödeme kaydı bulunmamaktadır. İlk ödemeyi eklemek için "Yeni Ödeme" butonuna tıklayın.'
          }
          onEdit={openEditModal}
          onDelete={handleDelete}
          sortable={true}
          onSort={handleSort}
          sortConfig={sortConfig}
          hover={true}
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
        <div className={paymentStyles.paymentForm}>
          <FormGroup label="Müşteri" required error={formErrors.customerId}>
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
              onChange={(e) => {
                const selectedAppointmentId = e.target.value;
                if (selectedAppointmentId) {
                  // Randevu seçildiğinde fiyatı otomatik doldur
                  const selectedAppointment = getCustomerAppointments(formData.customerId)
                    .find(apt => apt.appointmentId === parseInt(selectedAppointmentId));
                  setFormData({ 
                    ...formData, 
                    appointmentId: selectedAppointmentId,
                    amountPaid: selectedAppointment ? selectedAppointment.agreedPrice.toString() : ''
                  });
                } else {
                  // Genel ödeme seçildiğinde fiyatı temizle
                  setFormData({ ...formData, appointmentId: '', amountPaid: '' });
                }
              }}
              options={formData.customerId ?
                getCustomerAppointments(formData.customerId).map(apt => ({
                  value: apt.appointmentId,
                  label: `${apt.serviceName || 'Bilinmeyen Hizmet'} - ₺${apt.agreedPrice} - ${new Date(apt.appointmentDate).toLocaleDateString('tr-TR')}`
                })) : []}
              placeholder="Genel Ödeme"
              disabled={isSubmitting || !formData.customerId}
            />
          </FormGroup>

          <FormGroup 
            label="Tutar (₺)" 
            required 
            error={formErrors.amountPaid}
            hint={formData.appointmentId ? "Randevu fiyatı otomatik dolduruldu" : "Genel borçtan düşmek için ödeme tutarı"}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
              placeholder={formData.appointmentId ? "Randevu fiyatı" : "Örn: 150.00"}
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Ödeme Yöntemi">
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: parseInt(e.target.value) })} // ✅ parseInt
              options={paymentMethods}
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Ödeme Tarihi ve Saati" error={formErrors.paymentDate}>
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
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })} // ✅ parseInt
              options={paymentStatuses}
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup 
            label="Notlar" 
            hint="Ödeme hakkında eklemek istediğiniz notlar (opsiyonel)"
          >
           <Input
            type="text"
            value={formData.paymentNotes || ''}
            onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
            placeholder="Ödeme ile ilgili notlar ekleyebilirsiniz..."
            disabled={isSubmitting}
          />
          </FormGroup>

          <FormActions
            onCancel={closeModal}
            onSubmit={handleSubmit}
            submitText={editingPayment ? 'Değişiklikleri Kaydet' : 'Ödemeyi Ekle'}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
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