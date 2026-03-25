import { useRef, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Simple debounce utility to prevent function calls within a specified delay
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId = null;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle utility to ensure function is called at most once per specified interval
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay = 300) => {
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Hook for safe button press that prevents rapid clicks
 * @param {Function} onPress - Press handler to debounce
 * @param {number} delay - Debounce delay (default: 300ms)
 * @returns {Function} Safe press handler
 */
export const useSafePress = (onPress, delay = 300) => {
  const isClickingRef = useRef(false);
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    // Prevent if already clicking
    if (isClickingRef.current) {
      console.warn('⚠️ Button clicked too rapidly. Ignoring click.');
      return;
    }

    // Mark as clicking
    isClickingRef.current = true;

    try {
      // Call the handler
      onPress?.(...args);
    } catch (error) {
      console.error('Error in button press handler:', error);
    }

    // Reset after delay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, delay);
  }, [onPress, delay]);
};

/**
 * Hook for safe navigation that prevents rapid navigation calls
 * @param {Object} router - Expo router instance
 * @param {number} delay - Debounce delay (default: 500ms for navigation)
 * @returns {Object} Safe navigation functions
 */
export const useSafeNavigation = (router, delay = 500) => {
  const isNavigatingRef = useRef(false);
  const timeoutRef = useRef(null);

  const safeNavigate = useCallback((path) => {
    if (isNavigatingRef.current) {
      console.warn('⚠️ Navigation attempted too rapidly. Ignoring.');
      return;
    }

    isNavigatingRef.current = true;
    
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      isNavigatingRef.current = false;
    }

    // Reset after delay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, delay);
  }, [router, delay]);

  const safeReplace = useCallback((path) => {
    if (isNavigatingRef.current) {
      console.warn('⚠️ Navigation attempted too rapidly. Ignoring.');
      return;
    }

    isNavigatingRef.current = true;
    
    try {
      router.replace(path);
    } catch (error) {
      console.error('Navigation error:', error);
      isNavigatingRef.current = false;
    }

    // Reset after delay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, delay);
  }, [router, delay]);

  const safeBack = useCallback(() => {
    if (isNavigatingRef.current) {
      console.warn('⚠️ Navigation attempted too rapidly. Ignoring.');
      return;
    }

    isNavigatingRef.current = true;
    
    try {
      router.back();
    } catch (error) {
      console.error('Navigation error:', error);
      isNavigatingRef.current = false;
    }

    // Reset after delay
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, delay);
  }, [router, delay]);

  return {
    push: safeNavigate,
    replace: safeReplace,
    back: safeBack,
  };
};

/**
 * Wrap onPress handler with safety checks
 * - Prevents rapid clicks
 * - Prevents multiple screens opening
 * - Prevents app freeze from rapid navigation
 * 
 * Usage in components:
 * <TouchableOpacity onPress={createSafePressHandler(handlePress, loadingState, setLoadingState)}>
 * 
 * @param {Function} handler - Handler to wrap
 * @param {boolean} isLoading - Current loading state
 * @param {Function} setIsLoading - Function to set loading state
 * @param {number} debounceMs - Debounce delay (default: 300ms)
 * @returns {Function} Safe press handler
 */
export const createSafePressHandler = (
  handler,
  isLoading,
  setIsLoading,
  debounceMs = 300
) => {
  return async (...args) => {
    // Prevent if already loading or processing
    if (isLoading) {
      console.warn('⚠️ Request already in progress. Ignoring click.');
      return;
    }

    // Set loading state
    if (setIsLoading) {
      setIsLoading(true);
    }

    try {
      // Call the actual handler
      const result = await handler?.(...args);
      return result;
    } catch (error) {
      console.error('Error in safe press handler:', error);
      throw error;
    } finally {
      // Reset loading state after delay
      if (setIsLoading) {
        setTimeout(() => {
          setIsLoading(false);
        }, debounceMs);
      }
    }
  };
};

/**
 * Higher-order component to wrap a component with click safety
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with click safety
 */
export const withClickSafety = (Component) => {
  return (props) => {
    const clickRef = useRef(false);

    const handleClickSafety = useCallback((callback) => {
      if (!clickRef.current) {
        clickRef.current = true;
        callback?.();
        
        setTimeout(() => {
          clickRef.current = false;
        }, 300);
      }
    }, []);

    return <Component {...props} handleClickSafety={handleClickSafety} />;
  };
};

/**
 * Create a debounced navigation function
 * @param {Object} router - Expo router instance
 * @param {string} path - Path to navigate to
 * @param {number} delay - Debounce delay (default: 500ms)
 * @returns {Function} Function to call for navigation
 */
export const createDebouncedNavigation = (router, path, delay = 500) => {
  let lastNavigationTime = 0;

  return () => {
    const now = Date.now();
    if (now - lastNavigationTime >= delay) {
      lastNavigationTime = now;
      router.push(path);
    } else {
      console.warn(
        `⚠️ Navigation throttled. Wait ${Math.ceil((delay - (now - lastNavigationTime)) / 1000)} seconds.`
      );
    }
  };
};

export default {
  debounce,
  throttle,
  useSafePress,
  useSafeNavigation,
  createSafePressHandler,
  withClickSafety,
  createDebouncedNavigation,
};
