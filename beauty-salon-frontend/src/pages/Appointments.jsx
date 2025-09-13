import React, { useState, useEffect } from "react";
import {
  appointmentService,
  customerService,
  serviceService,
  getAppointmentStatusDisplay,
} from "../api/api";
import Layout, { AddButton } from "../components/Layout/Layout";
import Modal from "../components/common/Modal/Modal";
import Calendar from "../components/common/Calendar/Calendar";
import Table from "../components/common/Table/Table";
import {
  FormGroup,
  FormRow,
  FormCol,
  FormActions,
  Input,
  Select,
} from "../components/common/Form";
import appointmentStyles from "./appointments.module.css";

// CSS dosyasının import edildiğinden emin ol - CSS'teki appointment renkleri çalışacak

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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
    totalSessions: 1,
    remainingSessions: 1,
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

  useEffect(() => {
    fetchData();
  }, []);

  // Filtreleme useEffect'i
  useEffect(() => {
    let data = [...appointments];

    // Status filtresi - sayısal değerle karşılaştır
    if (filterStatus) {
      data = data.filter((a) => a.status === parseInt(filterStatus));
    }
    if (filterCustomer) {
      data = data.filter((a) => a.customerId === parseInt(filterCustomer));
    }
    if (filterService) {
      data = data.filter((a) => a.serviceId === parseInt(filterService));
    }
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

      const [appointmentsRes, customersRes, servicesRes] = await Promise.all([
        appointmentService.getAll(),
        customerService.getAll(),
        serviceService.getAll(),
      ]);
      setAppointments(appointmentsRes || []);
      setCustomers(customersRes || []);
      setServices(servicesRes || []);
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

  const handleDateClick = (dayInfo) => {
    if (!dayInfo?.isCurrentMonth) return;

    const d =
      dayInfo.date instanceof Date ? dayInfo.date : new Date(dayInfo.date);
    d.setHours(9, 0, 0, 0); // Default saat 09:00
    const dateValue = toLocalInput(d);

    setFormData({
      ...formData,
      appointmentDate: dateValue,
    });
    setShowAddModal(true);
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
        // Update işlemi
        await appointmentService.update(editingAppointment.appointmentId, {
          customerId: formData.customerId,
          serviceId: formData.serviceId,
          appointmentDate: formData.appointmentDate,
          agreedPrice: formData.agreedPrice,
          totalSessions: formData.totalSessions,
          remainingSessions: formData.remainingSessions,
          status: formData.status,
        });
      } else {
        // Create işlemi
        await appointmentService.create({
          customerId: formData.customerId,
          serviceId: formData.serviceId,
          appointmentDate: formData.appointmentDate,
          agreedPrice: formData.agreedPrice,
          totalSessions: formData.totalSessions,
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
      totalSessions: 1,
      remainingSessions: 1,
      status: AppointmentStatus.Scheduled,
    });
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find((s) => s.serviceId === parseInt(serviceId));
    setFormData({
      ...formData,
      serviceId: serviceId,
      agreedPrice: service ? service.price.toString() : "",
    });
  };

  const openAddModal = () => {
    setEditingAppointment(null);
    setFormData({
      customerId: "",
      serviceId: "",
      appointmentDate: "",
      agreedPrice: "",
      totalSessions: 1,
      remainingSessions: 1,
      status: AppointmentStatus.Scheduled,
    });
    setShowAddModal(true);
  };
  
  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.fullName : "Bilinmeyen";
  };

  const customerOptions = customers.map((customer) => ({
    value: customer.customerId,
    label: customer.fullName,
  }));

  const serviceOptions = services.map((service) => ({
    value: service.serviceId,
    label: `${service.serviceName} - ₺${service.price}`,
  }));

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
      render: (_, row) => (
        <span className="statusBadge" data-status={row.status}>
          {row.statusDisplay || getAppointmentStatusDisplay(row.status)}
        </span>
      ),
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
        onDateClick={handleDateClick}
        appointments={appointments}
        onAppointmentClick={handleEditAppointment}
        onAppointmentDelete={handleDeleteAppointment}
        getCustomerName={getCustomerName}
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
          <FormGroup label="Müşteri" required error={formErrors.customerId}>
            <Select
              value={formData.customerId}
              onChange={(e) =>
                setFormData({ ...formData, customerId: e.target.value })
              }
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
            <FormCol>
              <FormGroup label="Toplam Seans" error={formErrors.totalSessions}>
                <Input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => {
                    const newTotal = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      totalSessions: newTotal,

                      remainingSessions: editingAppointment
                        ? Math.min(formData.remainingSessions, newTotal)
                        : newTotal,
                    });
                  }}
                  disabled={isSubmitting}
                />
              </FormGroup>
            </FormCol>
            {editingAppointment && (
              <FormCol>
                <FormGroup
                  label="Kalan Seans"
                  error={formErrors.remainingSessions}
                >
                  <Input
                    type="number"
                    min="0"
                    max={formData.totalSessions}
                    value={formData.remainingSessions}
                    onChange={(e) => {
                      const newRemaining = parseInt(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        remainingSessions: Math.min(
                          newRemaining,
                          formData.totalSessions
                        ),
                      });
                    }}
                    disabled={isSubmitting}
                  />
                </FormGroup>
              </FormCol>
            )}
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
    </Layout>
  );
};

export default Appointments;
