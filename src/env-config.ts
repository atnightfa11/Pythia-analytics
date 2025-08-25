// Environment configuration for polling intervals
export const CONFIG = {
  // Live visitors polling interval in milliseconds (default: 5000ms = 5s)
  LIVE_POLL_MS: parseInt(import.meta.env.VITE_LIVE_POLL_MS || '5000'),

  // Main dashboard data polling interval in milliseconds (default: 120000ms = 2min)
  MAIN_POLL_MS: parseInt(import.meta.env.VITE_MAIN_POLL_MS || '120000'),

  // Maximum retry attempts for failed requests
  MAX_RETRY_ATTEMPTS: 3,

  // Base delay for exponential backoff in milliseconds
  RETRY_BASE_DELAY: 1000
} as const;
