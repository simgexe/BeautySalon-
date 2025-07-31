// components/common/FormActions.jsx
import React from 'react';
import commonStyles from '../../styles/common.module.css';

const FormActions = ({ 
  onCancel, 
  onSubmit, 
  cancelText = "İptal", 
  submitText = "Kaydet",
  isSubmitting = false,
  className = "" 
}) => {
  return (
    <div className={`${commonStyles.modalActions} ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className={commonStyles.btnSecondary}
        disabled={isSubmitting}
      >
        {cancelText}
      </button>
      <button
        type="submit"
        onClick={onSubmit}
        className={commonStyles.btnPrimary}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Kaydediliyor...' : submitText}
      </button>
    </div>
  );
};

export default FormActions;