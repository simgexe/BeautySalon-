import axios from 'axios';

// ========== API CONFIGURATION ==========
// Production'da aynı domain'den API'ye istek at
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Production'da relative path kullan
  : 'http://localhost:5000/api';  // Development'da localhost kullan

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} - ${response.config.url}`);
    return response.data;
  },
  (error) => {
    console.error('📥 Response Error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      throw new Error('API sunucusu çalışmıyor. Lütfen backend\'i başlatın.');
    }
    
    if (error.response) {
      const message = error.response.data?.message || 
                     error.response.data?.title || 
                     error.response.statusText;
      throw new Error(`API Hatası (${error.response.status}): ${message}`);
    }
    
    throw error;
  }
);

// ========== ENUMS ==========
export const AppointmentStatus = {
  Scheduled: 1,
  Confirmed: 2,
  Completed: 3,
  Cancelled: 4,
  NoShow: 5
};

export const PaymentStatus = {
  Pending: 1,
  Paid: 2,
  Cancelled: 3,
  Refunded: 4
};

export const PaymentMethodType = {
  Cash: 1,
  CreditCard: 2,
  DebitCard: 3,
  BankTransfer: 4
};

// ========== ENUM HELPERS ==========
export const getAppointmentStatusDisplay = (status) => {
  // Sayısal değerler için
  const numericDisplays = {
    1: { text: "Planlandı", color: "#3B82F6" }, // Mavi
    2: { text: "Onaylandı", color: "#10B981" }, // Yeşil
    3: { text: "Tamamlandı", color: "#059669" }, // Koyu yeşil
    4: { text: "İptal", color: "#EF4444" }, // Kırmızı
    5: { text: "Gelmedi", color: "#F59E0B" } // Turuncu
  };
  
  // String değerler için
  const stringDisplays = {
    "Scheduled": { text: "Planlandı", color: "#3B82F6" }, // Mavi
    "Confirmed": { text: "Onaylandı", color: "#10B981" }, // Yeşil
    "Completed": { text: "Tamamlandı", color: "#059669" }, // Koyu yeşil
    "Cancelled": { text: "İptal", color: "#EF4444" }, // Kırmızı
    "NoShow": { text: "Gelmedi", color: "#F59E0B" } // Turuncu
  };
  
  // Önce sayısal değeri kontrol et
  if (numericDisplays[status]) {
    return numericDisplays[status];
  }
  
  // Sonra string değeri kontrol et
  if (stringDisplays[status]) {
    return stringDisplays[status];
  }
  
  // Bulunamazsa default
  return { text: status.toString(), color: "#6B7280" };
};

export const getPaymentStatusDisplay = (status) => {
  const displays = {
    1: "Bekliyor",
    2: "Ödendi",
    3: "İptal",
    4: "İade"
  };
  return displays[status] || status.toString();
};

export const getPaymentMethodDisplay = (method) => {
  const displays = {
    1: "Nakit",
    2: "Kredi Kartı",
    3: "Banka Kartı",
    4: "Havale"
  };
  return displays[method] || method.toString();
};

// ========== CUSTOMER SERVICE ==========
export const customerService = {
  // Tüm müşterileri getir
  async getAll() {
    return await api.get('/customers');
  },

  // ID'ye göre müşteri getir
  async getById(id) {
    return await api.get(`/customers/${id}`);
  },

  // İsim ile müşteri ara
  async search(name) {
    return await api.get('/customers/search', { 
      params: { name } 
    });
  },

  // Yeni müşteri ekle
  async create(customerData) {
    const dto = {
      fullName: customerData.fullName,
      phoneNumber: customerData.phoneNumber,
      notes: customerData.notes || null
    };
    return await api.post('/customers', dto);
  },

  // Müşteri güncelle
  async update(id, customerData) {
    const dto = {
      fullName: customerData.fullName,
      phoneNumber: customerData.phoneNumber,
      notes: customerData.notes || null
    };
    return await api.put(`/customers/${id}`, dto);
  },

  // Müşteri sil
  async delete(id) {
    return await api.delete(`/customers/${id}`);
  },

  // Müşterinin randevularını getir
  async getAppointments(id) {
    return await api.get(`/customers/${id}/appointments`);
  },

  // Müşterinin ödemelerini getir
  async getPayments(id) {
    return await api.get(`/customers/${id}/payments`);
  },

  // Müşterinin aktif seanslarını getir
  async getActiveSessions(id) {
    return await api.get(`/customers/${id}/sessions`);
  },

  // Müşterinin seans geçmişini getir
  async getSessionHistory(id) {
    return await api.get(`/customers/${id}/session-history`);
  }
};

// ========== APPOINTMENT SERVICE ==========
export const appointmentService = {
  // Tüm randevuları getir
  async getAll() {
    return await api.get('/appointments');
  },

  // ID'ye göre randevu getir
  async getById(id) {
    return await api.get(`/appointments/${id}`);
  },

  // Takvim görünümü için randevuları getir
  async getCalendarView(startDate = null, endDate = null) {
    return await api.get('/appointments/calendar', {
      params: { startDate, endDate }
    });
  },

  // Belirli günün randevularını getir (kategorilere göre gruplu)
  async getByDate(date) {
    return await api.get(`/appointments/by-date/${date.toISOString().split('T')[0]}`);
  },

  // Tarih aralığına göre randevuları getir
  async getByDateRange(startDate, endDate) {
    return await api.get('/appointments/by-date-range', {
      params: { startDate, endDate }
    });
  },

  // Müşteriye ait randevuları getir
  async getCustomerAppointments(customerId) {
    return await api.get(`/appointments/customer/${customerId}`);
  },

  // Müşterinin aktif seanslarını getir
  async getCustomerActiveSessions(customerId) {
    return await api.get(`/appointments/customer/${customerId}/active-sessions`);
  },

  // Bugünün randevularını getir
  async getTodaysAppointments() {
    return await api.get('/appointments/today');
  },

  // Gelecek randevuları getir
  async getUpcomingAppointments() {
    return await api.get('/appointments/upcoming');
  },

  // Duruma göre randevuları getir
  async getByStatus(status) {
    return await api.get(`/appointments/by-status/${status}`);
  },

  // Yeni randevu oluştur
  async create(appointmentData) {
    const dto = {
      customerId: appointmentData.customerId,
      serviceId: appointmentData.serviceId,
      agreedPrice: appointmentData.agreedPrice,
      appointmentDate: appointmentData.appointmentDate
    };
    return await api.post('/appointments', dto);
  },

  // Randevu güncelle
  async update(id, appointmentData) {
    const dto = {
      customerId: appointmentData.customerId,
      serviceId: appointmentData.serviceId,
      agreedPrice: appointmentData.agreedPrice,
      appointmentDate: appointmentData.appointmentDate,
      status: appointmentData.status
    };
    return await api.put(`/appointments/${id}`, dto);
  },

  // Randevu durumunu güncelle
  async updateStatus(id, status) {
    return await api.put(`/appointments/${id}/status`, status);
  },

  // Randevu iptal et
  async cancel(id) {
    return await api.put(`/appointments/${id}/cancel`);
  },

  // Randevu onayla
  async confirm(id) {
    return await api.put(`/appointments/${id}/confirm`);
  },

  // Randevu tamamla
  async complete(id) {
    return await api.put(`/appointments/${id}/complete`);
  },

  // Randevu "gelmedi" olarak işaretle
  async markNoShow(id) {
    return await api.put(`/appointments/${id}/noshow`);
  },

  // Seans kullan
  async completeSession(id) {
    return await api.post(`/appointments/${id}/complete-session`);
  },

  // Randevu sil
  async delete(id) {
    return await api.delete(`/appointments/${id}`);
  }
};

// ========== PAYMENT SERVICE ==========
export const paymentService = {
  // Tüm ödemeleri getir
  async getAll() {
    return await api.get('/payments');
  },

  // ID'ye göre ödeme getir
  async getById(id) {
    return await api.get(`/payments/${id}`);
  },

  // Müşteriye ait ödemeleri getir
  async getCustomerPayments(customerId) {
    return await api.get(`/payments/customer/${customerId}`);
  },

  // Müşterinin borç/alacak durumunu getir
  async getCustomerBalance(customerId) {
    return await api.get(`/payments/customer/${customerId}/balance`);
  },

  // Randevunun ödeme durumunu getir
  async getAppointmentPaymentStatus(appointmentId) {
    return await api.get(`/payments/appointment/${appointmentId}/status`);
  },

  // Bekleyen ödemeleri getir
  async getPendingPayments() {
    return await api.get('/payments/pending');
  },

  // Filtrelenmiş ödemeleri getir
  async getFilteredPayments(paymentMethod = null, status = null) {
    return await api.get('/payments/filter', {
      params: { paymentMethod, status }
    });
  },

  // Yeni ödeme ekle
  async create(paymentData) {
    const dto = {
      customerId: paymentData.customerId,
      appointmentId: paymentData.appointmentId || null,
      amountPaid: paymentData.amountPaid,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status || PaymentStatus.Pending, // Sayısal enum değeri
      paymentNotes: paymentData.paymentNotes || null
    };
    return await api.post('/payments', dto);
  },

  // Kısmi ödeme yap
  async addPartialPayment(appointmentId, amount, paymentMethod, notes = null) {
    const dto = {
      appointmentId: appointmentId,
      amount: amount,
      paymentMethod: paymentMethod,
      paymentNotes: notes
    };
    return await api.post('/payments/partial', dto);
  },

  // Ödeme güncelle
  async update(id, paymentData) {
    const dto = {
      customerId: paymentData.customerId,
      appointmentId: paymentData.appointmentId || null,
      amountPaid: paymentData.amountPaid,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status,
      paymentNotes: paymentData.paymentNotes || null
    };
    return await api.put(`/payments/${id}`, dto);
  },

  // Ödeme durumunu güncelle
  async updateStatus(id, status) {
    return await api.put(`/payments/${id}/status`, status);
  },

  // Ödeme iade et
  async refund(id, reason = null) {
    return await api.put(`/payments/${id}/refund`, reason);
  },

  // Ödeme sil
  async delete(id) {
    return await api.delete(`/payments/${id}`);
  }
};

// ========== SERVICE SERVICE ==========
export const serviceService = {
  // Tüm servisleri getir
  async getAll() {
    return await api.get('/services');
  },

  // ID'ye göre servis getir
  async getById(id) {
    return await api.get(`/services/${id}`);
  },

  // Kategoriye göre servisleri getir
  async getByCategory(categoryId) {
    return await api.get(`/services/by-category/${categoryId}`);
  },

  // Servis ara
  async search(query) {
    return await api.get('/services/search', {
      params: { query }
    });
  },

  // Fiyat aralığına göre servisleri getir
  async getByPriceRange(minPrice = 0, maxPrice = null) {
    return await api.get('/services/by-price-range', {
      params: { minPrice, maxPrice }
    });
  },

  // Yeni servis ekle
  async create(serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: serviceData.price,
      categoryId: serviceData.categoryId,
      defaultSessions: serviceData.defaultSessions || 1
    };
    return await api.post('/services', dto);
  },

  // Servis güncelle
  async update(id, serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: serviceData.price,
      categoryId: serviceData.categoryId,
      defaultSessions: serviceData.defaultSessions
    };
    return await api.put(`/services/${id}`, dto);
  },

  // Servis sil
  async delete(id) {
    return await api.delete(`/services/${id}`);
  }
};

// ========== SERVICE CATEGORY SERVICE ==========
export const serviceCategoryService = {
  // Tüm kategorileri getir
  async getAll() {
    return await api.get('/servicecategories');
  },

  // ID'ye göre kategori getir
  async getById(id) {
    return await api.get(`/servicecategories/${id}`);
  },

  // Yeni kategori ekle
  async create(categoryData) {
    const dto = {
      categoryName: categoryData.categoryName
    };
    return await api.post('/servicecategories', dto);
  },

  // Kategori güncelle
  async update(id, categoryData) {
    const dto = {
      categoryName: categoryData.categoryName
    };
    return await api.put(`/servicecategories/${id}`, dto);
  },

  // Kategori sil
  async delete(id) {
    return await api.delete(`/servicecategories/${id}`);
  }
};

// categoryService alias'ı da ekleyelim (Services.jsx için)
export const categoryService = serviceCategoryService;

// ========== CUSTOMER SERVICE SESSION SERVICE ==========
export const customerServiceSessionService = {
  // Tüm seans paketlerini getir
  async getAll() {
    return await api.get('/customerservicesessions');
  },

  // ID'ye göre seans paketi getir
  async getById(id) {
    return await api.get(`/customerservicesessions/${id}`);
  },

  // Müşterinin seans paketlerini getir
  async getByCustomer(customerId) {
    return await api.get(`/customerservicesessions/customer/${customerId}`);
  },

  // Müşterinin aktif seans paketlerini getir
  async getActiveByCustomer(customerId) {
    return await api.get(`/customerservicesessions/customer/${customerId}/active`);
  },

  // Yeni seans paketi oluştur
  async create(sessionData) {
    const dto = {
      customerId: sessionData.customerId,
      serviceId: sessionData.serviceId,
      totalSessions: sessionData.totalSessions
    };
    return await api.post('/customerservicesessions', dto);
  },

  // Seans paketini güncelle
  async update(id, sessionData) {
    const dto = {
      remainingSessions: sessionData.remainingSessions,
      isActive: sessionData.isActive,
      completedDate: sessionData.completedDate
    };
    return await api.put(`/customerservicesessions/${id}`, dto);
  },

  // Seans paketini tamamla
  async complete(id) {
    return await api.put(`/customerservicesessions/${id}/complete`);
  },

  // Seans paketini sil
  async delete(id) {
    return await api.delete(`/customerservicesessions/${id}`);
  }
};

// ========== API CONNECTION TEST ==========
export const testApiConnection = async () => {
  const results = {
    success: [],
    errors: []
  };

  const endpoints = [
    { name: 'Customers', test: () => api.get('/customers') },
    { name: 'Appointments', test: () => api.get('/appointments') },
    { name: 'Services', test: () => api.get('/services') },
    { name: 'Categories', test: () => api.get('/servicecategories') },
    { name: 'Payments', test: () => api.get('/payments') }
  ];

  for (const endpoint of endpoints) {
    try {
      await endpoint.test();
      results.success.push(endpoint.name);
      console.log(`✅ ${endpoint.name} endpoint çalışıyor`);
    } catch (error) {
      results.errors.push(`${endpoint.name}: ${error.message}`);
      console.error(`❌ ${endpoint.name} endpoint hatası:`, error.message);
    }
  }

  return results;
};

// ========== EXPORT DEFAULT ==========
export default api;