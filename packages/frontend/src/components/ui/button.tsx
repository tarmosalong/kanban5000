import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200
      focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:outline-none
      disabled:pointer-events-none disabled:opacity-50
      active:scale-[0.98]
    `;
    
    const variantStyles = {
      primary: `
        bg-gradient-to-r from-primary-600 to-primary-500 text-white
        hover:from-primary-500 hover:to-primary-400 
        hover:shadow-lg hover:shadow-primary-500/25
      `,
      secondary: `
        bg-white/5 text-white border border-white/10
        hover:bg-white/10 hover:border-white/20
      `,
      ghost: `
        text-slate-400 hover:text-white hover:bg-white/5
      `,
      danger: `
        bg-gradient-to-r from-red-600 to-red-500 text-white
        hover:from-red-500 hover:to-red-400
        hover:shadow-lg hover:shadow-red-500/25
      `,
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
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
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
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
