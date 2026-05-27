import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  showCount?: number;
}

export function StarRating({
  value,
  max = 5,
  size = 14,
  interactive = false,
  onChange,
  showCount,
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <TouchableOpacity
            key={i}
            disabled={!interactive}
            onPress={() => onChange?.(i + 1)}
            hitSlop={4}
          >
            <Text style={{ fontSize: size, color: filled ? COLORS.accent : COLORS.light }}>
              ★
            </Text>
          </TouchableOpacity>
        );
      })}
      {showCount !== undefined && (
        <Text style={[styles.count, { fontSize: size * 0.85 }]}>({showCount})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  count: { color: COLORS.muted, marginLeft: 2 },
});
