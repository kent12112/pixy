import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

export default function ClientProfileScreen() {
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={72} />
          <View>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.role}>📷 Client account</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuRow}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Sign Out"
          variant="outline"
          onPress={confirmLogout}
          style={styles.logoutBtn}
        />
        <Text style={styles.version}>Pixy v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const MENU_ITEMS = [
  { icon: '✏️', label: 'Edit Profile' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '💳', label: 'Payment Methods' },
  { icon: '🔒', label: 'Privacy & Security' },
  { icon: '❓', label: 'Help & Support' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { padding: SPACING.base, gap: SPACING.lg },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    padding: SPACING.base,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: BORDER_RADIUS.xl,
  },
  name: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  email: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  role: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  section: { gap: 2 },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.dark },
  menuArrow: { fontSize: 20, color: COLORS.muted },
  logoutBtn: { marginTop: SPACING.md },
  version: { textAlign: 'center', fontSize: FONTS.sizes.xs, color: COLORS.muted },
});
