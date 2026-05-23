import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useNavigation }           from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons }                from '@expo/vector-icons';
import Toast                       from 'react-native-toast-message';
import { useAuthStore }            from '@store/authStore';
import { providersApi }            from '@api/providers';
import { bookingsApi }             from '@api/bookings';
import { Colors }                  from '@theme/colors';
import StatusBadge                 from '@components/common/StatusBadge';
import Button                      from '@components/common/Button';
import type { RootNavProp }        from '@types/navigation.types';

export default function ProviderDashboardScreen() {
  const navigation          = useNavigation<RootNavProp>();
  const { name, email, userId, logout } = useAuthStore();
  const qc                  = useQueryClient();

  const { data: bookings } = useQuery({
    queryKey: ['myBookings', 'ALL'],
    queryFn:  () => bookingsApi.getMy(),
    staleTime: 30_000,
  });

  const { data: provider } = useQuery({
    queryKey: ['provider', userId],
    queryFn:  () => providersApi.getById(userId!),
    enabled:  !!userId,
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: providersApi.toggleAvailability,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['provider', userId] });
      Toast.show({ type: 'success', text1: provider?.available ? 'You are now Busy' : 'You are now Available' });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: e.message }),
  });

  const stats = {
    total:      bookings?.length ?? 0,
    pending:    bookings?.filter(b => b.status === 'PENDING').length ?? 0,
    active:     bookings?.filter(b => b.status === 'IN_PROGRESS').length ?? 0,
    completed:  bookings?.filter(b => b.status === 'COMPLETED').length ?? 0,
  };

  const recentBookings = (bookings ?? []).slice(0, 3);
  const initials = name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name ?? 'Provider'}</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.category}>{provider?.serviceCategory?.replace('_', ' ') ?? ''}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Availability toggle */}
        <View style={styles.availRow}>
          <View>
            <Text style={styles.availTitle}>Availability</Text>
            <Text style={styles.availSub}>
              {provider?.available ? 'You are visible to customers' : 'You are hidden from customers'}
            </Text>
          </View>
          <Switch
            value={provider?.available ?? false}
            onValueChange={() => toggleMutation.mutate()}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: Colors.accent }}
            thumbColor={Colors.white}
            disabled={toggleMutation.isPending}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Jobs',  value: stats.total,     color: Colors.primary  },
          { label: 'Pending',     value: stats.pending,   color: Colors.warning  },
          { label: 'In Progress', value: stats.active,    color: Colors.info     },
          { label: 'Completed',   value: stats.completed, color: Colors.success  },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.statCard}>
            <Text style={[styles.statVal, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Rating */}
      {(provider?.rating ?? 0) > 0 && (
        <View style={styles.ratingCard}>
          <Ionicons name="star" size={20} color={Colors.warning} />
          <Text style={styles.ratingVal}>{provider!.rating!.toFixed(1)}</Text>
          <Text style={styles.ratingLabel}>Average Rating</Text>
          <Text style={styles.ratingCount}>({provider?.totalReviews ?? 0} reviews)</Text>
          <TouchableOpacity
            style={styles.viewRepBtn}
            onPress={() => navigation.navigate('ProviderProfile', { providerId: userId! })}
          >
            <Text style={styles.viewRepText}>View full reputation</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      )}

      {/* Pending bookings */}
      {stats.pending > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{stats.pending}</Text>
            </View>
          </View>
          {recentBookings
            .filter(b => b.status === 'PENDING')
            .map(booking => (
              <TouchableOpacity
                key={booking._id}
                style={styles.bookingRow}
                onPress={() => navigation.navigate('BookingDetail', { bookingId: booking._id })}
              >
                <View style={styles.bookingIcon}>
                  <Ionicons name="construct-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingCat}>{booking.serviceCategory.replace('_', ' ')}</Text>
                  <Text style={styles.bookingAddr} numberOfLines={1}>{booking.address}</Text>
                </View>
                <StatusBadge status={booking.status} size="sm" />
              </TouchableOpacity>
            ))}
          <Button
            title="View All Bookings"
            variant="outline"
            onPress={() => {}}
            style={{ marginTop: 8 }}
          />
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'create-outline',   label: 'Edit Profile',    onPress: () => {} },
            { icon: 'map-outline',      label: 'Update Location', onPress: () => {} },
            { icon: 'star-outline',     label: 'My Reviews',      onPress: () => navigation.navigate('ReviewList', { providerId: userId! }) },
            { icon: 'bar-chart-outline',label: 'Activity',        onPress: () => {} },
          ].map(({ icon, label, onPress }) => (
            <TouchableOpacity key={label} style={styles.actionBtn} onPress={onPress}>
              <View style={styles.actionIcon}>
                <Ionicons name={icon as any} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero:    { backgroundColor: Colors.primary, padding: 20, paddingTop: 24, paddingBottom: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar:  { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 22, color: Colors.white, fontWeight: '700' },
  name:     { fontSize: 18, fontWeight: '700', color: Colors.white },
  email:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  category: { fontSize: 12, color: Colors.accentLight, marginTop: 3, fontWeight: '600' },
  logoutBtn:{ padding: 4 },

  availRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14 },
  availTitle:{ fontSize: 14, fontWeight: '600', color: Colors.white, marginBottom: 2 },
  availSub:  { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard:  { flex: 1, minWidth: '44%', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statVal:   { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  ratingCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  ratingVal:  { fontSize: 20, fontWeight: '700', color: Colors.text },
  ratingLabel:{ fontSize: 13, color: Colors.textSecondary },
  ratingCount:{ fontSize: 12, color: Colors.textMuted, flex: 1 },
  viewRepBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewRepText:{ fontSize: 12, color: Colors.accent, fontWeight: '600' },

  section:       { backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: Colors.text },
  pendingBadge:  { backgroundColor: Colors.warning, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText: { fontSize: 12, color: Colors.white, fontWeight: '700' },

  bookingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  bookingIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBF0F8', alignItems: 'center', justifyContent: 'center' },
  bookingCat:  { fontSize: 13, fontWeight: '600', color: Colors.text },
  bookingAddr: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionBtn:   { flex: 1, minWidth: '44%', alignItems: 'center', gap: 8, backgroundColor: Colors.background, borderRadius: 12, padding: 16 },
  actionIcon:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF0F8', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, color: Colors.text, fontWeight: '500', textAlign: 'center' },
});