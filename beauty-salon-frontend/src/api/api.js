import axios from 'axios';

// ========== API CONFIGURATION ==========
const API_BASE_URL = 'http://localhost:5000/api';

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
  const displays = {
    1: "Planlandı",
    2: "Onaylandı",
    3: "Tamamlandı",
    4: "İptal",
    5: "Gelmedi"
  };
  return displays[status] || status.toString();
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

  // Tarih aralığına göre randevuları getir
  async getByDateRange(startDate, endDate) {
    return await api.get('/appointments/date-range', {
      params: { startDate, endDate }
    });
  },

  // Müşteriye ait randevuları getir
  async getCustomerAppointments(customerId) {
    return await api.get(`/appointments/customer/${customerId}`);
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
    return await api.get(`/appointments/status/${status}`);
  },

  // Yeni randevu oluştur
  async create(appointmentData) {
    const dto = {
      customerId: parseInt(appointmentData.customerId),
      serviceId: parseInt(appointmentData.serviceId),
      agreedPrice: parseFloat(appointmentData.agreedPrice),
      totalSessions: parseInt(appointmentData.totalSessions),
      appointmentDate: appointmentData.appointmentDate
    };
    return await api.post('/appointments', dto);
  },

  // Randevu güncelle
  async update(id, appointmentData) {
    const dto = {
      customerId: parseInt(appointmentData.customerId),
      serviceId: parseInt(appointmentData.serviceId),
      agreedPrice: parseFloat(appointmentData.agreedPrice),
      totalSessions: parseInt(appointmentData.totalSessions),
      remainingSessions: parseInt(appointmentData.remainingSessions),
      appointmentDate: appointmentData.appointmentDate,
      status: appointmentData.status
    };
    return await api.put(`/appointments/${id}`, dto);
  },

  // Randevu durumunu güncelle
  async updateStatus(id, status) {
    return await api.patch(`/appointments/${id}/status`, { status });
  },

  // Randevu sil
  async delete(id) {
    return await api.delete(`/appointments/${id}`);
  },

  // Randevu iptal et
  async cancel(id) {
    return await api.post(`/appointments/${id}/cancel`);
  },

  // Randevuyu onayla
  async confirm(id) {
    return await api.post(`/appointments/${id}/confirm`);
  },

  // Randevuyu tamamla
  async complete(id) {
    return await api.post(`/appointments/${id}/complete`);
  },

  // Randevuyu "gelmedi" olarak işaretle
  async markNoShow(id) {
    return await api.put(`/appointments/${id}/noshow`);
  },

  // Seans kullan (randevuyu tamamla)
  async completeSession(id) {
    return await api.post(`/appointments/${id}/complete-session`);
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

  // Müşteri bakiyesini getir
  async getCustomerBalance(customerId) {
    return await api.get(`/payments/customer/${customerId}/balance`);
  },

  // Randevu ödeme durumunu getir
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
  async add(paymentData) {
    const dto = {
      customerId: parseInt(paymentData.customerId),
      appointmentId: paymentData.appointmentId ? parseInt(paymentData.appointmentId) : null,
      amount: parseFloat(paymentData.amount),
      amountPaid: parseFloat(paymentData.amountPaid),
      paymentMethod: parseInt(paymentData.paymentMethod),
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      notes: paymentData.notes || null
    };
    return await api.post('/payments', dto);
  },

  // Kısmi ödeme ekle
  async addPartialPayment(partialPaymentData) {
    const dto = {
      customerId: parseInt(partialPaymentData.customerId),
      appointmentId: partialPaymentData.appointmentId ? parseInt(partialPaymentData.appointmentId) : null,
      amountPaid: parseFloat(partialPaymentData.amountPaid),
      paymentMethod: parseInt(partialPaymentData.paymentMethod),
      paymentDate: partialPaymentData.paymentDate || new Date().toISOString(),
      notes: partialPaymentData.notes || null
    };
    return await api.post('/payments/partial', dto);
  },

  // Ödeme güncelle
  async update(id, paymentData) {
    const dto = {
      amount: parseFloat(paymentData.amount),
      amountPaid: parseFloat(paymentData.amountPaid),
      paymentMethod: parseInt(paymentData.paymentMethod),
      status: parseInt(paymentData.status),
      notes: paymentData.notes || null
    };
    return await api.put(`/payments/${id}`, dto);
  },

  // Ödeme durumunu güncelle
  async updatePaymentStatus(id, status) {
    return await api.patch(`/payments/${id}/status`, { status });
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
    return await api.get(`/services/category/${categoryId}`);
  },

  // Servis ara
  async search(query) {
    return await api.get('/services/search', {
      params: { query }
    });
  },

  // Yeni servis ekle
  async create(serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: parseFloat(serviceData.price),
      categoryId: parseInt(serviceData.categoryId)
    };
    return await api.post('/services', dto);
  },

  // Servis güncelle
  async update(id, serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: parseFloat(serviceData.price),
      categoryId: parseInt(serviceData.categoryId)
    };
    return await api.put(`/services/${id}`, dto);
  },

  // Servis sil
  async delete(id) {
    return await api.delete(`/services/${id}`);
  }
};

// ========== SERVICE CATEGORY SERVICE ==========
export const categoryService = {
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