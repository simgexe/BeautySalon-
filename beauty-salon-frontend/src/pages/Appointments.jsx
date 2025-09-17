import React, { useState, useEffect } from "react";
import {
  appointmentService,
  customerService,
  serviceService,
  serviceCategoryService,
  getAppointmentStatusDisplay,
} from "../api/api";
import Layout, { AddButton } from "../components/Layout/Layout";
import Modal from "../components/common/Modal/Modal";
import Calendar from "../components/common/Calendar/Calendar";
import Table from "../components/common/Table/Table";
import {
  FormGroup,
  FormRow,
  FormActions,
  Input,
  Select,
} from "../components/common/Form";
import appointmentStyles from "./appointments.module.css";

// AppointmentStatus enum - Backend ile eşleşen sayısal değerler
export const AppointmentStatus = {
  Scheduled: 1,
  Confirmed: 2,
  Completed: 3,
  Cancelled: 4,
  NoShow: 5,
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Müşteri arama için
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Hizmet kategorisi ve hizmet seçimi için
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryServices, setCategoryServices] = useState([]);

  // Filtreler ve liste
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    serviceId: "",
    appointmentDate: "",
    agreedPrice: "",
    status: AppointmentStatus.Scheduled,
  });

  // Status tanımları - Backend enum değerleriyle eşleşen
  const appointmentStatuses = [
    {
      value: AppointmentStatus.Scheduled,
      label: "Planlandı",
      color: "#4F46E5",
    },
    {
      value: AppointmentStatus.Confirmed,
      label: "Onaylandı",
      color: "#10B981",
    },
    {
      value: AppointmentStatus.Completed,
      label: "Tamamlandı",
      color: "#6B7280",
    },
    { value: AppointmentStatus.Cancelled, label: "İptal", color: "#EF4444" },
    { value: AppointmentStatus.NoShow, label: "Gelmedi", color: "#F59E0B" },
  ];

  // Günlük randevular modal'ı için
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyAppointments, setDailyAppointments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Müşteri arama filtreleme
  useEffect(() => {
    if (customerSearchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(customerSearchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, customers]);

  // Kategori değiştiğinde hizmetleri filtrele
  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = services.filter(service => service.categoryId === parseInt(selectedCategoryId));
      setCategoryServices(filtered);
    } else {
      setCategoryServices(services);
    }
  }, [selectedCategoryId, services]);

  // Filtreleme useEffect'i
  useEffect(() => {
    let data = [...appointments];

    // Status filtresi - hem string hem sayısal değerleri kontrol et
    if (filterStatus) {
      const filterStatusNum = parseInt(filterStatus);
      data = data.filter((a) => {
        // Backend'den gelen status string olabilir ("Scheduled") veya sayısal olabilir (1)
        if (typeof a.status === 'string') {
          // String ise enum değerlerini karşılaştır
          const statusMap = {
            1: 'Scheduled',
            2: 'Confirmed', 
            3: 'Completed',
            4: 'Cancelled',
            5: 'NoShow'
          };
          return a.status === statusMap[filterStatusNum];
        } else {
          // Sayısal ise direkt karşılaştır
          return a.status === filterStatusNum;
        }
      });
    }
    
    // Müşteri filtresi
    if (filterCustomer) {
      data = data.filter((a) => a.customerId === parseInt(filterCustomer));
    }
    
    // Hizmet filtresi
    if (filterService) {
      data = data.filter((a) => a.serviceId === parseInt(filterService));
    }
    
    // Tarih filtreleri
    if (filterDateFrom) {
      data = data.filter(
        (a) => new Date(a.appointmentDate) >= new Date(filterDateFrom)
      );
    }
    if (filterDateTo) {
      data = data.filter(
        (a) =>
          new Date(a.appointmentDate) <= new Date(`${filterDateTo}T23:59:59`)
      );
    }

    setFilteredAppointments(data);
  }, [
    appointments,
    filterStatus,
    filterCustomer,
    filterService,
    filterDateFrom,
    filterDateTo,
  ]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [appointmentsRes, customersRes, servicesRes, categoriesRes] = await Promise.all([
        appointmentService.getAll(),
        customerService.getAll(),
        serviceService.getAll(),
        serviceCategoryService.getAll(),
      ]);
      setAppointments(appointmentsRes || []);
      setCustomers(customersRes || []);
      setServices(servicesRes || []);
      setServiceCategories(categoriesRes || []);
      setFilteredCustomers(customersRes || []);
    } catch (error) {
      console.error("Veri yüklerken detaylı hata:", error);

      if (error.message.includes("fetch")) {
        alert("API bağlantısı kurulamadı. Backend çalışıyor mu?");
      } else {
        alert(`Veri yüklenirken hata: ${error.message}`);
      }

      setAppointments([]);
      setCustomers([]);
      setServices([]);
      setServiceCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toLocalInput = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Calendar handlers
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };


  // Günlük randevular modal'ını aç
  const handleDateClickForModal = (dayInfo) => {
    if (!dayInfo?.isCurrentMonth) return;
    
    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.toDateString() === dayInfo.date.toDateString();
    });
    
    setSelectedDate(dayInfo.date);
    setDailyAppointments(dayAppointments);
    setShowDailyModal(true);
  };

  // Randevuları kategorilere göre grupla
  const groupAppointmentsByCategory = (appointments) => {
    const grouped = {};
    appointments.forEach(apt => {
      const category = apt.categoryName || 'Diğer';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(apt);
    });
    return grouped;
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);

    // Edit modunda tüm verileri form'a yükle
    setFormData({
      customerId: appointment.customerId.toString(),
      serviceId: appointment.serviceId.toString(),
      appointmentDate: toLocalInput(new Date(appointment.appointmentDate)),
      agreedPrice: appointment.agreedPrice.toString(),
      totalSessions: appointment.totalSessions,
      remainingSessions: appointment.remainingSessions,
      status: appointment.status, // Status değerini de yükle
    });
    setShowAddModal(true);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Bu randevuyu silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await appointmentService.delete(appointmentId);
      await fetchData();
    } catch (error) {
      console.error("Randevu silerken hata:", error);
      alert("Randevu silinirken hata oluştu");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerId) errors.customerId = "Müşteri seçimi gereklidir";
    if (!formData.serviceId) errors.serviceId = "Hizmet seçimi gereklidir";
    if (!formData.appointmentDate)
      errors.appointmentDate = "Randevu tarihi gereklidir";
    if (!formData.agreedPrice) errors.agreedPrice = "Fiyat bilgisi gereklidir";

    // Fiyat kontrolü
    if (
      formData.agreedPrice &&
      (isNaN(formData.agreedPrice) || parseFloat(formData.agreedPrice) <= 0)
    ) {
      errors.agreedPrice = "Geçerli bir fiyat giriniz";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingAppointment) {
        // Status değişikliği kontrolü
        const oldStatus = editingAppointment.status;
        const newStatus = formData.status;
        
        // Eğer status değiştiyse, önce updateStatus çağır (seans yönetimi için)
        if (oldStatus !== newStatus) {
          await appointmentService.updateStatus(editingAppointment.appointmentId, newStatus);
        }
        
        // Sonra diğer bilgileri güncelle
        await appointmentService.update(editingAppointment.appointmentId, {
          customerId: formData.customerId,
          serviceId: formData.serviceId,
          appointmentDate: formData.appointmentDate,
          agreedPrice: formData.agreedPrice,
          status: formData.status,
        });
      } else {
        // Create işlemi
        await appointmentService.create({
          customerId: formData.customerId,
          serviceId: formData.serviceId,
          appointmentDate: formData.appointmentDate,
          agreedPrice: formData.agreedPrice,
        });
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Randevu kaydederken detaylı hata:", error);

      if (error.message.includes("400")) {
        alert("Geçersiz veri. Lütfen tüm alanları kontrol edin.");
      } else if (error.message.includes("409")) {
        alert("Bu saatte başka bir randevu var.");
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
      customerId: "",
      serviceId: "",
      appointmentDate: "",
      agreedPrice: "",
      status: AppointmentStatus.Scheduled,
    });
    // Reset form state
    setCustomerSearchTerm("");
    setSelectedCustomer(null);
    setSelectedCategoryId("");
    setCategoryServices([]);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customerId: customer.customerId.toString(),
    });
    setCustomerSearchTerm(customer.fullName);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setFormData({
      ...formData,
      serviceId: "", // Reset service selection
    });
  };

  const handleServiceChange = (serviceId) => {
    const service = categoryServices.find((s) => s.serviceId === parseInt(serviceId));
    setFormData({
      ...formData,
      serviceId: serviceId,
      agreedPrice: service ? service.price.toString() : "",
      totalSessions: service ? service.defaultSessions : 1,
    });
  };

  const openAddModal = () => {
    setEditingAppointment(null);
    setFormData({
      customerId: "",
      serviceId: "",
      appointmentDate: "",
      agreedPrice: "",
      status: AppointmentStatus.Scheduled,
    });
    // Reset form state
    setCustomerSearchTerm("");
    setSelectedCustomer(null);
    setSelectedCategoryId("");
    setCategoryServices([]);
    setShowAddModal(true);
  };
  
  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.fullName : "Bilinmeyen";
  };

  // Status renklerini döndüren fonksiyon
  const getStatusColor = (status) => {
    const statusInfo = getAppointmentStatusDisplay(status);
    return statusInfo.color;
  };

  const columns = [
    {
      title: "Tarih",
      key: "appointmentDate",
      sortable: true,
      render: (v) => new Date(v).toLocaleDateString("tr-TR"),
    },
    {
      title: "Saat",
      key: "appointmentTime",
      sortable: false,
      render: (_, row) =>
        new Date(row.appointmentDate).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Müşteri",
      key: "customerName",
      sortable: true,
      render: (_, row) => getCustomerName(row.customerId),
    },
    {
      title: "Hizmet",
      key: "serviceName",
      sortable: true,
      render: (v) => v || "-",
    },
    {
      title: "Durum",
      key: "status",
      sortable: true,
      render: (_, row) => {
        const statusInfo = getAppointmentStatusDisplay(row.status);
        return (
          <span 
            className="statusBadge" 
            data-status={row.status}
            style={{
              backgroundColor: statusInfo.color,
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: `2px solid ${statusInfo.color}20`
            }}
          >
            {row.statusDisplay || statusInfo.text}
          </span>
        );
      },
    },
  ];

  const tableData = filteredAppointments.map((a) => ({
    ...a,
    id: a.appointmentId,
  }));

  // Loading state
  if (isLoading) {
    return (
      <Layout className={appointmentStyles.appointmentLayout}>
        <div className={appointmentStyles.loadingContainer}>
          <div className={appointmentStyles.spinner}></div>
          <p className={appointmentStyles.loadingText}>
            Randevular yükleniyor...
          </p>
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

  return (
    <Layout className={appointmentStyles.appointmentLayout}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <AddButton onClick={openAddModal}>+ Yeni Randevu</AddButton>
      </div>

      {/* Calendar Component */}
      <Calendar
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onDateClick={handleDateClickForModal}  // Günlük randevular modal'ını aç
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
          options={appointmentStatuses.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
          placeholder="Tüm Durumlar"
        />
        <Select
          className={appointmentStyles.appointmentFilter}
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          options={customers.map((c) => ({
            value: c.customerId,
            label: c.fullName,
          }))}
          placeholder="Tüm Müşteriler"
        />
        <Select
          className={appointmentStyles.appointmentFilter}
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          options={services.map((s) => ({
            value: s.serviceId,
            label: s.serviceName,
          }))}
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
            setFilterStatus("");
            setFilterCustomer("");
            setFilterService("");
            setFilterDateFrom("");
            setFilterDateTo("");
          }}
        >
          Filtreleri Sıfırla
        </button>
      </div>

      {/* Randevu Listesi */}
      <div className={appointmentStyles.appointmentListCard}>
        <div className={appointmentStyles.appointmentListHeader}>
          <h3 className={appointmentStyles.appointmentListTitle}>
            Randevu Listesi
          </h3>
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
        title={editingAppointment ? "Randevu Düzenle" : "Yeni Randevu"}
        size="medium"
        animation="slideUp"
        className={appointmentStyles.appointmentModal}
      >
        <div className={appointmentStyles.appointmentForm}>
          {/* Müşteri Arama */}
          <FormGroup label="Müşteri" required error={formErrors.customerId}>
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                placeholder="Müşteri adı veya telefon ile ara..."
                disabled={isSubmitting}
                style={{ marginBottom: 0 }}
              />
              {customerSearchTerm && filteredCustomers.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderTop: 'none',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.customerId}
                      onClick={() => handleCustomerSelect(customer)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div style={{ fontWeight: 'bold' }}>{customer.fullName}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>{customer.phoneNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                <strong>Seçilen:</strong> {selectedCustomer.fullName} - {selectedCustomer.phoneNumber}
              </div>
            )}
          </FormGroup>

          {/* Hizmet Kategorisi Seçimi */}
          <FormGroup label="Hizmet Kategorisi" required>
            <Select
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              options={serviceCategories.map(cat => ({
                value: cat.categoryId,
                label: cat.categoryName
              }))}
              placeholder="Kategori Seçin"
              disabled={isSubmitting}
            />
          </FormGroup>

          {/* Hizmet Seçimi */}
          <FormGroup label="Hizmet" required error={formErrors.serviceId}>
            <Select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={categoryServices.map(service => ({
                value: service.serviceId,
                label: `${service.serviceName} - ₺${service.price} (${service.defaultSessions} seans)`
              }))}
              placeholder={selectedCategoryId ? "Hizmet Seçin" : "Önce kategori seçin"}
              required
              disabled={isSubmitting || !selectedCategoryId}
            />
          </FormGroup>

          <FormGroup
            label="Randevu Tarihi ve Saati"
            required
            error={formErrors.appointmentDate}
          >
            <Input
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) =>
                setFormData({ ...formData, appointmentDate: e.target.value })
              }
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup
            label="Anlaşılan Fiyat (₺)"
            required
            error={formErrors.agreedPrice}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.agreedPrice}
              onChange={(e) =>
                setFormData({ ...formData, agreedPrice: e.target.value })
              }
              placeholder="Fiyat giriniz"
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormRow gap="medium">
          </FormRow>

          {/* Status Select - Edit modunda göster */}
          {editingAppointment && (
            <FormGroup label="Durum">
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: parseInt(e.target.value) })
                }
                options={appointmentStatuses}
                disabled={isSubmitting}
              />
            </FormGroup>
          )}

          <FormActions
            onCancel={closeModal}
            onSubmit={handleSubmit}
            submitText={editingAppointment ? "Güncelle" : "Kaydet"}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
      </Modal>

      {/* Günlük Randevular Modal'ı */}
      <Modal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
        title={`${selectedDate ? selectedDate.toLocaleDateString('tr-TR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }) : ''} - Günlük Randevular`}
        size="large"
      >
        {dailyAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Bu gün için randevu bulunmuyor.
          </div>
        ) : (
          <div>
            {Object.entries(groupAppointmentsByCategory(dailyAppointments)).map(([category, categoryAppointments]) => (
              <div key={category} style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  color: '#4F46E5', 
                  borderBottom: '2px solid #E5E7EB', 
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {category}
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {categoryAppointments.map(apt => (
                    <div
                      key={apt.appointmentId}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '1rem',
                        backgroundColor: '#F9FAFB'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: '0', color: '#1F2937' }}>
                              {apt.customerName}
                            </h4>
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: getAppointmentStatusDisplay(apt.status).color,
                                color: 'white',
                                border: `1px solid ${getAppointmentStatusDisplay(apt.status).color}20`
                              }}
                            >
                              {apt.statusDisplay || getAppointmentStatusDisplay(apt.status).text}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280' }}>
                            <strong>Hizmet:</strong> {apt.serviceName}
                          </p>
                          <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280' }}>
                            <strong>Saat:</strong> {new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280' }}>
                            <strong>Fiyat:</strong> ₺{apt.agreedPrice}
                          </p>
                          {apt.customerServiceSessionId && (
                            <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280' }}>
                              <strong>Seans Paketi:</strong> #{apt.customerServiceSessionId}
                            </p>
                          )}
                          {apt.totalSessions > 0 && (
                            <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280' }}>
                              <strong>Seans:</strong> {apt.remainingSessions}/{apt.totalSessions}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setShowDailyModal(false);
                                handleEditAppointment(apt);
                              }}
                              style={{
                                padding: '0.25rem 0.75rem',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
                                  handleDeleteAppointment(apt.appointmentId);
                                  setShowDailyModal(false);
                                }
                              }}
                              style={{
                                padding: '0.25rem 0.75rem',
                                border: '1px solid #EF4444',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Appointments;
