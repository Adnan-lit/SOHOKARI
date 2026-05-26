import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery }      from '@tanstack/react-query';
import { Ionicons }      from '@expo/vector-icons';
import * as Location     from 'expo-location';
import { providersApi }  from '@api/providers';
import type { ProviderSummaryResponse } from '@api/providers';
import { Colors }         from '@theme/colors';
import { SERVICE_CATEGORIES, ServiceCategory, DEFAULT_LOCATION } from '@constants/config';
import ProviderCard        from '@components/common/ProviderCard';
import Button              from '@components/common/Button';
import type { RootNavProp } from '@app-types/navigation.types';

type SortBy = 'REPUTATION' | 'RATING' | 'PRICE' | 'DISTANCE';

interface Filters {
  q:         string;
  category:  ServiceCategory | null;
  minRating: number | null;
  maxPrice:  number | null;
  available: boolean;
  sortBy:    SortBy | null;
  lat?:      number;
  lng?:      number;
}

const EMPTY: Filters = { q: '', category: null, minRating: null, maxPrice: null, available: false, sortBy: null };

export default function SearchScreen() {
  const navigation = useNavigation<RootNavProp>();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState<Filters>(EMPTY);
  const [applied, setApplied]         = useState<Filters>(EMPTY);

  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters(prev => ({ ...prev, [key]: val }));

  // Get location to pass to search for distance-aware results
  const getAndApply = useCallback(async () => {
    let lat = DEFAULT_LOCATION.latitude;
    let lng = DEFAULT_LOCATION.longitude;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch {}
    const next = { ...filters, lat, lng };
    setFilters(next);
    setApplied(next);
    setShowFilters(false);
  }, [filters]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', applied],
    queryFn: () => providersApi.search({
      q:         applied.q || undefined,
      category:  applied.category ?? undefined,
      minRating: applied.minRating ?? undefined,
      maxPrice:  applied.maxPrice ?? undefined,
      available: applied.available || undefined,
      sortBy:    applied.sortBy ?? undefined,
      lat:       applied.lat,
      lng:       applied.lng,
    }),
    enabled:   !!(applied.q || applied.category),
    staleTime: 30_000,
  });

  const clearFilters = () => { setFilters(EMPTY); setApplied(EMPTY); };
  const hasActive = Boolean(applied.category || applied.minRating || applied.maxPrice || applied.available || applied.sortBy);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={filters.q}
            onChangeText={v => set('q', v)}
            onSubmitEditing={getAndApply}
            placeholder="Search by name, skill…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            autoFocus
          />
          {filters.q ? (
            <TouchableOpacity onPress={() => set('q', '')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasActive && styles.filterBtnActive]}
          onPress={() => setShowFilters(p => !p)}
        >
          <Ionicons name="options-outline" size={20} color={hasActive ? Colors.white : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.chipRow}>
            {SERVICE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, filters.category === cat.key && styles.chipActive]}
                onPress={() => set('category', filters.category === cat.key ? null : cat.key)}
              >
                <Text style={[styles.chipText, filters.category === cat.key && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Sort by</Text>
          <View style={styles.chipRow}>
            {(['REPUTATION', 'RATING', 'PRICE', 'DISTANCE'] as SortBy[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, filters.sortBy === s && styles.chipActive]}
                onPress={() => set('sortBy', filters.sortBy === s ? null : s)}
              >
                <Text style={[styles.chipText, filters.sortBy === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Min Rating</Text>
          <View style={styles.chipRow}>
            {[3, 4, 4.5].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, filters.minRating === r && styles.chipActive]}
                onPress={() => set('minRating', filters.minRating === r ? null : r)}
              >
                <Ionicons name="star" size={12} color={filters.minRating === r ? Colors.white : Colors.warning} />
                <Text style={[styles.chipText, filters.minRating === r && styles.chipTextActive]}> {r}+</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => set('available', !filters.available)}>
            <Text style={styles.filterLabel}>Available now only</Text>
            <View style={[styles.toggle, filters.available && styles.toggleOn]}>
              <View style={[styles.toggleThumb, filters.available && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          <View style={styles.filterActions}>
            <Button title="Clear" onPress={clearFilters} variant="outline" style={{ flex: 1 }} />
            <Button title="Search with location" onPress={getAndApply} style={{ flex: 2 }} />
          </View>
        </View>
      )}

      {isFetching && !data ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item: ProviderSummaryResponse) => item.providerId}
          renderItem={({ item }: { item: ProviderSummaryResponse }) => (
            <ProviderCard
              provider={item}
              onPress={() => navigation.navigate('ProviderProfile', { providerId: item.providerId })}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            data != null ? (
              <Text style={styles.resultCount}>
                {data.length} provider{data.length !== 1 ? 's' : ''} found
                {applied.lat ? ' (sorted by distance)' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            applied.q || applied.category ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>Try different keywords or clear filters</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Search for a service</Text>
                <Text style={styles.emptyText}>Type a keyword or pick a category</Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  searchRow:   { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: 44 },
  filterBtn:   { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPanel: { backgroundColor: Colors.surface, padding: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  filterLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  chipActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:    { fontSize: 13, color: Colors.text },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  toggle:      { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border, padding: 2 },
  toggleOn:    { backgroundColor: Colors.accent },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white },
  toggleThumbOn: { marginLeft: 20 },
  filterActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  list:        { padding: 16, paddingBottom: 32 },
  resultCount: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingTop: 64 },
  emptyTitle:  { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptyText:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },
});