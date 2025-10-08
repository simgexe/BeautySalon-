// components/common/Table/Table.jsx
import React from 'react';
import Button from '../Button/Button';
import Pagination from '../Pagination/Pagination';
import styles from './Table.module.css';

const Table = ({ 
  columns, 
  data, 
  isLoading = false, 
  emptyMessage = "Veri bulunamadı",
  onEdit,
  onDelete,
  actions = true,
  className = "",
  striped = false,
  hover = true,
  compact = false,
  sortable = false,
  onSort,
  sortConfig = null,
  customActions = null,
  rowClassName = null,
  editButtonText = "Düzenle",
  deleteButtonText = "Sil",
  showEditButton = true,
  showDeleteButton = true,
  // New props for wrapper
  title = null,
  subtitle = null,
  showWrapper = false,
  headerActions = null,
  showRecordCount = true,
  // Pagination props
  showPagination = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange = null,
  onPageSizeChange = null
}) => {
  
  const handleSort = (columnKey) => {
    if (!sortable || !onSort) return;
    
    let direction = 'asc';
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSort({ key: columnKey, direction });
  };

  const getSortIcon = (columnKey) => {
    if (!sortable || !sortConfig) return null;
    if (sortConfig.key !== columnKey) return ' ↕️';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const tableContent = (
    <>
      <table 
        className={`
          ${styles.table} 
          ${striped ? styles.striped : ''} 
          ${hover ? styles.hover : ''}
        `}
      >
        <thead className={styles.tableHeader}>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                className={`
                  ${styles.tableHeaderCell} 
                  ${sortable && column.sortable !== false ? styles.sortable : ''}
                `}
                style={{ 
                  textAlign: column.align || 'left',
                  width: column.width || 'auto'
                }}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                {column.title}
                {sortable && column.sortable !== false && getSortIcon(column.key)}
              </th>
            ))}
            {(actions || customActions) && (
              <th className={`${styles.tableHeaderCell} ${styles.tableCellActions}`}>
                İşlemler
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + ((actions || customActions) ? 1 : 0)} 
                className={styles.emptyState}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className={`
                  ${styles.tableRow} 
                  ${rowClassName ? rowClassName(row, rowIndex) : ''}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={styles.tableCell}
                    style={{ 
                      textAlign: column.align || 'left'
                    }}
                  >
                    {column.render 
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </td>
                ))}
                
                {(actions || customActions) && (
                  <td className={styles.tableCellActions}>
                    <div className={styles.tableActions}>
                      {/* Custom Actions */}
                      {customActions && customActions(row, rowIndex)}
                      
                      {/* Default Actions */}
                      {actions && (
                        <>
                          {(typeof showEditButton === 'function' ? showEditButton(row) : showEditButton) && onEdit && (
                            <Button
                              onClick={() => onEdit(row)}
                              variant="primary"
                              size="medium"
                            >
                              {editButtonText}
                            </Button>
                          )}
                          {(typeof showDeleteButton === 'function' ? showDeleteButton(row) : showDeleteButton) && onDelete && (
                            <Button
                              onClick={() => onDelete(row.id || row)}
                              variant="danger"
                              size="medium"
                            >
                              {deleteButtonText}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );

  if (isLoading) {
    return (
      <div className={`${styles.tableWrapper} ${showWrapper ? styles.withWrapper : ''} ${className}`}>
        {showWrapper && title && (
          <div className={styles.tableWrapperHeader}>
            <h3 className={styles.tableWrapperTitle}>{title}</h3>
          </div>
        )}
        <div className={`${styles.tableContainer} ${compact ? styles.compact : ''}`}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showWrapper) {
    return (
      <div className={`${styles.tableWrapper} ${styles.withWrapper} ${className}`}>
        <div className={styles.tableWrapperHeader}>
          <div>
            <h3 className={styles.tableWrapperTitle}>{title || 'Liste'}</h3>
            {subtitle && <p className={styles.tableWrapperSubtitle}>{subtitle}</p>}
          </div>
          <div className={styles.tableWrapperActions}>
            {showRecordCount && (
              <span className={styles.tableWrapperCount}>{total || data.length} kayıt</span>
            )}
            {headerActions}
          </div>
        </div>
        <div className={`${styles.tableContainer} ${compact ? styles.compact : ''}`}>
          {tableContent}
        </div>
        {showPagination && onPageChange && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className} ${compact ? styles.compact : ''}`}>
      {tableContent}
      {showPagination && onPageChange && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

export default Table;