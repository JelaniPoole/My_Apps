// lib/api.ts
export const API_BASE =
  "https://c13e5c1e-7c5d-4b03-8a8c-cdae1f2536de-00-3fmidunzpdfr0.worf.replit.dev:5000";

export function apiUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}
