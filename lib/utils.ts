import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDevModeAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}
