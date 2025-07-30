import React, { useState, useEffect } from 'react';
import { paymentService, customerService, appointmentService } from '../api/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    appointmentId: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().slice(0, 16),
    status: 'Paid'
  });

  const paymentMethods = [
    { value: 'Cash', label: 'Nakit' },
    { value: 'CreditCard', label: 'Kredi Kartı' },
    { value: 'DebitCard', label: 'Banka Kartı' },
    { value: 'BankTransfer', label: 'Havale' }
  ];

  const paymentStatuses = [
    { value: 'Pending', label: 'Bekliyor', color: '#F59E0B' },
    { value: 'Paid', label: 'Ödendi', color: '#10B981' },
    { value: 'Cancelled', label: 'İptal', color: '#EF4444' },
    { value: 'Refunded', label: 'İade', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, filterStatus, filterMethod]);

  const fetchData = async () => {
    try {
      const [paymentsRes, customersRes, appointmentsRes] = await Promise.all([
        paymentService.getAll(),
        customerService.getAll(),
        appointmentService.getAll()
      ]);
      
      setPayments(paymentsRes.data);
      setCustomers(customersRes.data);
      setAppointments(appointmentsRes.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Veri yüklerken hata:', error);
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchQuery.trim()) {
      filtered = filtered.filter(payment =>
        payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    if (filterMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filterMethod);
    }

    setFilteredPayments(filtered);
  };

  const openAddModal = () => {
    setEditingPayment(null);
    setFormData({
      customerId: '',
      appointmentId: '',
      amountPaid: '',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().slice(0, 16),
      status: 'Paid'
    });
    setShowAddModal(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormData({
      customerId: payment.customerId.toString(),
      appointmentId: payment.appointmentId?.toString() || '',
      amountPaid: payment.amountPaid.toString(),
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date(payment.paymentDate).toISOString().slice(0, 16),
      status: payment.status
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingPayment(null);
    setFormData({
      customerId: '',
      appointmentId: '',
      amountPaid: '',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().slice(0, 16),
      status: 'Paid'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        customerId: formData.customerId,
        appointmentId: formData.appointmentId || null,
        amountPaid: formData.amountPaid,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        status: formData.status
      };

      if (editingPayment) {
        await paymentService.update(editingPayment.paymentId, paymentData);
      } else {
        await paymentService.create(paymentData);
      }
      
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Ödeme kaydederken hata:', error);
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) {
      try {
        await paymentService.delete(paymentId);
        fetchData();
      } catch (error) {
        console.error('Ödeme silerken hata:', error);
      }
    }
  };

  const showCustomerBalance = async (customerId) => {
    try {
      const response = await paymentService.getCustomerBalance(customerId);
      setSelectedCustomerBalance(response.data);
      setShowBalanceModal(true);
    } catch (error) {
      console.error('Müşteri bakiye bilgisi alınırken hata:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = paymentStatuses.find(s => s.value === status);
    return statusConfig?.color || '#6B7280';
  };

  const getMethodLabel = (method) => {
    const methodConfig = paymentMethods.find(m => m.value === method);
    return methodConfig?.label || method;
  };

  const getCustomerAppointments = (customerId) => {
    return appointments.filter(apt => apt.customerId === parseInt(customerId));
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <p style={{ color: '#666' }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: 0 }}>
          Ödemeler
        </h1>
        <button
          onClick={openAddModal}
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
          + Yeni Ödeme
        </button>
      </div>

      {/* Arama ve Filtreler */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Müşteri veya hizmet ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px'
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: 'white',
            minWidth: '150px'
          }}
        >
          <option value="">Tüm Durumlar</option>
          {paymentStatuses.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: 'white',
            minWidth: '150px'
          }}
        >
          <option value="">Tüm Yöntemler</option>
          {paymentMethods.map(method => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ödemeler Tablosu */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Müşteri</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Hizmet</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Tutar</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Tarih</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Yöntem</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Durum</th>
              <th style={{ padding: '16px', textAlign: 'right', color: '#666', fontWeight: '600' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                  {searchQuery || filterStatus || filterMethod 
                    ? 'Arama kriterlerine uygun ödeme bulunamadı.' 
                    : 'Henüz ödeme kaydı bulunmamaktadır.'}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.paymentId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ color: '#333', fontWeight: '500' }}>
                        {payment.customerName}
                      </div>
                      <button
                        onClick={() => showCustomerBalance(payment.customerId)}
                        style={{
                          fontSize: '12px',
                          color: '#4F46E5',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Bakiye Görüntüle
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#333' }}>
                    {payment.serviceName || 'Genel Ödeme'}
                  </td>
                  <td style={{ padding: '16px', color: '#333', fontWeight: '500' }}>
                    ₺{payment.amountPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {new Date(payment.paymentDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {getMethodLabel(payment.paymentMethod)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: `${getStatusColor(payment.status)}20`,
                      color: getStatusColor(payment.status),
                      border: `1px solid ${getStatusColor(payment.status)}40`
                    }}>
                      {paymentStatuses.find(s => s.value === payment.status)?.label || payment.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(payment)}
                      style={{
                        padding: '6px 12px',
                        marginRight: '8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#4F46E5',
                        cursor: 'pointer'
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(payment.paymentId)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#dc2626',
                        cursor: 'pointer'
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ödeme Ekleme/Düzenleme Modal */}
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
              {editingPayment ? 'Ödeme Düzenle' : 'Yeni Ödeme'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Müşteri *
                </label>
                <select
                  required
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
                  Randevu (Opsiyonel)
                </label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Genel Ödeme</option>
                  {formData.customerId && getCustomerAppointments(formData.customerId).map(appointment => {
                    const service = appointment.serviceName || 'Bilinmeyen Hizmet';
                    const date = new Date(appointment.appointmentDate).toLocaleDateString('tr-TR');
                    return (
                      <option key={appointment.appointmentId} value={appointment.appointmentId}>
                        {service} - {date}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Ödeme Yöntemi
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                  Ödeme Tarihi
                </label>
                <input
                  type="datetime-local"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
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
                  {paymentStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  {editingPayment ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Müşteri Bakiye Modal */}
      {showBalanceModal && selectedCustomerBalance && (
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
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', color: '#333', margin: 0 }}>Müşteri Bakiyesi</h2>
              <button
                onClick={() => setShowBalanceModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>
                {selectedCustomerBalance.customerName}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#666' }}>Toplam Anlaşmalı:</span>
                  <p style={{ fontWeight: '500', margin: '4px 0', color: '#333' }}>
                    ₺{selectedCustomerBalance.totalAgreedAmount.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Toplam Ödenen:</span>
                  <p style={{ fontWeight: '500', margin: '4px 0', color: '#10B981' }}>
                    ₺{selectedCustomerBalance.totalPaidAmount.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Bekleyen:</span>
                  <p style={{ fontWeight: '500', margin: '4px 0', color: '#F59E0B' }}>
                    ₺{selectedCustomerBalance.pendingAmount.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Kalan Borç:</span>
                  <p style={{ fontWeight: '500', margin: '4px 0', color: '#EF4444' }}>
                    ₺{selectedCustomerBalance.remainingDebt.toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              
              {selectedCustomerBalance.overPaid > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '14px', color: '#1e40af' }}>
                    Kredi: ₺{selectedCustomerBalance.overPaid.toLocaleString('tr-TR')}
                  </span>
                </div>
              )}
              
              <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                <p style={{ margin: '2px 0' }}>Toplam Ödeme Sayısı: {selectedCustomerBalance.totalPayments}</p>
                {selectedCustomerBalance.lastPaymentDate && (
                  <p style={{ margin: '2px 0' }}>
                    Son Ödeme: {new Date(selectedCustomerBalance.lastPaymentDate).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;