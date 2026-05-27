import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, FONTS, SPACING } from '@/constants';

type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'muted';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

export function Badge({ label, color = 'primary' }: BadgeProps) {
  return (
    <View style={[styles.container, styles[`bg_${color}`]]}>
      <Text style={[styles.label, styles[`text_${color}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  label: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  bg_primary: { backgroundColor: `${COLORS.primary}20` },
  bg_success: { backgroundColor: `${COLORS.success}20` },
  bg_warning: { backgroundColor: `${COLORS.warning}20` },
  bg_error: { backgroundColor: `${COLORS.error}20` },
  bg_muted: { backgroundColor: COLORS.light },
  text_primary: { color: COLORS.primary },
  text_success: { color: COLORS.success },
  text_warning: { color: COLORS.warning },
  text_error: { color: COLORS.error },
  text_muted: { color: COLORS.muted },
});
