import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { colors } from '../theme';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../api';
import { GodwinshopApiError } from '../lib/http';
import { formatMoney } from '../lib/format';
import { resolveImageUrl, PLACEHOLDER_IMAGE } from '../config/api';
import { RootScreenProps } from '../navigation/types';

export default function CheckoutScreen({ navigation }: RootScreenProps<'Checkout'>) {
  const { items, subtotal, deliveryFee, total, clearCart, hydrated } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState(user?.address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  if (!hydrated) {
    return <View style={styles.flex} />;
  }
  if (items.length === 0) {
    return (
      <View style={[styles.flex, styles.emptyWrap]}>
        <EmptyState
          title="Your cart is empty"
          message="Add products to your cart before checking out."
          actionLabel="Go to Shop"
          onAction={() => navigation.navigate('MainTabs', { screen: 'ShopTab' })}
        />
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (address.trim().length < 5) return setError('A delivery address is required (min 5 characters).');
    if (phone.trim().length < 5) return setError('A delivery phone number is required.');

    setPlacing(true);
    try {
      const res = await createOrder({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        delivery_address: address.trim(),
        delivery_city: city.trim() || undefined,
        delivery_phone: phone.trim(),
        delivery_instructions: instructions.trim() || undefined
      });
      clearCart();
      Alert.alert('Order placed 🎉', `Order ${res.order.order_number} was received. Track it from My Orders.`, [
        { text: 'OK', onPress: () => navigation.navigate('OrderDetail', { id: res.order.id }) }
      ]);
    } catch (err) {
      setError(err instanceof GodwinshopApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Order summary</Text>
        <View style={styles.items}>
          {items.map((i) => (
            <View key={i.product_id} style={styles.itemRow}>
              <Image
                source={{ uri: resolveImageUrl(i.image_url) ?? PLACEHOLDER_IMAGE }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={1}>{i.name}</Text>
                <Text style={styles.itemMeta}>Qty {i.quantity} × {formatMoney(i.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatMoney(i.price * i.quantity)}</Text>
            </View>
          ))}
        </View>

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
        </View>

        <Text style={styles.sectionTitle}>Delivery details</Text>

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{String(error)}</Text>
          </View>
        ) : null}

        <Field
          label="Delivery address"
          value={address}
          onChangeText={setAddress}
          placeholder="Street, house number, landmark"
          multiline
        />
        <Field label="City / region (optional)" value={city} onChangeText={setCity} placeholder="City, region" />
        <Field label="Phone for delivery" value={phone} onChangeText={setPhone} placeholder="+250 7xx xxx xxx" keyboardType="phone-pad" />
        <Field
          label="Delivery instructions (optional)"
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. call on arrival, leave with the security desk…"
          multiline
        />

        <View style={styles.submit}>
          <Button title={`Place Order · ${formatMoney(total)}`} onPress={submit} loading={placing} />
        </View>
        <Text style={styles.note}>Free delivery on orders of RWF 50,000 or more.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  emptyWrap: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 18, paddingBottom: 40 },
  sectionTitle: { color: colors.fg, fontSize: 17, fontWeight: '800', marginTop: 12, marginBottom: 10 },
  items: { gap: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 10,
    gap: 10
  },
  itemImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.base2 },
  itemBody: { flex: 1 },
  itemName: { color: colors.fg, fontSize: 14, fontWeight: '600' },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  itemTotal: { color: colors.fg, fontSize: 14, fontWeight: '700' },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 14
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted, fontSize: 14 },
  summaryValue: { color: colors.fg, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 10, marginTop: 4 },
  totalLabel: { color: colors.fg, fontSize: 17, fontWeight: '800' },
  totalValue: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  alert: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  alertText: { color: colors.danger, fontSize: 13 },
  submit: { marginTop: 16 },
  note: { color: colors.muted, fontSize: 12, marginTop: 12, textAlign: 'center' }
});