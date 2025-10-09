import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import styles from './reports.module.css';
import Table from '../../components/common/Table/Table';
import { Bar, Pie } from 'react-chartjs-2';
import GradientCard, { GradientCardContent, GradientCardInfo } from '../../components/common/GradientCard';
import SummaryCard, { SummaryCardGrid } from '../../components/common/SummaryCard';
import FilterBar from '../../components/common/FilterBar/FilterBar';
import { PaymentStatus, PaymentMethodType, getPaymentStatusDisplay, getPaymentMethodDisplay } from '../../api/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagedPayments, setPagedPayments] = useState([]);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar'); // 'bar', 'pie'

  const loadData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { reportsService, expenseService, serviceCategoryService, userService, paymentService } = await import('../../api/api');
      
      // Periyot filtrelerine göre tarih aralığı hesapla
      let filterStartDate = filters.startDate;
      let filterEndDate = filters.endDate;
      
      if (period === 'daily') {
        const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
        filterStartDate = selectedDate.toISOString().split('T')[0];
        filterEndDate = selectedDate.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0);
        filterStartDate = startOfMonth.toISOString().split('T')[0];
        filterEndDate = endOfMonth.toISOString().split('T')[0];
      } else if (period === 'yearly') {
        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear, 11, 31);
        filterStartDate = startOfYear.toISOString().split('T')[0];
        filterEndDate = endOfYear.toISOString().split('T')[0];
      }
      
      const periodPromise = period === 'daily'
        ? reportsService.getDailyRevenue(filterStartDate, filterEndDate)
        : (period === 'monthly' ? reportsService.getMonthlyRevenue(selectedYear) : reportsService.getYearlyRevenue());

      const [periodRes, revenueRes, expensesRes, categoriesRes, usersRes] = await Promise.all([
        periodPromise,
        reportsService.getRevenueReport({
          startDate: filterStartDate,
          endDate: filterEndDate,
          specialistId: filters.specialistId,
          categoryId: filters.categoryId,
          includePending: true
        }),
        expenseService.getAll({ startDate: filterStartDate, endDate: filterEndDate }),
        serviceCategoryService.getAll(),
        userService.getUsers()
      ]);

      // Revenue report'dan gelen detaylı ödeme verilerini kullan
      let allPayments = revenueRes.payments || revenueRes.Payments || [];
      
    // Eğer yeni API'den veri gelmiyorsa, eski yöntemi kullan
    if (allPayments.length === 0) {
        const [pendingListOld, paidListOld, cancelledListOld, refundedListOld] = await Promise.all([
          paymentService.getFilteredPayments(paymentMethod || null, 1),
          paymentService.getFilteredPayments(paymentMethod || null, 2),
          paymentService.getFilteredPayments(paymentMethod || null, 3),
          paymentService.getFilteredPayments(paymentMethod || null, 4)
        ]);
        
        allPayments = [
          ...(pendingListOld || []),
          ...(paidListOld || []),
          ...(cancelledListOld || []),
          ...(refundedListOld || [])
        ];
      }
      
      // Ödeme durumuna göre grupla
      const pendingList = allPayments.filter(p => p.status === 1);
      const paidList = allPayments.filter(p => p.status === 2);
      const cancelledList = allPayments.filter(p => p.status === 3);
      const refundedList = allPayments.filter(p => p.status === 4);

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
  }, [period, paymentMethod, selectedYear, selectedMonth, selectedDay]);

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
    if (qp.year) setSelectedYear(Number(qp.year));
    if (qp.month) setSelectedMonth(Number(qp.month));
    if (qp.day) setSelectedDay(Number(qp.day));
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
    qp.set('year', String(selectedYear));
    qp.set('month', String(selectedMonth));
    qp.set('day', String(selectedDay));
    setSearchParams(qp, { replace: true });
  }, [tab, period, startDate, endDate, selectedCategory, selectedSpecialist, selectedPaymentStatus, paymentMethod, customerQuery, minAmount, maxAmount, page, selectedYear, selectedMonth, selectedDay, setSearchParams]);

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
  }, [startDate, endDate, selectedSpecialist, selectedCategory, period, paymentMethod, selectedYear, selectedMonth, selectedDay, loadData]);

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
          service: p.serviceName || '-',
          category: p.categoryName || '-',
          specialist: p.specialistName || '-',
          appointmentDate: p.appointmentDate || null,
          paymentDate: p.paymentDate || null,
          amount: Number(p.amountPaid || 0),
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

  // Genel grafik verileri (filtrelerden bağımsız)
  const chartData = useMemo(() => {
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
      gross,
      expenseSeries,
      net
    };
  }, [period, daily, monthly, yearly, expenses, selectedYear, selectedMonth]);

  // Bar Chart için veri
  const barChartData = useMemo(() => ({
    labels: chartData.labels,
      datasets: [
      {
        label: 'Brüt Gelir',
        data: chartData.gross,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
        {
          label: 'Gider',
        data: chartData.expenseSeries,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        },
        {
          label: 'Net Gelir',
        data: chartData.net,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  }), [chartData]);


  // Pie Chart için veri (toplam değerler)
  const pieChartData = useMemo(() => {
    const totalGross = chartData.gross.reduce((sum, val) => sum + val, 0);
    const totalExpenses = chartData.expenseSeries.reduce((sum, val) => sum + val, 0);
    const totalNet = chartData.net.reduce((sum, val) => sum + val, 0);

    return {
      labels: ['Brüt Gelir', 'Gider', 'Net Gelir'],
      datasets: [{
        data: [totalGross, totalExpenses, totalNet],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
  }, [chartData]);
 

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
                    
                    {/* Periyot Filtreleri */}
                    {period === 'daily' && (
                      <div className={styles.periodFilters}>
                        <select className={styles.select} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                          {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <select className={styles.select} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                          {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{new Date(2024, month - 1).toLocaleDateString('tr-TR', { month: 'long' })}</option>
                          ))}
                        </select>
                        <select className={styles.select} value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
                          {Array.from({length: new Date(selectedYear, selectedMonth, 0).getDate()}, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {period === 'monthly' && (
                      <div className={styles.periodFilters}>
                        <select className={styles.select} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                          {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <select className={styles.select} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                          {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{new Date(2024, month - 1).toLocaleDateString('tr-TR', { month: 'long' })}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {period === 'yearly' && (
                      <div className={styles.periodFilters}>
                        <select 
                          className={styles.select} 
                          value={selectedYear} 
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                          {Array.from({length: 13}, (_, i) => 2035 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                {tab === 'income' && (
                  <div className={styles.incomeFilters}>
                    <FilterBar
                      searchQuery={customerQuery}
                      onSearchChange={(value) => { setCustomerQuery(value); setPage(1); }}
                      searchPlaceholder="Müşteri ara"
                      statusFilter={selectedPaymentStatus}
                      onStatusChange={(value) => { setSelectedPaymentStatus(value); setPage(1); }}
                      statusOptions={[
                        { value: '', label: 'Ödeme: Hepsi' },
                        { value: PaymentStatus.Pending, label: 'Bekleyen' },
                        { value: PaymentStatus.Paid, label: 'Ödenen' },
                        { value: PaymentStatus.Cancelled, label: 'İptal' },
                        { value: PaymentStatus.Refunded, label: 'İade' }
                      ]}
                      methodFilter={paymentMethod}
                      onMethodChange={(value) => { setPaymentMethod(value); setPage(1); }}
                      methodOptions={[
                        { value: '', label: 'Yöntem: Hepsi' },
                        { value: PaymentMethodType.Cash, label: 'Nakit' },
                        { value: PaymentMethodType.CreditCard, label: 'Kredi Kartı' },
                        { value: PaymentMethodType.DebitCard, label: 'Banka Kartı' },
                        { value: PaymentMethodType.BankTransfer, label: 'Havale' }
                      ]}
                      specialistFilter={selectedSpecialist}
                      onSpecialistChange={setSelectedSpecialist}
                      specialistOptions={specialists.map(s => ({ 
                        value: s.userId, 
                        label: `${s.firstName} ${s.lastName}` 
                      }))}
                      specialistPlaceholder="Uzman Filtrele"
                      categoryFilter={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      categoryOptions={categories.map(c => ({ 
                        value: c.categoryId, 
                        label: c.categoryName 
                      }))}
                      categoryPlaceholder="Kategori Filtrele"
                      onClearFilters={() => {
                        setCustomerQuery('');
                        setSelectedPaymentStatus('');
                        setPaymentMethod('');
                        setSelectedSpecialist('');
                        setSelectedCategory('');
                        setPage(1);
                      }}
                      showSearch={true}
                      showDate={false}
                      showMonth={false}
                      showYear={false}
                      showStatus={true}
                      showMethod={true}
                      showCategory={true}
                      showSpecialist={true}
                      showAmountRange={false}
                      showExpenseCategory={false}
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </div>
                )}
                {tab === 'expense' && (
                  <div className={styles.incomeFilters}>
                    <FilterBar
                      searchQuery={expenseCategory}
                      onSearchChange={setExpenseCategory}
                      searchPlaceholder="Kategori ara..."
                      onClearFilters={() => {
                        setExpenseCategory('');
                      }}
                      showSearch={true}
                      showDate={false}
                      showMonth={false}
                      showYear={false}
                      showStatus={false}
                      showMethod={false}
                      showCategory={false}
                      showSpecialist={false}
                      showAmountRange={false}
                      showExpenseCategory={false}
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <GradientCardInfo
                    title="Toplam Net Gelir"
                  value={`₺${(() => {
                    // Filtrelenmiş tarih aralığı hesapla
                    let filterStartDate = startDate;
                    let filterEndDate = endDate;
                    
                    if (period === 'daily') {
                      const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                      filterStartDate = selectedDate.toISOString().split('T')[0];
                      filterEndDate = selectedDate.toISOString().split('T')[0];
                    } else if (period === 'monthly') {
                      const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                      const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                      filterStartDate = startOfMonth.toISOString().split('T')[0];
                      filterEndDate = endOfMonth.toISOString().split('T')[0];
                    } else if (period === 'yearly') {
                      const startOfYear = new Date(selectedYear, 0, 1);
                      const endOfYear = new Date(selectedYear, 11, 31);
                      filterStartDate = startOfYear.toISOString().split('T')[0];
                      filterEndDate = endOfYear.toISOString().split('T')[0];
                    }
                    
                    // Filtrelenmiş ödenen ödemelerden toplam gelir
                    const filteredPayments = (paymentsByStatus[PaymentStatus.Paid] || [])
                      .filter(p => {
                        if (!filterStartDate && !filterEndDate) return true;
                        const paymentDate = new Date(p.paymentDate || p.appointmentDate);
                        const start = filterStartDate ? new Date(filterStartDate) : null;
                        const end = filterEndDate ? new Date(filterEndDate) : null;
                        
                        if (start && paymentDate < start) return false;
                        if (end && paymentDate > end) return false;
                        return true;
                      });
                    
                    const totalIncome = filteredPayments
                      .reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0);
                    
                    // Filtrelenmiş giderler
                    const filteredExpenses = expenses.filter(e => {
                      if (!filterStartDate && !filterEndDate) return true;
                      const expenseDate = new Date(e.expenseDate);
                      const start = filterStartDate ? new Date(filterStartDate) : null;
                      const end = filterEndDate ? new Date(filterEndDate) : null;
                      
                      if (start && expenseDate < start) return false;
                      if (end && expenseDate > end) return false;
                      return true;
                    });
                    
                    const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    
                    // Net gelir
                    return (totalIncome - totalExpense).toLocaleString('tr-TR');
                  })()}`}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <GradientCardInfo
                    title="Toplam Gider"
                  value={`₺${(() => {
                    // Filtrelenmiş tarih aralığı hesapla
                    let filterStartDate = startDate;
                    let filterEndDate = endDate;
                    
                    if (period === 'daily') {
                      const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                      filterStartDate = selectedDate.toISOString().split('T')[0];
                      filterEndDate = selectedDate.toISOString().split('T')[0];
                    } else if (period === 'monthly') {
                      const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                      const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                      filterStartDate = startOfMonth.toISOString().split('T')[0];
                      filterEndDate = endOfMonth.toISOString().split('T')[0];
                    } else if (period === 'yearly') {
                      const startOfYear = new Date(selectedYear, 0, 1);
                      const endOfYear = new Date(selectedYear, 11, 31);
                      filterStartDate = startOfYear.toISOString().split('T')[0];
                      filterEndDate = endOfYear.toISOString().split('T')[0];
                    }
                    
                    // Filtrelenmiş giderler
                    const filteredExpenses = expenses.filter(e => {
                      if (!filterStartDate && !filterEndDate) return true;
                      const expenseDate = new Date(e.expenseDate);
                      const start = filterStartDate ? new Date(filterStartDate) : null;
                      const end = filterEndDate ? new Date(filterEndDate) : null;
                      
                      if (start && expenseDate < start) return false;
                      if (end && expenseDate > end) return false;
                      return true;
                    });
                    
                    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('tr-TR');
                  })()}`}
                  />
                </div>
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
                  // Filtrelenmiş tarih aralığı hesapla
                  let filterStartDate = startDate;
                  let filterEndDate = endDate;
                  
                  if (period === 'daily') {
                    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                    filterStartDate = selectedDate.toISOString().split('T')[0];
                    filterEndDate = selectedDate.toISOString().split('T')[0];
                  } else if (period === 'monthly') {
                    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                    filterStartDate = startOfMonth.toISOString().split('T')[0];
                    filterEndDate = endOfMonth.toISOString().split('T')[0];
                  } else if (period === 'yearly') {
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const endOfYear = new Date(selectedYear, 11, 31);
                    filterStartDate = startOfYear.toISOString().split('T')[0];
                    filterEndDate = endOfYear.toISOString().split('T')[0];
                  }
                  
                  const pendingPayments = (paymentsByStatus[1] || []).filter(p => {
                    if (!filterStartDate && !filterEndDate) return true;
                    const paymentDate = new Date(p.paymentDate || p.appointmentDate);
                    const start = filterStartDate ? new Date(filterStartDate) : null;
                    const end = filterEndDate ? new Date(filterEndDate) : null;
                    
                    if (start && paymentDate < start) return false;
                    if (end && paymentDate > end) return false;
                    return true;
                  });
                  
                  return pendingPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="Gerçekleşen"
                value={`₺${(() => {
                  // Filtrelenmiş tarih aralığı hesapla
                  let filterStartDate = startDate;
                  let filterEndDate = endDate;
                  
                  if (period === 'daily') {
                    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                    filterStartDate = selectedDate.toISOString().split('T')[0];
                    filterEndDate = selectedDate.toISOString().split('T')[0];
                  } else if (period === 'monthly') {
                    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                    filterStartDate = startOfMonth.toISOString().split('T')[0];
                    filterEndDate = endOfMonth.toISOString().split('T')[0];
                  } else if (period === 'yearly') {
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const endOfYear = new Date(selectedYear, 11, 31);
                    filterStartDate = startOfYear.toISOString().split('T')[0];
                    filterEndDate = endOfYear.toISOString().split('T')[0];
                  }
                  
                  const paidPayments = (paymentsByStatus[2] || []).filter(p => {
                    if (!filterStartDate && !filterEndDate) return true;
                    const paymentDate = new Date(p.paymentDate || p.appointmentDate);
                    const start = filterStartDate ? new Date(filterStartDate) : null;
                    const end = filterEndDate ? new Date(filterEndDate) : null;
                    
                    if (start && paymentDate < start) return false;
                    if (end && paymentDate > end) return false;
                    return true;
                  });
                  
                  return paidPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="İptal"
                value={`₺${(() => {
                  // Filtrelenmiş tarih aralığı hesapla
                  let filterStartDate = startDate;
                  let filterEndDate = endDate;
                  
                  if (period === 'daily') {
                    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                    filterStartDate = selectedDate.toISOString().split('T')[0];
                    filterEndDate = selectedDate.toISOString().split('T')[0];
                  } else if (period === 'monthly') {
                    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                    filterStartDate = startOfMonth.toISOString().split('T')[0];
                    filterEndDate = endOfMonth.toISOString().split('T')[0];
                  } else if (period === 'yearly') {
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const endOfYear = new Date(selectedYear, 11, 31);
                    filterStartDate = startOfYear.toISOString().split('T')[0];
                    filterEndDate = endOfYear.toISOString().split('T')[0];
                  }
                  
                  const cancelledPayments = (paymentsByStatus[3] || []).filter(p => {
                    if (!filterStartDate && !filterEndDate) return true;
                    const paymentDate = new Date(p.paymentDate || p.appointmentDate);
                    const start = filterStartDate ? new Date(filterStartDate) : null;
                    const end = filterEndDate ? new Date(filterEndDate) : null;
                    
                    if (start && paymentDate < start) return false;
                    if (end && paymentDate > end) return false;
                    return true;
                  });
                  
                  return cancelledPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="İade"
                value={`₺${(() => {
                  // Filtrelenmiş tarih aralığı hesapla
                  let filterStartDate = startDate;
                  let filterEndDate = endDate;
                  
                  if (period === 'daily') {
                    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                    filterStartDate = selectedDate.toISOString().split('T')[0];
                    filterEndDate = selectedDate.toISOString().split('T')[0];
                  } else if (period === 'monthly') {
                    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                    filterStartDate = startOfMonth.toISOString().split('T')[0];
                    filterEndDate = endOfMonth.toISOString().split('T')[0];
                  } else if (period === 'yearly') {
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const endOfYear = new Date(selectedYear, 11, 31);
                    filterStartDate = startOfYear.toISOString().split('T')[0];
                    filterEndDate = endOfYear.toISOString().split('T')[0];
                  }
                  
                  const refundedPayments = (paymentsByStatus[4] || []).filter(p => {
                    if (!filterStartDate && !filterEndDate) return true;
                    const paymentDate = new Date(p.paymentDate || p.appointmentDate);
                    const start = filterStartDate ? new Date(filterStartDate) : null;
                    const end = filterEndDate ? new Date(filterEndDate) : null;
                    
                    if (start && paymentDate < start) return false;
                    if (end && paymentDate > end) return false;
                    return true;
                  });
                  
                  return refundedPayments.reduce((sum, p) => sum + Number(p.amountPaid || p.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
              <SummaryCard
                title="Giderler"
                value={`₺${(() => {
                  // Filtrelenmiş tarih aralığı hesapla
                  let filterStartDate = startDate;
                  let filterEndDate = endDate;
                  
                  if (period === 'daily') {
                    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                    filterStartDate = selectedDate.toISOString().split('T')[0];
                    filterEndDate = selectedDate.toISOString().split('T')[0];
                  } else if (period === 'monthly') {
                    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                    filterStartDate = startOfMonth.toISOString().split('T')[0];
                    filterEndDate = endOfMonth.toISOString().split('T')[0];
                  } else if (period === 'yearly') {
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const endOfYear = new Date(selectedYear, 11, 31);
                    filterStartDate = startOfYear.toISOString().split('T')[0];
                    filterEndDate = endOfYear.toISOString().split('T')[0];
                  }
                  
                  const filteredExpenses = expenses.filter(e => {
                    if (!filterStartDate && !filterEndDate) return true;
                    const expenseDate = new Date(e.expenseDate);
                    const start = filterStartDate ? new Date(filterStartDate) : null;
                    const end = filterEndDate ? new Date(filterEndDate) : null;
                    
                    if (start && expenseDate < start) return false;
                    if (end && expenseDate > end) return false;
                    return true;
                  });
                  
                  return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('tr-TR');
                })()}`}
              />
            </SummaryCardGrid>

            {/* Gelişmiş Grafik Bölümü */}
            <div className={styles.chartsGrid}>
              {/* Ana Grafik */}
              <div className={styles.mainChart}>
                <SectionCard title="Gelir ve Gider Analizi">
                  {/* Grafik Türü Seçimi */}
                  <div className={styles.chartTypeSelector}>
                    <div className={styles.segmentedPurple}>
                      <button 
                        className={`${styles.segmentPurple} ${selectedChartType === 'bar' ? styles.selected : ''}`} 
                        onClick={() => setSelectedChartType('bar')} 
                        type="button"
                      >
                        📊 Bar
                      </button>
                      <button 
                        className={`${styles.segmentPurple} ${selectedChartType === 'pie' ? styles.selected : ''}`} 
                        onClick={() => setSelectedChartType('pie')} 
                        type="button"
                      >
                        🥧 Pie
                      </button>
                    </div>
                  </div>
                  
                  
              <div className={styles.chartWrap}>
                    {selectedChartType === 'bar' && (
                      <Bar 
                        data={barChartData} 
                        options={{
                  responsive: true,
                  maintainAspectRatio: false,
                          plugins: { 
                            legend: { 
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                  size: 14,
                                  weight: '500'
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.9)',
                              titleColor: '#fff',
                              bodyColor: '#fff',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              borderWidth: 1,
                              cornerRadius: 12,
                              displayColors: true,
                              padding: 12,
                              titleFont: {
                                size: 14,
                                weight: 'bold'
                              },
                              bodyFont: {
                                size: 13
                              },
                              callbacks: {
                                title: function(context) {
                                  return context[0].label;
                                },
                                label: function(context) {
                                  return `${context.dataset.label}: ₺${context.parsed.y.toLocaleString('tr-TR')}`;
                                },
                                afterBody: function(context) {
                                  const dataIndex = context[0].dataIndex;
                                  const gross = chartData.gross[dataIndex];
                                  const expense = chartData.expenseSeries[dataIndex];
                                  const net = chartData.net[dataIndex];
                                  return [
                                    `Brüt Gelir: ₺${gross.toLocaleString('tr-TR')}`,
                                    `Gider: ₺${expense.toLocaleString('tr-TR')}`,
                                    `Net Gelir: ₺${net.toLocaleString('tr-TR')}`
                                  ];
                                }
                              }
                            }
                          },
                          scales: { 
                            y: { 
                              beginAtZero: true,
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                              },
                              ticks: {
                                callback: function(value) {
                                  return '₺' + value.toLocaleString('tr-TR');
                                },
                                font: {
                                  size: 12
                                }
                              }
                            },
                            x: {
                              grid: {
                                display: false
                              },
                              ticks: {
                                font: {
                                  size: 12
                                }
                              }
                            }
                          },
                          animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                          }
                        }} 
                      />
                    )}
                    {selectedChartType === 'pie' && (
                      <Pie 
                        data={pieChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { 
                            legend: { 
                              position: 'right',
                              labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                  size: 14,
                                  weight: '500'
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleColor: '#fff',
                              bodyColor: '#fff',
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              borderWidth: 1,
                              cornerRadius: 8,
                              displayColors: true,
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ₺${context.parsed.toLocaleString('tr-TR')} (${percentage}%)`;
                                }
                              }
                            }
                          },
                          animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                          }
                        }} 
                      />
                    )}
              </div>
            </SectionCard>
              </div>

              {/* Yan Panel - Özet İstatistikler */}
              <div className={styles.chartSidebar}>
                <SectionCard title="Özet İstatistikler">
                  <div className={styles.statisticsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>💰</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Toplam Gelir</div>
                        <div className={styles.statValue}>
                          ₺{chartData.gross.reduce((sum, val) => sum + val, 0).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>💸</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Toplam Gider</div>
                        <div className={styles.statValue}>
                          ₺{chartData.expenseSeries.reduce((sum, val) => sum + val, 0).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>📊</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Net Gelir</div>
                        <div className={styles.statValue}>
                          ₺{chartData.net.reduce((sum, val) => sum + val, 0).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>📈</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Karlılık Oranı</div>
                        <div className={styles.statValue}>
                          {(() => {
                            const totalGross = chartData.gross.reduce((sum, val) => sum + val, 0);
                            const totalNet = chartData.net.reduce((sum, val) => sum + val, 0);
                            return totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) + '%' : '0%';
                          })()}
                        </div>
                        <div className={styles.trendIndicator}>
                          {(() => {
                            const totalGross = chartData.gross.reduce((sum, val) => sum + val, 0);
                            const totalNet = chartData.net.reduce((sum, val) => sum + val, 0);
                            const profitability = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;
                            
                            if (profitability > 20) {
                              return <span className={styles.trendPositive}>📈 Yüksek Karlılık</span>;
                            } else if (profitability > 10) {
                              return <span className={styles.trendNeutral}>📊 Orta Karlılık</span>;
                            } else {
                              return <span className={styles.trendNegative}>📉 Düşük Karlılık</span>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar ile Gider/Gelir Oranı */}
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>⚖️</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Gider/Gelir Oranı</div>
                        <div className={styles.progressContainer}>
                          {(() => {
                            const totalGross = chartData.gross.reduce((sum, val) => sum + val, 0);
                            const totalExpenses = chartData.expenseSeries.reduce((sum, val) => sum + val, 0);
                            const ratio = totalGross > 0 ? (totalExpenses / totalGross) * 100 : 0;
                            
                            return (
                              <>
                                <div className={styles.progressBar}>
                                  <div 
                                    className={styles.progressFill} 
                                    style={{ 
                                      width: `${Math.min(ratio, 100)}%`,
                                      backgroundColor: ratio > 80 ? '#ef4444' : ratio > 60 ? '#f59e0b' : '#10b981'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.progressText}>
                                  {ratio.toFixed(1)}% 
                                  <span className={styles.progressStatus}>
                                    {ratio > 80 ? 'Yüksek' : ratio > 60 ? 'Orta' : 'Düşük'}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </SectionCard>
              </div>
            </div>

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
                  const headers = ['Müşteri','Hizmet','Kategori','Uzman','Randevu','Ödeme','Yöntem','Durum','Tutar'];
                  const rows = incomeRows.map(r => [
                    r.customer,
                    r.service,
                    r.category,
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
                { key: 'category', title: 'Kategori' },
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
                <div><strong>Kategori:</strong> {detailRow.category}</div>
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
                // Kategori filtresi
                const matchesCategory = !expenseCategory || (e.category || '').toLowerCase().includes(expenseCategory.toLowerCase());
                
                // Periyot filtresi
                let filterStartDate = startDate;
                let filterEndDate = endDate;
                
                if (period === 'daily') {
                  const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                  filterStartDate = selectedDate.toISOString().split('T')[0];
                  filterEndDate = selectedDate.toISOString().split('T')[0];
                } else if (period === 'monthly') {
                  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
                  const endOfMonth = new Date(selectedYear, selectedMonth, 0);
                  filterStartDate = startOfMonth.toISOString().split('T')[0];
                  filterEndDate = endOfMonth.toISOString().split('T')[0];
                } else if (period === 'yearly') {
                  const startOfYear = new Date(selectedYear, 0, 1);
                  const endOfYear = new Date(selectedYear, 11, 31);
                  filterStartDate = startOfYear.toISOString().split('T')[0];
                  filterEndDate = endOfYear.toISOString().split('T')[0];
                }
                
                const expenseDate = new Date(e.expenseDate);
                const start = filterStartDate ? new Date(filterStartDate) : null;
                const end = filterEndDate ? new Date(filterEndDate) : null;
                
                const matchesStartDate = !start || expenseDate >= start;
                const matchesEndDate = !end || expenseDate <= end;
                
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