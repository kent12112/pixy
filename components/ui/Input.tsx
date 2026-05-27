import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}

export function Input({ label, error, hint, suffix, prefix, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, focused && styles.focused, !!error && styles.errored]}>
        {prefix && <View style={styles.affix}>{prefix}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {suffix && <View style={styles.affix}>{suffix}</View>}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: SPACING.xs },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.dark },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: SPACING.md,
  },
  focused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  errored: { borderColor: COLORS.error },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONTS.sizes.base,
    color: COLORS.dark,
  },
  affix: { paddingHorizontal: SPACING.xs },
  error: { fontSize: FONTS.sizes.xs, color: COLORS.error },
  hint: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
});
