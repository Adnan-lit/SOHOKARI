import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors }   from '@theme/colors';
import type { ProviderSummaryResponse } from '@api/providers';

interface Props {
  provider: ProviderSummaryResponse;
  onPress:  () => void;
  compact?: boolean;
}

export default function ProviderCard({ provider, onPress, compact }: Props) {
  const rating   = provider.averageRating ?? 0;
  const distance = provider.distanceKm != null
    ? provider.distanceKm < 1
      ? `${(provider.distanceKm * 1000).toFixed(0)} m`
      : `${provider.distanceKm.toFixed(1)} km`
    : null;

  const scale = useSharedValue(1);
  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (compact) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable style={styles.compact} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <View style={styles.compactAvatar}>
            <Text style={styles.avatarText}>{provider.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.compactName} numberOfLines={1}>{provider.name}</Text>
            <Text style={styles.compactCat}>{provider.serviceCategory.replace('_', ' ')}</Text>
          </View>
          <View style={styles.compactRight}>
            <View style={[styles.dot, { backgroundColor: provider.isAvailable ? Colors.success : Colors.textMuted }]} />
            {rating > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color={Colors.warning} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
      <Pressable style={styles.card} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{provider.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
            <View style={styles.catRow}>
              <View style={styles.catBadge}>
                <Text style={styles.catText}>{provider.serviceCategory.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.availBadge, { backgroundColor: provider.isAvailable ? '#D1FAE5' : '#F1F5F9' }]}>
                <View style={[styles.dot, { backgroundColor: provider.isAvailable ? Colors.success : Colors.textMuted }]} />
                <Text style={[styles.availText, { color: provider.isAvailable ? Colors.success : Colors.textSecondary }]}>
                  {provider.isAvailable ? 'Available' : 'Busy'}
                </Text>
              </View>
            </View>
          </View>
          {provider.hourlyRate != null && (
            <View style={styles.priceBox}>
              <Text style={styles.priceAmount}>৳{provider.hourlyRate}</Text>
              <Text style={styles.priceUnit}>/hr</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              {provider.totalCompletedBookings != null && (
                <Text style={styles.reviewCount}> ({provider.totalCompletedBookings} jobs)</Text>
              )}
            </View>
          )}
          {distance && (
            <View style={styles.distRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.distText}>{distance} away</Text>
            </View>
          )}
          {provider.serviceArea ? (
            <View style={styles.distRow}>
              <Ionicons name="map-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.distText} numberOfLines={1}>{provider.serviceArea}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  header:      { flexDirection: 'row', alignItems: 'flex-start' },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 22, color: Colors.white, fontWeight: '700' },
  name:        { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  catRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  catBadge:    { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catText:     { fontSize: 11, color: Colors.primaryLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  availBadge:  { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 5 },
  availText:   { fontSize: 11, fontWeight: '700' },
  dot:         { width: 6, height: 6, borderRadius: 3 },
  priceBox:    { alignItems: 'flex-end', marginLeft: 8 },
  priceAmount: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  priceUnit:   { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  footer:      { flexDirection: 'row', gap: 14, marginTop: 14, flexWrap: 'wrap', paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText:  { fontSize: 14, color: Colors.text, fontWeight: '700' },
  reviewCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  distRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distText:    { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  compact:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, gap: 12, elevation: 2, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  compactAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  compactName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  compactCat:  { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  compactRight:{ alignItems: 'flex-end', gap: 6 },
});