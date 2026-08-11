export const colors = {
  base: '#0B0B0B',
  base2: '#101010',
  surface: '#151515',
  surface2: '#1C1C1C',
  divider: '#262626',
  muted: '#9A9A9A',
  fg: '#F5F5F5',
  accent: '#F5C400',
  accentHover: '#FFDB2E',
  accentDark: '#C9A200',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#38BDF8'
};

export const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: '#422006', border: '#854D0E', text: '#FACC15' },
  confirmed: { bg: '#082F49', border: '#075985', text: '#38BDF8' },
  processing: { bg: '#2E1065', border: '#6B21A8', text: '#A78BFA' },
  ready_for_delivery: { bg: '#083344', border: '#155E75', text: '#22D3EE' },
  out_for_delivery: { bg: '#1E1B4B', border: '#4338CA', text: '#818CF8' },
  delivered: { bg: '#022C22', border: '#047857', text: '#34D399' },
  cancelled: { bg: '#450A0A', border: '#B91C1C', text: '#F87171' },
  active: { bg: '#022C22', border: '#047857', text: '#34D399' },
  out_of_stock: { bg: '#450A0A', border: '#B91C1C', text: '#F87171' },
  inactive: { bg: '#1F2937', border: '#4B5563', text: '#9CA3AF' }
};

export const font = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System'
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

export const orderStatusLabel: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const productStatusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  out_of_stock: 'Out of Stock'
};