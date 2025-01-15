import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (typeof window === 'undefined') return ''; // Handle SSR case
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
}