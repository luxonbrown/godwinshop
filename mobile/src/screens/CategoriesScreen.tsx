import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius } from '../theme';
import { fetchCategories } from '../api';
import { Category } from '../types';
import { LoadingView } from '../components/Loading';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { TabScreenProps } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

export default function CategoriesScreen({ navigation }: TabScreenProps<'CategoriesTab'>) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCategories();
      setCategories(res.categories);
    } catch {
      setError('Could not load categories. Check your connection and try again.');
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

  if (loading) return <LoadingView label="Loading categories…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('ProductList', { categoryId: item.id, title: item.name })}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="pricetag-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <Text style={styles.cardCount}>
                {item.product_count} {item.product_count === 1 ? 'product' : 'products'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No categories yet"
            message="Categories appear here once the store admin adds them."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.fg, fontSize: 24, fontWeight: '800' },
  content: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 14,
    gap: 14
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.base2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardBody: { flex: 1 },
  cardName: { color: colors.fg, fontSize: 16, fontWeight: '700' },
  cardDesc: { color: colors.muted, fontSize: 13, marginTop: 2 },
  cardCount: { color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: 4 }
});