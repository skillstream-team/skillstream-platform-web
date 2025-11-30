import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirmBg: '#DC2626',
          confirmHover: '#B91C1C',
          border: 'rgba(220, 38, 38, 0.2)',
          bg: 'rgba(220, 38, 38, 0.05)'
        };
      case 'warning':
        return {
          confirmBg: '#F59E0B',
          confirmHover: '#D97706',
          border: 'rgba(245, 158, 11, 0.2)',
          bg: 'rgba(245, 158, 11, 0.05)'
        };
      default:
        return {
          confirmBg: '#00B5AD',
          confirmHover: '#00968d',
          border: 'rgba(0, 181, 173, 0.2)',
          bg: 'rgba(0, 181, 173, 0.05)'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(11, 30, 63, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border-2 max-w-md w-full p-6"
        style={{
          borderColor: colors.border,
          backgroundColor: 'white',
          boxShadow: '0 20px 60px rgba(11, 30, 63, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4 mb-6">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: colors.bg }}
          >
            <AlertTriangle 
              className="w-6 h-6" 
              style={{ color: colors.confirmBg }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              {title}
            </h3>
            <p className="text-sm" style={{ color: '#6F73D2' }}>
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            style={{ color: '#6F73D2' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
            style={{ 
              borderColor: '#E5E7EB',
              color: '#0B1E3F',
              backgroundColor: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F4F7FA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
            style={{ 
              backgroundColor: colors.confirmBg,
              boxShadow: `0 4px 14px ${colors.confirmBg}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.confirmHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.confirmBg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

