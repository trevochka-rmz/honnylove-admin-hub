import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debouncedValue;
}
