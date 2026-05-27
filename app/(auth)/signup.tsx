import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';
import type { UserRole } from '@/types';

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, fullName.trim(), role);
      // AuthGate redirects after session is established
    } catch (err: any) {
      Alert.alert('Signup failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Pixy — free forever</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            <RoleOption
              label="I want photos"
              emoji="🤳"
              desc="Book photographers on demand"
              selected={role === 'client'}
              onPress={() => setRole('client')}
            />
            <RoleOption
              label="I'm a photographer"
              emoji="📷"
              desc="Earn money doing what you love"
              selected={role === 'photographer'}
              onPress={() => setRole('photographer')}
            />
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              autoCapitalize="words"
              error={errors.fullName}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureTextEntry
              error={errors.password}
            />
          </View>

          <Button label="Create Account" onPress={handleSignup} loading={loading} size="lg" style={styles.btn} />

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleOption({ label, emoji, desc, selected, onPress }: {
  label: string; emoji: string; desc: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.roleOption, selected && styles.roleSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{label}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, padding: SPACING['2xl'], gap: SPACING.lg },
  back: { marginBottom: SPACING.sm },
  backIcon: { fontSize: 24, color: COLORS.dark },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.muted, marginTop: -SPACING.sm },
  roleRow: { flexDirection: 'row', gap: SPACING.sm },
  roleOption: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.light,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  roleSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}08` },
  roleEmoji: { fontSize: 28 },
  roleLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textAlign: 'center' },
  roleLabelSelected: { color: COLORS.primary },
  roleDesc: { fontSize: FONTS.sizes.xs, color: COLORS.muted, textAlign: 'center' },
  form: { gap: SPACING.md },
  btn: { marginTop: SPACING.sm },
  switchText: { textAlign: 'center', color: COLORS.muted, fontSize: FONTS.sizes.base },
});
