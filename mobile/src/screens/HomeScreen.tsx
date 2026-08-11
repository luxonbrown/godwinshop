import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius } from '../theme';
import { fetchProducts, fetchCategories } from '../api';
import { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { LoadingView } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { TabScreenProps } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: TabScreenProps<'HomeTab'>) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        fetchCategories(),
        fetchProducts({ limit: 6, sort: 'newest' })
      ]);
      setCategories(catRes.categories);
      setFeatured(prodRes.products);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return <LoadingView label="Loading the store…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const firstName = user?.full_name?.split(' ')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={featured}
        keyExtractor={(item) => `f-${item.id}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{firstName ? `Hello, ${firstName}` : 'Hello'}</Text>
                <Text style={styles.brand}>Godwinshop</Text>
              </View>
              <Pressable
                style={styles.cartButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' })}
              >
                <Ionicons name="cart-outline" size={24} color={colors.accent} />
              </Pressable>
            </View>

            <Text style={styles.hero}>
              Shop Smarter.{'\n'}
              <Text style={styles.heroAccent}>Order Easily.</Text>
            </Text>
            <Text style={styles.heroSub}>Get it delivered.</Text>

            <View style={styles.linkRow}>
              <Pressable style={styles.linkCard} onPress={() => navigation.navigate('About')}>
                <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
                <Text style={styles.linkText}>About</Text>
              </Pressable>
              <Pressable style={styles.linkCard} onPress={() => navigation.navigate('HowItWorks')}>
                <Ionicons name="play-circle-outline" size={20} color={colors.accent} />
                <Text style={styles.linkText}>How It Works</Text>
              </Pressable>
              <Pressable style={styles.linkCard} onPress={() => navigation.navigate('Contact')}>
                <Ionicons name="call-outline" size={20} color={colors.accent} />
                <Text style={styles.linkText}>Contact</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Pressable onPress={() => navigation.navigate('MainTabs', { screen: 'CategoriesTab' })}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {categories.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(c) => `cat-${c.id}`}
                contentContainerStyle={styles.categoryRow}
                renderItem={({ item }) => (
                  <Pressable style={styles.categoryChip} onPress={() => navigation.navigate('ProductList', { categoryId: item.id, title: item.name })}>
                    <Text style={styles.categoryChipText}>{item.name}</Text>
                    <Text style={styles.categoryChipCount}>
                      {item.product_count} {item.product_count === 1 ? 'item' : 'items'}
                    </Text>
                  </Pressable>
                )}
              />
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <Pressable onPress={() => navigation.navigate('MainTabs', { screen: 'ShopTab' })}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No products yet — check back soon.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  list: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { gap: 12 },
  cardWrap: { flex: 1, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  greeting: { color: colors.muted, fontSize: 14 },
  brand: { color: colors.fg, fontSize: 20, fontWeight: '800' },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hero: { color: colors.fg, fontSize: 32, fontWeight: '800', lineHeight: 38, marginTop: 16 },
  heroAccent: { color: colors.accent },
  heroSub: { color: colors.muted, fontSize: 15, marginTop: 6 },
  linkRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  linkCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
    gap: 6
  },
  linkText: { color: colors.fg, fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  sectionTitle: { color: colors.fg, fontSize: 18, fontWeight: '800' },
  seeAll: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  categoryRow: { gap: 10, paddingRight: 16 },
  categoryChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    maxWidth: 160
  },
  categoryChipText: { color: colors.fg, fontWeight: '700' },
  categoryChipCount: { color: colors.muted, fontSize: 12, marginTop: 2 },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 24 }
});