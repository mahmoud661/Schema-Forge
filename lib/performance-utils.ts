/**
 * Performance utilities for the schema editor
 */

/**
 * Throttles a function to execute at most once per specified time interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Creates a stable object reference that only changes when deep values change
 */
export function useStable<T>(value: T): T {
  const ref = React.useRef<T>(value);
  
  const isEqual = React.useMemo(() => {
    return JSON.stringify(ref.current) === JSON.stringify(value);
  }, [value]);
  
  React.useEffect(() => {
    if (!isEqual) {
      ref.current = value;
    }
  }, [value, isEqual]);
  
  return isEqual ? ref.current : value;
}

/**
 * Optimized handler for large lists to prevent unnecessary re-renders
 * @param list The original list
 * @param visibleStartIndex First visible item index
 * @param visibleEndIndex Last visible item index
 * @param bufferSize Number of additional items to render outside visible range
 */
export function getVisibleItems<T>(
  list: T[],
  visibleStartIndex: number,
  visibleEndIndex: number,
  bufferSize = 10
): T[] {
  const start = Math.max(0, visibleStartIndex - bufferSize);
  const end = Math.min(list.length, visibleEndIndex + bufferSize);
  
  return list.slice(start, end);
}

// Import missing React dependency at top
import React from 'react';
