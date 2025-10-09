import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import { FormGroup, FormRow, Input, FormActions, Textarea } from '../../components/common/Form';
import { customerService, regionalThinningSessionService, userService } from '../../api/api';
import styles from './RegionalThinning.module.css';


const RegionalThinning = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    bodyArea: '',
    contractDate: new Date().toISOString().split('T')[0],
    belly: '',
    rightArm: '',
    leftArm: '',
    rightLeg: '',
    leftLeg: '',
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
  const [regionalThinningAppointments, setRegionalThinningAppointments] = useState([]);
  const [selectedContractDate, setSelectedContractDate] = useState('');
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  // Appointment table hooks (simple table, no pagination)
  const appointmentColumns = useMemo(() => [
    { key: 'serviceName', title: 'Hizmet' },
    { key: 'appointmentDate', title: 'Tarih', render: (v) => v ? new Date(v).toLocaleDateString('tr-TR') : '-' },
    { key: 'specialistName', title: 'Uzman' },
    { key: 'specialistPhone', title: 'Telefon' },
    { key: 'agreedPrice', title: 'Fiyat', render: (v) => v ? v + ' TL' : '-' },
    { key: 'statusDisplay', title: 'Durum' }
  ], []);

  const appointmentData = useMemo(() => regionalThinningAppointments.map(a => ({
    id: a.appointmentId,
    serviceName: a.serviceName,
    appointmentDate: a.appointmentDate,
    specialistName: a.specialistName,
    specialistPhone: a.specialistPhone,
    agreedPrice: a.agreedPrice,
    statusDisplay: a.statusDisplay
  })), [regionalThinningAppointments]);

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
      const data = await regionalThinningSessionService.getCustomerCompleteInfo(selectedCustomer.customerId);
      
      // Verileri state'lere set et
      setRegionalThinningAppointments(data.regionalThinningAppointments || []);
      setSessions(data.regionalThinningSessions || []);
      
      // Müşteri bilgilerini güncelle
      setSelectedCustomer(prev => ({
        ...prev,
        ...data.customerInfo
      }));
      
      // Müşteri bilgilerini göster
      setShowCustomerInfo(true);
      
    } catch (err) {
      console.error('Müşteri bilgileri yüklenemedi:', err);
      alert('Müşteri bilgileri yüklenemedi: ' + (err.response?.data || err.message));
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

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Tüm müşterileri ve uzmanları yükle
        await Promise.all([
          loadAllCustomers(),
          loadSpecialists()
        ]);
      } catch {
        // ignore errors on initial load
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Müşteri seçme fonksiyonu
  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.fullName);
    setShowCustomerDropdown(false);
    
    // Müşteri seçildiğinde bilgileri sıfırla
    setShowCustomerInfo(false);
    setRegionalThinningAppointments([]);
    setSessions([]);
  };

  // Müşteri arama input değişikliği
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
    
    // Eğer arama temizlenirse, seçili müşteriyi de temizle
    if (value === '') {
      setSelectedCustomer(null);
      setShowCustomerInfo(false);
      setRegionalThinningAppointments([]);
      setSessions([]);
    }
  };

  // Sözleşme tarihi filtreleme
  const filteredSessions = useMemo(() => {
    if (!selectedContractDate) return sessions;
    return sessions.filter(session => 
      session.contractDate && 
      new Date(session.contractDate).toISOString().slice(0, 10) === selectedContractDate
    );
  }, [sessions, selectedContractDate]);

  const handleAddSession = () => {
    if (!selectedCustomer) {
      alert('Lütfen önce bir müşteri seçin.');
      return;
    }
    
    setEditingSession(null);
    // Admin kullanıcısını bul ve default olarak seç
    const adminUser = specialists.find(s => s.username === 'admin' || s.firstName === 'Admin');
    setSessionForm({
      sessionDate: new Date().toISOString().split('T')[0],
      bodyArea: '',
      contractDate: new Date().toISOString().split('T')[0],
      belly: '',
      rightArm: '',
      leftArm: '',
      rightLeg: '',
      leftLeg: '',
      notes: '',
      specialistId: adminUser ? adminUser.userId : null,
      appointmentId: null
    });
    setShowModal(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      sessionDate: new Date(session.sessionDate).toISOString().split('T')[0],
      bodyArea: session.bodyArea,
      contractDate: new Date(session.contractDate).toISOString().split('T')[0],
      belly: session.belly || '',
      rightArm: session.rightArm || '',
      leftArm: session.leftArm || '',
      rightLeg: session.rightLeg || '',
      leftLeg: session.leftLeg || '',
      notes: session.notes || '',
      specialistId: session.specialistId || null
      ,
      appointmentId: session.appointmentId || null
    });
    setShowModal(true);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Bu seansı silmek istediğinizden emin misiniz?')) return;
    try {
      await regionalThinningSessionService.delete(id);
      // Seansları yeniden yükle
      if (selectedCustomer) {
        const data = await regionalThinningSessionService.getCustomerCompleteInfo(selectedCustomer.customerId);
        setSessions(data.regionalThinningSessions || []);
      }
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
        contractDate: sessionForm.contractDate,
        belly: sessionForm.belly ? parseFloat(sessionForm.belly) : null,
        rightArm: sessionForm.rightArm ? parseFloat(sessionForm.rightArm) : null,
        leftArm: sessionForm.leftArm ? parseFloat(sessionForm.leftArm) : null,
        rightLeg: sessionForm.rightLeg ? parseFloat(sessionForm.rightLeg) : null,
        leftLeg: sessionForm.leftLeg ? parseFloat(sessionForm.leftLeg) : null,
        notes: sessionForm.notes || null,
        specialistId: sessionForm.specialistId,
        appointmentId: sessionForm.appointmentId
      };
      if (editingSession) {
        await regionalThinningSessionService.update(editingSession.regionalThinningSessionId, payload);
      } else {
        await regionalThinningSessionService.create(payload);
      }
      setShowModal(false);
      // Seansları yeniden yükle
      if (selectedCustomer) {
        const data = await regionalThinningSessionService.getCustomerCompleteInfo(selectedCustomer.customerId);
        setSessions(data.regionalThinningSessions || []);
      }
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
    { 
      key: 'bodyArea', 
      title: 'Uygulama Bölgesi' 
    },
    {
      key: 'contractDate',
      title: 'Sözleşme Tarihi',
      render: (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'
    },
    {
      key: 'belly',
      title: 'Göbek',
      render: (value) => value ? value.toFixed(2) : '-',
      align: 'right'
    },
    {
      key: 'rightArm',
      title: 'Sağ Kol',
      render: (value) => value ? value.toFixed(2) : '-',
      align: 'right'
    },
    {
      key: 'leftArm',
      title: 'Sol Kol',
      render: (value) => value ? value.toFixed(2) : '-',
      align: 'right'
    },
    {
      key: 'rightLeg',
      title: 'Sağ Bacak',
      render: (value) => value ? value.toFixed(2) : '-',
      align: 'right'
    },
    {
      key: 'leftLeg',
      title: 'Sol Bacak',
      render: (value) => value ? value.toFixed(2) : '-',
      align: 'right'
    },
    {
      key: 'notes',
      title: 'Notlar',
      render: (value) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-'
    }
  ], []);

  return (
    <Layout>
      <div className="pageContainer">
        {/* Müşteri Seçimi ve Bilgileri */}
        <div className="card card-gradient mb-md">
          <h2 className="mt-0">Müşteri Seçimi ve Bilgileri</h2>
          
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
              <button 
                type="button"
                className="btn btn-primary mt-md"
                onClick={handleGetCustomerInfo}
                disabled={isLoading}
              >
                {isLoading ? 'Yükleniyor...' : 'Bilgileri Getir'}
              </button>
            )}
          </FormGroup>

          {/* Müşteri Bilgileri */}
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
                    <label>İlk Randevu Tarihi:</label>
                    <span className={styles.infoValue}>
                      {selectedCustomer.firstAppointmentDate ? 
                        new Date(selectedCustomer.firstAppointmentDate).toLocaleDateString('tr-TR') : 
                        'Belirtilmemiş'
                      }
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Bölgesel İncelme Randevuları:</label>
                    <span className={styles.infoValue}>{regionalThinningAppointments.length}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Toplam Seans Sayısı:</label>
                    <span className={styles.infoValue}>{sessions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Randevu Bilgileri */}
        {showCustomerInfo && regionalThinningAppointments.length > 0 && (
          <div className="card card-gradient mb-md">
            <h2 className="mt-0">Bölgesel İncelme Randevuları</h2>
            <Table
              showWrapper={false}
              showRecordCount={true}
              columns={appointmentColumns}
              data={appointmentData}
              isLoading={isLoading}
              compact={true}
            />
          </div>
        )}

        {showCustomerInfo && selectedCustomer && (
          <div className="card">
            <div className={styles.cardHeader}>
              <h2 className="mt-0">Seans Bilgileri</h2>
              <div className={styles.cardActions}>
                <FormGroup label="Sözleşme Tarihi Filtresi">
                  <Input 
                    type="date" 
                    value={selectedContractDate} 
                    onChange={(e) => setSelectedContractDate(e.target.value)}
                    placeholder="Tüm sözleşmeler"
                  />
                </FormGroup>
                <AddButton onClick={handleAddSession}>+ Yeni Seans Ekle</AddButton>
              </div>
            </div>
          <Table
              showWrapper={false}
            showRecordCount={true}
              columns={columns}
              data={filteredSessions.map(s => ({
                id: s.regionalThinningSessionId,
                sessionDate: s.sessionDate,
                bodyArea: s.bodyArea,
                contractDate: s.contractDate,
                belly: s.belly,
                rightArm: s.rightArm,
                leftArm: s.leftArm,
                rightLeg: s.rightLeg,
                leftLeg: s.leftLeg,
                notes: s.notes
              }))}
              isLoading={isLoading}
              compact={true}
              actions={true}
              onEdit={(row) => handleEditSession(sessions.find(s => s.regionalThinningSessionId === (row.id || row)))}
              onDelete={(rowOrId) => handleDeleteSession(typeof rowOrId === 'object' ? rowOrId.regionalThinningSessionId : rowOrId)}
              editButtonText="Düzenle"
              deleteButtonText="Sil"
              emptyMessage="Bu müşteri için henüz seans kaydı bulunmuyor."
            />
          </div>
        )}

        {!selectedCustomer && (
          <div className="card">
            <div className="text-center p-lg">
              <h3>Müşteri Seçin</h3>
              <p>Bölgesel incelme takip kayıtlarını görüntülemek için yukarıdan bir müşteri seçin ve "Bilgileri Getir" butonuna basın.</p>
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
              <FormGroup label="Seans Tarihi" required>
                <Input 
                  type="date" 
                  value={sessionForm.sessionDate} 
                  onChange={(e) => setSessionForm({...sessionForm, sessionDate: e.target.value})} 
                  required 
                />
              </FormGroup>
              <FormGroup label="Sözleşme Tarihi" required>
                <Input 
                  type="date" 
                  value={sessionForm.contractDate} 
                  onChange={(e) => setSessionForm({...sessionForm, contractDate: e.target.value})} 
                  required 
                />
              </FormGroup>
            </FormRow>
            
            <FormGroup label="Uygulama Bölgesi" required>
              <Input 
                type="text" 
                placeholder="Örn: Üst vücut, Alt vücut, Tam vücut"
                value={sessionForm.bodyArea} 
                onChange={(e) => setSessionForm({...sessionForm, bodyArea: e.target.value})} 
                required 
              />
            </FormGroup>

            <FormGroup label="Uzman" required>
              <select 
                value={sessionForm.specialistId || ''} 
                onChange={(e) => setSessionForm({...sessionForm, specialistId: e.target.value ? parseInt(e.target.value) : null})}
                required
                className={styles.formControl}
              >
                <option value="">Uzman Seçin</option>
                {specialists.map(specialist => (
                  <option key={specialist.userId} value={specialist.userId}>
                    {specialist.firstName} {specialist.lastName} ({specialist.username})
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="İlişkili Randevu">
              <select
                value={sessionForm.appointmentId || ''}
                onChange={(e) => setSessionForm({...sessionForm, appointmentId: e.target.value ? parseInt(e.target.value) : null})}
                className={styles.formControl}
              >
                <option value="">(Varsayılan: yok)</option>
                {regionalThinningAppointments.map(a => (
                  <option key={a.appointmentId} value={a.appointmentId}>
                    {a.serviceName} - {new Date(a.appointmentDate).toLocaleDateString('tr-TR')}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormRow>
              <FormGroup label="Göbek">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={sessionForm.belly} 
                  onChange={(e) => setSessionForm({...sessionForm, belly: e.target.value})} 
                />
              </FormGroup>
              <FormGroup label="Sağ Kol">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={sessionForm.rightArm} 
                  onChange={(e) => setSessionForm({...sessionForm, rightArm: e.target.value})} 
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup label="Sol Kol">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={sessionForm.leftArm} 
                  onChange={(e) => setSessionForm({...sessionForm, leftArm: e.target.value})} 
                />
              </FormGroup>
              <FormGroup label="Sağ Bacak">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={sessionForm.rightLeg} 
                  onChange={(e) => setSessionForm({...sessionForm, rightLeg: e.target.value})} 
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup label="Sol Bacak">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={sessionForm.leftLeg} 
                  onChange={(e) => setSessionForm({...sessionForm, leftLeg: e.target.value})} 
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

export default RegionalThinning;