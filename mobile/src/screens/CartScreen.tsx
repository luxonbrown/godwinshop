import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { useCart } from '../context/CartContext';
import { QuantityStepper } from '../components/QuantityStepper';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PLACEHOLDER_IMAGE, resolveImageUrl } from '../config/api';
import { formatMoney } from '../lib/format';
import { TabScreenProps } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }: TabScreenProps<'CartTab'>) {
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem } = useCart();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          message="Browse the shop and add some products to get started."
          actionLabel="Start Shopping"
          onAction={() => navigation.navigate('MainTabs', { screen: 'ShopTab' })}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.product_id)}
            contentContainerStyle={styles.content}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image
                  source={{ uri: resolveImageUrl(item.image_url) ?? PLACEHOLDER_IMAGE }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.price}>{formatMoney(item.price)}</Text>
                  <View style={styles.controls}>
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(q) => updateQuantity(item.product_id, q)}
                      max={item.stock_quantity}
                    />
                    <Pressable onPress={() => removeItem(item.product_id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatMoney(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={[styles.summaryValue, deliveryFee === 0 && { color: colors.accent }]}>
                {deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatMoney(total)}</Text>
            </View>
            <Button title="Proceed to Checkout" onPress={() => navigation.navigate('Checkout')} />
          </View>
        </>
      )}
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 12,
    gap: 12
  },
  image: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.base2 },
  body: { flex: 1 },
  name: { color: colors.fg, fontSize: 15, fontWeight: '600' },
  price: { color: colors.accent, fontSize: 15, fontWeight: '800', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted, fontSize: 14 },
  summaryValue: { color: colors.fg, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 10, marginTop: 4 },
  totalLabel: { color: colors.fg, fontSize: 17, fontWeight: '800' },
  totalValue: { color: colors.accent, fontSize: 18, fontWeight: '800' }
});