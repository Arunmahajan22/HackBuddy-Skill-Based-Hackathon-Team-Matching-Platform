import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a fast-changing value (e.g. search input).
 *
 * @param {any} value The input value to debounce.
 * @param {number} delay Milliseconds to delay updating the returned value.
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
