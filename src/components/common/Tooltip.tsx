import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  variant?: 'default' | 'help' | 'info';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delayDuration = 300,
  variant = 'default',
  className = ''
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className={`
              z-50 rounded-lg px-3 py-2 text-sm font-medium shadow-lg
              bg-gray-900 dark:bg-gray-800 text-white
              animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out 
              data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
              data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
              ${className}
            `}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

interface HelpTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  side = 'top',
  className = ''
}) => {
  return (
    <Tooltip content={content} side={side} variant="help" className={className}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>
    </Tooltip>
  );
};

interface InfoTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  side = 'top',
  className = ''
}) => {
  return (
    <Tooltip content={content} side={side} variant="info" className={className}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        aria-label="Information"
      >
        <Info className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
      </button>
    </Tooltip>
  );
};

