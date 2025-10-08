import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import { FormGroup, FormRow, Input, FormActions, Textarea } from '../../components/common/Form';
import { customerService, regionalThinningSessionService } from '../../api/api';

const defaultForm = {
  fullName: '',
  phoneNumber: '',
  contractDate: '',
  specialistName: ''
};

const RegionalThinning = () => {
  const [form, setForm] = useState(defaultForm);
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
      const data = await regionalThinningSessionService.getByCustomer(customerIdToLoad);
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
      contractDate: new Date().toISOString().split('T')[0],
      belly: '',
      rightArm: '',
      leftArm: '',
      rightLeg: '',
      leftLeg: '',
      notes: ''
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
      notes: session.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Bu seansı silmek istediğinizden emin misiniz?')) return;
    try {
      await regionalThinningSessionService.delete(id);
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
        contractDate: sessionForm.contractDate,
        belly: sessionForm.belly ? parseFloat(sessionForm.belly) : null,
        rightArm: sessionForm.rightArm ? parseFloat(sessionForm.rightArm) : null,
        leftArm: sessionForm.leftArm ? parseFloat(sessionForm.leftArm) : null,
        rightLeg: sessionForm.rightLeg ? parseFloat(sessionForm.rightLeg) : null,
        leftLeg: sessionForm.leftLeg ? parseFloat(sessionForm.leftLeg) : null,
        notes: sessionForm.notes || null,
        specialistId: null
      };
      if (editingSession) {
        await regionalThinningSessionService.update(editingSession.regionalThinningSessionId, payload);
      } else {
        await regionalThinningSessionService.create(payload);
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
        )}

        {!selectedCustomer && (
          <div className="card">
            <div className="text-center p-lg">
              <h3>Müşteri Seçin</h3>
              <p>Bölgesel incelme takip kayıtlarını görüntülemek için yukarıdan bir müşteri seçin.</p>
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