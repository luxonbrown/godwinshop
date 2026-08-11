export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'admin';
  is_verified: boolean;
  status: string;
  profile_image: string | null;
  address: string | null;
  city: string | null;
  created_at?: string;
  updated_at?: string;
  order_count?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  effective_price: number;
  sku: string | null;
  stock_quantity: number;
  image_url: string | null;
  status: 'active' | 'inactive' | 'out_of_stock';
  category_id: number | null;
  category_name: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductDetailResponse {
  product: Product;
  related_products: Product[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  image_url: string | null;
  sku?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address: string;
  delivery_city: string | null;
  delivery_phone: string;
  delivery_instructions: string | null;
  status: OrderStatus;
  expected_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  items?: OrderItem[];
}

export interface OrderList {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: User;
  unread?: number;
}

export interface LoginResponse {
  message: string;
  user: User;
  /** Raw signed session cookie. Sets Set-Cookie too, but mobile may
      need it explicitly depending on native networking behavior. */
  session_cookie?: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock_quantity: number;
}

export interface ApiErrorPayload {
  message: string;
  code?: string;
  errors?: { field?: string; message?: string }[];
  status?: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface OrderCreatePayload {
  items: { product_id: number; quantity: number }[];
  delivery_address: string;
  delivery_city?: string;
  delivery_phone: string;
  delivery_instructions?: string;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name';