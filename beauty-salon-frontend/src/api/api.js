// api/api.js - Backend Controllers'a tam uyumlu API servisleri
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000';

console.log('🌐 API Base URL:', API_BASE_URL);

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - debug için
api.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - hata yakalama ve data extraction
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} - ${response.config.url}`);
    return response.data; // Sadece data'yı döndür
  },
  (error) => {
    console.error('📥 Response Error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      throw new Error('API sunucusu çalışmıyor. Lütfen backend\'i başlatın.');
    }
    
    if (error.response) {
      throw new Error(`API Hatası: ${error.response.status} - ${error.response.data || error.response.statusText}`);
    }
    
    throw error;
  }
);

// ========== CUSTOMER SERVICE ==========
export const customerService = {
  // Tüm müşterileri getir (CustomerSummaryDto)
  async getAll() {
    return { data: await api.get('/api/customers') };
  },

  // Belirli müşteriyi getir (CustomerDetailDto)
  async getById(id) {
    return { data: await api.get(`/api/customers/${id}`) };
  },

  // Müşteri arama (telefon veya isim ile)
  async search(query) {
    return {
      data: await api.get(`/api/customers/search?query=${encodeURIComponent(query)}`),
    };
  },

  // Yeni müşteri ekle (CreateCustomerDto → CustomerResponseDto)
  async create(customerData) {
    const dto = {
      fullName: customerData.fullName,
      phoneNumber: customerData.phoneNumber,
      notes: customerData.notes || null
    };
    return { data: await api.post('/api/customers', dto) };
  },

  // Müşteri güncelle (UpdateCustomerDto)
  async update(id, customerData) {
    const dto = {
      fullName: customerData.fullName,
      phoneNumber: customerData.phoneNumber,
      notes: customerData.notes || null
    };
    await api.put(`/api/customers/${id}`, dto);
    return { data: null };
  },

  // Müşteri sil
  async delete(id) {
    await api.delete(`/api/customers/${id}`);
    return { data: null };
  },

  // Müşterinin randevularını getir
  async getAppointments(id) {
    return { data: await api.get(`/api/customers/${id}/appointments`) };
  },

  // Müşterinin ödemelerini getir
  async getPayments(id) {
    return { data: await api.get(`/api/customers/${id}/payments`) };
  },
};

// ========== APPOINTMENT SERVICE ==========
export const appointmentService = {
  // Tüm randevuları getir (AppointmentResponseDto)
  async getAll() {
    return { data: await api.get('/api/appointments') };
  },

  // Belirli randevuyu getir
  async getById(id) {
    return { data: await api.get(`/api/appointments/${id}`) };
  },

  // Müşteri randevularını getir
  async getCustomerAppointments(customerId) {
    return { data: await api.get(`/api/customers/${customerId}/appointments`) };
  },

  // Bugünkü randevuları getir
  async getTodaysAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return { data: await api.get(`/api/appointments/today?date=${today}`) };
  },

  // Gelecek randevuları getir
  async getUpcomingAppointments(days = 7) {
    return { data: await api.get(`/api/appointments/upcoming?days=${days}`) };
  },

  // Takvim görünümü (AppointmentCalendarDto)
  async getCalendarView(startDate, endDate) {
    let url = '/api/appointments/calendar';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return { data: await api.get(url) };
  },

  // Tarih aralığına göre randevuları getir
  async getByDateRange(startDate, endDate) {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    return { data: await api.get(`/api/appointments/by-date-range?${params.toString()}`) };
  },

  // Duruma göre randevuları getir
  async getByStatus(status) {
    return { data: await api.get(`/api/appointments/by-status/${status}`) };
  },

  // Yeni randevu oluştur (CreateAppointmentDto → AppointmentResponseDto)
  async create(appointmentData) {
    const dto = {
      customerId: parseInt(appointmentData.customerId),
      serviceId: parseInt(appointmentData.serviceId),
      agreedPrice: parseFloat(appointmentData.agreedPrice),
      totalSessions: parseInt(appointmentData.totalSessions),
      appointmentDate: appointmentData.appointmentDate,
    };
    return { data: await api.post('/api/appointments', dto) };
  },

  // Randevu güncelle (UpdateAppointmentDto)
  async update(id, appointmentData) {
    const dto = {
      customerId: parseInt(appointmentData.customerId),
      serviceId: parseInt(appointmentData.serviceId),
      agreedPrice: parseFloat(appointmentData.agreedPrice),
      totalSessions: parseInt(appointmentData.totalSessions),
      remainingSessions: parseInt(appointmentData.remainingSessions),
      appointmentDate: appointmentData.appointmentDate,
      status: appointmentData.status,
    };
    await api.put(`/api/appointments/${id}`, dto);
    return { data: null };
  },

  // Randevu sil
  async delete(id) {
    await api.delete(`/api/appointments/${id}`);
    return { data: null };
  },

  // Randevu durumunu güncelle
  async updateStatus(id, status) {
    await api.put(`/api/appointments/${id}/status`, status);
    return { data: null };
  },

  // Randevu onayla
  async confirm(id) {
    await api.put(`/api/appointments/${id}/confirm`);
    return { data: null };
  },

  // Randevu tamamla
  async complete(id) {
    await api.put(`/api/appointments/${id}/complete`);
    return { data: null };
  },

  // Randevu iptal et
  async cancel(id) {
    await api.put(`/api/appointments/${id}/cancel`);
    return { data: null };
  },

  // Randevu "gelmedi" olarak işaretle
  async markAsNoShow(id) {
    await api.put(`/api/appointments/${id}/no-show`);
    return { data: null };
  },
};

// ========== SERVICE SERVICE ==========
export const serviceService = {
  // Tüm servisleri getir (ServiceResponseDto)
  async getAll() {
    return { data: await api.get('/api/services') };
  },

  // Belirli servisi getir
  async getById(id) {
    return { data: await api.get(`/api/services/${id}`) };
  },

  // Kategoriye göre servisleri getir
  async getByCategory(categoryId) {
    return { data: await api.get(`/api/services/by-category/${categoryId}`) };
  },

  // Servis arama
  async search(query) {
    return {
      data: await api.get(`/api/services/search?query=${encodeURIComponent(query)}`),
    };
  },

  // Yeni servis ekle (CreateServiceDto → ServiceResponseDto)
  async create(serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: parseFloat(serviceData.price),
      categoryId: parseInt(serviceData.categoryId),
    };
    return { data: await api.post('/api/services', dto) };
  },

  // Servis güncelle (UpdateServiceDto)
  async update(id, serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: parseFloat(serviceData.price),
      categoryId: parseInt(serviceData.categoryId),
    };
    await api.put(`/api/services/${id}`, dto);
    return { data: null };
  },

  // Servis sil
  async delete(id) {
    await api.delete(`/api/services/${id}`);
    return { data: null };
  }
};

// ========== SERVICE CATEGORY SERVICE ==========
export const categoryService = {
  // Tüm kategorileri getir (ServiceCategoryResponseDto)
  async getAll() {
    return { data: await api.get('/api/servicecategories') };
  },

  // Belirli kategoriyi getir
  async getById(id) {
    return { data: await api.get(`/api/servicecategories/${id}`) };
  },

  // Yeni kategori ekle (CreateServiceCategoryDto → ServiceCategoryResponseDto)
  async create(categoryData) {
    const dto = {
      categoryName: categoryData.categoryName
    };
    return { data: await api.post('/api/servicecategories', dto) };
  },

  // Kategori güncelle (UpdateServiceCategoryDto)
  async update(id, categoryData) {
    const dto = {
      categoryName: categoryData.categoryName
    };
    await api.put(`/api/servicecategories/${id}`, dto);
    return { data: null };
  },

  // Kategori sil
  async delete(id) {
    await api.delete(`/api/servicecategories/${id}`);
    return { data: null };
  }
};

// ========== PAYMENT SERVICE ==========
export const paymentService = {
  // Tüm ödemeleri getir (PaymentResponseDto)
  async getAll() {
    return { data: await api.get('/api/payments') };
  },

  // Belirli ödemeyi getir
  async getById(id) {
    return { data: await api.get(`/api/payments/${id}`) };
  },

  // Müşteri bakiyesini getir
  async getCustomerBalance(customerId) {
    return { data: await api.get(`/api/payments/customer/${customerId}/balance`) };
  },

  // Randevu ödeme durumunu getir
  async getAppointmentPaymentStatus(appointmentId) {
    return { data: await api.get(`/api/payments/appointment/${appointmentId}/status`) };
  },

  // Bekleyen ödemeleri getir
  async getPendingPayments() {
    return { data: await api.get('/api/payments/pending') };
  },

  // Filtrelenmiş ödemeler getir
  async getFilteredPayments(paymentMethod = null, status = null) {
    const params = new URLSearchParams();
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return { data: await api.get(`/api/payments/filter${query}`) };
  },

  // Yeni ödeme ekle (CreatePaymentDto → PaymentResponseDto)
  async create(paymentData) {
    const dto = {
      customerId: parseInt(paymentData.customerId),
      appointmentId: paymentData.appointmentId ? parseInt(paymentData.appointmentId) : null,
      amountPaid: parseFloat(paymentData.amountPaid),
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod, // Enum: Cash=1, CreditCard=2, DebitCard=3, BankTransfer=4
      status: paymentData.status || 1, // PaymentStatus: Pending=1, Paid=2, Cancelled=3, Refunded=4
      paymentNotes: paymentData.paymentNotes || null,
    };
    return { data: await api.post('/api/payments', dto) };
  },

  // Ödeme güncelle (UpdatePaymentDto)
  async update(id, paymentData) {
    const dto = {
      customerId: parseInt(paymentData.customerId),
      appointmentId: paymentData.appointmentId ? parseInt(paymentData.appointmentId) : null,
      amountPaid: parseFloat(paymentData.amountPaid),
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status,
      paymentNotes: paymentData.paymentNotes || null,
    };
    await api.put(`/api/payments/${id}`, dto);
    return { data: null };
  },

  // Ödeme durumunu güncelle
  async updateStatus(id, status) {
    await api.put(`/api/payments/${id}/status`, status);
    return { data: null };
  },

  // Ödeme sil
  async delete(id) {
    await api.delete(`/api/payments/${id}`);
    return { data: null };
  },

  // Kısmi ödeme yap (PartialPaymentDto)
  async makePartialPayment(appointmentId, paymentData) {
    const dto = {
      appointmentId: parseInt(appointmentId),
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      paymentNotes: paymentData.paymentNotes || null
    };
    return { data: await api.post('/api/payments/partial', dto) };
  }
};

// ========== ENUM HELPERS ==========
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

// Enum display helper'ları
export const getAppointmentStatusDisplay = (status) => {
  const displays = {
    1: "Planlandı",
    2: "Onaylandı", 
    3: "Tamamlandı",
    4: "İptal",
    5: "Gelmedi",
    // String enum değerleri
    "Scheduled": "Planlandı",
    "Confirmed": "Onaylandı",
    "Completed": "Tamamlandı",
    "Cancelled": "İptal",
    "NoShow": "Gelmedi"
  };
  return displays[status] || status.toString();
};

export const getPaymentStatusDisplay = (status) => {
  const displays = {
    1: "Bekliyor",
    2: "Ödendi",
    3: "İptal",
    4: "İade",
    // String enum değerleri
    "Pending": "Bekliyor",
    "Paid": "Ödendi",
    "Cancelled": "İptal",
    "Refunded": "İade"
  };
  return displays[status] || status.toString();
};

export const getPaymentMethodDisplay = (method) => {
  const displays = {
    // Sayısal enum değerleri
    1: "Nakit",
    2: "Kredi Kartı",
    3: "Banka Kartı",
    4: "Havale",
    // String enum değerleri
    "Cash": "Nakit",
    "CreditCard": "Kredi Kartı",
    "DebitCard": "Banka Kartı", 
    "BankTransfer": "Havale"
  };
  return displays[method] || method.toString();
};

// ========== API TEST FUNCTION ==========
export const testApiConnection = async () => {
  const results = {
    success: [],
    errors: []
  };

  const endpoints = [
    { name: 'Test', service: () => api.get('/api/test') },
    { name: 'Customers', service: () => api.get('/api/customers') },
    { name: 'Appointments', service: () => api.get('/api/appointments') },
    { name: 'Services', service: () => api.get('/api/services') },
    { name: 'Categories', service: () => api.get('/api/servicecategories') },
    { name: 'Payments', service: () => api.get('/api/payments') }
  ];

  for (const endpoint of endpoints) {
    try {
      await endpoint.service();
      results.success.push(endpoint.name);
    } catch (error) {
      results.errors.push(`${endpoint.name}: ${error.message}`);
    }
  }

  return results;
};