import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => void | Promise<void>;
  interval?: number; // in milliseconds
  storageKey?: string; // for localStorage backup
  enabled?: boolean;
  debounceMs?: number;
}

export const useAutoSave = ({
  data,
  onSave,
  interval = 30000, // 30 seconds default
  storageKey,
  enabled = true,
  debounceMs = 1000
}: UseAutoSaveOptions) => {
  const lastSavedRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Save function with debounce
  const save = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;
    
    // Check if data has changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    try {
      isSavingRef.current = true;
      
      // Save to localStorage as backup if key provided
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            data,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
      
      // Call the save callback
      await onSave(data);
      lastSavedRef.current = JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, storageKey, enabled]);

  // Debounced save on data change
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save]);

  // Periodic save
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      save();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled, save]);

  // Load from localStorage on mount if key provided
  const loadDraft = useCallback(() => {
    if (!storageKey) return null;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    lastSavedRef.current = null;
  }, [storageKey]);

  // Manual save
  const manualSave = useCallback(async () => {
    await save();
  }, [save]);

  return {
    loadDraft,
    clearDraft,
    manualSave,
    isSaving: isSavingRef.current
  };
};

