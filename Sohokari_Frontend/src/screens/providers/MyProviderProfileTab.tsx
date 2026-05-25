import React from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery }      from '@tanstack/react-query';
import { Ionicons }      from '@expo/vector-icons';
import { providersApi }  from '@api/providers';
import { reviewsApi }    from '@api/reviews';
import type { ReviewResponse } from '@api/reviews';
import { Colors }        from '@theme/colors';
import Button            from '@components/common/Button';
import type { RootNavProp } from '@app-types/navigation.types';

/**
 * Provider's own profile tab.
 * Uses GET /providers/me (authenticated) — avoids the userId vs providerId mismatch.
 * AuthResponse has no providerId field, so we cannot use getById(userId).
 */
export default function MyProviderProfileTab() {
  const navigation = useNavigation<RootNavProp>();

  const { data: provider, isLoading } = useQuery({
    queryKey: ['myProviderProfile'],
    queryFn:  providersApi.getMyProfile,
    staleTime: 60_000,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', provider?.providerId],
    queryFn:  () => reviewsApi.getByProvider(provider!.providerId),
    enabled:  !!provider?.providerId,
  });

  if (isLoading || !provider) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const avg = provider.averageRating ?? 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{provider.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{provider.name}</Text>
        <View style={styles.catBadge}>
          <Text style={styles.catText}>{provider.serviceCategory.replace('_', ' ')}</Text>
        </View>
        <View style={styles.availRow}>
          <View style={[styles.dot, { backgroundColor: provider.isAvailable ? Colors.success : Colors.error }]} />
          <Text style={[styles.availText, { color: provider.isAvailable ? Colors.success : Colors.error }]}>
            {provider.isAvailable ? 'Available Now' : 'Currently Busy'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{avg > 0 ? avg.toFixed(1) : '—'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{provider.totalCompletedBookings ?? 0}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{provider.totalReviews ?? 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      {/* About */}
      {provider.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{provider.bio}</Text>
        </View>
      ) : null}

      {/* Skills */}
      {provider.skills && provider.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.chipRow}>
            {provider.skills.map((s, i) => (
              <View key={i} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
            ))}
          </View>
        </View>
      )}

      {/* Verification */}
      {(provider.nidVerified || provider.tradeLicenseVerified) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <View style={styles.chipRow}>
            {provider.nidVerified && (
              <View style={[styles.chip, { backgroundColor: '#E1F5EE' }]}>
                <Text style={[styles.chipText, { color: Colors.success }]}>✓ NID Verified</Text>
              </View>
            )}
            {provider.tradeLicenseVerified && (
              <View style={[styles.chip, { backgroundColor: '#E1F5EE' }]}>
                <Text style={[styles.chipText, { color: Colors.success }]}>✓ Trade License</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Badges */}
      {provider.badges && provider.badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.chipRow}>
            {provider.badges.map((b, i) => (
              <View key={i} style={styles.badge}><Text style={styles.badgeText}>🏅 {b}</Text></View>
            ))}
          </View>
        </View>
      )}

      {/* Reputation link */}
      <View style={styles.section}>
        <Button
          title="View Full Reputation"
          variant="outline"
          onPress={() => navigation.navigate('ProviderProfile', { providerId: provider.providerId })}
        />
      </View>

      {/* Recent reviews */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>My Reviews</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ReviewList', { providerId: provider.providerId })}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {reviews && reviews.length > 0 ? (
          reviews.slice(0, 3).map((r: ReviewResponse) => (
            <View key={r.reviewId} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{r.customerName}</Text>
                <Text style={styles.reviewScore}>⭐ {r.overallSatisfaction}/5</Text>
              </View>
              {r.reviewText ? <Text style={styles.reviewText}>{r.reviewText}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>No reviews yet</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero:      { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  avatar:    { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  avatarText:{ fontSize: 32, color: Colors.white, fontWeight: '700' },
  name:      { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 8 },
  catBadge:  { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 10 },
  catText:   { fontSize: 13, color: Colors.white, fontWeight: '600' },
  availRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 13, fontWeight: '600' },
  statsRow:  { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: -20, borderRadius: 14, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  stat:      { flex: 1, alignItems: 'center', gap: 4 },
  statVal:   { fontSize: 18, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDivider:{ width: 1, backgroundColor: Colors.border },
  section:    { backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:{ fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  viewAll:    { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  bioText:    { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { backgroundColor: '#EBF0F8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipText:   { fontSize: 13, color: Colors.primaryLight, fontWeight: '500' },
  badge:      { backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText:  { fontSize: 12, color: Colors.warning, fontWeight: '600' },
  reviewCard: { borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: 12, marginTop: 8 },
  reviewHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewAuthor:{ fontSize: 13, fontWeight: '600', color: Colors.text },
  reviewScore: { fontSize: 12, color: Colors.warning },
  reviewText:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  noReviews:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});