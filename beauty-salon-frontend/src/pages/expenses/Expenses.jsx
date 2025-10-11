import React, { useState, useEffect, useCallback } from 'react';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import { FormGroup, FormRow, Input, FormActions } from '../../components/common/Form';
import FilterBar from '../../components/common/FilterBar/FilterBar';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

function Expenses() {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Filtre state'leri
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    category: '',
    notes: ''
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const { expenseService } = await import('../../api/api');
      const data = await expenseService.getAll();
      // Backend'den gelen ExpenseId'yi id olarak map et
      const mappedData = (data || []).map(expense => ({
        ...expense,
        id: expense.expenseId
      }));
      setExpenses(mappedData);
      setFilteredExpenses(mappedData);
    } catch (e) {
      setError('Giderler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme fonksiyonu
  const applyFilters = useCallback(() => {
    let filtered = [...expenses];

    // Kategori filtresi
    if (categoryFilter.trim()) {
      filtered = filtered.filter(expense => 
        expense.category && expense.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Tarih filtresi
    if (dateFilter) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expenseDate).toISOString().split('T')[0];
        return expenseDate === dateFilter;
      });
    }

    // Ay filtresi
    if (monthFilter) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expenseDate);
        const expenseMonth = expenseDate.getMonth() + 1; // getMonth() 0-11 arası döner
        return expenseMonth === parseInt(monthFilter);
      });
    }

    // Yıl filtresi
    if (yearFilter) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expenseDate);
        const expenseYear = expenseDate.getFullYear();
        return expenseYear === parseInt(yearFilter);
      });
    }

    setFilteredExpenses(filtered);
    setPage(1); // Filtreleme sonrası ilk sayfaya dön
  }, [expenses, categoryFilter, dateFilter, monthFilter, yearFilter]);

  // Filtreler değiştiğinde otomatik filtreleme
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { expenseService } = await import('../../api/api');

      // Backend DTO beklenen tiplere dönüştürme
      const payload = {
        description: String(formData.description || '').trim(),
        amount: Number(formData.amount),
        expenseDate: new Date(formData.expenseDate).toISOString(),
        category: formData.category ? String(formData.category).trim() : null,
        notes: formData.notes ? String(formData.notes).trim() : null
      };

      if (editingExpense) {
        await expenseService.update(editingExpense.expenseId, payload);
      } else {
        await expenseService.create(payload);
      }
      
      await loadExpenses();
      setShowForm(false);
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        category: '',
        notes: ''
      });
    } catch (e) {
      setError(e?.message || 'Gider kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate.split('T')[0],
      category: expense.category || '',
      notes: expense.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    // Admin kontrolü
    if (!isAdmin()) {
      toast.error('Bu işlem için admin yetkisi gereklidir');
      return;
    }

    if (!window.confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      setError(null); // Önceki hataları temizle
      console.log('Deleting expense with ID:', id);
      const { expenseService } = await import('../../api/api');
      await expenseService.delete(id);
      console.log('Expense deleted successfully');
      toast.success('Gider başarıyla silindi');
      await loadExpenses();
    } catch (e) {
      console.error('Delete error:', e);
      toast.error(`Gider silinemedi: ${e?.message || e?.response?.data?.message || 'Bilinmeyen hata'}`);
      setError(`Gider silinemedi: ${e?.message || e?.response?.data?.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'description', title: 'Açıklama' },
    { key: 'amount', title: 'Tutar', align: 'right', render: (v) => `₺${Number(v).toLocaleString('tr-TR')}` },
    { key: 'expenseDate', title: 'Tarih', render: (v) => new Date(v).toLocaleDateString('tr-TR') },
    { key: 'category', title: 'Kategori' },
    { key: 'createdByUserName', title: 'Ekleyen' },
    { key: 'notes', title: 'Notlar' }
  ];

  return (
    <Layout>
      <div className="pageContainer">
        {error && (
          <div className="alert alertError">
            <span>⚠️</span>
            {error}
          </div>
        )}

        
        <div className="card card-gradient mb-md">
          <div className="section-header">
            <div>
              <h2 className="section-title">Giderler</h2>
              <p className="section-subtitle">
                {isAdmin() ? (
                  <>Tüm giderleri görüntüleyebilir, ekleyebilir, düzenleyebilir ve silebilirsiniz. Sistem genelinde gider yönetimi için tam yetkiye sahipsiniz.</>
                ) : (
                  <>Giderleri görüntüleyebilir, ekleyebilir ve düzenleyebilirsiniz. Silme işlemi için admin yetkisi gereklidir.</>
                )}
              </p>
            </div>
            <div className="flex flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <FilterBar
                searchQuery={categoryFilter}
                onSearchChange={setCategoryFilter}
                searchPlaceholder="Kategori ara..."
                dateFilter={dateFilter}
                onDateChange={setDateFilter}
                monthFilter={monthFilter}
                onMonthChange={setMonthFilter}
                yearFilter={yearFilter}
                onYearChange={setYearFilter}
                onClearFilters={() => {
                  setCategoryFilter('');
                  setDateFilter('');
                  setMonthFilter('');
                  setYearFilter('');
                }}
                showSearch={true}
                showDate={true}
                showMonth={true}
                showYear={true}
                showStatus={false}
                showMethod={false}
                showCategory={false}
                showSpecialist={false}
                showAmountRange={false}
                showExpenseCategory={false}
              />
              
              <AddButton onClick={() => setShowForm(true)}>+ Yeni Gider</AddButton>
            </div>
          </div>
        </div>

        <Table
          title="Gider Listesi"
          showWrapper={true}
          showRecordCount={true}
          showPagination={true}
          page={page}
          pageSize={pageSize}
          total={filteredExpenses.length}
          onPageChange={setPage}
          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
          columns={columns}
          data={filteredExpenses.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
          isLoading={loading}
          onEdit={handleEdit}
          onDelete={isAdmin() ? handleDelete : null}
          actions={true}
          editButtonText="Düzenle"
          deleteButtonText="Sil"
        />

        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
            setFormData({
              description: '',
              amount: '',
              expenseDate: new Date().toISOString().split('T')[0],
              category: '',
              notes: ''
            });
          }}
          title={editingExpense ? 'Gider Düzenle' : 'Yeni Gider'}
          size="medium"
          animation="slideUp"
        >
          <form onSubmit={handleSubmit}>
            <FormGroup label="Açıklama" required>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                placeholder="Gider açıklaması"
              />
            </FormGroup>
            
            <FormRow>
              <FormGroup label="Tutar" required>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  placeholder="0.00"
                />
              </FormGroup>
              <FormGroup label="Tarih" required>
                <Input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  required
                />
              </FormGroup>
            </FormRow>
            
            <FormGroup label="Kategori">
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Kategori adı"
              />
            </FormGroup>
            
            <FormGroup label="Notlar">
              <Input
                type="textarea"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                placeholder="Ek notlar..."
              />
            </FormGroup>
            
            <FormActions
              onCancel={() => setShowForm(false)}
              onSubmit={handleSubmit}
              submitText={editingExpense ? 'Güncelle' : 'Kaydet'}
              cancelText="İptal"
              isSubmitting={loading}
            />
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

export default Expenses;
