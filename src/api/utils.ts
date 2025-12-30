import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardized error handler for API calls
 * Backend returns errors as { error: "message" } or { error: "message", details: [...] }
 */
export function getErrorMessage(error: any): string {
  return error?.response?.data?.error || error?.message || 'An unexpected error occurred';
}

/**
 * Handle wrapped API responses
 * Backend returns { success: true, data: {...} } or { success: true, conversations: [...] }
 */
export function unwrapResponse<T>(responseData: any, dataKey: string = 'data'): T {
  if (responseData && typeof responseData === 'object' && 'success' in responseData) {
    return responseData[dataKey] || responseData;
  }
  return responseData;
}

