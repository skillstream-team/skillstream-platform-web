import { useState, useCallback, useRef } from 'react';

interface UndoAction {
  id: string;
  type: string;
  description: string;
  undo: () => void | Promise<void>;
  timestamp: Date;
}

export const useUndo = () => {
  const [history, setHistory] = useState<UndoAction[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const maxHistoryRef = useRef(50); // Max 50 actions in history

  const addAction = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const newAction: UndoAction = {
      ...action,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setHistory(prev => {
      const updated = [newAction, ...prev].slice(0, maxHistoryRef.current);
      return updated;
    });
    setCanUndo(true);
  }, []);

  const undo = useCallback(async () => {
    if (history.length === 0) return;

    const lastAction = history[0];
    try {
      await lastAction.undo();
      setHistory(prev => prev.slice(1));
      setCanUndo(history.length > 1);
    } catch (error) {
      console.error('Error undoing action:', error);
      throw error;
    }
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCanUndo(false);
  }, []);

  const getLastAction = useCallback(() => {
    return history.length > 0 ? history[0] : null;
  }, [history]);

  return {
    addAction,
    undo,
    clearHistory,
    getLastAction,
    canUndo,
    historyLength: history.length
  };
};

