import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 lg:hidden"
      style={{ backgroundColor: '#F4F7FA' }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(11, 30, 63, 0.1)',
          boxShadow: '0 2px 10px rgba(11, 30, 63, 0.05)'
        }}
      >
        {title && (
          <h2 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
            {title}
          </h2>
        )}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all duration-200 active:scale-95"
            style={{ 
              backgroundColor: 'rgba(0, 181, 173, 0.1)'
            }}
          >
            <X className="h-6 w-6" style={{ color: '#00B5AD' }} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-73px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

