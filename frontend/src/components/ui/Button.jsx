import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'destructive'
  size = 'md', // 'sm' (32px) | 'md' (36px) | 'lg' (40px)
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 rounded-md select-none focus-visible:outline-2 focus-visible:outline-blue-700 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-xs font-medium gap-2',
    lg: 'h-10 px-5 text-sm gap-2',
  };

  const variantStyles = {
    primary: 'bg-gray-1000 text-background-100 hover:opacity-90 active:scale-[0.99] shadow-xs',
    secondary: 'border border-gray-400 bg-background-100 text-gray-1000 hover:bg-gray-100 hover:border-gray-500 active:scale-[0.99] shadow-xs',
    ghost: 'text-gray-900 hover:text-gray-1000 hover:bg-gray-100 active:scale-[0.99]',
    destructive: 'bg-red-700 text-white hover:opacity-90 active:scale-[0.99] shadow-xs',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
