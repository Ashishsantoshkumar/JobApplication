// In production deployments (like Vercel), set VITE_API_URL as an empty string to use relative paths
// and rely on host rewrites/proxies. In local development, it defaults to the local port 5000.
export const API_BASE = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:5000';
