import React, { useState, useEffect } from "react";
import {
  customerServiceSessionService,
  customerService,
  serviceService,
  serviceCategoryService,
} from "../../api/api";
import Layout, { AddButton } from "../../components/Layout/Layout";
import Modal from "../../components/common/Modal/Modal";
import Table from "../../components/common/Table/Table";
import GradientCard, { GradientCardContent } from "../../components/common/GradientCard";
import FilterBar from "../../components/common/FilterBar/FilterBar";
import {
  FormGroup,
  FormActions,
  Input,
  Select,
} from "../../components/common/Form";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import sessionStyles from "./sessionPackages.module.css";

const SessionPackages = () => {
  const { isAdmin, isSpecialist, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
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

  // Filtreler
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formData, setFormData] = useState({
    customerId: "",
    serviceId: "",
    totalSessions: "",
    remainingSessions: "",
    isActive: true,
  });

  // Status seçenekleri
  const statusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "active", label: "Aktif" },
    { value: "completed", label: "Tamamlanmış" },
  ];

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
    let data = [...sessions];

    // Müşteri arama filtresi
    if (filterCustomer) {
      data = data.filter((s) => {
        // Müşteri bilgisini customers array'inden bul
        const customer = customers.find(c => c.customerId === s.customerId);
        const customerName = customer?.fullName || s.customer?.fullName || s.customerName || '';
        return customerName.toLowerCase().includes(filterCustomer.toLowerCase());
      });
    }
    
    // Hizmet filtresi
    if (filterService) {
      data = data.filter((s) => s.serviceId === parseInt(filterService));
    }
    
    // Status filtresi
    if (filterStatus && filterStatus !== "all") {
      if (filterStatus === "active") {
        data = data.filter((s) => s.isActive);
      } else if (filterStatus === "completed") {
        data = data.filter((s) => !s.isActive);
      }
    }

    setFilteredSessions(data);
    setPage(1);
  }, [sessions, filterCustomer, filterService, filterStatus, customers]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [sessionsRes, customersRes, servicesRes, categoriesRes] = await Promise.all([
        customerServiceSessionService.getAll(),
        customerService.getAll(),
        serviceService.getAll(),
        serviceCategoryService.getAll(),
      ]);
      
      setSessions(sessionsRes || []);
      setCustomers(customersRes || []);
      setServices(servicesRes || []);
      setServiceCategories(categoriesRes || []);
      setFilteredCustomers(customersRes || []);
    } catch (error) {
      console.error("Veri yüklerken detaylı hata:", error);
      alert(`Veri yüklenirken hata: ${error.message}`);
      setSessions([]);
      setCustomers([]);
      setServices([]);
      setServiceCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSession = (session) => {
    if (!isAdmin() && !isSpecialist()) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      return;
    }
    
    // Specialist can only edit sessions from their categories
    if (isSpecialist() && !isAdmin()) {
      const service = services.find(s => s.serviceId === session.serviceId);
      const userCategories = user?.serviceCategories || [];
      
      const canEdit = userCategories.some(cat => cat.categoryId === service?.categoryId);
      
      if (!canEdit) {
        toast.error("Bu seans paketini düzenleyemezsiniz. Sadece kendi uzmanlık alanınızdaki seans paketlerini düzenleyebilirsiniz.");
        return;
      }
    }
    
    setEditingSession(session);
    setFormData({
      customerId: session.customerId.toString(),
      serviceId: session.serviceId.toString(),
      totalSessions: session.totalSessions.toString(),
      remainingSessions: session.remainingSessions.toString(),
      isActive: session.isActive,
    });
    
    // Müşteri bilgilerini yükle
    const customer = customers.find(c => c.customerId === session.customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerSearchTerm(customer.fullName);
    }
    
    // Hizmet kategorisini yükle
    const service = services.find(s => s.serviceId === session.serviceId);
    if (service) {
      setSelectedCategoryId(service.categoryId.toString());
    }
    
    setShowAddModal(true);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!isAdmin() && !isSpecialist()) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      return;
    }

    // Specialist can only delete sessions from their categories
    if (isSpecialist() && !isAdmin()) {
      const session = sessions.find(s => s.customerServiceSessionId === sessionId);
      const service = services.find(s => s.serviceId === session?.serviceId);
      const userCategories = user?.serviceCategories || [];
      const canDelete = userCategories.some(cat => cat.categoryId === service?.categoryId);
      
      if (!canDelete) {
        toast.error("Bu seans paketini silemezsiniz. Sadece kendi uzmanlık alanınızdaki seans paketlerini silebilirsiniz.");
        return;
      }
    }

    if (!window.confirm("Bu seans paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    try {
      await customerServiceSessionService.delete(sessionId);
      await fetchData();
      toast.success("Seans paketi başarıyla silindi");
    } catch (error) {
      console.error("Seans paketi silerken hata:", error);
      if (error.message.includes("existing appointments")) {
        toast.error("Bu seans paketinin randevuları var. Önce randevuları silin veya iptal edin.");
      } else {
        toast.error("Seans paketi silinirken hata oluştu");
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerId) errors.customerId = "Müşteri seçimi gereklidir";
    if (!formData.serviceId) errors.serviceId = "Hizmet seçimi gereklidir";
    if (!formData.totalSessions) errors.totalSessions = "Toplam seans sayısı gereklidir";
    if (!formData.remainingSessions) errors.remainingSessions = "Kalan seans sayısı gereklidir";

    // Sayısal kontroller
    if (formData.totalSessions && (isNaN(formData.totalSessions) || parseInt(formData.totalSessions) <= 0)) {
      errors.totalSessions = "Geçerli bir toplam seans sayısı giriniz";
    }
    if (formData.remainingSessions && (isNaN(formData.remainingSessions) || parseInt(formData.remainingSessions) < 0)) {
      errors.remainingSessions = "Geçerli bir kalan seans sayısı giriniz";
    }

    // Kalan seans, toplam seans'tan fazla olamaz
    if (formData.totalSessions && formData.remainingSessions && 
        parseInt(formData.remainingSessions) > parseInt(formData.totalSessions)) {
      errors.remainingSessions = "Kalan seans sayısı toplam seans sayısından fazla olamaz";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isAdmin() && !isSpecialist()) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingSession) {
        // Update işlemi
        await customerServiceSessionService.update(editingSession.customerServiceSessionId, {
          remainingSessions: parseInt(formData.remainingSessions),
          isActive: formData.isActive,
          completedDate: !formData.isActive ? new Date().toISOString() : null,
        });
      } else {
        // Create işlemi
        await customerServiceSessionService.create({
          customerId: parseInt(formData.customerId),
          serviceId: parseInt(formData.serviceId),
          totalSessions: parseInt(formData.totalSessions),
        });
      }

      await fetchData();
      closeModal();
      toast.success(editingSession ? "Seans paketi güncellendi" : "Seans paketi oluşturuldu");
    } catch (error) {
      console.error("Seans paketi kaydederken detaylı hata:", error);
      toast.error(`Seans paketi kaydedilirken hata: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingSession(null);
    setFormErrors({});
    setFormData({
      customerId: "",
      serviceId: "",
      totalSessions: "",
      remainingSessions: "",
      isActive: true,
    });
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
      totalSessions: service ? service.defaultSessions.toString() : "",
      remainingSessions: service ? service.defaultSessions.toString() : "",
    });
  };

  const openAddModal = () => {
    if (!isAdmin() && !isSpecialist()) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      return;
    }

    setEditingSession(null);
    setFormData({
      customerId: "",
      serviceId: "",
      totalSessions: "",
      remainingSessions: "",
      isActive: true,
    });
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

  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.serviceId === serviceId);
    return service ? service.serviceName : "Bilinmeyen";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const columns = [
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
      render: (_, row) => getServiceName(row.serviceId),
    },
    {
      title: "Kategori",
      key: "categoryName",
      sortable: true,
      render: (_, row) => {
        const service = services.find(s => s.serviceId === row.serviceId);
        const category = serviceCategories.find(c => c.categoryId === service?.categoryId);
        return category ? category.categoryName : "Bilinmeyen";
      },
    },
    {
      title: "Toplam Seans",
      key: "totalSessions",
      sortable: true,
    },
    {
      title: "Kalan Seans",
      key: "remainingSessions",
      sortable: true,
      render: (v, row) => (
        <span className={`font-bold ${
          v === 0 ? 'text-danger' : v <= 2 ? 'text-warning' : 'text-success'
        }`}>
          {v}
        </span>
      ),
    },
    {
      title: "Kullanılan",
      key: "usedSessions",
      sortable: true,
      render: (_, row) => row.totalSessions - row.remainingSessions,
    },
    {
      title: "Durum",
      key: "isActive",
      sortable: true,
      render: (_, row) => (
        <span className={`status-badge ${
          row.isActive ? 'status-badge--active' : 'status-badge--inactive'
        }`}>
          {row.isActive ? 'Aktif' : 'Tamamlandı'}
        </span>
      ),
    },
    {
      title: "Başlangıç",
      key: "createdDate",
      sortable: true,
      render: (v) => formatDate(v),
    },
    {
      title: "Tamamlanma",
      key: "completedDate",
      sortable: true,
      render: (v) => v ? formatDate(v) : "-",
    },
  ];

  const tableData = filteredSessions.map((s) => ({
    ...s,
    id: s.customerServiceSessionId,
  }));

  // Loading state
  if (isLoading) {
    return (
      <Layout className={sessionStyles.sessionLayout}>
        <div className={sessionStyles.loadingContainer}>
          <div className={sessionStyles.spinner}></div>
          <p className={sessionStyles.loadingText}>
            Seans paketleri yükleniyor...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className={sessionStyles.sessionLayout}>
      <GradientCard>
        <GradientCardContent>
          <div className={sessionStyles.headerContainer}>
            <div className={sessionStyles.headerLeft}>
              <h1 className={sessionStyles.pageTitle} style={{ color: '#000000' }}>Seans Paketi Yönetimi</h1>
              <p style={{ margin: '0 0 1rem 0', color: '#6B7280' }}>
                {isAdmin() ? (
                  <>Tüm seans paketlerini görüntüleyebilir, ekleyebilir, düzenleyebilir ve silebilirsiniz. Sistem genelinde seans paketi yönetimi için tam yetkiye sahipsiniz.</>
                ) : isSpecialist() ? (
                  <>Tüm seans paketlerini görüntüleyebilirsiniz. Sadece kendi uzmanlık alanınızdaki seans paketlerini ekleyebilir, düzenleyebilir ve silebilirsiniz.</>
                ) : (
                  <>Seans paketlerini görüntüleyebilirsiniz. Ekleme, düzenleme ve silme işlemleri için uzman yetkisi gereklidir.</>
                )}
              </p>
            </div>
            
            <div className={sessionStyles.headerRight}>
              <FilterBar
                searchQuery={filterCustomer}
                onSearchChange={setFilterCustomer}
                searchPlaceholder="Müşteri Ara..."
                statusFilter={filterStatus}
                onStatusChange={setFilterStatus}
                statusOptions={statusOptions}
                statusPlaceholder="Tüm Durumlar"
                serviceFilter={filterService}
                onServiceChange={setFilterService}
                serviceOptions={services.map((s) => ({
                  value: s.serviceId,
                  label: s.serviceName,
                }))}
                servicePlaceholder="Tüm Hizmetler"
                onClearFilters={() => {
                  setFilterCustomer("");
                  setFilterService("");
                  setFilterStatus("");
                }}
                showSearch={true}
                showDate={false}
                showDateRange={false}
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
              {(isAdmin() || isSpecialist()) && (
                <AddButton onClick={openAddModal}>+ Yeni Seans Paketi</AddButton>
              )}
            </div>
          </div>
        </GradientCardContent>
      </GradientCard>

      {/* Seans Paketi Listesi */}
      <div className={sessionStyles.listCard}>
        <Table
          title="Seans Paketi Listesi"
          showWrapper={true}
          showRecordCount={true}
          showPagination={true}
          page={page}
          pageSize={pageSize}
          total={tableData.length}
          onPageChange={setPage}
          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
          className={sessionStyles.table}
          columns={columns}
          data={tableData.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
          isLoading={isLoading}
          onEdit={handleEditSession}
          onDelete={handleDeleteSession}
          sortable={true}
          hover={true}
          striped={false}
          compact={false}
          editButtonText="Düzenle"
          deleteButtonText="Sil"
        />
      </div>

      {/* Seans Paketi Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingSession ? "Seans Paketi Düzenle" : "Yeni Seans Paketi"}
        size="medium"
        animation="slideUp"
        className={sessionStyles.modal}
      >
        <div className={sessionStyles.form}>
          {/* Müşteri Arama */}
          <FormGroup label="Müşteri" required error={formErrors.customerId}>
            <div className="dropdown">
              <Input
                type="text"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                placeholder="Müşteri adı veya telefon ile ara..."
                disabled={isSubmitting || editingSession}
                className="mb-0"
              />
              {customerSearchTerm && filteredCustomers.length > 0 && !editingSession && (
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
              disabled={isSubmitting || editingSession}
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
              disabled={isSubmitting || editingSession || !selectedCategoryId}
            />
          </FormGroup>

          {/* Toplam Seans */}
          <FormGroup
            label="Toplam Seans Sayısı"
            required
            error={formErrors.totalSessions}
          >
            <Input
              type="number"
              min="1"
              value={formData.totalSessions}
              onChange={(e) =>
                setFormData({ ...formData, totalSessions: e.target.value })
              }
              placeholder="Toplam seans sayısını giriniz"
              required
              disabled={isSubmitting || editingSession}
            />
          </FormGroup>

          {/* Kalan Seans (sadece düzenleme modunda) */}
          {editingSession && (
            <FormGroup
              label="Kalan Seans Sayısı"
              required
              error={formErrors.remainingSessions}
            >
              <Input
                type="number"
                min="0"
                max={formData.totalSessions}
                value={formData.remainingSessions}
                onChange={(e) =>
                  setFormData({ ...formData, remainingSessions: e.target.value })
                }
                placeholder="Kalan seans sayısını giriniz"
                required
                disabled={isSubmitting}
              />
            </FormGroup>
          )}

          {/* Aktif Durumu (sadece düzenleme modunda) */}
          {editingSession && (
            <FormGroup label="Durum">
              <Select
                value={formData.isActive ? "true" : "false"}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.value === "true" })
                }
                options={[
                  { value: "true", label: "Aktif" },
                  { value: "false", label: "Tamamlandı" }
                ]}
                disabled={isSubmitting}
              />
            </FormGroup>
          )}

          <FormActions
            onCancel={closeModal}
            onSubmit={handleSubmit}
            submitText={editingSession ? "Güncelle" : "Kaydet"}
            isSubmitting={isSubmitting}
            align="end"
            submitVariant="primary"
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default SessionPackages;
