import React, { useState, useEffect } from "react";
import {
  appointmentService,
  customerService,
  serviceService,
  serviceCategoryService,
  userService,
  getAppointmentStatusDisplay,
} from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";
import Layout, { AddButton } from "../../components/Layout/Layout";
import Modal from "../../components/common/Modal/Modal";
import Calendar from "../../components/common/Calendar/Calendar";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import FilterBar from "../../components/common/FilterBar/FilterBar";
import GradientCard, { GradientCardContent, GradientCardInfo } from "../../components/common/GradientCard";
import {
  FormGroup,
  FormRow,
  FormActions,
  Input,
  Select,
} from "../../components/common/Form";
import toast from 'react-hot-toast';
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
  const { isAdmin, user } = useAuth();
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
  
  // Permission alert state

  // Müşteri arama için
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Hizmet kategorisi ve hizmet seçimi için
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryServices, setCategoryServices] = useState([]);
  
  // Uzman seçimi için
  const [categorySpecialists, setCategorySpecialists] = useState([]);

  // Filtreler ve liste
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
    specialistId: "",
  });

  // Yetki kontrolü ve alert gösterimi
  const checkPermissionAndShowAlert = (action, requiredRole = null) => {
    if (isAdmin()) return true;

    if (user?.roleName === 'Staff') {
      toast.error(`Bu işlemi (${action}) gerçekleştirmek için yetkiniz bulunmamaktadır.`);
      return false;
    }

    if (user?.roleName === 'Specialist') {
      // Specialist için daha detaylı kontrol gerekebilir
      return true; // Geçici olarak true döndür
    }

    toast.error(`Bu işlemi (${action}) gerçekleştirmek için yetkiniz bulunmamaktadır.`);
    return false;
  };

  // Kullanıcının hangi kategorilerde randevu ekleyebileceğini kontrol et
  const canUserCreateInCategory = (categoryId) => {
    if (isAdmin()) return true;
    
    // Staff → Randevu ekleyemez (sadece görüntüleme)
    if (user?.roleName === 'Staff') {
      checkPermissionAndShowAlert("randevu ekleme");
      return false;
    }
    
    // Specialist → Sadece kendi kategorilerinde randevu ekleyebilir
    if (user?.roleName === 'Specialist') {
      // Gerçek implementasyon için kullanıcının kategorilerini API'den almalıyız
      return true; // Geçici olarak specialist'lere izin ver
    }
    
    checkPermissionAndShowAlert("randevu ekleme");
    return false;
  };

  // Kullanıcının randevuyu düzenleyip silebileceğini kontrol et
  const canUserEditAppointment = (appointment) => {
    if (isAdmin()) return true;
    
    // Staff → Hiçbir randevuyu düzenleyemez (sadece görüntüleme)
    if (user?.roleName === 'Staff') {
      checkPermissionAndShowAlert("randevu düzenleme");
      return false;
    }
    
    // Specialist → Sadece kendi kategorilerindeki randevuları düzenleyebilir
    if (user?.roleName === 'Specialist') {
      // Kullanıcının bu randevunun kategorisinde yetkisi var mı?
      const service = services.find(s => s.serviceId === appointment.serviceId);
      if (!service) return false;
      
      return canUserCreateInCategory(service.categoryId);
    }
    
    checkPermissionAndShowAlert("randevu düzenleme");
    return false;
  };

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

  // Kategori değiştiğinde uzmanları getir
  useEffect(() => {
    const fetchSpecialists = async () => {
      if (selectedCategoryId) {
        try {
          const specialists = await userService.getSpecialistsByCategory(selectedCategoryId);
          setCategorySpecialists(specialists);
        } catch (error) {
          console.error('Uzmanlar yüklenirken hata:', error);
          setCategorySpecialists([]);
        }
      } else {
        setCategorySpecialists([]);
      }
    };

    fetchSpecialists();
  }, [selectedCategoryId]);

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
    
    // Müşteri filtresi - arama yapılabilir
    if (filterCustomer) {
      data = data.filter((a) => {
        const customer = customers.find(c => c.customerId === a.customerId);
        if (!customer) return false;
        return customer.fullName.toLowerCase().includes(filterCustomer.toLowerCase()) ||
               customer.phoneNumber.includes(filterCustomer);
      });
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
    customers,
    filterStatus,
    filterCustomer,
    filterService,
    filterDateFrom,
    filterDateTo,
  ]);

  // Reset page when filters or source list change
  useEffect(() => {
    setPage(1);
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
    // Yetki kontrolü
    if (!canUserEditAppointment(appointment)) {
      return;
    }
    
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
      specialistId: appointment.specialistId ? appointment.specialistId.toString() : "",
    });

    // Kategori ve müşteri bilgilerini de yükle
    const service = services.find(s => s.serviceId === appointment.serviceId);
    if (service) {
      setSelectedCategoryId(service.categoryId.toString());
    }

    const customer = customers.find(c => c.customerId === appointment.customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerSearchTerm(customer.fullName);
    }

    setShowAddModal(true);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    // Randevuyu bul ve yetki kontrolü yap
    const appointment = appointments.find(apt => apt.appointmentId === appointmentId);
    if (appointment && !canUserEditAppointment(appointment)) {
      return;
    }
    
    if (!window.confirm("Bu randevuyu silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await appointmentService.delete(appointmentId);
      await fetchData();
      toast.success("Randevu başarıyla silindi!");
    } catch (error) {
      console.error("Randevu silerken hata:", error);
      
      if (error.message.includes("403")) {
        toast.error("Randevu silmek için yetkiniz bulunmamaktadır.");
      } else {
        toast.error("Randevu silinirken hata oluştu");
      }
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
          try {
            await appointmentService.updateStatus(editingAppointment.appointmentId, newStatus);
          } catch (statusError) {
            if (statusError.message.includes("403")) {
              toast.error("Randevu durumunu değiştirmek için yetkiniz bulunmamaktadır.");
              return;
            }
            throw statusError;
          }
        }
        
        // Sonra diğer bilgileri güncelle
        try {
          await appointmentService.update(editingAppointment.appointmentId, {
            customerId: formData.customerId,
            serviceId: formData.serviceId,
            appointmentDate: formData.appointmentDate,
            agreedPrice: formData.agreedPrice,
            status: formData.status,
            specialistId: formData.specialistId && formData.specialistId !== "" ? parseInt(formData.specialistId) : null,
          });
        } catch (updateError) {
          if (updateError.message.includes("403")) {
            toast.error("Randevu düzenlemek için yetkiniz bulunmamaktadır.");
            return;
          }
          throw updateError;
        }
      } else {
        // Create işlemi
        
        await appointmentService.create({
          customerId: formData.customerId,
          serviceId: formData.serviceId,
          appointmentDate: formData.appointmentDate,
          agreedPrice: formData.agreedPrice,
          specialistId: formData.specialistId && formData.specialistId !== "" ? parseInt(formData.specialistId) : null,
        });
      }

      await fetchData();
      closeModal();
      toast.success(editingAppointment ? "Randevu başarıyla güncellendi!" : "Randevu başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Randevu kaydederken detaylı hata:", error);

      if (error.message.includes("403")) {
        toast.error("Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.");
      } else if (error.message.includes("400")) {
        toast.error("Geçersiz veri. Lütfen tüm alanları kontrol edin.");
      } else if (error.message.includes("409")) {
        toast.error("Bu saatte başka bir randevu var.");
      } else {
        toast.error(`Randevu kaydedilirken hata: ${error.message}`);
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
      specialistId: "", // Reset specialist selection
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
    // Yetki kontrolü
    if (!isAdmin() && user?.roleName !== 'Specialist') {
      checkPermissionAndShowAlert("randevu ekleme");
      return;
    }
    
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
          className="status-badge" 
          data-status={row.status}
          style={{
            backgroundColor: statusInfo.color,
            borderColor: `${statusInfo.color}20`
          }}
        >
          {row.statusDisplay || statusInfo.text}
        </span>
        );
      },
    },
  ];

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const tableData = filteredAppointments.slice(start, end).map((a) => ({
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
       {/* Kullanıcı Bilgilendirme */}
       <GradientCard>
         <GradientCardContent>
           <div className="section-header">
             <div>
               <h2 className="section-title">Randevular</h2>
               <p className="section-subtitle">
                 {isAdmin() ? (
                   <>Tüm randevuları görüntüleyebilir, ekleyebilir, düzenleyebilir ve silebilirsiniz.</>
                 ) : user?.roleName === 'Staff' ? (
                   <>Tüm randevuları görüntüleyebilirsiniz. Randevu ekleme, düzenleme ve silme işlemleri için uzman yetkisi gereklidir.</>
                 ) : (
                   <>Tüm randevuları görüntüleyebilir, kendi uzmanlık alanınızda randevu ekleyebilir, düzenleyebilir ve silebilirsiniz.</>
                 )}
               </p>
               
               {(isAdmin() || user?.roleName === 'Specialist') && (
                 <AddButton onClick={openAddModal}>+ Yeni Randevu</AddButton>
               )}
             </div>
             <div>
               <GradientCardInfo
                 title="Toplam Randevu"
                 value={appointments.length}
               />
             </div>
           </div>
         </GradientCardContent>
       </GradientCard>

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
        canEditAppointment={canUserEditAppointment}
        canDeleteAppointment={canUserEditAppointment}
        className={appointmentStyles.appointmentCalendar}
      />

      {/* Filtreler */}
      <div className={appointmentStyles.appointmentFiltersBar}>
        <FilterBar
          searchQuery={filterCustomer}
          onSearchChange={setFilterCustomer}
          searchPlaceholder="Müşteri ara..."
          dateFromFilter={filterDateFrom}
          onDateFromChange={setFilterDateFrom}
          dateToFilter={filterDateTo}
          onDateToChange={setFilterDateTo}
          statusFilter={filterStatus}
          onStatusChange={setFilterStatus}
          statusOptions={appointmentStatuses.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
          statusPlaceholder="Tüm Durumlar"
          serviceFilter={filterService}
          onServiceChange={setFilterService}
          serviceOptions={services.map((s) => ({
            value: s.serviceId,
            label: s.serviceName,
          }))}
          servicePlaceholder="Tüm Hizmetler"
          onClearFilters={() => {
            setFilterStatus("");
            setFilterCustomer("");
            setFilterService("");
            setFilterDateFrom("");
            setFilterDateTo("");
          }}
          showSearch={true}
          showDate={false}
          showDateRange={true}
          showMonth={false}
          showYear={false}
          showStatus={true}
          showMethod={false}
          showCategory={false}
          showService={true}
          showSpecialist={false}
          showCustomer={false}
          showAmountRange={false}
          showExpenseCategory={false}
          style={{ backgroundColor: 'transparent' }}
        />
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
          canEdit={(row) => canUserEditAppointment(row)}
          canDelete={(row) => canUserEditAppointment(row)}
        />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredAppointments.length}
        onPageChange={setPage}
        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
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
            <div className="dropdown">
              <Input
                type="text"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                placeholder="Müşteri adı veya telefon ile ara..."
                disabled={isSubmitting}
                className="mb-0"
              />
              {customerSearchTerm && filteredCustomers.length > 0 && (
                <div className="dropdown-menu">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.customerId}
                      onClick={() => handleCustomerSelect(customer)}
                      className="dropdown-item"
                    >
                      <div className="dropdown-item-name">{customer.fullName}</div>
                      <div className="dropdown-item-meta">{customer.phoneNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <div className="selected-item">
                <span className="selected-item-label">Seçilen:</span> {selectedCustomer.fullName} - {selectedCustomer.phoneNumber}
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

          {/* Uzman Seçimi */}
          <FormGroup label="Uzman">
            <Select
              value={formData.specialistId}
              onChange={(e) =>
                setFormData({ ...formData, specialistId: e.target.value })
              }
              options={[
                { value: "", label: "Uzman Seçin (Opsiyonel)" },
                ...categorySpecialists.map(specialist => ({
                  value: specialist.userId,
                  label: `${specialist.firstName} ${specialist.lastName}`.trim() || specialist.username
                }))
              ]}
              placeholder={selectedCategoryId ? "Uzman Seçin" : "Önce kategori seçin"}
              disabled={isSubmitting || !selectedCategoryId}
            />
            <small style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
              Admin olarak randevu ekliyorsanız uzman seçmeyebilirsiniz
            </small>
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
          <div className="daily-appointments">
            Bu gün için randevu bulunmuyor.
          </div>
        ) : (
          <div>
            {Object.entries(groupAppointmentsByCategory(dailyAppointments)).map(([category, categoryAppointments]) => (
              <div key={category} className="appointment-category">
                <h3 className="appointment-category-title">
                  {category}
                </h3>
                <div className="appointment-grid">
                  {categoryAppointments.map(apt => (
                    <div
                      key={apt.appointmentId}
                      className="appointment-card"
                    >
                      <div className="appointment-header">
                        <div className="appointment-info">
                          <div className="appointment-meta">
                            <h4 className="appointment-title">
                              {apt.customerName}
                            </h4>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: getAppointmentStatusDisplay(apt.status).color,
                                borderColor: `${getAppointmentStatusDisplay(apt.status).color}20`
                              }}
                            >
                              {apt.statusDisplay || getAppointmentStatusDisplay(apt.status).text}
                            </span>
                          </div>
                          <p className="appointment-details">
                            <strong>Hizmet:</strong> {apt.serviceName}
                          </p>
                          <p className="appointment-details">
                            <strong>Saat:</strong> {new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <p className="appointment-details">
                            <strong>Fiyat:</strong> ₺{apt.agreedPrice}
                          </p>
                          {apt.customerServiceSessionId && (
                            <p className="appointment-details">
                              <strong>Seans Paketi:</strong> #{apt.customerServiceSessionId}
                            </p>
                          )}
                          {apt.totalSessions > 0 && (
                            <p className="appointment-details">
                              <strong>Seans:</strong> {apt.remainingSessions}/{apt.totalSessions}
                            </p>
                          )}
                        </div>
                        <div className="appointment-actions">
                          <div className="appointment-buttons">
                            {canUserEditAppointment(apt) && (
                              <button
                                onClick={() => {
                                  setShowDailyModal(false);
                                  handleEditAppointment(apt);
                                }}
                                className="appointment-button"
                              >
                                Düzenle
                              </button>
                            )}
                            {canUserEditAppointment(apt) && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
                                    handleDeleteAppointment(apt.appointmentId);
                                    setShowDailyModal(false);
                                  }
                                }}
                                className="appointment-button appointment-button--danger"
                              >
                                Sil
                              </button>
                            )}
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
