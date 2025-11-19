import React from 'react';

/**
 * Mobile utility components and hooks for consistent mobile design
 */

// Mobile Card Wrapper - Provides consistent card styling
export const MobileCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 transition-all duration-200 active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'white',
        borderColor: '#E5E7EB'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#00B5AD';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 181, 173, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </div>
  );
};

// Mobile Section Header
export const MobileSectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: '#6F73D2' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Mobile Stat Card
export const MobileStatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, icon, color = '#00B5AD' }) => {
  return (
    <MobileCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#6F73D2' }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
            {value}
          </p>
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
      </div>
    </MobileCard>
  );
};

// Mobile Button - Primary
export const MobileButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false,
  disabled = false,
  className = ''
}) => {
  const baseStyles = 'px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: {
      backgroundColor: '#00B5AD',
      color: 'white',
      boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
    },
    secondary: {
      backgroundColor: '#6F73D2',
      color: 'white',
      boxShadow: '0 4px 14px rgba(111, 115, 210, 0.3)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#0B1E3F',
      border: '2px solid #E5E7EB'
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={variantStyles[variant]}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = '#00968d';
        } else if (!disabled && variant === 'secondary') {
          e.currentTarget.style.backgroundColor = '#5d62b8';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = '#00B5AD';
        } else if (!disabled && variant === 'secondary') {
          e.currentTarget.style.backgroundColor = '#6F73D2';
        }
      }}
    >
      {children}
    </button>
  );
};

// Mobile Input Field
export const MobileInput: React.FC<{
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
  className?: string;
}> = ({ label, placeholder, value, onChange, type = 'text', icon, error, className = '' }) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${icon ? 'pl-12' : ''}`}
          style={{
            borderColor: error ? '#dc2626' : (focused ? '#00B5AD' : '#E5E7EB'),
            backgroundColor: 'white',
            color: '#0B1E3F',
            fontSize: '16px',
            boxShadow: focused && !error ? '0 0 0 4px rgba(0, 181, 173, 0.1)' : 'none'
          }}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  );
};

// Horizontal Scrollable Chips
export const MobileChips: React.FC<{
  items: { id: string; label: string }[];
  selected?: string;
  onSelect?: (id: string) => void;
}> = ({ items, selected, onSelect }) => {
  return (
    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
      {items.map((item) => {
        const isSelected = selected === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className="px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0"
            style={{
              backgroundColor: isSelected ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
              color: isSelected ? 'white' : '#0B1E3F',
              boxShadow: isSelected ? '0 2px 8px rgba(0, 181, 173, 0.3)' : 'none'
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

