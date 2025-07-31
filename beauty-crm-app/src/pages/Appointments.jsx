// pages/Appointments.jsx - Clean Refactored Version
import React, { useState, useEffect } from 'react';
import { appointmentService, customerService, serviceService } from '../api/api';

import Layout from '../components/layout/Layout';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Calendar from '../components/calendar/Calendar';
import { FormGroup, FormRow, FormCol, FormActions, Input, Select } from '../components/common/';
import commonStyles from '../styles/common.module.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, []);

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

  // Calendar handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (dayInfo) => {
    if (!dayInfo.isCurrentMonth) return;
    const dateStr = dayInfo.date.toISOString().split('T')[0];
    setFormData({ 
      ...formData, 
      appointmentDate: `${dateStr}T09:00` 
    });
    setEditingAppointment(null);
    setShowAddModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      customerId: appointment.customerId.toString(),
      serviceId: appointment.serviceId.toString(),
      appointmentDate: new Date(appointment.appointmentDate).toISOString().slice(0, 16),
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.serviceId || !formData.appointmentDate || !formData.agreedPrice) {
      alert('Tüm gerekli alanları doldurun');
      return;
    }

    try {
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
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
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

  if (isLoading) {
    return (
      <Layout>
        <div className={commonStyles.loading}>
          <div className={commonStyles.spinner}></div>
          <p style={{ color: '#666' }}>Randevular yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  // Error state
  if (!isLoading && (!appointments || !customers || !services)) {
    return (
      <Layout>
        <div className={commonStyles.loading}>
          <p style={{ color: '#dc2626' }}>Veriler yüklenemedi. Lütfen sayfayı yenileyin.</p>
          <button 
            onClick={() => window.location.reload()}
            className={commonStyles.btnPrimary}
          >
            Sayfayı Yenile
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <PageHeader
        title="Randevular"
        buttonText="Yeni Randevu"
        onButtonClick={openAddModal}
      />

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
      />

      {/* Appointment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingAppointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
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

          <FormGroup label="Hizmet" required>
            <Select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={serviceOptions}
              placeholder="Hizmet Seçin"
              required
            />
          </FormGroup>

          <FormGroup label="Randevu Tarihi ve Saati" required>
            <Input
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              required
            />
          </FormGroup>

          <FormGroup label="Anlaşılan Fiyat (₺)" required>
            <Input
              type="number"
              step="0.01"
              value={formData.agreedPrice}
              onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
              placeholder="Fiyat giriniz"
              required
            />
          </FormGroup>

          <FormRow>
            <FormCol>
              <FormGroup label="Toplam Seans">
                <Input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    totalSessions: parseInt(e.target.value) || 1,
                    remainingSessions: editingAppointment ? formData.remainingSessions : (parseInt(e.target.value) || 1)
                  })}
                />
              </FormGroup>
            </FormCol>
            {editingAppointment && (
              <FormCol>
                <FormGroup label="Kalan Seans">
                  <Input
                    type="number"
                    min="0"
                    max={formData.totalSessions}
                    value={formData.remainingSessions}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      remainingSessions: parseInt(e.target.value) || 0
                    })}
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
              />
            </FormGroup>
          )}

          <FormActions
            onCancel={closeModal}
            submitText={editingAppointment ? 'Güncelle' : 'Kaydet'}
          />
        </form>
      </Modal>
    </Layout>
  );
};

export default Appointments;