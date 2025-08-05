// components/common/Table/Table.jsx
import React from 'react';
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
  showDeleteButton = true
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

  if (isLoading) {
    return (
      <div className={`${styles.tableContainer} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className} ${compact ? styles.compact : ''}`}>
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
                          {showEditButton && onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className={styles.btnEdit}
                            >
                              {editButtonText}
                            </button>
                          )}
                          {showDeleteButton && onDelete && (
                            <button
                              onClick={() => onDelete(row.id || row)}
                              className={styles.btnDanger}
                            >
                              {deleteButtonText}
                            </button>
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
    </div>
  );
};

export default Table;