/**
 * Debug Utilities
 *
 * Utilities for conditional logging based on environment or debug flags.
 */

/**
 * Checks if debug mode is enabled.
 * Debug mode is enabled when NODE_ENV is 'development' or when the DEBUG flag is set.
 */
export function isDebugEnabled(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';
}

/**
 * Logs a debug message to the console only if debug mode is enabled.
 *
 * @param message - The message to log
 * @param optionalParams - Additional parameters to log
 *
 * @example
 * ```ts
 * debugLog('User clicked button', { buttonId: 'submit' });
 * ```
 */
export function debugLog(message: string, ...optionalParams: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(`[DEBUG] ${message}`, ...optionalParams);
  }
}

/**
 * Logs an info message to the console only if debug mode is enabled.
 *
 * @param message - The message to log
 * @param optionalParams - Additional parameters to log
 */
export function debugInfo(message: string, ...optionalParams: unknown[]): void {
  if (isDebugEnabled()) {
    console.info(`[INFO] ${message}`, ...optionalParams);
  }
}

/**
 * Logs a warning message to the console (always shown, regardless of debug mode).
 *
 * @param message - The warning message to log
 * @param optionalParams - Additional parameters to log
 */
export function debugWarn(message: string, ...optionalParams: unknown[]): void {
  console.warn(`[WARN] ${message}`, ...optionalParams);
}

/**
 * Logs an error message to the console (always shown, regardless of debug mode).
 *
 * @param message - The error message to log
 * @param optionalParams - Additional parameters to log
 */
export function debugError(message: string, ...optionalParams: unknown[]): void {
  console.error(`[ERROR] ${message}`, ...optionalParams);
}
