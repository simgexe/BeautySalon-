import React from 'react';
import styles from './GradientCard.module.css';

/**
 * GradientCard - Ortak gradient kart component'i
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Kart içeriği
 * @param {string} props.className - Ek CSS sınıfları
 * @param {Object} props.style - Inline stiller
 * @param {boolean} props.compact - Kompakt görünüm için
 * @param {string} props.variant - Kart varyantı ('default', 'large', 'small')
 */
const GradientCard = ({ 
  children, 
  className = '', 
  style = {},
  compact = false,
  variant = 'default'
}) => {
  const cardClasses = [
    styles.gradientCard,
    compact && styles.compact,
    variant && styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      style={style}
    >
      {children}
    </div>
  );
};

/**
 * GradientCardContent - Kart içeriği wrapper'ı
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - İçerik
 * @param {string} props.className - Ek CSS sınıfları
 * @param {boolean} props.flex - Flex layout kullan
 * @param {string} props.justify - Justify content (space-between, flex-start, etc.)
 * @param {string} props.align - Align items (flex-start, center, etc.)
 */
const GradientCardContent = ({ 
  children, 
  className = '', 
  flex = false,
  justify = 'space-between',
  align = 'flex-start'
}) => {
  const contentClasses = [
    styles.cardContent,
    flex && styles.flex,
    className
  ].filter(Boolean).join(' ');

  const contentStyle = flex ? { justifyContent: justify, alignItems: align } : {};

  return (
    <div 
      className={contentClasses}
      style={contentStyle}
    >
      {children}
    </div>
  );
};

/**
 * GradientCardMain - Ana içerik alanı
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - İçerik
 * @param {string} props.className - Ek CSS sınıfları
 * @param {boolean} props.flex - Flex layout kullan
 */
const GradientCardMain = ({ 
  children, 
  className = '', 
  flex = true 
}) => {
  const mainClasses = [
    styles.cardMain,
    flex && styles.flex,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={mainClasses}>
      {children}
    </div>
  );
};

/**
 * GradientCardActions - Aksiyon butonları alanı
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - İçerik
 * @param {string} props.className - Ek CSS sınıfları
 * @param {boolean} props.flex - Flex layout kullan
 * @param {string} props.align - Align items
 */
const GradientCardActions = ({ 
  children, 
  className = '', 
  flex = true,
  align = 'flex-end'
}) => {
  const actionsClasses = [
    styles.cardActions,
    flex && styles.flex,
    className
  ].filter(Boolean).join(' ');

  const actionsStyle = flex ? { alignItems: align } : {};

  return (
    <div 
      className={actionsClasses}
      style={actionsStyle}
    >
      {children}
    </div>
  );
};

/**
 * GradientCardInfo - Bilgi kartı (beyaz arka planlı)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - İçerik
 * @param {string} props.className - Ek CSS sınıfları
 * @param {string} props.title - Kart başlığı
 * @param {string} props.value - Ana değer
 * @param {string} props.subtitle - Alt başlık
 * @param {React.ReactNode} props.extra - Ekstra içerik
 */
const GradientCardInfo = ({ 
  children, 
  className = '', 
  title,
  value,
  subtitle,
  extra
}) => {
  const infoClasses = [
    styles.cardInfo,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={infoClasses}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      {value && <div className={styles.cardValue}>{value}</div>}
      {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
      {extra && <div className={styles.cardExtra}>{extra}</div>}
      {children}
    </div>
  );
};

// Export all components
export default GradientCard;
export { 
  GradientCardContent, 
  GradientCardMain, 
  GradientCardActions, 
  GradientCardInfo 
};
