import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function makeColorTransparent(hex: string, opacityPercentage: number): string | null {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    // Expand shorthand like "#f00" to "ff0000"
    hex = hex.split('').map(c => c + c).join('');
  }

  if (hex.length !== 6) return null;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const alpha = Math.min(100, Math.max(0, opacityPercentage)) / 100;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
