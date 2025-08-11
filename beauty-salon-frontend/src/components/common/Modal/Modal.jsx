import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = "medium", // small, medium, large, fullscreen
  variant = "default", // default, danger, success, warning
  header = null,
  footer = null,
  showHeader = true,
  showFooter = false,
  maxHeight = "90vh",
  preventScroll = true,
  animation = "fadeIn", // fadeIn, slideIn, slideUp, scale
  zIndex = 1000
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Handle escape key and focus management
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement;
      
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
      
      // Focus management - delay to ensure DOM is ready
      setTimeout(() => {
        const active = document.activeElement;
        const isInside = modalRef.current?.contains(active);

        // Modal içinde zaten bir elemana odak varsa, odağı bozma
        if (isInside) return;

        const firstInput = modalRef.current?.querySelector(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        
        if (firstInput) {
          firstInput.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (preventScroll) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, closeOnEscape, onClose, preventScroll]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const sizeClass = {
    small: styles.sizeSmall,
    medium: styles.sizeMedium,
    large: styles.sizeLarge,
    fullscreen: styles.sizeFullscreen
  }[size];

  const variantClass = {
    default: styles.variantDefault,
    danger: styles.variantDanger,
    success: styles.variantSuccess,
    warning: styles.variantWarning
  }[variant];

  const animationClass = {
    fadeIn: styles.animationFadeIn,
    slideIn: styles.animationSlideIn,
    slideUp: styles.animationSlideUp,
    scale: styles.animationScale
  }[animation];

  return (
    <div 
      ref={overlayRef}
      className={`${styles.modalOverlay} ${animationClass}`}
      onClick={handleOverlayClick}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        ref={modalRef}
        className={`
          ${styles.modalContent} 
          ${sizeClass} 
          ${variantClass}
          ${className}
        `}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1} // Make focusable for keyboard navigation
      >
        {/* Modal Header */}
        {showHeader && (
          <div className={styles.modalHeader}>
            {header || (
              <>
                {title && (
                  <h2 id="modal-title" className={styles.modalTitle}>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={handleClose}
                    className={styles.closeButton}
                    aria-label="Modalı kapat"
                    type="button"
                  >
                    <span className={styles.closeIcon}>×</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Modal Body */}
        <div className={styles.modalBody}>
          {children}
        </div>
        
        {/* Modal Footer */}
        {showFooter && footer && (
          <div className={styles.modalFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Modal Action Buttons Component
export const ModalActions = ({ 
  onCancel, 
  onConfirm, 
  cancelText = "İptal", 
  confirmText = "Kaydet",
  isLoading = false,
  confirmVariant = "primary", // primary, danger, success
  showCancel = true,
  showConfirm = true,
  className = "",
  children
}) => {
  const confirmClass = {
    primary: styles.confirmPrimary,
    danger: styles.confirmDanger,
    success: styles.confirmSuccess
  }[confirmVariant];

  return (
    <div className={`${styles.modalActions} ${className}`}>
      {children}
      {showCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          {cancelText}
        </button>
      )}
      {showConfirm && onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className={`${styles.confirmButton} ${confirmClass}`}
          disabled={isLoading}
        >
          {isLoading ? 'Yükleniyor...' : confirmText}
        </button>
      )}
    </div>
  );
};

export default Modal;