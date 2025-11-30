import React from 'react';
import { Undo2 } from 'lucide-react';

interface UndoButtonProps {
  onUndo: () => void | Promise<void>;
  canUndo: boolean;
  lastActionDescription?: string;
  className?: string;
}

export const UndoButton: React.FC<UndoButtonProps> = ({
  onUndo,
  canUndo,
  lastActionDescription,
  className = ''
}) => {
  if (!canUndo) return null;

  return (
    <button
      onClick={onUndo}
      className={`flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors ${className}`}
      title={lastActionDescription ? `Undo: ${lastActionDescription}` : 'Undo last action'}
    >
      <Undo2 className="w-4 h-4" />
      <span>Undo</span>
      {lastActionDescription && (
        <span className="text-xs opacity-75">({lastActionDescription})</span>
      )}
    </button>
  );
};

