import React, { useState, useEffect } from 'react';
import { customerService } from '../../api/api';

// Layout ve Component import'ları
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import { FormGroup, FormActions, Input, Textarea } from '../../components/common/Form';
import Table from '../../components/common/Table/Table';
import GradientCard, { GradientCardContent, GradientCardInfo } from '../../components/common/GradientCard';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formErrors, setFormErrors] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
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
    setPage(1);
  }, [customers, searchQuery, sortConfig]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await customerService.getAll();
      setCustomers(response || []);
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

  // Müşteri detayını modal ile göster
  const handleViewDetail = async (customer) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await customerService.getById(customer.customerId);
      setSelectedCustomerDetail(detail);
    } catch (error) {
      console.error('Müşteri detayı yüklenirken hata:', error);
      setShowDetailModal(false);
      setSelectedCustomerDetail(null);
      alert('Müşteri detayları yüklenirken bir hata oluştu.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Modal kapat
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCustomerDetail(null);
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };


  return (
    <Layout className={customerStyles.customerLayout}>
      
      <GradientCard>
        <GradientCardContent>
          <div className={customerStyles.headerContainer}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-xs">Müşteriler</h1>
              <p className="text-gray-600 text-sm leading-relaxed mb-md">
                Müşteri detaylarını (finansal durum, kalan seans, randevu geçmişi) görmek için müşteri adına tıklayın!
              </p>
              
              <div className="flex gap-sm align-center">
                <Input
                  placeholder="Müşteri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                  style={{ minWidth: '150px' }}
                  className="search-input"
                />
                <AddButton onClick={openAddModal} className="add-customer-btn">
                  <span className="mr-1">+</span> Yeni Müşteri
                </AddButton>
              </div>
            </div>
            
            <div>
              <GradientCardInfo
                title="Toplam Müşteri"
                value={customers.length}
              />
            </div>
          </div>
        </GradientCardContent>
      </GradientCard>

      {/* Customers Table */}
      <Table
        title="Müşteri Listesi"
        showWrapper={true}
        showRecordCount={true}
        showPagination={true}
        page={page}
        pageSize={pageSize}
        total={filteredCustomers.length}
        onPageChange={setPage}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
        columns={[
            {
              title: 'Ad Soyad',
              key: 'fullName',
              sortable: true,
              render: (value, customer) => (
                <div className="flex-column gap-xs">
                  <span 
                    className={`${customerStyles.nameText} text-primary`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetail(customer)}
                  >
                    {value}
                  </span>
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
            },
          ]}
          data={filteredCustomers.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map(customer => ({
            ...customer,
            id: customer.customerId
          }))}
          isLoading={isLoading}
          emptyMessage={
            searchQuery 
              ? `"${searchQuery}" için müşteri bulunamadı.` 
              : 'Henüz müşteri kaydı bulunmamaktadır. İlk müşteriyi eklemek için "Yeni Müşteri" butonuna tıklayın.'
          }
          onRowClick={handleViewDetail}
          sortable={true}
          onSort={handleSort}
          sortConfig={sortConfig}
          hover={true}
          striped={false}
          actions={true}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />

      {/* Customer Add/Edit Modal */}
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

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        title="Müşteri Detayları"
        size="large"
        animation="slideUp"
        className={customerStyles.detailModal}
      >
        {loadingDetail ? (
          <div className={customerStyles.modalLoading}>
            <div className={customerStyles.loadingSpinner}></div>
            <p>Müşteri detayları yükleniyor...</p>
          </div>
        ) : selectedCustomerDetail ? (
          <div className={customerStyles.detailModalContent}>
            {/* Müşteri Başlık */}
            <div className={customerStyles.detailHeader}>
              <h2>{selectedCustomerDetail.fullName}</h2>
              {selectedCustomerDetail.phoneNumber && (
                <a href={`tel:${selectedCustomerDetail.phoneNumber}`} className={customerStyles.phoneLink}>
                  📞 {selectedCustomerDetail.phoneNumber}
                </a>
              )}
              {selectedCustomerDetail.notes && (
                <p className={customerStyles.detailNotes}>{selectedCustomerDetail.notes}</p>
              )}
            </div>

            {/* İstatistikler Grid */}
            <div className={customerStyles.statsGrid}>
              <div className={customerStyles.statCard}>
                <div className={customerStyles.statLabel}>Net Borç</div>
                <div className={`${customerStyles.statValue} ${
                  selectedCustomerDetail.netDebt > 0 ? 'text-danger' : 'text-success'
                }`}>
                  {selectedCustomerDetail.netDebt >= 0 
                    ? formatCurrency(selectedCustomerDetail.netDebt) 
                    : `-${formatCurrency(selectedCustomerDetail.netDebt)}`
                  }
                </div>
              </div>
              <div className={customerStyles.statCard}>
                <div className={customerStyles.statLabel}>Toplam Borç</div>
                <div className={customerStyles.statValue}>{formatCurrency(selectedCustomerDetail.totalDebt)}</div>
              </div>
              <div className={customerStyles.statCard}>
                <div className={customerStyles.statLabel}>Toplam Ödenen</div>
                <div className={customerStyles.statValue}>{formatCurrency(selectedCustomerDetail.totalPaid)}</div>
              </div>
              <div className={customerStyles.statCard}>
                <div className={customerStyles.statLabel}>Kalan Seans</div>
                <div className={customerStyles.statValue}>{selectedCustomerDetail.remainingSessions}</div>
              </div>
              <div className={customerStyles.statCard}>
                <div className={customerStyles.statLabel}>Toplam Seans</div>
                <div className={customerStyles.statValue}>{selectedCustomerDetail.totalSessions}</div>
              </div>
              <div className={customerStyles.statCard}>
                <div className={customerStyles.statLabel}>Toplam Randevu</div>
                <div className={customerStyles.statValue}>{selectedCustomerDetail.totalAppointments}</div>
              </div>
            </div>

            {/* Seans Paketleri */}
            {selectedCustomerDetail.sessions && selectedCustomerDetail.sessions.length > 0 && (
              <div className={customerStyles.detailSection}>
                <h3>Seans Paketleri</h3>
                <div className={customerStyles.sessionsList}>
                  {selectedCustomerDetail.sessions.map((session, index) => (
                    <div key={index} className={customerStyles.sessionItem}>
                      <div className={customerStyles.sessionInfo}>
                        <strong>{session.serviceName}</strong>
                        {session.categoryName && (
                          <span className={customerStyles.categoryTag}>{session.categoryName}</span>
                        )}
                      </div>
                      <div className={customerStyles.sessionProgress}>
                        <div className={customerStyles.progressInfo}>
                          <span>{session.totalSessions - session.remainingSessions} / {session.totalSessions} Seans</span>
                          <span className={session.isActive ? customerStyles.activeTag : customerStyles.inactiveTag}>
                            {session.isActive ? 'Aktif' : 'Tamamlandı'}
                          </span>
                        </div>
                        <div className={customerStyles.progressBar}>
                          <div 
                            className={customerStyles.progressFill}
                            style={{ width: `${session.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Randevu Geçmişi */}
            {selectedCustomerDetail.appointmentHistory && selectedCustomerDetail.appointmentHistory.length > 0 && (
              <div className={customerStyles.detailSection}>
                <h3>Son Randevular</h3>
                <div className={customerStyles.appointmentsList}>
                  {selectedCustomerDetail.appointmentHistory.slice(0, 5).map((appointment, index) => (
                    <div key={index} className={customerStyles.appointmentItem}>
                      <div className={customerStyles.appointmentDate}>
                        {new Date(appointment.appointmentDate).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className={customerStyles.appointmentInfo}>
                        <strong>{appointment.serviceName}</strong>
                        {appointment.serviceCategory && (
                          <span className={customerStyles.categoryTag}>{appointment.serviceCategory}</span>
                        )}
                        <div className={customerStyles.appointmentMeta}>
                          <span>{formatCurrency(appointment.agreedPrice)}</span>
                          <span className={customerStyles.statusTag}>{appointment.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ödeme Geçmişi */}
            {selectedCustomerDetail.paymentHistory && selectedCustomerDetail.paymentHistory.length > 0 && (
              <div className={customerStyles.detailSection}>
                <h3>Son Ödemeler</h3>
                <div className={customerStyles.paymentsList}>
                  {selectedCustomerDetail.paymentHistory.slice(0, 5).map((payment, index) => (
                    <div key={index} className={customerStyles.paymentItem}>
                      <div className={customerStyles.paymentDate}>
                        {new Date(payment.paymentDate).toLocaleDateString('tr-TR')}
                      </div>
                      <div className={customerStyles.paymentInfo}>
                        <strong>{payment.appointmentInfo || 'Genel Ödeme'}</strong>
                        <div className={customerStyles.paymentMeta}>
                          <span className={customerStyles.paymentAmount}>{formatCurrency(payment.amountPaid)}</span>
                          <span className={customerStyles.paymentMethod}>{payment.paymentMethod}</span>
                          <span className={payment.status === 'Ödendi' ? customerStyles.paidTag : customerStyles.pendingTag}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={customerStyles.modalError}>
            Müşteri detayları yüklenemedi.
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Customers;