import { request } from '../lib/http';
import {
  Category,
  ContactPayload,
  LoginResponse,
  Notification,
  Order,
  OrderCreatePayload,
  OrderList,
  Product,
  ProductDetailResponse,
  ProductListResponse,
  ProductSort,
  SessionResponse,
  User
} from '../types';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: ProductSort;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

// --- Public catalog ---

export async function fetchProducts(query: ProductQuery = {}): Promise<ProductListResponse> {
  return request(`/api/products${qs(query as Record<string, string | number | undefined | null>)}`);
}

export async function fetchProduct(id: number): Promise<ProductDetailResponse> {
  return request<ProductDetailResponse>(`/api/products/${id}`);
}

export async function fetchCategories(): Promise<{ categories: Category[] }> {
  return request<{ categories: Category[] }>('/api/categories');
}

export async function submitContact(payload: ContactPayload): Promise<{ message: string }> {
  return request<{ message: string }>('/api/contact', { method: 'POST', body: payload });
}

// --- Auth ---

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
}

export async function register(payload: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
}): Promise<{ message: string; user: User; devVerificationUrl?: string | null }> {
  return request('/api/auth/register', { method: 'POST', body: payload });
}

export async function verifyEmail(token: string): Promise<{ message: string; verified: boolean }> {
  return request('/api/auth/verify', { method: 'POST', body: { token } });
}

export async function resendVerification(email: string): Promise<{ message: string; devVerificationUrl?: string | null }> {
  return request('/api/auth/resend-verification', { method: 'POST', body: { email } });
}

export async function fetchCurrentSession(): Promise<SessionResponse> {
  return request<SessionResponse>('/api/auth/session');
}

export async function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

export async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
  return request('/api/auth/password', { method: 'PUT', body: { current_password, new_password } });
}

// --- Profile ---

export async function fetchProfile(): Promise<{ user: User }> {
  return request<{ user: User }>('/api/users/profile');
}

export async function updateProfile(payload: {
  full_name?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}): Promise<{ message: string; user: User }> {
  return request('/api/users/profile', { method: 'PUT', body: payload });
}

// --- Orders ---

export async function createOrder(payload: OrderCreatePayload): Promise<{ message: string; order: Order }> {
  return request('/api/orders', { method: 'POST', body: payload });
}

export async function fetchMyOrders(page = 1, limit = 10): Promise<OrderList> {
  return request<OrderList>(`/api/orders/mine${qs({ page, limit })}`);
}

export async function fetchOrder(id: number): Promise<{ order: Order }> {
  return request<{ order: Order }>(`/api/orders/${id}`);
}

export async function cancelOrder(id: number): Promise<{ message: string }> {
  return request(`/api/orders/${id}/cancel`, { method: 'POST' });
}

// --- Notifications ---

export async function fetchNotifications(): Promise<{ notifications: Notification[] }> {
  return request('/api/notifications');
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  return request('/api/notifications/unread-count');
}

// Health
export async function fetchHealth(): Promise<{ status: string; service: string }> {
  return request('/api/health');
}

export type { Product };
export { qs };