'use client';

import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-zinc-400 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg px-3 py-2 text-[13px] text-white
            bg-white/[0.03] border border-white/[0.06]
            placeholder:text-zinc-600
            transition-all duration-150
            focus:bg-white/[0.05] focus:border-accent-400/40
            focus:outline-none focus:ring-2 focus:ring-accent-400/10
            ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-[12px] text-zinc-600">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-[12px] text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component with same styling
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-zinc-400 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg px-3 py-2 text-[13px] text-white resize-none
            bg-white/[0.03] border border-white/[0.06]
            placeholder:text-zinc-600
            transition-all duration-150
            focus:bg-white/[0.05] focus:border-accent-400/40
            focus:outline-none focus:ring-2 focus:ring-accent-400/10
            ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-[12px] text-zinc-600">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-[12px] text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
