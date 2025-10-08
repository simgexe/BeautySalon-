import React, { useState, useEffect } from 'react';
import Layout, { AddButton } from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import Table from '../../components/common/Table/Table';
import { FormGroup, FormRow, Input, FormActions } from '../../components/common/Form';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
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
      setExpenses(data || []);
    } catch (e) {
      setError('Giderler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

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
    if (!window.confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      const { expenseService } = await import('../../api/api');
      await expenseService.delete(id);
      await loadExpenses();
    } catch (e) {
      setError('Gider silinemedi.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'description', title: 'Açıklama' },
    { key: 'amount', title: 'Tutar', align: 'right', render: (v) => `₺${Number(v).toLocaleString('tr-TR')}` },
    { key: 'expenseDate', title: 'Tarih', render: (v) => new Date(v).toLocaleDateString('tr-TR') },
    { key: 'category', title: 'Kategori' },
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
              <p className="section-subtitle">Giderlerinizi yönetin</p>
            </div>
            <AddButton onClick={() => setShowForm(true)}>+ Yeni Gider</AddButton>
          </div>
        </div>

        <Table
          title="Gider Listesi"
          showWrapper={true}
          showRecordCount={true}
          showPagination={true}
          page={page}
          pageSize={pageSize}
          total={expenses.length}
          onPageChange={setPage}
          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
          columns={columns}
          data={expenses.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
          isLoading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
