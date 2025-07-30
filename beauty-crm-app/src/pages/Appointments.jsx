import React, { useState, useEffect } from 'react';
import { appointmentService, customerService, serviceService } from '../api/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // API çağrılarını ayrı ayrı yap ve debug et
      console.log('Fetching appointments...');
      const appointmentsRes = await appointmentService.getAll();
      console.log('Appointments response:', appointmentsRes);
      
      console.log('Fetching customers...');
      const customersRes = await customerService.getAll();
      console.log('Customers response:', customersRes);
      
      console.log('Fetching services...');
      const servicesRes = await serviceService.getAll();
      console.log('Services response:', servicesRes);
      
      setAppointments(appointmentsRes.data || []);
      setCustomers(customersRes.data || []);
      setServices(servicesRes.data || []);
      
    } catch (error) {
      console.error('Veri yüklerken detaylı hata:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Kullanıcıya daha detaylı hata mesajı
      if (error.message.includes('fetch')) {
        alert('API bağlantısı kurulamadı. Backend çalışıyor mu?');
      } else {
        alert(`Veri yüklenirken hata: ${error.message}`);
      }
      
      // Boş arrayler set et ki sayfa crash olmasın
      setAppointments([]);
      setCustomers([]);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Önceki ayın son günleri
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Sonraki ayın ilk günleri (6 satır olması için)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (dayInfo) => {
    if (!dayInfo.isCurrentMonth) return;
    setSelectedDate(dayInfo.date);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form data before submit:', formData);
    
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
      
      console.log('Sending appointment data:', appointmentData);

      if (editingAppointment) {
        console.log('Updating appointment:', editingAppointment.appointmentId);
        await appointmentService.update(editingAppointment.appointmentId, appointmentData);
      } else {
        console.log('Creating new appointment');
        await appointmentService.create(appointmentData);
      }
      
      console.log('Appointment saved successfully');
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Randevu kaydederken detaylı hata:', error);
      console.error('Error response:', error.response);
      
      if (error.message.includes('400')) {
        alert('Geçersiz veri. Lütfen tüm alanları kontrol edin.');
      } else if (error.message.includes('409')) {
        alert('Bu saatte başka bir randevu var.');
      } else {
        alert(`Randevu kaydedilirken hata: ${error.message}`);
      }
    }
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

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedDate(null);
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

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const days = getDaysInMonth(currentDate);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return '#4F46E5';
      case 'Confirmed': return '#10B981';
      case 'Completed': return '#6B7280';
      case 'Cancelled': return '#EF4444';
      case 'NoShow': return '#F59E0B';
      default: return '#4F46E5';
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.fullName : 'Bilinmeyen';
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner"></div>
        <p style={{ color: '#666' }}>Randevular yükleniyor...</p>
      </div>
    );
  }

  // Veri yüklendikten sonra kontrol et
  if (!isLoading && (!appointments || !customers || !services)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <p style={{ color: '#dc2626' }}>Veriler yüklenemedi. Lütfen sayfayı yenileyin.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: 0 }}>
          Randevular
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          + Yeni Randevu
        </button>
      </div>

      {/* Takvim */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* Takvim Başlığı */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <button
            onClick={handlePrevMonth}
            style={{
              padding: '8px 16£px',
              backgroundColor: '#fef3ed',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ◀ Önceki
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleNextMonth}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            Sonraki ▶
          </button>
        </div>

        {/* Gün İsimleri */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {dayNames.map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#666',
              fontSize: '14px',
              padding: '8px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Takvim Günleri */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px'
        }}>
          {days.map((dayInfo, index) => {
            const dayAppointments = getAppointmentsForDate(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(dayInfo)}
                style={{
                  minHeight: '100px',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: isToday ? '#e0e7ff' : dayInfo.isCurrentMonth ? 'white' : '#f9fafb',
                  cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default',
                  opacity: dayInfo.isCurrentMonth ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (dayInfo.isCurrentMonth && !isToday) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (dayInfo.isCurrentMonth && !isToday) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isToday ? '#4F46E5' : '#333',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  {dayInfo.date.getDate()}
                </div>
                {dayAppointments.slice(0, 2).map((apt, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAppointment(apt);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 6px',
                      backgroundColor: getStatusColor(apt.status),
                      color: 'white',
                      borderRadius: '4px',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    title={`${getCustomerName(apt.customerId)} - ${new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                  >
                    <div style={{ fontWeight: '500' }}>
                      {getCustomerName(apt.customerId)}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>
                      {new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    {/* Silme butonu - hover'da görünür */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAppointment(apt.appointmentId);
                      }}
                      style={{
                        position: 'absolute',
                        top: '1px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#dc2626',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.display = 'flex';
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>
                    +{dayAppointments.length - 2} daha
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#333' }}>
              {editingAppointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Müşteri *
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                  required
                >
                  <option value="">Müşteri Seçin</option>
                  {customers.map(customer => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Hizmet *
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                  required
                >
                  <option value="">Hizmet Seçin</option>
                  {services.map(service => (
                    <option key={service.serviceId} value={service.serviceId}>
                      {service.serviceName} - ₺{service.price}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Randevu Tarihi ve Saati *
                </label>
                <input
                  type="datetime-local"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Anlaşılan Fiyat (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.agreedPrice}
                  onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    Toplam Seans
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSessions}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      totalSessions: parseInt(e.target.value) || 1,
                      remainingSessions: editingAppointment ? formData.remainingSessions : (parseInt(e.target.value) || 1)
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                {editingAppointment && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                      Kalan Seans
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.totalSessions}
                      value={formData.remainingSessions}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        remainingSessions: parseInt(e.target.value) || 0
                      })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                )}
              </div>

              {editingAppointment && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="Scheduled">Planlandı</option>
                    <option value="Confirmed">Onaylandı</option>
                    <option value="Completed">Tamamlandı</option>
                    <option value="Cancelled">İptal</option>
                    <option value="NoShow">Gelmedi</option>
                  </select>
                </div>
              )}

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
                  {editingAppointment ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;