import commonStyles from '../../styles/common.module.css';

const FormGroup = ({ 
  label, 
  required = false, 
  children, 
  className = "",
  error = null 
}) => {
  return (
    <div className={`${commonStyles.formGroup} ${className}`}>
      {label && (
        <label className={commonStyles.formLabel}>
          {label} 
          {required && (
            <span style={{ color: 'var(--color-danger)' }}>*</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <span style={{ 
          color: 'var(--color-danger)', 
          fontSize: '12px',
          marginTop: '4px',
          display: 'block'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default FormGroup;