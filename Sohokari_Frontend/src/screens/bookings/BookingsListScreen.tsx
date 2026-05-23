import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation }       from '@react-navigation/native';
import { useQuery }            from '@tanstack/react-query';
import { Ionicons }            from '@expo/vector-icons';
import dayjs                   from 'dayjs';
import { bookingsApi }         from '@api/bookings';
import { useAuthStore }        from '@store/authStore';
import { Colors }              from '@theme/colors';
import { BOOKING_STATUSES, BookingStatus } from '@constants/config';
import StatusBadge             from '@components/common/StatusBadge';
import type { RootNavProp }    from '@app-types/navigation.types';
import type { BookingResponse } from '@api/bookings';

const STATUS_TABS: (BookingStatus | 'ALL')[] = [
  'ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
];

export default function BookingsListScreen() {
  const navigation    = useNavigation<RootNavProp>();
  const { role }      = useAuthStore();
  const [tab, setTab] = useState<BookingStatus | 'ALL'>('ALL');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['myBookings', tab],
    queryFn:  () => bookingsApi.getMy(tab === 'ALL' ? undefined : tab),
    staleTime: 15_000,
  });

  const bookings: BookingResponse[] = data ?? [];

  const renderItem = ({ item }: { item: BookingResponse }) => {
    // Backend returns flat fields: customerName, providerName
    const otherName = role === 'PROVIDER' ? item.customerName : item.providerName;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.bookingId })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name="construct-outline" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.cardCat}>{item.serviceCategory.replace('_', ' ')}</Text>
              <Text style={styles.cardOther}>{otherName}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {item.scheduledDate ? dayjs(item.scheduledDate).format('DD MMM YYYY') : '—'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {item.scheduledTime ? String(item.scheduledTime).substring(0, 5) : '—'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={STATUS_TABS}
        horizontal
        keyExtractor={s => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, tab === item && styles.tabActive]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.tabBar}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.bookingId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch}
              colors={[Colors.primary]} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>
                {tab === 'ALL' ? 'Your bookings will appear here'
                  : `No ${tab.replace('_', ' ').toLowerCase()} bookings`}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar:    { backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border, flexGrow: 0 },
  tabs:      { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:   { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.white, fontWeight: '600' },
  list:      { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF0F8', alignItems: 'center', justifyContent: 'center' },
  cardCat:    { fontSize: 14, fontWeight: '600', color: Colors.text },
  cardOther:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardFooter: { gap: 6 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:   { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptyText:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },
});