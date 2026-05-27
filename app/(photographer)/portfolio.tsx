import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PhotographerProfile, Service } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, SPECIALTIES } from '@/constants';

const { width } = Dimensions.get('window');
const IMG = (width - SPACING.base * 2 - SPACING.sm * 2) / 3;

export default function PortfolioScreen() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Edit state
  const [bio, setBio] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  async function loadProfile() {
    const { data: p } = await supabase
      .from('photographer_profiles')
      .select('*, services(*)')
      .eq('user_id', user!.id)
      .single();
    if (p) {
      setProfile(p as any);
      setServices(((p as any).services ?? []) as Service[]);
      setBio((p as any).bio ?? '');
      setBasePrice(String((p as any).base_price ?? 50));
      setSelectedSpecialties((p as any).specialties ?? []);
    }
    setLoading(false);
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('photographer_profiles')
      .update({ bio, base_price: parseFloat(basePrice) || 50, specialties: selectedSpecialties })
      .eq('id', profile.id);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('✅ Profile updated!');
    setSaving(false);
  }

  async function pickAndUploadPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    setUploading(true);
    const newUrls: string[] = [];
    for (const asset of result.assets) {
      const ext = asset.uri.split('.').pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('portfolio').upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('portfolio').getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }

    const updatedUrls = [...(profile?.portfolio_urls ?? []), ...newUrls];
    await supabase.from('photographer_profiles').update({ portfolio_urls: updatedUrls }).eq('id', profile!.id);
    setProfile((p) => p ? { ...p, portfolio_urls: updatedUrls } : p);
    setUploading(false);
  }

  async function removePhoto(url: string) {
    const updated = profile!.portfolio_urls.filter((u) => u !== url);
    await supabase.from('photographer_profiles').update({ portfolio_urls: updated }).eq('id', profile!.id);
    setProfile((p) => p ? { ...p, portfolio_urls: updated } : p);
  }

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>My Profile & Portfolio</Text>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Input
            value={bio}
            onChangeText={setBio}
            placeholder="Tell clients about yourself, your style, and what makes your photos special…"
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />
        </View>

        {/* Base price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Price ($ / hour)</Text>
          <Input
            value={basePrice}
            onChangeText={setBasePrice}
            keyboardType="numeric"
            placeholder="50"
            prefix={<Text style={styles.dollar}>$</Text>}
          />
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.tagGrid}>
            {SPECIALTIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.tagChip, selectedSpecialties.includes(s) && styles.tagChipActive]}
                onPress={() => toggleSpecialty(s)}
              >
                <Text style={[styles.tagLabel, selectedSpecialties.includes(s) && styles.tagLabelActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button label={saving ? 'Saving…' : 'Save Changes'} onPress={saveProfile} loading={saving} />

        {/* Portfolio photos */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Portfolio Photos</Text>
            <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploading}>
              <Text style={styles.addPhoto}>{uploading ? 'Uploading…' : '+ Add Photos'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {(profile?.portfolio_urls ?? []).map((url) => (
              <View key={url} style={styles.photoWrap}>
                <Image source={{ uri: url }} style={[styles.photo, { width: IMG, height: IMG }]} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(url)}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {(profile?.portfolio_urls ?? []).length === 0 && (
            <TouchableOpacity style={styles.addPhotoPlaceholder} onPress={pickAndUploadPhoto}>
              <Text style={styles.addPhotoEmoji}>📸</Text>
              <Text style={styles.addPhotoText}>Tap to add portfolio photos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} onToggle={async () => {
              await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
              setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
            }} />
          ))}
          <TouchableOpacity style={styles.addService} onPress={() => Alert.alert('Add service', 'Service editor coming soon!')}>
            <Text style={styles.addServiceLabel}>+ Add Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceRow({ service, onToggle }: { service: Service; onToggle: () => void }) {
  return (
    <View style={styles.serviceRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceMeta}>${service.price} · {service.duration_min} min</Text>
      </View>
      <Switch
        value={service.is_active}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.light, true: `${COLORS.success}60` }}
        thumbColor={service.is_active ? COLORS.success : COLORS.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: SPACING.base, gap: SPACING.lg },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark },
  section: { gap: SPACING.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  bioInput: { minHeight: 90, textAlignVertical: 'top' } as any,
  dollar: { fontSize: FONTS.sizes.base, color: COLORS.muted },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tagChip: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.light },
  tagChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  tagLabel: { fontSize: FONTS.sizes.sm, color: COLORS.muted, fontWeight: '500' },
  tagLabelActive: { color: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoWrap: { position: 'relative' },
  photo: { borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.light },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeIcon: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  addPhoto: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  addPhotoPlaceholder: { borderWidth: 2, borderColor: COLORS.light, borderStyle: 'dashed', borderRadius: BORDER_RADIUS.xl, padding: SPACING['2xl'], alignItems: 'center', gap: SPACING.sm },
  addPhotoEmoji: { fontSize: 32 },
  addPhotoText: { fontSize: FONTS.sizes.base, color: COLORS.muted },
  serviceRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.light, borderRadius: BORDER_RADIUS.lg },
  serviceName: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.dark },
  serviceMeta: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  addService: { padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.lg, borderStyle: 'dashed', alignItems: 'center' },
  addServiceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
});
