import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { fetchOrder, cancelOrder } from '../api';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { LoadingView } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import { orderStatusLabel } from '../theme';
import { formatDateTime, formatDeliveryDate, formatMoney } from '../lib/format';
import { resolveImageUrl, PLACEHOLDER_IMAGE } from '../config/api';
import { RootScreenProps } from '../navigation/types';

export default function OrderDetailScreen({ navigation, route }: RootScreenProps<'OrderDetail'>) {
  const { id } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOrder(id);
      setOrder(res.order);
    } catch {
      setError('Could not load this order. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) return <LoadingView label="Loading order…" />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found.'} onRetry={load} />;

  const handleCancel = () => {
    Alert.alert('Cancel order?', 'This order is still pending and can be cancelled. Stock will be restored.', [
      { text: 'Keep Order', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(order!.id);
            setOrder({ ...order!, status: 'cancelled' });
          } catch {
            Alert.alert('Could not cancel', 'Please try again.');
          }
        }
      }
    ]);
  };

  const expected = formatDeliveryDate(order.expected_delivery_date);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <StatusBadge status={order.status} label={orderStatusLabel[order.status] ?? order.status} />
        </View>
        <Text style={styles.date}>{formatDateTime(order.created_at)}</Text>
        {expected ? <Text style={styles.expected}>Expected delivery: {expected}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Items</Text>
      <View style={styles.items}>
        {(order.items ?? []).map((i) => (
          <View key={i.id} style={styles.itemRow}>
            <Image
              source={{ uri: resolveImageUrl(i.image_url) ?? PLACEHOLDER_IMAGE }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemBody}>
              <Text style={styles.itemName} numberOfLines={2}>{i.product_name}</Text>
              <Text style={styles.itemMeta}>Qty {i.quantity} × {formatMoney(i.unit_price)}</Text>
            </View>
            <Text style={styles.itemTotal}>{formatMoney(i.subtotal)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Delivery details</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoLine}><Text style={styles.infoLabel}>Address: </Text>{order.delivery_address}</Text>
        {order.delivery_city ? (
          <Text style={styles.infoLine}><Text style={styles.infoLabel}>City: </Text>{order.delivery_city}</Text>
        ) : null}
        <Text style={styles.infoLine}><Text style={styles.infoLabel}>Phone: </Text>{order.delivery_phone}</Text>
        {order.delivery_instructions ? (
          <Text style={styles.infoLine}><Text style={styles.infoLabel}>Instructions: </Text>{order.delivery_instructions}</Text>
        ) : null}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatMoney(order.subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery fee</Text>
          <Text style={[styles.summaryValue, order.delivery_fee === 0 && { color: colors.accent }]}>
            {order.delivery_fee === 0 ? 'Free' : formatMoney(order.delivery_fee)}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatMoney(order.total_amount)}</Text>
        </View>
      </View>

      {order.status === 'pending' ? (
        <View style={styles.cancelWrap}>
          <Button title="Cancel Order" variant="danger" onPress={handleCancel} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: 18, paddingBottom: 40 },
  headerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 16
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { color: colors.fg, fontSize: 17, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 12, marginTop: 6 },
  expected: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 8 },
  sectionTitle: { color: colors.fg, fontSize: 16, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  items: { gap: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    padding: 10,
    gap: 10
  },
  itemImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.base2 },
  itemBody: { flex: 1 },
  itemName: { color: colors.fg, fontSize: 14, fontWeight: '600' },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  itemTotal: { color: colors.fg, fontSize: 14, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 16
  },
  infoLine: { color: colors.muted, fontSize: 13, marginVertical: 4, lineHeight: 19 },
  infoLabel: { color: colors.fg, fontWeight: '600' },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    marginTop: 22
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted, fontSize: 14 },
  summaryValue: { color: colors.fg, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 10, marginTop: 4 },
  totalLabel: { color: colors.fg, fontSize: 17, fontWeight: '800' },
  totalValue: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  cancelWrap: { marginTop: 20 }
});