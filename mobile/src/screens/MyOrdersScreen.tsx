import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { fetchMyOrders } from '../api';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingView } from '../components/Loading';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { orderStatusLabel } from '../theme';
import { formatDateTime, formatMoney } from '../lib/format';
import { RootScreenProps } from '../navigation/types';

export default function MyOrdersScreen({ navigation }: RootScreenProps<'MyOrders'>) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    if (nextPage === 1) setLoading(true);
    try {
      setError(null);
      const res = await fetchMyOrders(nextPage, 10);
      setTotal(res.total);
      setPages(res.pages);
      setPage(res.page);
      setOrders((prev) => (append ? [...prev, ...res.orders] : res.orders));
    } catch {
      setError('Could not load your orders. Check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(1, false);
    setRefreshing(false);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (page >= pages || loadingMore || loading) return;
    setLoadingMore(true);
    load(page + 1, true);
  }, [page, pages, loadingMore, loading, load]);

  if (loading) return <LoadingView label="Loading your orders…" />;
  if (error && orders.length === 0) return <ErrorState message={error} onRetry={() => load(1, false)} />;

  return (
    <View style={styles.safe}>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <Text style={styles.count}>{total} {total === 1 ? 'order' : 'orders'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <StatusBadge status={item.status} label={orderStatusLabel[item.status] ?? item.status} />
            </View>
            <Text style={styles.date}>{formatDateTime(item.created_at)}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.countItems}>
                {item.items?.length ?? '—'} item(s)
              </Text>
              <Text style={styles.total}>{formatMoney(item.total_amount)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No orders yet"
            message="When you place an order, it will show up here."
            actionLabel="Start Shopping"
            onAction={() => navigation.navigate('MainTabs', { screen: 'ShopTab' })}
          />
        }
        ListFooterComponent={loadingMore ? <Text style={styles.footerMore}>Loading more…</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  content: { padding: 16, paddingBottom: 32 },
  count: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { color: colors.fg, fontSize: 15, fontWeight: '700' },
  date: { color: colors.muted, fontSize: 12, marginTop: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  countItems: { color: colors.muted, fontSize: 13 },
  total: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  footerMore: { color: colors.muted, textAlign: 'center', paddingVertical: 12 }
});