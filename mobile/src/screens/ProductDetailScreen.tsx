import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { fetchProduct } from '../api';
import { Product } from '../types';
import { effectivePrice, isOutOfStock, PLACEHOLDER_IMAGE, resolveImageUrl } from '../config/api';
import { formatMoney } from '../lib/format';
import { LoadingView } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { QuantityStepper } from '../components/QuantityStepper';
import { StatusBadge } from '../components/StatusBadge';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { RootScreenProps } from '../navigation/types';

export default function ProductDetailScreen({ navigation, route }: RootScreenProps<'ProductDetail'>) {
  const { id } = route.params;
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProduct(id);
      setProduct(res.product);
      setRelated(res.related_products);
      navigation.setOptions({ title: res.product.name });
    } catch {
      setError('Could not load this product. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  if (loading) return <LoadingView label="Loading product…" />;
  if (error || !product) return <ErrorState message={error ?? 'Product not found.'} onRetry={load} />;

  const outOfStock = isOutOfStock(product);
  const hasDiscount = Number(product.discount_price || 0) > 0;
  const image = resolveImageUrl(product.image_url) ?? PLACEHOLDER_IMAGE;

  const handleAdd = () => {
    addItem(
      {
        product_id: product.id,
        name: product.name,
        price: effectivePrice(product),
        image_url: product.image_url,
        stock_quantity: product.stock_quantity
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.row}>
          {product.category_name ? <Text style={styles.category}>{product.category_name}</Text> : null}
          {outOfStock ? <StatusBadge status="out_of_stock" label="Out of Stock" /> : <StatusBadge status="active" label="In Stock" />}
        </View>

        <Text style={styles.name}>{product.name}</Text>
        {product.sku ? <Text style={styles.sku}>SKU: {product.sku}</Text> : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(effectivePrice(product))}</Text>
          {hasDiscount ? <Text style={styles.original}>{formatMoney(product.price)}</Text> : null}
        </View>

        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

        <View style={styles.stockRow}>
          <Text style={styles.stockText}>
            {outOfStock ? 'Currently unavailable' : `${product.stock_quantity} available`}
          </Text>
          {!outOfStock && product.stock_quantity <= 5 ? (
            <Text style={styles.lowStock}>Hurry — only a few left!</Text>
          ) : null}
        </View>

        {!outOfStock ? (
          <View style={styles.addRow}>
            <QuantityStepper quantity={quantity} onChange={setQuantity} max={product.stock_quantity} />
            <View style={styles.addBtn}>
              <Button title={added ? 'Added ✓' : 'Add to Cart'} onPress={handleAdd} disabled={outOfStock} />
            </View>
          </View>
        ) : (
          <Button title="Out of Stock" onPress={() => {}} disabled />
        )}

        {related.length > 0 ? (
          <View style={styles.related}>
            <Text style={styles.relatedTitle}>You may also like</Text>
            <View style={styles.relatedGrid}>
              {related.map((p) => (
                <View key={p.id} style={styles.relatedCard}>
                  <ProductCard product={p} onPress={() => navigation.push('ProductDetail', { id: p.id })} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { paddingBottom: 40 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.base2 },
  body: { padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { color: colors.fg, fontSize: 22, fontWeight: '800', marginTop: 10 },
  sku: { color: colors.muted, fontSize: 12, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  price: { color: colors.accent, fontSize: 24, fontWeight: '800' },
  original: { color: colors.muted, fontSize: 15, textDecorationLine: 'line-through' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 14 },
  stockRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockText: { color: colors.fg, fontSize: 13, fontWeight: '600' },
  lowStock: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  addBtn: { flex: 1 },
  related: { marginTop: 32 },
  relatedTitle: { color: colors.fg, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  relatedCard: { flex: 1, minWidth: '45%', marginBottom: 12 }
});