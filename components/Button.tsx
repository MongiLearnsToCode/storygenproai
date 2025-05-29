
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent-ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode | React.ReactElement;
  rightIcon?: React.ReactNode | React.ReactElement;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50 inline-flex items-center justify-center transition-colors duration-150";
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Updated for light theme & new primary color
  const variantStyles = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500 shadow-sm hover:shadow-md disabled:bg-sky-600/70 disabled:text-white/80',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700 focus:ring-neutral-400 border border-neutral-300 hover:border-neutral-400 disabled:bg-neutral-200/70 disabled:text-neutral-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-600/70',
    ghost: 'bg-transparent hover:bg-neutral-200/70 text-neutral-600 hover:text-neutral-800 focus:ring-neutral-500 border border-transparent hover:border-neutral-300/70 disabled:text-neutral-400',
    'accent-ghost': 'bg-transparent hover:bg-sky-500/10 text-sky-600 hover:text-sky-500 focus:ring-sky-500 border border-sky-500/30 hover:border-sky-500/60 disabled:text-sky-600/50 disabled:border-sky-500/20',
  };

  const loadingStyles = isLoading ? "opacity-75 cursor-not-allowed" : "";
  const disabledStyles = disabled && !isLoading ? "opacity-60 cursor-not-allowed" : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${loadingStyles} ${disabledStyles} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className={`animate-spin h-5 w-5 ${leftIcon ? 'mr-2' : ''} ${rightIcon ? 'ml-2' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};