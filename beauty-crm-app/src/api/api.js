const API_BASE_URL = 'https://localhost:7072/api';
const httpClient = {
  async get(url) {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async post(url, data) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async put(url, data) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.status === 204 ? null : await response.json();
  },

  async delete(url) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.status === 204 ? null : await response.json();
  },
};

// Customer Service
export const customerService = {
  async getAll() {
    return { data: await httpClient.get('/customers') };
  },

  async getById(id) {
    return { data: await httpClient.get(`/customers/${id}`) };
  },

  async search(query) {
    return {
      data: await httpClient.get(
        `/customers/search?query=${encodeURIComponent(query)}`
      ),
    };
  },

  async create(customerData) {
    return { data: await httpClient.post('/customers', customerData) };
  },

  async update(id, customerData) {
    await httpClient.put(`/customers/${id}`, customerData);
    return { data: null };
  },

  async delete(id) {
    await httpClient.delete(`/customers/${id}`);
    return { data: null };
  },

  async getAppointments(id) {
    return { data: await httpClient.get(`/customers/${id}/appointments`) };
  },

  async getPayments(id) {
    return { data: await httpClient.get(`/customers/${id}/payments`) };
  },
};

// Appointment Service
export const appointmentService = {
  async getAll() {
    return { data: await httpClient.get('/appointments') };
  },

  async getById(id) {
    return { data: await httpClient.get(`/appointments/${id}`) };
  },

  async getCalendarView(startDate, endDate) {
    let url = '/appointments/calendar';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return { data: await httpClient.get(url) };
  },

  async getByDateRange(startDate, endDate) {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    return {
      data: await httpClient.get(
        `/appointments/by-date-range?${params.toString()}`
      ),
    };
  },

  async getCustomerAppointments(customerId) {
    return {
      data: await httpClient.get(`/appointments/customer/${customerId}`),
    };
  },

  async getTodaysAppointments() {
    return { data: await httpClient.get('/appointments/today') };
  },

  async getUpcomingAppointments(days = 7) {
    return {
      data: await httpClient.get(`/appointments/upcoming?days=${days}`),
    };
  },

  async getByStatus(status) {
    return { data: await httpClient.get(`/appointments/by-status/${status}`) };
  },

  async create(appointmentData) {
    // Backend DTO'ya göre dönüştür
    const dto = {
      customerId: parseInt(appointmentData.customerId),
      serviceId: parseInt(appointmentData.serviceId),
      agreedPrice: parseFloat(appointmentData.agreedPrice),
      totalSessions: parseInt(appointmentData.totalSessions),
      appointmentDate: appointmentData.appointmentDate,
    };
    return { data: await httpClient.post('/appointments', dto) };
  },

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
    await httpClient.put(`/appointments/${id}`, dto);
    return { data: null };
  },

  async delete(id) {
    await httpClient.delete(`/appointments/${id}`);
    return { data: null };
  },

  async updateStatus(id, status) {
    await httpClient.put(`/appointments/${id}/status`, status);
    return { data: null };
  },

  async confirm(id) {
    await httpClient.put(`/appointments/${id}/confirm`);
    return { data: null };
  },

  async complete(id) {
    await httpClient.put(`/appointments/${id}/complete`);
    return { data: null };
  },

  async cancel(id) {
    await httpClient.put(`/appointments/${id}/cancel`);
    return { data: null };
  },
};

// Service Service
export const serviceService = {
  async getAll() {
    return { data: await httpClient.get('/services') };
  },

  async getById(id) {
    return { data: await httpClient.get(`/services/${id}`) };
  },

  async getByCategory(categoryId) {
    return {
      data: await httpClient.get(`/services/by-category/${categoryId}`),
    };
  },

  async search(query) {
    return {
      data: await httpClient.get(
        `/services/search?query=${encodeURIComponent(query)}`
      ),
    };
  },

  async create(serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: parseFloat(serviceData.price),
      categoryId: parseInt(serviceData.categoryId),
    };
    return { data: await httpClient.post('/services', dto) };
  },

  async update(id, serviceData) {
    const dto = {
      serviceName: serviceData.serviceName,
      price: parseFloat(serviceData.price),
      categoryId: parseInt(serviceData.categoryId),
    };
    await httpClient.put(`/services/${id}`, dto);
    return { data: null };
  },

  async delete(id) {
    await httpClient.delete(`/services/${id}`);
    return { data: null };
  },
};

// Category Service
export const categoryService = {
  async getAll() {
    return { data: await httpClient.get('/servicecategories') };
  },

  async getById(id) {
    return { data: await httpClient.get(`/servicecategories/${id}`) };
  },

  async getWithServices() {
    return { data: await httpClient.get('/servicecategories/with-services') };
  },

  async create(categoryData) {
    return { data: await httpClient.post('/servicecategories', categoryData) };
  },

  async update(id, categoryData) {
    await httpClient.put(`/servicecategories/${id}`, categoryData);
    return { data: null };
  },

  async delete(id) {
    await httpClient.delete(`/servicecategories/${id}`);
    return { data: null };
  },

  async getServices(id) {
    return { data: await httpClient.get(`/servicecategories/${id}/services`) };
  },
};

// Payment Service
export const paymentService = {
  async getAll() {
    return { data: await httpClient.get('/payments') };
  },

  async getById(id) {
    return { data: await httpClient.get(`/payments/${id}`) };
  },

  async getCustomerPayments(customerId) {
    return { data: await httpClient.get(`/payments/customer/${customerId}`) };
  },

  async getCustomerBalance(customerId) {
    return {
      data: await httpClient.get(`/payments/customer/${customerId}/balance`),
    };
  },

  async getAppointmentPaymentStatus(appointmentId) {
    return {
      data: await httpClient.get(
        `/payments/appointment/${appointmentId}/status`
      ),
    };
  },

  async getPending() {
    return { data: await httpClient.get('/payments/pending') };
  },

  async getFiltered(paymentMethod, status) {
    let url = '/payments/filter?';
    if (paymentMethod) url += `paymentMethod=${paymentMethod}&`;
    if (status) url += `status=${status}&`;
    return { data: await httpClient.get(url) };
  },

  async create(paymentData) {
    const dto = {
      customerId: parseInt(paymentData.customerId),
      appointmentId: paymentData.appointmentId
        ? parseInt(paymentData.appointmentId)
        : null,
      amountPaid: parseFloat(paymentData.amountPaid),
      paymentMethod: paymentData.paymentMethod,
    };
    return { data: await httpClient.post('/payments', dto) };
  },

  async addPartialPayment(partialPaymentData) {
    const dto = {
      appointmentId: parseInt(partialPaymentData.appointmentId),
      amount: parseFloat(partialPaymentData.amount),
      paymentMethod: partialPaymentData.paymentMethod,
    };
    return { data: await httpClient.post('/payments/partial-payment', dto) };
  },

  async update(id, paymentData) {
    const dto = {
      customerId: parseInt(paymentData.customerId),
      appointmentId: paymentData.appointmentId
        ? parseInt(paymentData.appointmentId)
        : null,
      amountPaid: parseFloat(paymentData.amountPaid),
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      status: paymentData.status,
    };
    await httpClient.put(`/payments/${id}`, dto);
    return { data: null };
  },

  async updateStatus(id, status) {
    await httpClient.put(`/payments/${id}/status`, status);
    return { data: null };
  },

  async delete(id) {
    await httpClient.delete(`/payments/${id}`);
    return { data: null };
  },
};
