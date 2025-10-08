import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import { FormGroup, FormRow, Input, FormActions, Textarea } from '../../components/common/Form';
import { customerService, laserSessionService } from '../../api/api';

const defaultForm = {
  fullName: '',
  phoneNumber: '',
  contractDate: '',
  specialistName: ''
};

const LaserTracking = () => {
  const [form, setForm] = useState(defaultForm);
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
    notes: ''
  });

  // Müşteri arama için yeni state'ler
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const customerId = query.get('customerId');

  const loadSessions = async (customerIdToLoad = customerId) => {
    if (!customerIdToLoad) return;
    try {
      const data = await laserSessionService.getByCustomer(customerIdToLoad);
      setSessions(data || []);
    } catch (err) {
      console.error('Seanslar yüklenemedi:', err);
    }
  };

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
        
        if (customerId) {
          const detail = await customerService.getById(customerId);
          setForm(v => ({
            ...v,
            fullName: detail.fullName || '',
            phoneNumber: detail.phoneNumber || '',
            contractDate: detail.firstAppointmentDate ? new Date(detail.firstAppointmentDate).toISOString().slice(0, 10) : '',
            specialistName: detail.specialistName || ''
          }));

          await loadSessions();
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
    
    // Form'u müşteri bilgileri ile doldur
    setForm({
      fullName: customer.fullName || '',
      phoneNumber: customer.phoneNumber || '',
      contractDate: customer.firstAppointmentDate ? new Date(customer.firstAppointmentDate).toISOString().slice(0, 10) : '',
      specialistName: customer.specialistName || ''
    });
    
    // Bu müşterinin seanslarını yükle
    await loadSessions(customer.customerId);
  };

  // Müşteri arama input değişikliği
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
    
    // Eğer arama temizlenirse, seçili müşteriyi de temizle
    if (value === '') {
      setSelectedCustomer(null);
      setForm(defaultForm);
      setSessions([]);
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
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      sessionDate: new Date(session.sessionDate).toISOString().split('T')[0],
      bodyArea: session.bodyArea,
      energyJPerCm2: session.energyJPerCm2,
      pulse: session.pulse,
      speed: session.speed,
      shots: session.shots,
      notes: session.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Bu seansı silmek istediğinizden emin misiniz?')) return;
    try {
      await laserSessionService.delete(id);
      await loadSessions();
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
        specialistId: null
      };
      if (editingSession) {
        await laserSessionService.update(editingSession.laserSessionId, payload);
      } else {
        await laserSessionService.create(payload);
      }
      setShowModal(false);
      await loadSessions(currentCustomerId);
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

        {/* Müşteri Bilgileri */}
        {selectedCustomer && (
          <div className="card card-gradient mb-md">
            <h2 className="mt-0">Müşteri Bilgileri</h2>
            <FormRow>
              <FormGroup label="Ad Soyad">
                <Input placeholder="Örn: Ayşe Yılmaz" value={form.fullName} onChange={(e)=> setForm({ ...form, fullName: e.target.value })} disabled={isLoading} />
              </FormGroup>
              <FormGroup label="Telefon Numarası">
                <Input placeholder="Örn: 0555 123 45 67" value={form.phoneNumber} onChange={(e)=> setForm({ ...form, phoneNumber: e.target.value })} disabled={isLoading} />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="Sözleşme Tarihi">
                <Input type="date" value={form.contractDate} onChange={(e)=> setForm({ ...form, contractDate: e.target.value })} disabled={isLoading} />
              </FormGroup>
              <FormGroup label="Estetisyen">
                <Input placeholder="Uzman adı" value={form.specialistName} onChange={(e)=> setForm({ ...form, specialistName: e.target.value })} disabled={isLoading} />
              </FormGroup>
            </FormRow>
          </div>
        )}

        {selectedCustomer && (
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
              <FormGroup label="Seans Tarihi" required>
                <Input 
                  type="date" 
                  value={sessionForm.sessionDate} 
                  onChange={(e) => setSessionForm({...sessionForm, sessionDate: e.target.value})} 
                  required 
                />
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
