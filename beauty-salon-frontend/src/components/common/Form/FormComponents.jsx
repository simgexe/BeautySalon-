import React from 'react';
import styles from './Form.module.css';

// Form Group Component
export const FormGroup = ({ 
  children, 
  className = '', 
  label,
  required = false,
  error,
  hint,
  inline = false,
  ...props 
}) => (
  <div className={`
    ${styles.formGroup} 
    ${inline ? styles.formGroupInline : ''} 
    ${error ? styles.formGroupError : ''}
    ${className}
  `} {...props}>
    {label && (
      <label className={styles.formLabel}>
        {label}
        {required && <span className={styles.requiredIndicator}>*</span>}
      </label>
    )}
    <div className={styles.formControl}>
      {children}
    </div>
    {hint && <div className={styles.formHint}>{hint}</div>}
    {error && <div className={styles.formError}>{error}</div>}
  </div>
);

// Form Row Component
export const FormRow = ({ 
  children, 
  className = '', 
  gap = 'medium',
  noWrap = false,
  ...props 
}) => {
  const gapClass = {
    small: styles.formRowGapSmall,
    medium: styles.formRowGapMedium,
    large: styles.formRowGapLarge
  }[gap];

  return (
    <div className={`
      ${styles.formRow} 
      ${noWrap ? styles.formRowNoWrap : ''}
      ${gapClass}
      ${className}
    `} {...props}>
      {children}
    </div>
  );
};

// Form Column Component
export const FormCol = ({ 
  children, 
  size,
  className = '', 
  ...props 
}) => {
  return (
    <div className={`${styles.formCol} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Input Component
export const Input = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  hint,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  size = "medium", // small, medium, large
  variant = "default", // default, outlined, filled
  icon,
  iconPosition = "left",
  ...props 
}) => {
  const sizeClass = {
    small: styles.inputSmall,
    medium: '',
    large: styles.inputLarge
  }[size];

  const variantClass = {
    default: '',
    outlined: styles.inputOutlined,
    filled: styles.inputFilled
  }[variant];

  const inputClass = `
    ${styles.input} 
    ${sizeClass} 
    ${variantClass}
    ${error ? styles.inputError : ''}
    ${icon && iconPosition === 'left' ? styles.inputWithIconPadding : ''}
    ${className}
  `;

  const inputElement = (
    <>
      {icon && (
        <div className={`
          ${styles.inputIcon} 
          ${iconPosition === 'right' ? styles.inputIconRight : ''}
        `}>
          {icon}
        </div>
      )}
      <input 
        className={inputClass}
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        {...props} 
      />
    </>
  );

  if (label || error || hint) {
    return (
      <FormGroup 
        label={label}
        required={required}
        error={error}
        hint={hint}
      >
        {icon ? (
          <div className={`
            ${styles.inputWithIcon} 
            ${iconPosition === 'right' ? styles.inputIconRight : ''}
          `}>
            {inputElement}
          </div>
        ) : inputElement}
      </FormGroup>
    );
  }

  return icon ? (
    <div className={`
      ${styles.inputWithIcon} 
      ${iconPosition === 'right' ? styles.inputIconRight : ''}
    `}>
      {inputElement}
    </div>
  ) : inputElement;
};

// Select Component
export const Select = ({ 
  label, 
  options = [], 
  error, 
  className = '', 
  required = false,
  placeholder = 'Seçiniz...',
  hint,
  value,
  onChange,
  disabled = false,
  size = "medium",
  variant = "default",
  ...props 
}) => {
  const sizeClass = {
    small: styles.selectSmall,
    medium: '',
    large: styles.selectLarge
  }[size];

  const variantClass = {
    default: '',
    outlined: styles.selectOutlined,
    filled: styles.selectFilled
  }[variant];

  const selectClass = `
    ${styles.select} 
    ${sizeClass} 
    ${variantClass}
    ${error ? styles.selectError : ''}
    ${className}
  `;

  const selectElement = (
    <select 
      className={selectClass}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      required={required}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (label || error || hint) {
    return (
      <FormGroup 
        label={label}
        required={required}
        error={error}
        hint={hint}
      >
        {selectElement}
      </FormGroup>
    );
  }

  return selectElement;
};

// Textarea Component
export const Textarea = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  rows = 4,
  hint,
  name,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  size = "medium",
  variant = "default",
  ...props 
}) => {
  const sizeClass = {
    small: styles.textareaSmall,
    medium: '',
    large: styles.textareaLarge
  }[size];

  const variantClass = {
    default: '',
    outlined: styles.textareaOutlined,
    filled: styles.textareaFilled
  }[variant];

  const textareaClass = `
    ${styles.textarea} 
    ${sizeClass} 
    ${variantClass}
    ${error ? styles.textareaError : ''}
    ${className}
  `;

  const textareaElement = (
    <textarea 
      className={textareaClass}
      rows={rows}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      {...props} 
    />
  );

  if (label || error || hint) {
    return (
      <FormGroup 
        label={label}
        required={required}
        error={error}
        hint={hint}
      >
        {textareaElement}
      </FormGroup>
    );
  }

  return textareaElement;
};

// Form Actions Component
export const FormActions = ({ 
  children, 
  className = '', 
  align = 'end', // start, center, end, between, around
  onCancel,
  onSubmit,
  submitText = 'Kaydet',
  cancelText = 'İptal',
  isSubmitting = false,
  submitVariant = 'primary',
  showCancel = true,
  showSubmit = true,
  vertical = false,
  ...props 
}) => {
  const alignClass = {
    start: styles.formActionsStart,
    center: styles.formActionsCenter,
    end: styles.formActionsEnd,
    between: styles.formActionsBetween,
    around: styles.formActionsAround
  }[align];

  return (
    <div className={`
      ${styles.formActions} 
      ${alignClass}
      ${vertical ? styles.formActionsVertical : ''}
      ${className}
    `} {...props}>
      {children}
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}
      {showSubmit && onSubmit && (
        <Button
          type="submit"
          variant={submitVariant}
          onClick={onSubmit}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Yükleniyor...' : submitText}
        </Button>
      )}
    </div>
  );
};

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  loading = false,
  disabled = false,
  type = 'button',
  size = 'medium',
  ...props 
}) => {
  const variantClass = {
    primary: styles.formButtonPrimary,
    secondary: styles.formButtonSecondary,
    danger: styles.formButtonDanger,
    success: styles.formButtonSuccess
  }[variant];

  return (
    <button 
      className={`
        ${styles.formButton}
        ${variantClass}
        ${loading ? styles.formLoading : ''}
        ${className}
      `}
      type={type}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? 'Yükleniyor...' : children}
    </button>
  );
};