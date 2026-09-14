import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    id,
    error,
    helperText,
    icon: Icon,
    rightElement,
    size = 'md', // 'sm' (32px) | 'md' (36px) | 'lg' (40px)
    className = '',
    type = 'text',
    ...props
  },
  ref
) {
  const heightStyles = {
    sm: 'h-8 text-xs',
    md: 'h-9 text-xs',
    lg: 'h-10 text-sm',
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-gray-1000 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-3 flex items-center text-gray-700">
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`w-full rounded-md border bg-background-100 text-gray-1000 placeholder:text-gray-700 transition-colors duration-150 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
            Icon ? 'pl-9' : 'pl-3'
          } ${rightElement ? 'pr-10' : 'pr-3'} ${
            error ? 'border-red-700 focus:border-red-700 focus:ring-red-700' : 'border-gray-400 hover:border-gray-500'
          } ${heightStyles[size] || heightStyles.md} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-red-700 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-gray-700">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
