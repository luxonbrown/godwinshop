import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../theme';

export function QuantityStepper({
  quantity,
  onChange,
  max
}: {
  quantity: number;
  onChange: (q: number) => void;
  max?: number;
}) {
  const canDecrement = quantity > 1;
  const canIncrement = !max || quantity < max;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => canDecrement && onChange(quantity - 1)}
        disabled={!canDecrement}
        style={[styles.btn, !canDecrement && styles.disabled]}
        hitSlop={8}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{quantity}</Text>
      <TouchableOpacity
        onPress={() => canIncrement && onChange(quantity + 1)}
        disabled={!canIncrement}
        style={[styles.btn, !canIncrement && styles.disabled]}
        hitSlop={8}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: { color: colors.fg, fontSize: 18, fontWeight: '700' },
  value: { color: colors.fg, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  disabled: { opacity: 0.35 }
});