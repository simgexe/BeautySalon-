import React from 'react';

const FilterBar = ({ 
  // Arama filtreleri
  searchQuery = '',
  onSearchChange = () => {},
  searchPlaceholder = "Ara...",
  
  // Tarih filtreleri
  dateFilter = '',
  onDateChange = () => {},
  dateFromFilter = '',
  onDateFromChange = () => {},
  dateToFilter = '',
  onDateToChange = () => {},
  
  // Ay filtresi
  monthFilter = '',
  onMonthChange = () => {},
  
  // Yıl filtresi
  yearFilter = '',
  onYearChange = () => {},
  
  // Durum filtreleri
  statusFilter = '',
  onStatusChange = () => {},
  statusOptions = [],
  statusPlaceholder = "Tüm Durumlar",
  
  // Yöntem filtreleri
  methodFilter = '',
  onMethodChange = () => {},
  methodOptions = [],
  methodPlaceholder = "Tüm Yöntemler",
  
  // Kategori filtreleri
  categoryFilter = '',
  onCategoryChange = () => {},
  categoryOptions = [],
  categoryPlaceholder = "Tüm Kategoriler",
  
  // Hizmet filtreleri
  serviceFilter = '',
  onServiceChange = () => {},
  serviceOptions = [],
  servicePlaceholder = "Tüm Hizmetler",
  
  // Uzman filtreleri
  specialistFilter = '',
  onSpecialistChange = () => {},
  specialistOptions = [],
  specialistPlaceholder = "Tüm Uzmanlar",
  
  // Müşteri filtreleri
  customerFilter = '',
  onCustomerChange = () => {},
  customerOptions = [],
  customerPlaceholder = "Tüm Müşteriler",
  
  // Tutar filtreleri
  minAmount = '',
  onMinAmountChange = () => {},
  maxAmount = '',
  onMaxAmountChange = () => {},
  
  // Gider kategorisi
  expenseCategory = '',
  onExpenseCategoryChange = () => {},
  
  // Filtreleri temizle
  onClearFilters = () => {},
  
  // Görünürlük kontrolleri
  showSearch = true,
  showDate = true,
  showDateRange = false,
  showMonth = true,
  showYear = true,
  showStatus = false,
  showMethod = false,
  showCategory = false,
  showService = false,
  showSpecialist = false,
  showCustomer = false,
  showAmountRange = false,
  showExpenseCategory = false,
  
  // Stil
  style = {},
  className = ''
}) => {
  const hasActiveFilters = searchQuery || dateFilter || dateFromFilter || dateToFilter || 
                          monthFilter || yearFilter || statusFilter || methodFilter || 
                          categoryFilter || serviceFilter || specialistFilter || 
                          customerFilter || minAmount || maxAmount || expenseCategory;

  const defaultStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    ...style
  };

  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#333',
    fontSize: '0.9rem',
    minWidth: '120px'
  };

  const selectStyle = {
    ...inputStyle,
    minWidth: '140px'
  };

  return (
    <div style={defaultStyle} className={className}>
      {/* Arama Filtresi */}
      {showSearch && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Tarih Filtresi */}
      {showDate && (
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Tarih Aralığı */}
      {showDateRange && (
        <>
          <input
            type="date"
            value={dateFromFilter}
            onChange={(e) => onDateFromChange(e.target.value)}
            style={inputStyle}
            placeholder="Başlangıç"
          />
          <input
            type="date"
            value={dateToFilter}
            onChange={(e) => onDateToChange(e.target.value)}
            style={inputStyle}
            placeholder="Bitiş"
          />
        </>
      )}

      {/* Ay Filtresi */}
      {showMonth && (
        <select
          value={monthFilter}
          onChange={(e) => onMonthChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Tüm Aylar</option>
          <option value="1">Ocak</option>
          <option value="2">Şubat</option>
          <option value="3">Mart</option>
          <option value="4">Nisan</option>
          <option value="5">Mayıs</option>
          <option value="6">Haziran</option>
          <option value="7">Temmuz</option>
          <option value="8">Ağustos</option>
          <option value="9">Eylül</option>
          <option value="10">Ekim</option>
          <option value="11">Kasım</option>
          <option value="12">Aralık</option>
        </select>
      )}

      {/* Yıl Filtresi */}
      {showYear && (
        <select
          value={yearFilter}
          onChange={(e) => onYearChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Tüm Yıllar</option>
          {Array.from({length: 13}, (_, i) => 2035 - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      )}

      {/* Durum Filtresi */}
      {showStatus && (
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">{statusPlaceholder}</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Yöntem Filtresi */}
      {showMethod && (
        <select
          value={methodFilter}
          onChange={(e) => onMethodChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">{methodPlaceholder}</option>
          {methodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Kategori Filtresi */}
      {showCategory && (
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">{categoryPlaceholder}</option>
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Hizmet Filtresi */}
      {showService && (
        <select
          value={serviceFilter}
          onChange={(e) => onServiceChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">{servicePlaceholder}</option>
          {serviceOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Uzman Filtresi */}
      {showSpecialist && (
        <select
          value={specialistFilter}
          onChange={(e) => onSpecialistChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">{specialistPlaceholder}</option>
          {specialistOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Müşteri Filtresi */}
      {showCustomer && (
        <select
          value={customerFilter}
          onChange={(e) => onCustomerChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">{customerPlaceholder}</option>
          {customerOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Tutar Aralığı */}
      {showAmountRange && (
        <>
          <input
            type="number"
            placeholder="Min Tutar"
            value={minAmount}
            onChange={(e) => onMinAmountChange(e.target.value)}
            style={{...inputStyle, minWidth: '100px'}}
          />
          <input
            type="number"
            placeholder="Max Tutar"
            value={maxAmount}
            onChange={(e) => onMaxAmountChange(e.target.value)}
            style={{...inputStyle, minWidth: '100px'}}
          />
        </>
      )}

      {/* Gider Kategorisi */}
      {showExpenseCategory && (
        <input
          type="text"
          placeholder="Kategori ara..."
          value={expenseCategory}
          onChange={(e) => onExpenseCategoryChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Filtreleri Temizle Butonu */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#333',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.borderColor = '#007bff';
            e.target.style.color = '#007bff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#ddd';
            e.target.style.color = '#333';
          }}
        >
          Filtreleri Temizle
        </button>
      )}
    </div>
  );
};

export default FilterBar;