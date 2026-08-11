import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { effectivePrice, isOutOfStock, PLACEHOLDER_IMAGE, resolveImageUrl } from '../config/api';
import { Product } from '../types';
import { formatMoney } from '../lib/format';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const outOfStock = isOutOfStock(product);
  const hasDiscount = Number(product.discount_price || 0) > 0;
  const image = resolveImageUrl(product.image_url) ?? PLACEHOLDER_IMAGE;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        {outOfStock ? (
          <View style={[styles.badge, styles.outOfStock]}>
            <Text style={styles.badgeText}>Out of Stock</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        {product.category_name ? (
          <Text style={styles.category}>{product.category_name}</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {hasDiscount ? <Text style={styles.original}>{formatMoney(product.price)}</Text> : null}
        <Text style={styles.price}>{formatMoney(effectivePrice(product))}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    flex: 1
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.base2 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  outOfStock: { backgroundColor: 'rgba(69,10,10,0.92)' },
  badgeText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  body: { padding: 12 },
  category: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { color: colors.fg, fontSize: 15, fontWeight: '600', marginTop: 4 },
  original: { color: colors.muted, fontSize: 12, textDecorationLine: 'line-through', marginTop: 6 },
  price: { color: colors.accent, fontSize: 16, fontWeight: '800', marginTop: 2 }
});