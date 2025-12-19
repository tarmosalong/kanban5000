'use client';

import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-1.5 font-medium rounded-lg
      transition-all duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/30
      disabled:pointer-events-none disabled:opacity-40
      active:scale-[0.98]
    `;
    
    const variantStyles = {
      primary: `
        text-zinc-900 
        bg-gradient-to-b from-accent-300 to-accent-400
        shadow-sm shadow-accent-500/20
        hover:from-accent-200 hover:to-accent-300
        hover:shadow-md hover:shadow-accent-500/25
      `,
      secondary: `
        text-zinc-300 
        bg-white/[0.03] border border-white/[0.06]
        hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white
      `,
      ghost: `
        text-zinc-500 
        hover:text-zinc-200 hover:bg-white/[0.04]
      `,
      danger: `
        text-white 
        bg-gradient-to-b from-red-500 to-red-600
        shadow-sm shadow-red-500/20
        hover:from-red-400 hover:to-red-500
        hover:shadow-md hover:shadow-red-500/25
      `,
    };

    const sizeStyles = {
      xs: 'px-2 py-1 text-[11px]',
      sm: 'px-2.5 py-1.5 text-[12px]',
      md: 'px-3.5 py-2 text-[13px]',
      lg: 'px-5 py-2.5 text-[14px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
