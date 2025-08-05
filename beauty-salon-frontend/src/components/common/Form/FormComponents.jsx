import React from 'react';
import '../../../styles/components/form.css';

// Form Group Component
export const FormGroup = ({ children, className = '', ...props }) => (
  <div className={`form-group ${className}`} {...props}>
    {children}
  </div>
);

// Form Row Component
export const FormRow = ({ children, className = '', ...props }) => (
  <div className={`form-row ${className}`} {...props}>
    {children}
  </div>
);

// Form Column Component
export const FormCol = ({ children, size = 12, className = '', ...props }) => {
  const sizeClass = size === 6 ? 'form-col-6' : 
                   size === 4 ? 'form-col-4' : 
                   size === 3 ? 'form-col-3' : 'form-col';
  
  return (
    <div className={`${sizeClass} ${className}`} {...props}>
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
  ...props 
}) => (
  <div className={`form-group ${className}`}>
    {label && (
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
    )}
    <input 
      className={`form-input ${error ? 'error' : ''}`} 
      {...props} 
    />
    {hint && <div className="form-hint">{hint}</div>}
    {error && <div className="form-error">{error}</div>}
  </div>
);

// Select Component
export const Select = ({ 
  label, 
  options = [], 
  error, 
  className = '', 
  required = false,
  placeholder = 'Seçiniz...',
  hint,
  ...props 
}) => (
  <div className={`form-group ${className}`}>
    {label && (
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
    )}
    <select 
      className={`form-select ${error ? 'error' : ''}`} 
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {hint && <div className="form-hint">{hint}</div>}
    {error && <div className="form-error">{error}</div>}
  </div>
);

// Textarea Component
export const Textarea = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  rows = 4,
  hint,
  ...props 
}) => (
  <div className={`form-group ${className}`}>
    {label && (
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
    )}
    <textarea 
      className={`form-textarea ${error ? 'error' : ''}`} 
      rows={rows}
      {...props} 
    />
    {hint && <div className="form-hint">{hint}</div>}
    {error && <div className="form-error">{error}</div>}
  </div>
);

// Form Actions Component
export const FormActions = ({ 
  children, 
  className = '', 
  align = 'end',
  ...props 
}) => (
  <div className={`form-actions ${align} ${className}`} {...props}>
    {children}
  </div>
);

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  loading = false,
  ...props 
}) => (
  <button 
    className={`btn btn-${variant} ${loading ? 'form-loading' : ''} ${className}`}
    disabled={loading}
    {...props}
  >
    {children}
  </button>
); 