import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, statusColors } from '../theme';

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = statusColors[status] ?? statusColors.inactive;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  text: { fontSize: 12, fontWeight: '700' }
});