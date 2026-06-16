import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation }  from '@react-navigation/native';
import { useQuery }       from '@tanstack/react-query';
import { Ionicons }       from '@expo/vector-icons';
import * as Location      from 'expo-location';
import { useAuthStore }   from '@store/authStore';
import { providersApi }   from '@api/providers';
import type { ProviderSummaryResponse } from '@api/providers';
import { Colors }         from '@theme/colors';
import { DEFAULT_LOCATION, ServiceCategory } from '@constants/config';
import ProviderCard       from '@components/common/ProviderCard';
import CategoryPills      from '@components/common/CategoryPills';
import EmptyState         from '@components/common/EmptyState';
import Skeleton           from '@components/common/Skeleton';
import { useI18n }        from '@store/i18n';
import type { CustomerTabNavProp } from '@app-types/navigation.types';

export default function HomeScreen() {
  const navigation        = useNavigation<CustomerTabNavProp>();
  const { name, logout }  = useAuthStore();
  const [category, setCat]= useState<ServiceCategory | null>(null);
  const [coords, setCoords] = useState(DEFAULT_LOCATION);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['nearbyProviders', coords.latitude, coords.longitude, category],
    queryFn:  () => providersApi.getNearby({ lat: coords.latitude, lng: coords.longitude, radius: 10, category: category ?? undefined }),
    staleTime: 60_000,
  });

  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    } catch {}
  }, []);

  // Auto-fetch user's real location on mount
  useEffect(() => { getLocation(); }, [getLocation]);
  const { t } = useI18n();
  const providers: ProviderSummaryResponse[] = data ?? [];
  const greeting = name ? `${t('home.greeting')}, ${name.split(' ')[0]} 👋` : `${t('home.greeting')} 👋`;

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subGreeting}>{t('home.subGreeting')}</Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('NearbyMap')}>
          <Ionicons name="map-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.aiBanner} onPress={() => navigation.navigate('AIChat')} activeOpacity={0.85}>
        <View style={styles.aiLeft}>
          <Text style={styles.aiTitle}>🤖 AI Assistant</Text>
          <Text style={styles.aiSub}>Describe your problem in Bangla or English</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.white} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Categories</Text>
      <CategoryPills selected={category} onSelect={setCat} />

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {category ? `${category.replace('_', ' ')} Providers` : 'Nearby Providers'}
          {providers.length > 0 ? ` (${providers.length})` : ''}
        </Text>
        {/* <TouchableOpacity onPress={getLocation} style={styles.locationBtn}>
          <Ionicons name="locate-outline" size={16} color={Colors.accent} />
          <Text style={styles.locationText}>Update location</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {renderHeader()}
        <View style={{ paddingHorizontal: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row' }}>
              <Skeleton width={52} height={52} borderRadius={26} />
              <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
                <Skeleton width="60%" height={16} style={{ marginBottom: 10 }} />
                <Skeleton width="40%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={providers}
      keyExtractor={item => item.providerId}
      renderItem={({ item }) => (
        <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderProfile', { providerId: item.providerId })} />
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <EmptyState 
          icon="search-outline" 
          title="No providers found" 
          description="Try a different category or increase search radius" 
        />
      }
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  topBar: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting:    { fontSize: 20, fontWeight: '700', color: Colors.white },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn:   { paddingVertical: 4, paddingHorizontal: 8 },
  logoutText:  { fontSize: 12, color: Colors.white, fontWeight: '600' },
  notifBtn:    { padding: 6 },
  searchWrap:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: -20, marginBottom: 16 },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, height: 48, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  searchPlaceholder: { fontSize: 14, color: Colors.textMuted, flex: 1 },
  mapBtn:      { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  aiBanner:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 20, backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14 },
  aiLeft:      { flex: 1 },
  aiTitle:     { fontSize: 15, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  aiSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8, marginTop: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: '700', color: Colors.text, paddingHorizontal: 16, marginBottom: 10, marginTop: 16 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:{ fontSize: 12, color: Colors.accent },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  empty:       { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptyText:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});