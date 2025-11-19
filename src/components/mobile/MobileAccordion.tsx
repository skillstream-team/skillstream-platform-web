import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const MobileAccordion: React.FC<MobileAccordionProps> = ({
  title,
  children,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div 
      className="rounded-2xl border-2 overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'white',
        borderColor: isOpen ? '#00B5AD' : '#E5E7EB'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between transition-all duration-200 active:bg-gray-50"
        style={{ backgroundColor: isOpen ? 'rgba(0, 181, 173, 0.05)' : 'white' }}
      >
        <span className="text-lg font-bold text-left" style={{ color: '#0B1E3F' }}>
          {title}
        </span>
        <ChevronDown 
          className="h-5 w-5 transition-transform duration-200 flex-shrink-0"
          style={{ 
            color: '#00B5AD',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: '#E5E7EB' }}>
          {children}
        </div>
      )}
    </div>
  );
};

