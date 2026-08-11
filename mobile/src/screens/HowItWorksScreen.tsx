import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  {
    icon: 'search-outline',
    title: 'Browse',
    text: 'Explore our catalog, search products, filter by price and pick your favourites.'
  },
  {
    icon: 'cart-outline',
    title: 'Add to cart',
    text: 'Set quantities and review your cart with clear pricing and delivery fees.'
  },
  {
    icon: 'create-outline',
    title: 'Checkout',
    text: 'Sign in (or create an account), confirm your delivery address and phone, and place the order.'
  },
  {
    icon: 'time-outline',
    title: 'Enjoy & Track',
    text: 'Follow the order status from pending to delivered. You can cancel while it is still pending.'
  }
];

export default function HowItWorksScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Ordering from Godwinshop is as easy as 1-2-3-4:
      </Text>

      {STEPS.map((step, idx) => (
        <View key={step.title} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.iconWrap}>
              <Ionicons name={step.icon as never} size={22} color={colors.accent} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>
                {idx + 1}. {step.title}
              </Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Good to know</Text>
        <Text style={styles.bullet}>• Free delivery on orders of RWF 50,000 or more.</Text>
        <Text style={styles.bullet}>• New accounts must verify their email before placing orders.</Text>
        <Text style={styles.bullet}>• <Text style={styles.highlight}>Pending</Text> orders can be cancelled from the order page.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.base2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBody: { flex: 1 },
  stepTitle: { color: colors.fg, fontSize: 16, fontWeight: '800' },
  stepText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 4 },
  cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  bullet: { color: colors.muted, fontSize: 14, lineHeight: 24 },
  highlight: { color: colors.accent, fontWeight: '700' }
});