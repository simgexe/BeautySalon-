import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import styles from './reports.module.css';
import Table from '../../components/common/Table/Table';
import { Bar } from 'react-chartjs-2';
import GradientCard, { GradientCardContent, GradientCardInfo } from '../../components/common/GradientCard';
import SummaryCard, { SummaryCardGrid } from '../../components/common/SummaryCard';
import { PaymentStatus, PaymentMethodType, getPaymentStatusDisplay, getPaymentMethodDisplay } from '../../api/api';
// Icons reserved for future inline decorations; remove to keep lint clean
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const SectionCard = ({ title, children }) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>{title}</div>
    <div className={styles.cardBody}>{children}</div>
  </div>
);

function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('daily'); // 'daily' | 'monthly' | 'yearly'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [specialists, setSpecialists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(''); // '' all, 1 pending, 2 paid, 3 cancelled, 4 refunded
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API data
  const [daily, setDaily] = useState([]); // [{date,totalRevenue}]
  const [monthly, setMonthly] = useState([]); // [{month, monthName, totalRevenue}]
  const [yearly, setYearly] = useState([]); // [{year,totalRevenue}]
  // eslint-disable-next-line no-unused-vars
  const [categoryRevenue, setCategoryRevenue] = useState([]); // [{categoryName,totalRevenue}]
  // eslint-disable-next-line no-unused-vars
  const [specialistRevenue, setSpecialistRevenue] = useState([]); // [{specialistName,totalRevenue}]
  // eslint-disable-next-line no-unused-vars
  const [statusSummary, setStatusSummary] = useState({ paid: 0, pending: 0, cancelled: 0, refunded: 0 });
  const [expenses, setExpenses] = useState([]);
  const [paymentsByStatus, setPaymentsByStatus] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseStartDate, setExpenseStartDate] = useState('');
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagedPayments, setPagedPayments] = useState([]);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const loadData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { reportsService, expenseService, serviceCategoryService, userService, paymentService } = await import('../../api/api');
      const periodPromise = period === 'daily'
        ? reportsService.getDailyRevenue(filters.startDate, filters.endDate)
        : (period === 'monthly' ? reportsService.getMonthlyRevenue(selectedYear) : reportsService.getYearlyRevenue());

      const [periodRes, revenueRes, expensesRes, categoriesRes, usersRes, pendingList, paidList, cancelledList, refundedList] = await Promise.all([
        periodPromise,
        reportsService.getRevenueReport({
          startDate: filters.startDate,
          endDate: filters.endDate,
          specialistId: filters.specialistId,
          categoryId: filters.categoryId,
          includePending: true
        }),
        expenseService.getAll({ startDate: filters.startDate, endDate: filters.endDate }),
        serviceCategoryService.getAll(),
        userService.getUsers(),
        paymentService.getFilteredPayments(paymentMethod || null, 1),
        paymentService.getFilteredPayments(paymentMethod || null, 2),
        paymentService.getFilteredPayments(paymentMethod || null, 3),
        paymentService.getFilteredPayments(paymentMethod || null, 4)
      ]);

      if (period === 'daily') setDaily(periodRes || []);
      if (period === 'monthly') setMonthly(periodRes || []);
      if (period === 'yearly') setYearly(periodRes || []);
      setCategoryRevenue(revenueRes.categoryRevenue || []);
      setSpecialistRevenue(revenueRes.specialistRevenue || []);
      setExpenses(expensesRes || []);
      setCategories(categoriesRes || []);
      // Uzmanlar: rolü Specialist olanları filtrele, değilse tüm kullanıcılar
      const specialistsOnly = (usersRes || []).filter(u => (u.roleName || '').toLowerCase().includes('special'));
      setSpecialists(specialistsOnly.length ? specialistsOnly : (usersRes || []));
      setPaymentsByStatus({
        1: pendingList || [],
        2: paidList || [],
        3: cancelledList || [],
        4: refundedList || []
      });
      setStatusSummary({
        paid: (paidList || []).length,
        pending: (pendingList || []).length,
        cancelled: (cancelledList || []).length,
        refunded: (refundedList || []).length
      });
    } catch (e) {
      setError('Rapor verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [period, paymentMethod, selectedYear]);

  useEffect(() => {
    const load = async () => {
      try {
        await loadData({});
      } catch (e) {
        setError('Rapor verileri alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadData]);

  // Restore filters from URL on first mount
  useEffect(() => {
    const qp = Object.fromEntries(searchParams.entries());
    if (qp.tab) setTab(qp.tab);
    if (qp.period) setPeriod(qp.period);
    if (qp.startDate) setStartDate(qp.startDate);
    if (qp.endDate) setEndDate(qp.endDate);
    if (qp.categoryId) setSelectedCategory(qp.categoryId);
    if (qp.specialistId) setSelectedSpecialist(qp.specialistId);
    if (qp.status) setSelectedPaymentStatus(qp.status);
    if (qp.method) setPaymentMethod(qp.method);
    if (qp.q) setCustomerQuery(qp.q);
    if (qp.min) setMinAmount(qp.min);
    if (qp.max) setMaxAmount(qp.max);
    if (qp.page) setPage(Number(qp.page) || 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to URL
  useEffect(() => {
    const qp = new URLSearchParams();
    qp.set('tab', tab);
    qp.set('period', period);
    if (startDate) qp.set('startDate', startDate); else qp.delete('startDate');
    if (endDate) qp.set('endDate', endDate); else qp.delete('endDate');
    if (selectedCategory) qp.set('categoryId', selectedCategory); else qp.delete('categoryId');
    if (selectedSpecialist) qp.set('specialistId', selectedSpecialist); else qp.delete('specialistId');
    if (selectedPaymentStatus) qp.set('status', selectedPaymentStatus); else qp.delete('status');
    if (paymentMethod) qp.set('method', paymentMethod); else qp.delete('method');
    if (customerQuery) qp.set('q', customerQuery); else qp.delete('q');
    if (minAmount !== '') qp.set('min', String(minAmount)); else qp.delete('min');
    if (maxAmount !== '') qp.set('max', String(maxAmount)); else qp.delete('max');
    qp.set('page', String(page));
    setSearchParams(qp, { replace: true });
  }, [tab, period, startDate, endDate, selectedCategory, selectedSpecialist, selectedPaymentStatus, paymentMethod, customerQuery, minAmount, maxAmount, page, setSearchParams]);

  // Refetch on filter changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData({
        startDate,
        endDate,
        specialistId: selectedSpecialist || undefined,
        categoryId: selectedCategory || undefined
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [startDate, endDate, selectedSpecialist, selectedCategory, period, paymentMethod, selectedYear, selectedMonth, loadData]);

  // Build income detail rows with filters applied
  const incomeRows = useMemo(() => {
    // Tüm ödemeleri birleştir
    const allPayments = [
      ...(paymentsByStatus[PaymentStatus.Pending] || []),
      ...(paymentsByStatus[PaymentStatus.Paid] || []),
      ...(paymentsByStatus[PaymentStatus.Cancelled] || []),
      ...(paymentsByStatus[PaymentStatus.Refunded] || [])
    ];
    
    return allPayments
      .filter(p => {
        // Status filtresi - hem numeric hem string enum desteği
        if (!selectedPaymentStatus) return true;
        const pStatus = typeof p.status === 'number' ? p.status : (PaymentStatus[p.status] || parseInt(p.status));
        return pStatus === Number(selectedPaymentStatus);
      })
      .filter(p => !customerQuery || (p.customerName || '').toLowerCase().includes(customerQuery.toLowerCase()))
      .filter(p => selectedCategory ? (String(p.categoryId || p.appointment?.service?.categoryId || '') === String(selectedCategory)) : true)
      .filter(p => selectedSpecialist ? (String(p.specialistId || p.appointment?.specialistId || '') === String(selectedSpecialist)) : true)
      .filter(p => {
        // Method filtresi - hem numeric hem string enum desteği
        if (!paymentMethod) return true;
        const pMethod = typeof p.paymentMethod === 'number' ? p.paymentMethod : (PaymentMethodType[p.paymentMethod] || parseInt(p.paymentMethod));
        return pMethod === Number(paymentMethod);
      })
      .map(p => {
        // Backend'den gelen değerleri normalize et
        const status = typeof p.status === 'number' ? p.status : (PaymentStatus[p.status] || parseInt(p.status) || 0);
        const method = typeof p.paymentMethod === 'number' ? p.paymentMethod : (PaymentMethodType[p.paymentMethod] || parseInt(p.paymentMethod) || 0);
        
        return {
          id: p.paymentId,
          customer: p.customerName || '-',
          service: p.serviceName || p.appointment?.serviceName || '-',
          specialist: p.specialistName || p.appointment?.specialistName || '-',
          appointmentDate: p.appointmentDate || p.appointment?.appointmentDate || null,
          paymentDate: p.paymentDate || null,
          amount: Number(p.amountPaid || p.amount || 0),
          method: method,
          status: status
        };
      });
  }, [paymentsByStatus, selectedPaymentStatus, customerQuery, selectedCategory, selectedSpecialist, paymentMethod]);

  useEffect(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setTotalPaymentsCount(incomeRows.length);
    setPagedPayments(incomeRows.slice(start, end));
  }, [incomeRows, page, pageSize]);

  // Grouping helper removed (table uses flat pagination)

  const incomeLineData = useMemo(() => {
    let labels = [];
    let gross = [];
    let expenseSeries = [];

    if (period === 'daily') {
      labels = daily.map(d => new Date(d.date).toLocaleDateString('tr-TR'));
      const expensesByDate = expenses.reduce((acc, expense) => {
        const key = new Date(expense.expenseDate).toDateString();
        acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
        return acc;
      }, {});
      gross = daily.map(d => Number(d.totalRevenue || 0));
      expenseSeries = daily.map(d => {
        const key = new Date(d.date).toDateString();
        return Number(expensesByDate[key] || 0);
      });
    } else if (period === 'monthly') {
      // Seçilen ay ve yıla göre filtrele
      const filteredMonthly = monthly.filter(m => 
        (m.year || selectedYear) === selectedYear && 
        m.month === selectedMonth
      );
      labels = filteredMonthly.map(m => m.monthName || String(m.month));
      
      // Aylık gideri hesapla
      const expensesByMonth = expenses.reduce((acc, expense) => {
        const dt = new Date(expense.expenseDate);
        const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
        return acc;
      }, {});
      gross = filteredMonthly.map(m => Number(m.totalRevenue || 0));
      expenseSeries = filteredMonthly.map(m => {
        const idx = (m.year || selectedYear);
        const key = `${idx}-${String(m.month).padStart(2,'0')}`;
        return Number(expensesByMonth[key] || 0);
      });
    } else {
      // yearly
      labels = yearly.map(y => String(y.year));
      const expensesByYear = expenses.reduce((acc, expense) => {
        const dt = new Date(expense.expenseDate);
        const key = String(dt.getFullYear());
        acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
        return acc;
      }, {});
      gross = yearly.map(y => Number(y.totalRevenue || 0));
      expenseSeries = yearly.map(y => Number(expensesByYear[String(y.year)] || 0));
    }

    const net = gross.map((g, i) => g - (expenseSeries[i] || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Gider',
          data: expenseSeries,
          borderColor: 'rgba(239, 68, 68, 0.9)',
          backgroundColor: 'rgba(239, 68, 68, 0.25)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Net Gelir',
          data: net,
          borderColor: 'rgba(34, 197, 94, 0.9)',
          backgroundColor: 'rgba(34, 197, 94, 0.25)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [period, daily, monthly, yearly, expenses, selectedYear, selectedMonth]);

 

  return (
    <Layout>
      <div className={styles.container}>
        {error && (
          <div className={styles.errorAlert}>{error}</div>
        )}
        {/* Top Section - Financial Summary and Filters */}
        <GradientCard>
          <GradientCardContent>
            <div className={styles.gradientCardHeader}>
              <div>
                <div className={styles.pageTitle}>Raporlar</div>
                <div className={styles.pageSubtitle}>Gelir ve giderlerinizi takip edin</div>
                
                {/* Ana Tablar ve Periyot Tabları */}
                <div className={styles.tabRow} style={{ marginTop: '20px' }}>
                  <div className={styles.segmentedPurple}>
                    <button className={`${styles.segmentPurple} ${tab==='overview'?styles.selected:''}`} onClick={() => setTab('overview')} type="button">Genel Bakış</button>
                    <button className={`${styles.segmentPurple} ${tab==='income'?styles.selected:''}`} onClick={() => setTab('income')} type="button">Gelir</button>
                    <button className={`${styles.segmentPurple} ${tab==='expense'?styles.selected:''}`} onClick={() => setTab('expense')} type="button">Gider</button>
                  </div>
                  <div className={styles.tabRowRight}>
                    <div className={styles.segmentedPurple}>
                      <button className={`${styles.segmentPurple} ${period==='daily'?styles.selected:''}`} onClick={() => setPeriod('daily')} type="button">Günlük</button>
                      <button className={`${styles.segmentPurple} ${period==='monthly'?styles.selected:''}`} onClick={() => setPeriod('monthly')} type="button">Aylık</button>
                      <button className={`${styles.segmentPurple} ${period==='yearly'?styles.selected:''}`} onClick={() => setPeriod('yearly')} type="button">Yıllık</button>
                    </div>
                  </div>
                </div>
                {tab === 'income' && (
                  <div className={styles.incomeFilters}>
                    <input className={styles.input} placeholder="Müşteri ara" value={customerQuery} onChange={(e)=>{ setCustomerQuery(e.target.value); setPage(1); }} />
                    <select className={styles.select} value={selectedPaymentStatus} onChange={(e)=>{ setSelectedPaymentStatus(e.target.value); setPage(1); }}>
                      <option value=''>Ödeme: Hepsi</option>
                      <option value={PaymentStatus.Pending}>Bekleyen</option>
                      <option value={PaymentStatus.Paid}>Ödenen</option>
                      <option value={PaymentStatus.Cancelled}>İptal</option>
                      <option value={PaymentStatus.Refunded}>İade</option>
                    </select>
                    <select className={styles.select} value={paymentMethod} onChange={(e)=>{ setPaymentMethod(e.target.value); setPage(1); }}>
                      <option value=''>Yöntem: Hepsi</option>
                      <option value={PaymentMethodType.Cash}>Nakit</option>
                      <option value={PaymentMethodType.CreditCard}>Kredi Kartı</option>
                      <option value={PaymentMethodType.DebitCard}>Banka Kartı</option>
                      <option value={PaymentMethodType.BankTransfer}>Havale</option>
                    </select>
                    <select className={styles.filterSelect} value={selectedSpecialist} onChange={(e)=>setSelectedSpecialist(e.target.value)}>
                      <option value=''>Uzman Filtrele</option>
                      {specialists.map(s => (
                        <option key={s.userId} value={s.userId}>{s.firstName} {s.lastName}</option>
                      ))}
                    </select>
                    <select className={styles.filterSelect} value={selectedCategory} onChange={(e)=>setSelectedCategory(e.target.value)}>
                      <option value=''>Kategori Filtrele</option>
                      {categories.map(c => (
                        <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                      ))}
                    </select>
                  </div>
                )}
                {tab === 'expense' && (
                  <div className={styles.incomeFilters}>
                    <input 
                      className={styles.dateInput} 
                      type="date" 
                      value={expenseStartDate} 
                      onChange={(e) => setExpenseStartDate(e.target.value)} 
                      placeholder="Başlangıç Tarihi"
                    />
                    <input 
                      className={styles.dateInput} 
                      type="date" 
                      value={expenseEndDate} 
                      onChange={(e) => setExpenseEndDate(e.target.value)} 
                      placeholder="Bitiş Tarihi"
                    />
                    <input 
                      className={styles.input} 
                      placeholder="Kategori ara..." 
                      value={expenseCategory} 
                      onChange={(e) => setExpenseCategory(e.target.value)} 
                    />
                  </div>
                )}
              </div>
              <div>
                <GradientCardInfo
                  title="Toplam Net Gelir"
                  value={`₺${(() => {
                    // Tüm ödenen ödemelerden toplam gelir
                    const totalIncome = (paymentsByStatus[PaymentStatus.Paid] || [])
                      .reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0);
                    // Toplam gider
                    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    // Net gelir
                    return (totalIncome - totalExpense).toLocaleString('tr-TR');
                  })()}`}
                />
              </div>
            </div>
          </GradientCardContent>
        </GradientCard>

        {loading ? (
          <div>Raporlar yükleniyor...</div>
        ) : tab === 'overview' && (
          <>

            {/* Özet Kartları */}
            <SummaryCardGrid>
              <SummaryCard
                title="Bekleyen"
                value={`₺${(() => {
                  const pendingPayments = paymentsByStatus[1] || [];
                  return pendingPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="Gerçekleşen"
                value={`₺${(() => {
                  const paidPayments = paymentsByStatus[2] || [];
                  return paidPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="İptal"
                value={`₺${(() => {
                  const cancelledPayments = paymentsByStatus[3] || [];
                  return cancelledPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="İade"
                value={`₺${(() => {
                  const refundedPayments = paymentsByStatus[4] || [];
                  return refundedPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="Giderler"
                value={`₺${expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('tr-TR')}`}
              />
            </SummaryCardGrid>

            {/* Tek Ana Grafik */}
            <SectionCard title="Gelir ve Giderler">
              <div className={styles.chartWrap}>
                <Bar data={incomeLineData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' }},
                  scales: { y: { beginAtZero: true } }
                }} />
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'income' && (
          <>
            <Table
              title="Gelir Detayları"
              showWrapper={true}
              showRecordCount={true}
              headerActions={
                <button className={styles.pageBtn} onClick={() => {
                  const headers = ['Müşteri','Hizmet','Uzman','Randevu','Ödeme','Yöntem','Durum','Tutar'];
                  const rows = incomeRows.map(r => [
                    r.customer,
                    r.service,
                    r.specialist,
                    r.appointmentDate ? new Date(r.appointmentDate).toLocaleString('tr-TR') : '-',
                    r.paymentDate ? new Date(r.paymentDate).toLocaleString('tr-TR') : '-',
                    getPaymentMethodDisplay(r.method),
                    getPaymentStatusDisplay(r.status),
                    r.amount
                  ]);
                  const csv = [headers, ...rows].map(a => a.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
                  const blob = new Blob([new Uint8Array([0xef,0xbb,0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url; link.download = 'gelir-detaylari.csv'; link.click(); URL.revokeObjectURL(url);
                }}>CSV Dışa Aktar</button>
              }
              columns={[
                { key: 'customer', title: 'Müşteri' },
                { key: 'service', title: 'Hizmet' },
                { key: 'specialist', title: 'Uzman' },
                { key: 'appointmentDate', title: 'Randevu', render: (v)=> v? new Date(v).toLocaleString('tr-TR'):'-' },
                { key: 'paymentDate', title: 'Ödeme', render: (v)=> v? new Date(v).toLocaleString('tr-TR'):'-' },
                { key: 'method', title: 'Yöntem', render: (v)=> getPaymentMethodDisplay(v) },
                { key: 'status', title: 'Durum', render: (v)=> (
                  <span className={`${styles.badge} ${Number(v)===PaymentStatus.Paid?styles.badgePaid:Number(v)===PaymentStatus.Pending?styles.badgePending:Number(v)===PaymentStatus.Cancelled?styles.badgeCancelled:styles.badgeRefunded}`}>
                    {getPaymentStatusDisplay(v)}
                  </span>
                ) },
                { key: 'amount', title: 'Tutar', align: 'right', render: (v)=> `₺${Number(v).toLocaleString('tr-TR')}` }
              ]}
              data={pagedPayments}
              isLoading={loading}
              customActions={(row)=> (
                <button className={styles.pageBtn} onClick={()=>{ setDetailRow(row); setDetailOpen(true); }}>Detay</button>
              )}
              actions={true}
              compact={true}
            />
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page===1}>Önceki</button>
            <span className={styles.pageInfo}>Sayfa {page} / {Math.max(1, Math.ceil(totalPaymentsCount / pageSize))}</span>
            <button className={styles.pageBtn} onClick={()=> setPage(p=> Math.min(Math.ceil(totalPaymentsCount / pageSize) || 1, p+1))} disabled={page >= Math.ceil(totalPaymentsCount / pageSize)}>Sonraki</button>
          </div>
          </>
        )}

        {/* Detay Modal */}
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Gelir Detayı"
          size="medium"
          animation="fade"
        >
          {detailRow ? (
            <div>
              <div className={styles.listSections}>
                <div><strong>Müşteri:</strong> {detailRow.customer}</div>
                <div><strong>Hizmet:</strong> {detailRow.service}</div>
                <div><strong>Uzman:</strong> {detailRow.specialist}</div>
                <div><strong>Randevu Tarihi:</strong> {detailRow.appointmentDate ? new Date(detailRow.appointmentDate).toLocaleString('tr-TR') : '-'}</div>
                <div><strong>Ödeme Tarihi:</strong> {detailRow.paymentDate ? new Date(detailRow.paymentDate).toLocaleString('tr-TR') : '-'}</div>
                <div><strong>Ödeme Yöntemi:</strong> {getPaymentMethodDisplay(detailRow.method)}</div>
                <div><strong>Durum:</strong> {getPaymentStatusDisplay(detailRow.status)}</div>
                <div><strong>Tutar:</strong> ₺{detailRow.amount.toLocaleString('tr-TR')}</div>
              </div>
            </div>
          ) : (
            <div>Yükleniyor...</div>
          )}
        </Modal>

        {tab === 'expense' && (
          <Table
            title="Gider Detayları"
            showWrapper={true}
            showRecordCount={false}
              columns={[
                { key: 'description', title: 'Açıklama' },
                { key: 'amount', title: 'Tutar', align: 'right', render: (v) => `₺${Number(v).toLocaleString('tr-TR')}` },
                { key: 'expenseDate', title: 'Tarih', render: (v) => new Date(v).toLocaleDateString('tr-TR') },
                { key: 'category', title: 'Kategori' },
                { key: 'notes', title: 'Notlar' }
              ]}
              data={expenses.filter(e => {
                const matchesCategory = !expenseCategory || (e.category || '').toLowerCase().includes(expenseCategory.toLowerCase());
                const matchesStartDate = !expenseStartDate || new Date(e.expenseDate) >= new Date(expenseStartDate);
                const matchesEndDate = !expenseEndDate || new Date(e.expenseDate) <= new Date(expenseEndDate);
                return matchesCategory && matchesStartDate && matchesEndDate;
              })}
              isLoading={loading}
              actions={false}
              compact={true}
            />
        )}
      </div>
    </Layout>
  );
}

export default Reports;


