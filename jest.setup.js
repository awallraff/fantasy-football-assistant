// Optional: Add any global test setup here
// For example, mocking console methods, setting up global variables, etc.

// Suppress console output during tests to keep output clean
global.console = {
  ...console,
  // Keep error and warn for debugging, but suppress log and info
  log: jest.fn(),
  info: jest.fn(),
}

// Mock window and other browser globals if needed for components
// Only define window properties if they don't exist (for Node environment)
if (typeof window !== 'undefined') {
  // Only define location if it doesn't exist (avoid redefining in jsdom environment)
  if (!window.location) {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    })
  }
} else {
  // Define global window for Node environment if needed
  global.window = {}
}
