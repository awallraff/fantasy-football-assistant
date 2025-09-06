// Utility functions for client-side only operations

export function safeNavigate(url: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

export function isClient(): boolean {
  return typeof window !== 'undefined'
}

export function safeLocalStorageGet(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }
  return null
}

export function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Failed to set localStorage item:', error)
    }
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove localStorage item:', error)
    }
  }
}
