import React, { useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '90vh',
  showHandle = true
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
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
        style={{ 
          backgroundColor: 'rgba(11, 30, 63, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-[24px] transition-transform duration-300 ease-out"
        style={{
          backgroundColor: 'white',
          boxShadow: '0 -10px 40px rgba(11, 30, 63, 0.15)',
          maxHeight: maxHeight,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-12 h-1 rounded-full"
              style={{ backgroundColor: '#E5E7EB' }}
            />
          </div>
        )}

        {/* Header */}
        {(title || true) && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            {title && (
              <h2 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <X className="h-5 w-5" style={{ color: '#00B5AD' }} />
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          className="overflow-y-auto"
          style={{ 
            maxHeight: `calc(${maxHeight} - 80px)`,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

