import React from 'react';
import styles from './Pagination.module.css';

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const current = Math.min(Math.max(1, page || 1), totalPages);

  const go = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== current) onPageChange && onPageChange(next);
  };

 
  const makePages = () => {
    if (totalPages <= 7) return range(1, totalPages);
    const pages = new Set([1, 2, totalPages - 1, totalPages, current - 1, current, current + 1]);
    return range(1, totalPages).filter(p => pages.has(p));
  };

  const pages = makePages();

  return (
    <div className={styles.pagination}>
      <div className={styles.left}>
        <span className={styles.total}>Toplam: {total}</span>
        {onPageSizeChange && (
          <select
            className={styles.pageSize}
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}/sayfa</option>
            ))}
          </select>
        )}
      </div>
      <div className={styles.controls}>
        <button className={styles.nav} onClick={() => go(1)} disabled={current === 1}>
          «
        </button>
        <button className={styles.nav} onClick={() => go(current - 1)} disabled={current === 1}>
          ‹
        </button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const showDots = prev && p - prev > 1;
          return (
            <React.Fragment key={p}>
              {showDots && <span className={styles.ellipsis}>…</span>}
              <button
                className={`${styles.pageBtn} ${p === current ? styles.active : ''}`}
                onClick={() => go(p)}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}
        <button className={styles.nav} onClick={() => go(current + 1)} disabled={current === totalPages}>
          ›
        </button>
        <button className={styles.nav} onClick={() => go(totalPages)} disabled={current === totalPages}>
          »
        </button>
      </div>
    </div>
  );
};

export default Pagination;


