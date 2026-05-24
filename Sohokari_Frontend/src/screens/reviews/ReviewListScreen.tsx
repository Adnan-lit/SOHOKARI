import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp }  from '@react-navigation/native';
import { useQuery }             from '@tanstack/react-query';
import { Ionicons }             from '@expo/vector-icons';
import dayjs                    from 'dayjs';
import { reviewsApi }           from '@api/reviews';
import type { ReviewResponse }  from '@api/reviews';
import { Colors }               from '@theme/colors';
import type { RootStackParamList } from '@app-types/navigation.types';

type RoutePropType = RouteProp<RootStackParamList, 'ReviewList'>;

const CRITERIA_LABELS: Record<string, string> = {
  serviceQuality:       'Service Quality',
  communication:        'Communication',
  timeliness:           'Timeliness',
  professionalBehavior: 'Professional Behavior',
  overallSatisfaction:  'Overall Satisfaction',
};

export default function ReviewListScreen() {
  const { params } = useRoute<RoutePropType>();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', params.providerId],
    queryFn:  () => reviewsApi.getByProvider(params.providerId),
  });

  const reviews: ReviewResponse[] = data ?? [];
  const avg = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.overallSatisfaction, 0) / reviews.length).toFixed(1)
    : '0';

  const renderItem = ({ item }: { item: ReviewResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.customerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{item.customerName}</Text>
          <Text style={styles.reviewDate}>{dayjs(item.createdAt).format('DD MMM YYYY')}</Text>
        </View>
        <View style={styles.overallBox}>
          <Ionicons name="star" size={14} color={Colors.warning} />
          <Text style={styles.overallScore}>{item.overallSatisfaction}</Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        {(['serviceQuality','communication','timeliness','professionalBehavior','overallSatisfaction'] as (keyof ReviewResponse)[]).map(key => {
          const val = item[key] as number;
          if (typeof val !== 'number' || key === 'overallSatisfaction') return null;
          return (
            <View key={key as string} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{CRITERIA_LABELS[key as string]}</Text>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${(val / 5) * 100}%` as any }]} />
              </View>
              <Text style={styles.breakdownVal}>{val}</Text>
            </View>
          );
        })}
      </View>

      {item.reviewText ? <Text style={styles.reviewText}>"{item.reviewText}"</Text> : null}
    </View>
  );

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <FlatList
      data={reviews}
      keyExtractor={r => r.reviewId}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.summary}>
          <Text style={styles.avgScore}>{avg}</Text>
          <View style={styles.avgStars}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name="star" size={20} color={s <= Math.round(Number(avg)) ? Colors.warning : Colors.border} />
            ))}
          </View>
          <Text style={styles.totalText}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyText}>Reviews will appear here after completed bookings</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list:    { padding: 16, paddingBottom: 40 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 16, padding: 24, marginBottom: 16 },
  avgScore:{ fontSize: 52, fontWeight: '700', color: Colors.white },
  avgStars:{ flexDirection: 'row', gap: 4, marginTop: 6 },
  totalText:{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  card:    { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, color: Colors.white, fontWeight: '700' },
  authorName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reviewDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  overallBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  overallScore: { fontSize: 14, fontWeight: '700', color: Colors.warning },
  breakdown: { gap: 8, marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { fontSize: 12, color: Colors.textMuted, width: 130 },
  breakdownBar: { flex: 1, height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  breakdownVal: { fontSize: 12, fontWeight: '600', color: Colors.text, width: 16, textAlign: 'right' },
  reviewText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 20, borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  empty:    { alignItems: 'center', paddingTop: 48 },
  emptyTitle:{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },
});