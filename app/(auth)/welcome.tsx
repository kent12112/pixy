import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>📸</Text>
        </View>
        <Text style={styles.brand}>pixy</Text>
        <Text style={styles.tagline}>Professional photographers,{'\n'}wherever you are.</Text>
      </View>

      {/* Feature bullets */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <Button
          label="Get Started"
          variant="primary"
          size="lg"
          onPress={() => router.push('/(auth)/signup')}
          style={styles.ctaBtn}
        />
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>
            Already have an account?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '🗺️', text: 'See photographers near you on a live map' },
  { icon: '⚡', text: 'Book instantly — like Uber for photos' },
  { icon: '📷', text: 'Get your photos delivered in minutes' },
  { icon: '💰', text: 'Photographers set their own prices' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, paddingHorizontal: SPACING['2xl'] },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 44 },
  brand: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: FONTS.sizes.lg,
    textAlign: 'center',
    color: COLORS.muted,
    lineHeight: 28,
  },
  features: { gap: SPACING.md, marginBottom: SPACING['2xl'] },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: { fontSize: 22, width: 32 },
  featureText: { fontSize: FONTS.sizes.base, color: COLORS.dark, flex: 1 },
  ctas: { gap: SPACING.md, paddingBottom: SPACING['2xl'] },
  ctaBtn: { width: '100%' },
  loginLink: { textAlign: 'center', color: COLORS.muted, fontSize: FONTS.sizes.base },
});
