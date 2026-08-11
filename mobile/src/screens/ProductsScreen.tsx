import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { fetchProducts } from '../api';
import { Product, ProductSort } from '../types';
import { ProductCard } from '../components/ProductCard';
import { LoadingView } from '../components/Loading';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { TabScreenProps, RootScreenProps } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name', label: 'Name A–Z' }
];

export default function ProductsScreen({ navigation, route }: RootScreenProps<'ProductList'> | TabScreenProps<'ShopTab'>) {
  const nav = navigation as RootScreenProps<'ProductList'>['navigation'];
  const params = 'params' in route ? (route.params ?? {}) : {};
  const categoryId = (params as { categoryId?: number }).categoryId;
  const initialTitle = (params as { title?: string }).title;
  const initialSearch = (params as { search?: string }).search;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(initialSearch ?? '');
  const [sort, setSort] = useState<ProductSort>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (nextPage === 1) setLoading(true);
      try {
        setError(null);
        const res = await fetchProducts({
          page: nextPage,
          limit: 12,
          search: search.trim() || undefined,
          category_id: categoryId,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          sort
        });
        setTotal(res.total);
        setPages(res.pages);
        setPage(res.page);
        setProducts((prev) => (append ? [...prev, ...res.products] : res.products));
      } catch {
        setError('Could not load products. Check your connection and try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, categoryId, minPrice, maxPrice, sort]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, false), 400);
  };

  const applySort = (next: ProductSort) => {
    setSort(next);
    setProducts([]);
    searchTimer.current = setTimeout(() => load(1, false), 250);
  };

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

  useEffect(() => {
    navigation.setOptions({ title: initialTitle ?? (categoryId ? 'Products' : 'Shop') });
  }, [navigation, initialTitle, categoryId]);

  if (loading) return <LoadingView label="Loading products…" />;
  if (error && products.length === 0) return <ErrorState message={error} onRetry={() => load(1, false)} />;

  const filtersActive = minPrice !== '' || maxPrice !== '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search products…"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable style={[styles.filterBtn, showFilters && styles.filterBtnActive]} onPress={() => setShowFilters((v) => !v)}>
          <Ionicons name="options-outline" size={20} color={showFilters ? colors.black : colors.accent} />
        </Pressable>
      </View>

      {showFilters ? (
        <View style={styles.filters}>
          <View style={styles.sortRow}>
            {SORTS.map((s) => (
              <Pressable
                key={s.value}
                style={[styles.sortChip, sort === s.value && styles.sortChipActive]}
                onPress={() => applySort(s.value)}
              >
                <Text style={[styles.sortChipText, sort === s.value && { color: colors.black }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.priceInput, filtersActive && styles.priceInputActive]}
              value={minPrice}
              onChangeText={(t) => { setMinPrice(t.replace(/[^0-9]/g, '')); }}
              placeholder="Min RWF"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={[styles.priceInput, filtersActive && styles.priceInputActive]}
              value={maxPrice}
              onChangeText={(t) => { setMaxPrice(t.replace(/[^0-9]/g, '')); }}
              placeholder="Max RWF"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
            <Pressable style={styles.applyBtn} onPress={() => load(1, false)}>
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {total} {total === 1 ? 'product' : 'products'}
          {categoryId ? ' in this category' : ''}
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard product={item} onPress={() => nav.navigate('ProductDetail', { id: item.id })} />
          </View>
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            title="No products found"
            message={search || filtersActive ? 'Try a different search or clear filters.' : 'This category is empty right now.'}
            actionLabel={search || filtersActive ? 'Clear search & filters' : undefined}
            onAction={() => { setSearch(''); setMinPrice(''); setMaxPrice(''); load(1, false); }}
          />
        }
        ListFooterComponent={loadingMore ? <Text style={styles.footerMore}>Loading more…</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    gap: 8
  },
  searchInput: { flex: 1, color: colors.fg, fontSize: 15, paddingVertical: 11 },
  filterBtn: {
    width: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filters: { paddingHorizontal: 16, paddingTop: 10 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface
  },
  sortChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  sortChipText: { color: colors.fg, fontSize: 12, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  priceInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    color: colors.fg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13
  },
  priceInputActive: { borderColor: colors.accent },
  priceDash: { color: colors.muted },
  applyBtn: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.divider
  },
  applyText: { color: colors.fg, fontSize: 13, fontWeight: '700' },
  countRow: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 },
  countText: { color: colors.muted, fontSize: 12 },
  row: { gap: 12 },
  cardWrap: { flex: 1, marginBottom: 16 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  footerMore: { color: colors.muted, textAlign: 'center', paddingVertical: 12 }
});