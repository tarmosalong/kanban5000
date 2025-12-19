'use client';

import { Toaster as HotToaster, toast } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(24, 24, 27, 0.95)',
          color: '#fafafa',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '400',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        },
        success: {
          iconTheme: {
            primary: '#2dd4bf',
            secondary: '#18181b',
          },
          style: {
            borderLeft: '3px solid #2dd4bf',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#18181b',
          },
          style: {
            borderLeft: '3px solid #f87171',
          },
        },
        loading: {
          iconTheme: {
            primary: '#a1a1aa',
            secondary: '#18181b',
          },
        },
      }}
    />
  );
}

// Backwards compatible hook that matches the old API
export function useToast() {
  return {
    addToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (type === 'success') {
        toast.success(message);
      } else if (type === 'error') {
        toast.error(message);
      } else {
        toast(message);
      }
    },
    toast, // Also export the raw toast function for more flexibility
  };
}

// Export toast directly for modern usage
export { toast };
