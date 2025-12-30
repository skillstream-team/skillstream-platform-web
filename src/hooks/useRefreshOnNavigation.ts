import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Global request tracking to prevent duplicate calls
const activeRequests = new Map<string, Promise<any>>();
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache

/**
 * Hook to automatically refresh data when navigating to a page
 * This ensures newly created items appear immediately when navigating back
 * 
 * @param refreshFn - Function to call when refresh is needed
 * @param options - Optional configuration
 */
export function useRefreshOnNavigation(
  refreshFn: () => void | Promise<void>,
  options: {
    /** Refresh when page becomes visible (default: true) */
    refreshOnVisible?: boolean;
    /** Refresh when location key changes (default: true) */
    refreshOnLocationChange?: boolean;
    /** Refresh when location state has refresh flag (default: true) */
    refreshOnStateFlag?: boolean;
    /** Cache key for request deduplication (default: auto-generated) */
    cacheKey?: string;
    /** Debounce delay in ms (default: 300) */
    debounceMs?: number;
  } = {}
) {
  const location = useLocation();
  const lastLocationKey = useRef<string | null>(null);
  const isRefreshing = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const {
    refreshOnVisible = true,
    refreshOnLocationChange = true,
    refreshOnStateFlag = true,
    cacheKey = `refresh-${location.pathname}`,
    debounceMs = 300,
  } = options;

  // Debounced refresh function with request deduplication
  const debouncedRefresh = useCallback(async () => {
    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Check if already refreshing
    if (isRefreshing.current) {
      return;
    }

    // Check cache
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return;
    }

    // Check if there's an active request for this key
    if (activeRequests.has(cacheKey)) {
      try {
        await activeRequests.get(cacheKey);
      } catch (error) {
        // Ignore errors from previous request
      }
      return;
    }

    // Debounce the actual execution
    debounceTimer.current = setTimeout(async () => {
      // Create and track the request
      const requestPromise = (async () => {
        try {
          isRefreshing.current = true;
          await refreshFn();
          // Update cache
          requestCache.set(cacheKey, { data: null, timestamp: Date.now() });
        } catch (error) {
          console.error('Refresh error:', error);
          // Don't cache errors
        } finally {
          isRefreshing.current = false;
          activeRequests.delete(cacheKey);
        }
      })();

      activeRequests.set(cacheKey, requestPromise);
      await requestPromise;
    }, debounceMs);
  }, [refreshFn, cacheKey, debounceMs]);

  // Refresh when navigating to this page (location key changes or refresh flag)
  useEffect(() => {
    if (!refreshOnLocationChange && !refreshOnStateFlag) return;

    const shouldRefresh =
      (refreshOnLocationChange && lastLocationKey.current !== location.key) ||
      (refreshOnStateFlag && (location.state as any)?.refresh === true);

    if (shouldRefresh) {
      lastLocationKey.current = location.key;
      // Clear the refresh flag
      if ((location.state as any)?.refresh) {
        window.history.replaceState({ ...location.state, refresh: false }, '');
      }
      debouncedRefresh();
    }
  }, [location.key, location.state, debouncedRefresh, refreshOnLocationChange, refreshOnStateFlag]);

  // Refresh when page becomes visible (user navigates back or switches tabs)
  useEffect(() => {
    if (!refreshOnVisible) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refresh if page was hidden for more than 1 second
        const hiddenTime = (document as any).__lastHiddenTime || 0;
        if (Date.now() - hiddenTime > 1000) {
          debouncedRefresh();
        }
      } else {
        (document as any).__lastHiddenTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [debouncedRefresh, refreshOnVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
}

/**
 * Helper to create navigation state with refresh flag
 */
export function createRefreshState(additionalState?: any) {
  return { refresh: true, ...additionalState };
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearRefreshCache(key?: string) {
  if (key) {
    requestCache.delete(key);
    activeRequests.delete(key);
  } else {
    requestCache.clear();
    activeRequests.clear();
  }
}
