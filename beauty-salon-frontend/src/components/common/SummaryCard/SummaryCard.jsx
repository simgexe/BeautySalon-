import React from 'react';
import styles from './SummaryCard.module.css';

/**
 * SummaryCard - Özet bilgileri göstermek için ortak kart component'i
 * 
 * @param {Object} props
 * @param {string} props.title - Kart başlığı
 * @param {string|number} props.value - Ana değer
 * @param {string} props.subtitle - Alt başlık (opsiyonel)
 * @param {string} props.icon - İkon (opsiyonel)
 * @param {string} props.className - Ek CSS sınıfları
 * @param {Function} props.onClick - Tıklama eventi (opsiyonel)
 * @param {string} props.variant - Kart varyantı ('default', 'primary', 'success', 'warning', 'danger')
 */
const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  className = '',
  onClick,
  variant = 'default'
}) => {
  const cardClasses = [
    styles.summaryCard,
    variant && styles[variant],
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>{value}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
    </div>
  );
};

/**
 * SummaryCardGrid - Özet kartları için grid container
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Kart elemanları
 * @param {string} props.className - Ek CSS sınıfları
 * @param {number} props.columns - Sütun sayısı (opsiyonel, default: auto-fit)
 */
export const SummaryCardGrid = ({ 
  children, 
  className = '',
  columns
}) => {
  const gridClasses = [
    styles.summaryCards,
    className
  ].filter(Boolean).join(' ');

  const style = columns ? {
    gridTemplateColumns: `repeat(${columns}, 1fr)`
  } : {};

  return (
    <div className={gridClasses} style={style}>
      {children}
    </div>
  );
};

export default SummaryCard;

