'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce hook
 *
 * Returns a debounced value that only updates after the specified delay
 * has passed without the value changing.
 *
 * Perfect for auto-save functionality - waits for user to stop typing
 * before triggering save.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 1000ms)
 * @returns Debounced value
 *
 * @example
 * ```ts
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after user stops typing
 *   searchAPI(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 1000): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay is over
    // This ensures we only update after user stops changing the value
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
