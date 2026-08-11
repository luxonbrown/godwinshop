import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function FullScreenLoader() {
  return (
    <View style={[styles.container, { backgroundColor: colors.base }]}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>GS</Text>
      </View>
      <Text style={styles.brand}>Godwinshop</Text>
      <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.base, padding: 24 },
  text: { color: colors.muted, marginTop: 12, fontSize: 14 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.base2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider
  },
  logoText: { color: colors.accent, fontSize: 28, fontWeight: '800' },
  brand: { color: colors.fg, fontSize: 22, fontWeight: '800', marginTop: 12 }
});