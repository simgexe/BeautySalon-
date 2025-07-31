// components/common/Modal.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = "",
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={commonStyles.modalOverlay} 
      onClick={handleOverlayClick}
    >
      <div className={`${commonStyles.modalContent} ${className}`}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className={commonStyles.modalHeader} style={{ margin: 0 }}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: '#666',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          )}
        </div>
        
        {/* Modal Content */}
        {children}
      </div>
    </div>
  );
};

export default Modal;