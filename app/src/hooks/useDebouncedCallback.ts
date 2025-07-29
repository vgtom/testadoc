import { useRef } from "react";

const useDebouncedCallback = (
  callback: (...args: any[]) => void,
  delay: number
) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  };
};

export default useDebouncedCallback;
