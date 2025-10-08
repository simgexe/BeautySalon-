import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  variant = 'primary', // primary, secondary, danger, success
  size = 'medium', // small, medium, large
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.medium;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

