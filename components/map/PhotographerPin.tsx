import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { PhotographerProfile } from '@/types';
import { etaMinutes } from '@/hooks/useNearbyPhotographers';
import { COLORS, BORDER_RADIUS, FONTS } from '@/constants';

interface Props {
  photographer: PhotographerProfile;
  selected?: boolean;
  onPress: () => void;
}

export function PhotographerPin({ photographer, selected = false, onPress }: Props) {
  const { user } = photographer;

  return (
    <Marker
      coordinate={{ latitude: photographer.latitude, longitude: photographer.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={[styles.pin, selected && styles.pinSelected]}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>
              {user?.full_name?.charAt(0) ?? '?'}
            </Text>
          </View>
        )}
        <View>
          <Text style={[styles.eta, selected && styles.etaSelected]}>
            ~{photographer.distance_km != null ? etaMinutes(photographer.distance_km) : '?'} min
          </Text>
          <Text style={[styles.price, selected && styles.priceSelected]}>
            ${photographer.base_price}
          </Text>
        </View>
        {photographer.is_available && <View style={styles.dot} />}
      </View>
      <View style={[styles.tail, selected && styles.tailSelected]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pinSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  avatar: { width: 26, height: 26, borderRadius: 13 },
  avatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  eta: { fontSize: 10, fontWeight: '800', color: COLORS.success },
  etaSelected: { color: COLORS.white },
  price: { fontSize: 10, color: COLORS.muted },
  priceSelected: { color: `${COLORS.white}cc` },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    position: 'absolute',
    top: -2,
    right: -2,
  },
  tail: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.white,
    marginTop: -1,
  },
  tailSelected: { borderTopColor: COLORS.primary },
});
