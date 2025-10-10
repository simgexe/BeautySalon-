import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import { FormGroup, FormRow, Input, FormActions, Textarea } from '../../components/common/Form';
import { customerService, laserSessionService, userService } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import AccessDenied from '../../components/common/AccessDenied/AccessDenied';
import styles from './LaserTracking.module.css';

const LaserTracking = () => {
  const { isAdmin, isSpecialist, hasLaserCategory } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    bodyArea: '',
    energyJPerCm2: '',
    pulse: '',
    speed: '',
    shots: '',
    notes: '',
    specialistId: null,
    appointmentId: null
  });

  // Müşteri arama için yeni state'ler
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Randevu ve kategori bilgileri için state'ler
  const [laserAppointments, setLaserAppointments] = useState([]);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [specialists, setSpecialists] = useState([]);

  // Appointment table columns and data
  const appointmentColumns = useMemo(() => [
    { key: 'serviceName', title: 'Hizmet' },
    { key: 'appointmentDate', title: 'Tarih', render: (v) => v ? new Date(v).toLocaleDateString('tr-TR') : '-' },
    { key: 'specialistName', title: 'Uzman' },
    { key: 'specialistPhone', title: 'Telefon' },
    { key: 'agreedPrice', title: 'Fiyat', render: (v) => v ? v + ' TL' : '-' },
    { key: 'statusDisplay', title: 'Durum' }
  ], []);

  const appointmentData = useMemo(() => laserAppointments.map(a => ({
    id: a.appointmentId,
    serviceName: a.serviceName,
    appointmentDate: a.appointmentDate,
    specialistName: a.specialistName,
    specialistPhone: a.specialistPhone,
    agreedPrice: a.agreedPrice,
    statusDisplay: a.statusDisplay
  })), [laserAppointments]);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const customerId = query.get('customerId');



  // Tüm müşterileri yükle
  const loadAllCustomers = async () => {
    try {
      const customers = await customerService.getAll();
      setAllCustomers(customers || []);
      setFilteredCustomers(customers || []);
    } catch (err) {
      console.error('Müşteriler yüklenemedi:', err);
    }
  };

  // Uzmanları yükle
  const loadSpecialists = async () => {
    try {
      const users = await userService.getUsers();
      setSpecialists(users || []);
    } catch (err) {
      console.error('Uzmanlar yüklenemedi:', err);
    }
  };

  // Müşteri bilgilerini getir butonu
  const handleGetCustomerInfo = async () => {
    if (!selectedCustomer) {
      alert('Lütfen önce bir müşteri seçin.');
      return;
    }

    setIsLoading(true);
    try {
      // Backend'den tüm bilgileri tek seferde getir
      const data = await laserSessionService.getCustomerCompleteInfo(selectedCustomer.customerId);
      
      console.log('Complete info response:', data);
      
      // Randevuları state'e kaydet
      setLaserAppointments(data.laserAppointments || []);
      
      // Seansları state'e kaydet
      setSessions(data.laserSessions || []);
      
      // Müşteri bilgilerini selectedCustomer içine spread et (Regional Thinning gibi)
      setSelectedCustomer(prev => ({
        ...prev,
        ...data.customerInfo
      }));
      
      // Müşteri bilgilerini göster
      setShowCustomerInfo(true);
      
    } catch (err) {
      console.error('Müşteri bilgileri yüklenemedi:', err);
      alert('Müşteri bilgileri yüklenirken hata oluştu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Müşteri arama filtreleme
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers(allCustomers);
    } else {
      const filtered = allCustomers.filter(customer =>
        customer.fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(customerSearchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, allCustomers]);

  // Load real customer data including first appointment and specialist
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Tüm müşterileri yükle
        await loadAllCustomers();
        
        // Uzmanları yükle
        await loadSpecialists();
        
        // Eğer URL'de customerId varsa, o müşteriyi seç
        if (customerId) {
          const customer = allCustomers.find(c => c.customerId === parseInt(customerId));
          if (customer) {
            setSelectedCustomer(customer);
            setCustomerSearchTerm(customer.fullName);
            await handleGetCustomerInfo();
          }
        }
      } catch {
        // ignore errors on initial load
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // Müşteri seçme fonksiyonu
  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.fullName);
    setShowCustomerDropdown(false);
  };

  // Müşteri arama input değişikliği
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
    
    // Eğer arama temizlenirse, seçili müşteriyi de temizle
    if (value === '') {
      setSelectedCustomer(null);
      setSessions([]);
      setLaserAppointments([]);
      setShowCustomerInfo(false);
    }
  };

  const handleAddSession = () => {
    if (!selectedCustomer) {
      alert('Lütfen önce bir müşteri seçin.');
      return;
    }
    
    setEditingSession(null);
    setSessionForm({
      sessionDate: new Date().toISOString().split('T')[0],
      bodyArea: '',
      energyJPerCm2: '',
      pulse: '',
      speed: '',
      shots: '',
      notes: '',
      specialistId: null,
      appointmentId: null
    });
    setShowModal(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      sessionDate: session.sessionDate ? new Date(session.sessionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      bodyArea: session.bodyArea,
      energyJPerCm2: session.energyJPerCm2,
      pulse: session.pulse,
      speed: session.speed,
      shots: session.shots,
      notes: session.notes || '',
      specialistId: session.specialistId || null,
      appointmentId: session.appointmentId || null
    });
    setShowModal(true);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Bu seansı silmek istediğinizden emin misiniz?')) return;
    try {
      await laserSessionService.delete(id);
      await handleGetCustomerInfo();
    } catch (err) {
      alert('Seans silinemedi: ' + (err.response?.data || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentCustomerId = selectedCustomer ? selectedCustomer.customerId : customerId;
    
    if (!currentCustomerId) {
      alert('Müşteri seçimi bulunamadı. Lütfen bir müşteri seçin.');
      return;
    }
    try {
      const payload = {
        customerId: parseInt(currentCustomerId),
        sessionDate: sessionForm.sessionDate,
        bodyArea: sessionForm.bodyArea,
        energyJPerCm2: parseFloat(sessionForm.energyJPerCm2),
        pulse: parseInt(sessionForm.pulse),
        speed: parseFloat(sessionForm.speed),
        shots: parseInt(sessionForm.shots),
        notes: sessionForm.notes || null,
        specialistId: sessionForm.specialistId,
        appointmentId: sessionForm.appointmentId
      };
      if (editingSession) {
        await laserSessionService.update(editingSession.laserSessionId, payload);
      } else {
        await laserSessionService.create(payload);
      }
      setShowModal(false);
      await handleGetCustomerInfo();
    } catch (err) {
      alert('Seans kaydedilemedi: ' + (err.response?.data || err.message));
    }
  };

  const columns = useMemo(() => [
    {
      key: 'sessionDate',
      title: 'Seans Tarihi',
      render: (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'
    },
    { key: 'bodyArea', title: 'Uygulama Bölgesi' },
    { key: 'energyJPerCm2', title: 'J/cm²', align: 'right' },
    { key: 'pulse', title: 'Pulse', align: 'right' },
    { key: 'speed', title: 'Hız', align: 'right' },
    { key: 'shots', title: 'Atış Sayısı', align: 'right' },
    {
      key: 'notes',
      title: 'Notlar',
      render: (value) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-'
    }
  ], []);

  // Role-based access control
  if (!isAdmin() && !isSpecialist()) {
    return (
      <AccessDenied 
        title="Erişim Reddedildi"
        message="Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece admin ve uzman kullanıcılar lazer takip sayfasına erişebilir."
        additionalInfo={[
          "Lazer takip sayfası sadece admin veya uzman kullanıcılar tarafından kullanılabilir.",
          "Staff kullanıcıları bu sayfaya erişemez.",
          "Uzman kullanıcılar sadece kendi uzmanlık alanlarında işlem yapabilir."
        ]}
      />
    );
  }

  // Lazer kategorisi kontrolü
  if (isSpecialist() && !isAdmin() && !hasLaserCategory()) {
    return (
      <AccessDenied 
        title="Erişim Reddedildi"
        message="Bu sayfaya erişim yetkiniz bulunmamaktadır. Lazer takip sayfasına erişmek için lazer kategorisinde uzman olmanız gerekmektedir."
        additionalInfo={[
          "Lazer takip sayfasına erişmek için lazer kategorisinde uzman olmanız gereklidir.",
          "Admin kullanıcıları tüm kategorilere erişebilir.",
          "Uzman kullanıcılar sadece atandıkları kategorilerde işlem yapabilir.",
          "Kategori ataması için admin ile iletişime geçin."
        ]}
      />
    );
  }

  return (
    <Layout>
      <div className="pageContainer">
        {/* Müşteri Arama */}
        <div className="card card-gradient mb-md">
          <h2 className="mt-0">Müşteri Seçimi</h2>
          <FormGroup label="Müşteri Ara">
            <div className="dropdown">
              <Input 
                type="text"
                placeholder="Müşteri adı veya telefon ile ara..."
                value={customerSearchTerm}
                onChange={handleCustomerSearchChange}
                onFocus={() => setShowCustomerDropdown(customerSearchTerm.length > 0)}
                disabled={isLoading}
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
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
        </div>

        {/* Müşteri seçildiğinde Bilgileri Getir butonu */}
        {selectedCustomer && !showCustomerInfo && (
          <div className="card mb-md text-center">
            <button 
              onClick={handleGetCustomerInfo} 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Yükleniyor...' : 'Müşteri Bilgilerini ve Randevularını Getir'}
            </button>
          </div>
        )}

        {/* Müşteri Bilgileri - Lazer Kategorisi */}
        {showCustomerInfo && selectedCustomer && (
          <div className={styles.customerInfoSection}>
            <div className={styles.customerInfoDisplay}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Ad Soyad:</label>
                  <span className={styles.infoValue}>{selectedCustomer.fullName}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Telefon:</label>
                  <span className={styles.infoValue}>{selectedCustomer.phoneNumber}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>İlk Lazer Randevusu:</label>
                  <span className={styles.infoValue}>
                    {selectedCustomer.firstAppointmentDate ? 
                      new Date(selectedCustomer.firstAppointmentDate).toLocaleDateString('tr-TR') : 
                      'Belirtilmemiş'
                    }
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>Lazer Epilasyon Uzmanı:</label>
                  <span className={styles.infoValue}>
                    {selectedCustomer.specialistName || 'Belirtilmemiş'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>Lazer Randevuları:</label>
                  <span className={styles.infoValue}>{laserAppointments.length}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Toplam Seans Sayısı:</label>
                  <span className={styles.infoValue}>{sessions.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Randevular Tablosu */}
        {showCustomerInfo && (
          <div className="mb-md">
            <Table
              title="Lazer Randevuları"
              showWrapper={true}
              showRecordCount={true}
              columns={appointmentColumns}
              data={appointmentData}
              isLoading={isLoading}
              compact={true}
              emptyMessage="Bu müşteri için lazer randevusu bulunmuyor."
            />
          </div>
        )}

        {showCustomerInfo && selectedCustomer && (
          <Table
            title="Seans Bilgileri"
            showWrapper={true}
            showRecordCount={true}
            headerActions={<AddButton onClick={handleAddSession}>+ Yeni Seans Ekle</AddButton>}
              columns={columns}
              data={sessions.map(s => ({
                id: s.laserSessionId,
                sessionDate: s.sessionDate,
                bodyArea: s.bodyArea,
                energyJPerCm2: s.energyJPerCm2,
                pulse: s.pulse,
                speed: s.speed,
                shots: s.shots,
                notes: s.notes
              }))}
              isLoading={isLoading}
              compact={true}
              actions={true}
              onEdit={(row) => handleEditSession(sessions.find(s => s.laserSessionId === (row.id || row)))}
              onDelete={(rowOrId) => handleDeleteSession(typeof rowOrId === 'object' ? rowOrId.laserSessionId : rowOrId)}
              editButtonText="Düzenle"
              deleteButtonText="Sil"
              emptyMessage="Bu müşteri için henüz lazer seans kaydı bulunmuyor."
            />
        )}

        {!selectedCustomer && (
          <div className="card">
            <div className="text-center p-lg">
              <h3>Müşteri Seçin</h3>
              <p>Lazer takip kayıtlarını görüntülemek için yukarıdan bir müşteri seçin.</p>
            </div>
          </div>
        )}

        {/* Session Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingSession ? 'Seans Düzenle' : 'Yeni Seans Ekle'}
          size="medium"
          animation="slideUp"
        >
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup label="İlişkili Randevu" required>
                <select
                  value={sessionForm.appointmentId || ''}
                  onChange={(e) => {
                    const appointmentId = e.target.value ? parseInt(e.target.value) : null;
                    if (appointmentId) {
                      const selectedAppointment = laserAppointments.find(a => a.appointmentId === appointmentId);
                      if (selectedAppointment) {
                        setSessionForm({
                          ...sessionForm, 
                          appointmentId: appointmentId,
                          sessionDate: new Date(selectedAppointment.appointmentDate).toISOString().split('T')[0],
                          specialistId: selectedAppointment.specialistId || sessionForm.specialistId
                        });
                      }
                    } else {
                      setSessionForm({
                        ...sessionForm, 
                        appointmentId: null,
                        sessionDate: new Date().toISOString().split('T')[0]
                      });
                    }
                  }}
                  className={styles.formControl}
                  required
                >
                  <option value="">Randevu Seçin</option>
                  {laserAppointments.map(a => (
                    <option key={a.appointmentId} value={a.appointmentId}>
                      {a.serviceName} - {new Date(a.appointmentDate).toLocaleDateString('tr-TR')} {a.specialistName ? `(${a.specialistName})` : ''}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label="Seans Tarihi (Otomatik)" required>
                <Input 
                  type="date" 
                  value={sessionForm.sessionDate} 
                  disabled
                  title="Randevu seçildiğinde otomatik doldurulur"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup label="Uzman (Otomatik)">
                <select 
                  value={sessionForm.specialistId || ''} 
                  disabled
                  className={styles.formControl}
                  title="Randevu seçildiğinde otomatik doldurulur"
                >
                  <option value="">Uzman Seçin</option>
                  {specialists.map(specialist => (
                    <option key={specialist.userId} value={specialist.userId}>
                      {specialist.firstName} {specialist.lastName}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label="Uygulama Bölgesi" required>
                <Input 
                  type="text" 
                  placeholder="Örn: Bacaklar" 
                  value={sessionForm.bodyArea} 
                  onChange={(e) => setSessionForm({...sessionForm, bodyArea: e.target.value})} 
                  required 
                />
              </FormGroup>
            </FormRow>
            
            <FormRow>
              <FormGroup label="J/cm²" required>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="12" 
                  value={sessionForm.energyJPerCm2} 
                  onChange={(e) => setSessionForm({...sessionForm, energyJPerCm2: e.target.value})} 
                  required 
                />
              </FormGroup>
              <FormGroup label="Pulse" required>
                <Input 
                  type="number" 
                  placeholder="10" 
                  value={sessionForm.pulse} 
                  onChange={(e) => setSessionForm({...sessionForm, pulse: e.target.value})} 
                  required 
                />
              </FormGroup>
            </FormRow>
            
            <FormRow>
              <FormGroup label="Hız" required>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="9" 
                  value={sessionForm.speed} 
                  onChange={(e) => setSessionForm({...sessionForm, speed: e.target.value})} 
                  required 
                />
              </FormGroup>
              <FormGroup label="Atış Sayısı" required>
                <Input 
                  type="number" 
                  placeholder="5000" 
                  value={sessionForm.shots} 
                  onChange={(e) => setSessionForm({...sessionForm, shots: e.target.value})} 
                  required 
                />
              </FormGroup>
            </FormRow>
            
            <FormGroup label="Notlar">
              <Textarea 
                rows={3} 
                placeholder="Ek bilgiler..." 
                value={sessionForm.notes} 
                onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})} 
              />
            </FormGroup>
            
            <FormActions
              onCancel={() => setShowModal(false)}
              onSubmit={handleSubmit}
              submitText={editingSession ? 'Güncelle' : 'Kaydet'}
              cancelText="İptal"
              isSubmitting={isLoading}
            />
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default LaserTracking;
