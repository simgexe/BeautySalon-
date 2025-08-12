// pages/Appointments.jsx 
import React, { useState, useEffect } from 'react';
import { appointmentService, customerService, serviceService } from '../api/api';

// Layout ve Component import'ları
import Layout , {AddButton} from '../components/Layout/Layout';
import Modal from '../components/common/Modal/Modal';
import Calendar from '../components/common/Calendar/Calendar';
import Table from '../components/common/Table/Table'; 
import { FormGroup, FormRow, FormCol, FormActions, Input, Select } from '../components/common/Form';

// Sayfa özel stilleri
import appointmentStyles from './appointments.module.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Filtreler ve liste
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    appointmentDate: '',
    agreedPrice: '',
    totalSessions: 1,
    remainingSessions: 1,
    status: 'Scheduled'
  });

  const appointmentStatuses = [
    { value: 'Scheduled', label: 'Planlandı', color: '#4F46E5' },
    { value: 'Confirmed', label: 'Onaylandı', color: '#10B981' },
    { value: 'Completed', label: 'Tamamlandı', color: '#6B7280' },
    { value: 'Cancelled', label: 'İptal', color: '#EF4444' },
    { value: 'NoShow', label: 'Gelmedi', color: '#F59E0B' }
  ];

  console.log('Appointment statuses:', appointmentStatuses); // Debug için

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let data = [...appointments];

    if (filterStatus) data = data.filter(a => a.status === filterStatus);
    if (filterCustomer) data = data.filter(a => a.customerId === parseInt(filterCustomer));
    if (filterService) data = data.filter(a => a.serviceId === parseInt(filterService));
    if (filterDateFrom) data = data.filter(a => new Date(a.appointmentDate) >= new Date(filterDateFrom));
    if (filterDateTo) data = data.filter(a => new Date(a.appointmentDate) <= new Date(`${filterDateTo}T23:59:59`));

    setFilteredAppointments(data);
  }, [appointments, filterStatus, filterCustomer, filterService, filterDateFrom, filterDateTo]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [appointmentsRes, customersRes, servicesRes] = await Promise.all([
        appointmentService.getAll(),
        customerService.getAll(),
        serviceService.getAll()
      ]);
      
      setAppointments(appointmentsRes.data || []);
      setCustomers(customersRes.data || []);
      setServices(servicesRes.data || []);
      
    } catch (error) {
      console.error('Veri yüklerken detaylı hata:', error);
      
      if (error.message.includes('fetch')) {
        alert('API bağlantısı kurulamadı. Backend çalışıyor mu?');
      } else {
        alert(`Veri yüklenirken hata: ${error.message}`);
      }
      
      setAppointments([]);
      setCustomers([]);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };
  
    const toLocalInput = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
  // Calendar handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (dayInfo) => {
    if (!dayInfo?.isCurrentMonth) return;

    // dayInfo.date her zaman Date olmayabilir; güvenli dönüştürme:
    const d = dayInfo.date instanceof Date ? dayInfo.date : new Date(dayInfo.date);

    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
    setFormData((prev) => ({
      ...prev,
      appointmentDate: toLocalInput(local),
    }));
    setEditingAppointment(null);
    setShowAddModal(true);
  };

  const handleEditAppointment = (appointment) => {
    console.log('Editing appointment:', appointment); // Debug için
    setEditingAppointment(appointment);
    setFormData({
      customerId: appointment.customerId.toString(),
      serviceId: appointment.serviceId.toString(),
      appointmentDate: toLocalInput(new Date(appointment.appointmentDate)),
      agreedPrice: appointment.agreedPrice.toString(),
      totalSessions: appointment.totalSessions,
      remainingSessions: appointment.remainingSessions,
      status: appointment.status
    });
    setShowAddModal(true);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      try {
        await appointmentService.delete(appointmentId);
        fetchData();
      } catch (error) {
        console.error('Randevu silerken hata:', error);
        alert('Randevu silinirken bir hata oluştu');
      }
    }
  };

  // Form handlers
  const handleSubmit = async () => {
    if (!formData.customerId || !formData.serviceId || !formData.appointmentDate || !formData.agreedPrice) {
      alert('Tüm gerekli alanları doldurun');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const appointmentData = {
        customerId: formData.customerId,
        serviceId: formData.serviceId,
        appointmentDate: formData.appointmentDate,
        agreedPrice: formData.agreedPrice,
        totalSessions: formData.totalSessions,
        remainingSessions: formData.remainingSessions,
        status: formData.status
      };

      if (editingAppointment) {
        await appointmentService.update(editingAppointment.appointmentId, appointmentData);
      } else {
        await appointmentService.create(appointmentData);
      }
      const customerName = customers.find(c => c.customerId === parseInt(formData.customerId))?.fullName || 'Müşteri';
    const serviceName = services.find(s => s.serviceId === parseInt(formData.serviceId))?.serviceName || 'Hizmet';
    
    alert(`✅ Randevu oluşturuldu!\n\n` +
          `👤 Müşteri: ${customerName}\n` +
          `🛍️ Hizmet: ${serviceName}\n` +
          `💰 Tutar: ₺${formData.agreedPrice}\n\n` +
          `📝 Ödeme kaydı da otomatik olarak "Bekliyor" statüsünde oluşturuldu. Ödemeler sayfasından kontrol edebilirsiniz.`);
      
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Randevu kaydederken detaylı hata:', error);
      
      if (error.message.includes('400')) {
        alert('Geçersiz veri. Lütfen tüm alanları kontrol edin.');
      } else if (error.message.includes('409')) {
        alert('Bu saatte başka bir randevu var.');
      } else {
        alert(`Randevu kaydedilirken hata: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeModal = () => {
    setShowAddModal(false);
    setEditingAppointment(null);
    setFormErrors({});
    setFormData({
      customerId: '',
      serviceId: '',
      appointmentDate: '',
      agreedPrice: '',
      totalSessions: 1,
      remainingSessions: 1,
      status: 'Scheduled'
    });
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.serviceId === parseInt(serviceId));
    setFormData({
      ...formData,
      serviceId: serviceId,
      agreedPrice: service ? service.price.toString() : ''
    });
  };

  const openAddModal = () => {
    setEditingAppointment(null);
    setFormData({
      customerId: '',
      serviceId: '',
      appointmentDate: '',
      agreedPrice: '',
      totalSessions: 1,
      remainingSessions: 1,
      status: 'Scheduled'
    });
    setShowAddModal(true);
  };

  // Helper functions for Calendar component
  const getStatusColor = (status) => {
    const statusConfig = appointmentStatuses.find(s => s.value === status);
    return statusConfig?.color || '#4F46E5';
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.fullName : 'Bilinmeyen';
  };

  // Prepare options for form
  const customerOptions = customers.map(customer => ({
    value: customer.customerId,
    label: customer.fullName
  }));

  const serviceOptions = services.map(service => ({
    value: service.serviceId,
    label: `${service.serviceName} - ₺${service.price}`
  }));

  // Loading state
  if (isLoading) {
    return (
      <Layout className={appointmentStyles.appointmentLayout}>
        <div className={appointmentStyles.loadingContainer}>
          <div className={appointmentStyles.spinner}></div>
          <p className={appointmentStyles.loadingText}>Randevular yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  // Error state
  if (!isLoading && (!appointments || !customers || !services)) {
    return (
      <Layout className={appointmentStyles.appointmentLayout}>
        <div className={appointmentStyles.errorContainer}>
          <p className={appointmentStyles.errorText}>
            Veriler yüklenemedi. Lütfen sayfayı yenileyin.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className={appointmentStyles.reloadButton}
          >
            Sayfayı Yenile
          </button>
        </div>
      </Layout>
    );
  }

  // Liste kolonları
  const columns = [
    { title: 'Tarih', key: 'appointmentDate', sortable: true, render: (v) => new Date(v).toLocaleDateString('tr-TR') },
    { title: 'Saat', key: 'appointmentTime', sortable: false, render: (_, row) => new Date(row.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) },
    { title: 'Müşteri', key: 'customerName', sortable: true, render: (_, row) => getCustomerName(row.customerId) },
    { title: 'Hizmet', key: 'serviceName', sortable: true, render: (v) => v || '-' },
    { title: 'Durum', key: 'status', sortable: true, render: (_, row) => {
      const statusConfig = appointmentStatuses.find(s => s.value === row.status);
      return statusConfig ? statusConfig.label : row.status;
    }}
  ];

  // Tablo verisi
  const tableData = filteredAppointments.map(a => ({
    ...a,
    id: a.appointmentId
  }));

  return (
    <Layout className={appointmentStyles.appointmentLayout}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <AddButton onClick={openAddModal}>+ Yeni Randevu</AddButton>
      </div>
      {/* Calendar Component */}
      <Calendar
  currentDate={currentDate}
  onPrevMonth={handlePrevMonth}
  onNextMonth={handleNextMonth}
  onDateClick={handleDateClick}
  appointments={appointments}
  onAppointmentClick={handleEditAppointment}
  onAppointmentDelete={handleDeleteAppointment}
  getCustomerName={getCustomerName}
  getStatusColor={getStatusColor}
  className={appointmentStyles.appointmentCalendar}
/>

{/* Filtreler */}
<div className={appointmentStyles.appointmentFiltersBar}>
  <Select
    className={appointmentStyles.appointmentFilter}
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    options={[
      { value: 'Scheduled', label: 'Planlandı' },
      { value: 'Confirmed', label: 'Onaylandı' },
      { value: 'Completed', label: 'Tamamlandı' },
      { value: 'Cancelled', label: 'İptal' },
      { value: 'NoShow', label: 'Gelmedi' }
    ]}
    placeholder="Tüm Durumlar"
  />
  <Select
    className={appointmentStyles.appointmentFilter}
    value={filterCustomer}
    onChange={(e) => setFilterCustomer(e.target.value)}
    options={customers.map(c => ({ value: c.customerId, label: c.fullName }))}
    placeholder="Tüm Müşteriler"
  />
  <Select
    className={appointmentStyles.appointmentFilter}
    value={filterService}
    onChange={(e) => setFilterService(e.target.value)}
    options={services.map(s => ({ value: s.serviceId, label: s.serviceName }))}
    placeholder="Tüm Hizmetler"
  />
  <Input
    className={appointmentStyles.appointmentFilter}
    type="date"
    value={filterDateFrom}
    onChange={(e) => setFilterDateFrom(e.target.value)}
    placeholder="Başlangıç"
  />
  <Input
    className={appointmentStyles.appointmentFilter}
    type="date"
    value={filterDateTo}
    onChange={(e) => setFilterDateTo(e.target.value)}
    placeholder="Bitiş"
  />
  <button
    type="button"
    className={appointmentStyles.resetFiltersButton}
    onClick={() => {
      setFilterStatus('');
      setFilterCustomer('');
      setFilterService('');
      setFilterDateFrom('');
      setFilterDateTo('');
    }}
  >
    Filtreleri Sıfırla
  </button>
</div>

{/* Randevu Listesi */}
<div className={appointmentStyles.appointmentListCard}>
  <div className={appointmentStyles.appointmentListHeader}>
    <h3 className={appointmentStyles.appointmentListTitle}>Randevu Listesi</h3>
    <span className={appointmentStyles.appointmentListCount}>
      {filteredAppointments.length} kayıt
    </span>
  </div>

  <Table
    className={appointmentStyles.appointmentTable} 
    columns={columns}
    data={tableData}
    isLoading={isLoading}
    onEdit={handleEditAppointment}
    onDelete={handleDeleteAppointment}
    sortable={true}
    hover={true}
    striped={false}
    compact={false}
    editButtonText="Düzenle"
    deleteButtonText="Sil"
  />
</div>

      {/* Appointment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingAppointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
        size="medium"
        animation="slideUp"
        className={appointmentStyles.appointmentModal}
      >
        <div className={appointmentStyles.appointmentForm}>
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

          <FormGroup label="Hizmet" required error={formErrors.serviceId}>
            <Select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={serviceOptions}
              placeholder="Hizmet Seçin"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Randevu Tarihi ve Saati" required error={formErrors.appointmentDate}>
            <Input
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup label="Anlaşılan Fiyat (₺)" required error={formErrors.agreedPrice}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.agreedPrice}
              onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
              placeholder="Fiyat giriniz"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormRow gap="medium">
            <FormCol>
              <FormGroup label="Toplam Seans" error={formErrors.totalSessions}>
                <Input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    totalSessions: parseInt(e.target.value) || 1,
                    remainingSessions: editingAppointment ? formData.remainingSessions : (parseInt(e.target.value) || 1)
                  })}
                  disabled={isSubmitting}
                />
              </FormGroup>
            </FormCol>
            {editingAppointment && (
              <FormCol>
                <FormGroup label="Kalan Seans" error={formErrors.remainingSessions}>
                  <Input
                    type="number"
                    min="0"
                    max={formData.totalSessions}
                    value={formData.remainingSessions}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      remainingSessions: parseInt(e.target.value) || 0
                    })}
                    disabled={isSubmitting}
                  />
                </FormGroup>
              </FormCol>
            )}
          </FormRow>

          {editingAppointment && (
            <FormGroup label="Durum">
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={appointmentStatuses}
                disabled={isSubmitting}
              />
            </FormGroup>
          )}

          <FormActions
            onCancel={closeModal}
            onSubmit={handleSubmit}
            submitText={editingAppointment ? 'Güncelle' : 'Kaydet'}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default Appointments;