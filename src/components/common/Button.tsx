import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'text-white',
    secondary: 'text-white',
    danger: 'text-white',
    outline: 'border-2 bg-white',
    ghost: 'bg-transparent'
  };

  const variantColors = {
    primary: {
      bg: '#00B5AD',
      hover: '#00968d',
      shadow: 'rgba(0, 181, 173, 0.3)'
    },
    secondary: {
      bg: '#6F73D2',
      hover: '#5a5fb8',
      shadow: 'rgba(111, 115, 210, 0.3)'
    },
    danger: {
      bg: '#DC2626',
      hover: '#B91C1C',
      shadow: 'rgba(220, 38, 38, 0.3)'
    },
    outline: {
      border: '#E5E7EB',
      text: '#0B1E3F',
      hover: '#F4F7FA'
    },
    ghost: {
      text: '#6F73D2',
      hover: 'rgba(111, 115, 210, 0.1)'
    }
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  const colors = variantColors[variant];
  const isSolid = variant !== 'outline' && variant !== 'ghost';

  const style: React.CSSProperties = isSolid
    ? {
        backgroundColor: colors.bg,
        boxShadow: `0 4px 14px ${colors.shadow}`
      }
    : variant === 'outline'
    ? {
        borderColor: colors.border,
        color: colors.text,
        backgroundColor: 'white'
      }
    : {
        color: colors.text,
        backgroundColor: 'transparent'
      };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (isSolid) {
      e.currentTarget.style.backgroundColor = colors.hover;
    } else if (variant === 'outline') {
      e.currentTarget.style.backgroundColor = colors.hover;
    } else {
      e.currentTarget.style.backgroundColor = colors.hover;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (isSolid) {
      e.currentTarget.style.backgroundColor = colors.bg;
    } else if (variant === 'outline') {
      e.currentTarget.style.backgroundColor = 'white';
    } else {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  };

  return (
    <button
      className={cn(baseStyles, sizes[size], variants[variant], className)}
      style={style}
      disabled={disabled || isLoading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

