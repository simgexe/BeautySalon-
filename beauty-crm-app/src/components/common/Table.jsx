// components/common/Table.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const Table = ({ 
  columns, 
  data, 
  isLoading = false, 
  emptyMessage = "Veri bulunamadı",
  onEdit,
  onDelete,
  actions = true,
  className = ""
}) => {
  if (isLoading) {
    return (
      <div className={commonStyles.card}>
        <div className={commonStyles.loading}>
          <div className={commonStyles.spinner}></div>
          <p style={{ color: '#666' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${commonStyles.tableContainer} ${className}`}>
      <table className={commonStyles.table}>
        <thead className={commonStyles.tableHeader}>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                className={commonStyles.tableHeaderCell}
                style={{ textAlign: column.align || 'left' }}
              >
                {column.title}
              </th>
            ))}
            {actions && (
              <th className={`${commonStyles.tableHeaderCell} ${commonStyles.tableCellActions}`}>
                İşlemler
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (actions ? 1 : 0)} 
                className={commonStyles.emptyState}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className={commonStyles.tableRow}>
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={commonStyles.tableCell}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {column.render 
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </td>
                ))}
                {actions && (
                  <td className={commonStyles.tableCellActions}>
                    <div className={commonStyles.tableActions}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className={commonStyles.btnEdit}
                        >
                          Düzenle
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row.id || row)}
                          className={commonStyles.btnDanger}
                        >
                          Sil
                        </button>
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