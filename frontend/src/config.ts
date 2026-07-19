// Use the Vercel rewrite in production so API calls stay on the same origin for
// every visitor. A localhost value is never valid in a browser production build:
// it would point to the visitor's device, not this application's backend.
const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
const isLocalApiUrl = configuredApiBase !== undefined &&
  /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(configuredApiBase);

export const API_BASE = import.meta.env.DEV
  ? (configuredApiBase || 'http://localhost:5000')
  : (isLocalApiUrl ? '' : (configuredApiBase || ''));
