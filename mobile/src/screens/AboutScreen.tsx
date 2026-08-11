import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.hero}>
        Godwinshop <Text style={styles.heroAccent}>—</Text>
        <Text style={styles.heroSub}> delivered.</Text>
      </Text>
      <Text style={styles.title}>Shop smarter. Order easily. Get it delivered.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Who we are</Text>
        <Text style={styles.paragraph}>
          Godwinshop is an online clothing store built to make shopping simple. We bring you quality products with a
          checkout-to-doorstep experience — browse, order, and track your delivery from one place, whether on the web
          or on Android.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What we offer</Text>
        <Text style={styles.bullet}>• A curated catalog with clear prices and discounts</Text>
        <Text style={styles.bullet}>• Secure sign-in with order history for every customer</Text>
        <Text style={styles.bullet}>• Real-time order status updates until delivery</Text>
        <Text style={styles.bullet}>• Admin-managed products, stock and notifications</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order statuses</Text>
        <Text style={styles.paragraph}>
          Pending → Confirmed → Processing → Ready for Delivery → Out for Delivery → Delivered. You can cancel while
          an order is still pending.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  content: { padding: 20, paddingBottom: 40 },
  hero: { color: colors.fg, fontSize: 28, fontWeight: '800' },
  heroAccent: { color: colors.accent },
  heroSub: { color: colors.muted, fontWeight: '600' },
  title: { color: colors.fg, fontSize: 18, fontWeight: '700', marginTop: 6, marginBottom: 18, lineHeight: 26 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14
  },
  cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  paragraph: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  bullet: { color: colors.muted, fontSize: 14, lineHeight: 24 }
});