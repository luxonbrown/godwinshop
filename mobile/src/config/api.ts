/**
 * Centralized API configuration.
 *
 * Override the production URL at build time with the
 * EXPO_PUBLIC_API_URL environment variable (e.g. .env file):
 *
 *   EXPO_PUBLIC_API_URL=https://godwinshop-api.onrender.com
 */
const GLOBAL_API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const API_BASE_URL = GLOBAL_API_URL || 'https://godwinshop-api.onrender.com';

export const CLIENT_SITE_URL = 'https://godwinshop-client.onrender.com';

export const COOKIE_NAME = 'godwinshop.sid';

export const DELIVERY_FEE = 2500;
export const FREE_DELIVERY_THRESHOLD = 50000;

/**
 * The API returns relative image paths like "/uploads/xxx.jpeg".
 * Resolve them to absolute HTTPS URLs for Android.
 */
export function resolveImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
}

export const PLACEHOLDER_IMAGE = `${API_BASE_URL}/uploads/placeholder.svg`;

export function effectivePrice(p?: { price?: number | string; discount_price?: number | string | null } | null): number {
  if (!p) return 0;
  const discount = Number(p.discount_price || 0);
  const price = Number(p.price || 0);
  return discount > 0 ? discount : price;
}

export function isOutOfStock(p?: {
  status?: string;
  stock_quantity?: number | string;
} | null): boolean {
  if (!p) return false;
  return (
    p.status === 'out_of_stock' ||
    p.status === 'inactive' ||
    Number(p.stock_quantity || 0) <= 0
  );
}

export function computeDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}