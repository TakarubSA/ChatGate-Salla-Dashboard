// src/lib/api-config.ts

// Reads from env if present, falls back to localhost for local dev.
// Set VITE_API_BASE_URL in your .env / .env.production to override.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL

export const API_ENDPOINTS = {
  merchantOrders: `${API_BASE_URL}/salla/api/merchant/orders`,
  // add other endpoints here as you centralize them, e.g.:
  // merchantCarts: `${API_BASE_URL}/salla/api/merchant/carts`,
  // login: `${API_BASE_URL}/auth/login`,
} as const;