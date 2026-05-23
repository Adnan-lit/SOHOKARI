import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useNavigation }  from '@react-navigation/native';
import { useQuery }       from '@tanstack/react-query';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons }       from '@expo/vector-icons';
import * as Location      from 'expo-location';
import { providersApi }   from '@api/providers';
import { Colors }         from '@theme/colors';
import { DEFAULT_LOCATION, SERVICE_CATEGORIES, ServiceCategory } from '@constants/config';
import CategoryPills      from '@components/common/CategoryPills';
import type { RootNavProp } from '@types/navigation.types';

const { width, height } = Dimensions.get('window');

export default function NearbyMapScreen() {
  const navigation = useNavigation<RootNavProp>();
  const [region, setRegion]     = useState(DEFAULT_LOCATION);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: providers, isLoading } = useQuery({
    queryKey: ['nearbyProviders', region.latitude, region.longitude, category],
    queryFn:  () => providersApi.getNearby({
      lat:      region.latitude,
      lng:      region.longitude,
      radius:   10,
      category: category ?? undefined,
    }),
    staleTime: 60_000,
  });

  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setRegion(prev => ({
        ...prev,
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => { getMyLocation(); }, []);

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      ELECTRICIAN:   '#F59E0B',
      PLUMBER:       '#3B82F6',
      CLEANER:       '#10B981',
      PAINTER:       '#8B5CF6',
      CARPENTER:     '#D97706',
      AC_TECHNICIAN: '#06B6D4',
    };
    return map[cat] ?? Colors.primary;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {(providers ?? []).map(provider => (
          <Marker
            key={provider._id}
            coordinate={{
              latitude:  provider.location?.coordinates[1] ?? region.latitude,
              longitude: provider.location?.coordinates[0] ?? region.longitude,
            }}
            pinColor={provider.available ? categoryColor(provider.serviceCategory) : Colors.textMuted}
          >
            <Callout onPress={() => navigation.navigate('ProviderProfile', { providerId: provider._id })}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{provider.name}</Text>
                <Text style={styles.calloutCat}>{provider.serviceCategory.replace('_', ' ')}</Text>
                {provider.hourlyRate != null && (
                  <Text style={styles.calloutRate}>৳{provider.hourlyRate}/hr</Text>
                )}
                <Text style={styles.calloutTap}>Tap to view profile →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Category filter */}
      <View style={styles.filterOverlay}>
        <CategoryPills selected={category} onSelect={setCategory} />
      </View>

      {/* Provider count badge */}
      {!isLoading && providers && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{providers.length} providers nearby</Text>
        </View>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {/* My location button */}
      <TouchableOpacity
        style={styles.myLocBtn}
        onPress={getMyLocation}
        disabled={locating}
      >
        {locating
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : <Ionicons name="locate" size={22} color={Colors.primary} />
        }
      </TouchableOpacity>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
          <Text style={styles.legendText}>Busy</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { width, height },

  filterOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },

  countBadge: {
    position: 'absolute', top: 68, alignSelf: 'center',
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    elevation: 4,
  },
  countText: { fontSize: 12, color: Colors.white, fontWeight: '600' },

  loadingOverlay: {
    position: 'absolute', top: 68, alignSelf: 'center',
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: 10, elevation: 4,
  },

  myLocBtn: {
    position: 'absolute', bottom: 100, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },

  legend: {
    position: 'absolute', bottom: 100, left: 16,
    backgroundColor: Colors.surface, borderRadius: 10,
    padding: 10, gap: 6, elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.text },

  callout:     { width: 160, padding: 4 },
  calloutName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  calloutCat:  { fontSize: 12, color: Colors.primary, fontWeight: '500', marginBottom: 2 },
  calloutRate: { fontSize: 12, color: Colors.accent, fontWeight: '600', marginBottom: 4 },
  calloutTap:  { fontSize: 11, color: Colors.textMuted },
});