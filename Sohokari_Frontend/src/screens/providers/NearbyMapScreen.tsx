import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, FlatList, Animated, PanResponder, TextInput,
} from 'react-native';
import { useNavigation }  from '@react-navigation/native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons }       from '@expo/vector-icons';
import * as Location      from 'expo-location';
import { Client }         from '@stomp/stompjs';
import { providersApi }   from '@api/providers';
import type { ProviderSummaryResponse } from '@api/providers';
import { Colors }         from '@theme/colors';
import { DEFAULT_LOCATION, ServiceCategory, WS_URL } from '@constants/config';
import CategoryPills      from '@components/common/CategoryPills';
import ProviderCard       from '@components/common/ProviderCard';
import { useAuthStore }   from '@store/authStore';
import type { RootNavProp } from '@app-types/navigation.types';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Bottom Sheet snap points ────────────────────────────────────────────
const SNAP_COLLAPSED = 90;
const SNAP_HALF = SCREEN_HEIGHT * 0.42;
const SNAP_FULL = SCREEN_HEIGHT * 0.82;

// ── Category marker colors & icons ──────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICIAN: '#F59E0B', PLUMBER: '#3B82F6', CLEANER: '#10B981',
  BUA: '#EC4899', AC_CLEANER: '#06B6D4', REPAIRMAN: '#D97706',
  TECHNICIAN: '#8B5CF6', OTHER: '#6B7280',
};

const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICIAN: '⚡', PLUMBER: '🔧', CLEANER: '🧹',
  BUA: '🏠', AC_CLEANER: '❄️', REPAIRMAN: '🔨',
  TECHNICIAN: '💻', OTHER: '🔵',
};

export default function NearbyMapScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { token } = useAuthStore();

  // ── State ──────────────────────────────────────────────────────────────
  const [myLocation, setMyLocation] = useState(DEFAULT_LOCATION);
  const [mapCenter, setMapCenter] = useState(DEFAULT_LOCATION);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [maxRate, setMaxRate] = useState<number | undefined>();
  const [radius, setRadius] = useState(10);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [providers, setProviders] = useState<ProviderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPanned, setHasPanned] = useState(false);
  const [isOffCenter, setIsOffCenter] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const stompRef = useRef<Client | null>(null);
  const isRecenteringRef = useRef(false);

  // ── Bottom Sheet Animated ──────────────────────────────────────────────
  const sheetHeight = useRef(new Animated.Value(SNAP_COLLAPSED)).current;
  const lastSheetH = useRef(SNAP_COLLAPSED);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const newH = Math.max(SNAP_COLLAPSED, Math.min(lastSheetH.current - g.dy, SNAP_FULL));
        sheetHeight.setValue(newH);
      },
      onPanResponderRelease: (_, g) => {
        const cur = lastSheetH.current - g.dy;
        const snaps = [SNAP_COLLAPSED, SNAP_HALF, SNAP_FULL];
        let nearest = snaps[0];
        let minDist = Infinity;
        for (const s of snaps) {
          if (Math.abs(cur - s) < minDist) { minDist = Math.abs(cur - s); nearest = s; }
        }
        if (g.vy < -0.5) { nearest = snaps.find(s => s > cur) ?? nearest; }
        else if (g.vy > 0.5) { nearest = [...snaps].reverse().find(s => s < cur) ?? nearest; }
        lastSheetH.current = nearest;
        Animated.spring(sheetHeight, { toValue: nearest, useNativeDriver: false, damping: 20, stiffness: 200 }).start();
      },
    })
  ).current;

  // ── Fetch providers using Advanced Search API ──────────────────────────
  const fetchProviders = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const data = await providersApi.search({
        latitude: lat,
        longitude: lng,
        maxDistanceKm: radius,
        category: category ?? undefined,
        minRating,
        maxHourlyRate: maxRate,
        keyword: keyword.trim() || undefined,
      });
      setProviders(data);
      // Push updated markers to WebView
      webViewRef.current?.postMessage(JSON.stringify({ type: 'UPDATE_PROVIDERS', providers: data }));
    } catch (_) {
      // Silently ignore search errors
    } finally {
      setLoading(false);
      setHasPanned(false);
    }
  }, [radius, category, minRating, maxRate]);

  // ── Get my location on mount ───────────────────────────────────────────
  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(prev => ({ ...prev, ...coords }));
      setMapCenter(prev => ({ ...prev, ...coords }));
      setIsOffCenter(false);
      setHasPanned(false);
      // Use FLY_TO for smooth animation; set flag to suppress REGION_CHANGE
      isRecenteringRef.current = true;
      webViewRef.current?.postMessage(JSON.stringify({ type: 'RECENTER', ...coords }));
      // Clear the flag after the animation completes (~1.2s)
      setTimeout(() => { isRecenteringRef.current = false; }, 1500);
      fetchProviders(coords.latitude, coords.longitude);
    } finally { setLocating(false); }
  };

  useEffect(() => { getMyLocation(); }, []);

  // Re-fetch when filters change (using current map center)
  useEffect(() => {
    if (mapCenter.latitude !== DEFAULT_LOCATION.latitude) {
      fetchProviders(mapCenter.latitude, mapCenter.longitude);
    }
  }, [category, minRating, maxRate, radius]);

  // ── WebView message handler ────────────────────────────────────────────
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NAVIGATE' && data.providerId) {
        navigation.navigate('ProviderProfile', { providerId: data.providerId });
      } else if (data.type === 'REGION_CHANGE') {
        // Ignore region changes triggered by our own recenter animation
        if (isRecenteringRef.current) return;
        const newCenter = { latitude: data.latitude, longitude: data.longitude };
        setMapCenter(prev => ({ ...prev, ...newCenter }));
        setHasPanned(true);
        setIsOffCenter(true);
      }
    } catch (e) {}
  };

  // ── "Search This Area" handler ─────────────────────────────────────────
  const handleSearchThisArea = () => {
    fetchProviders(mapCenter.latitude, mapCenter.longitude);
  };

  // ── Snap map to provider when tapped in list ───────────────────────────
  const handleListItemPress = (provider: ProviderSummaryResponse) => {
    if (provider.latitude && provider.longitude) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'FLY_TO', latitude: provider.latitude, longitude: provider.longitude,
      }));
    }
    navigation.navigate('ProviderProfile', { providerId: provider.providerId });
  };

  // ── WebSocket: Live Tracking ───────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/provider-locations', (message) => {
          try {
            const loc = JSON.parse(message.body);
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'LIVE_UPDATE',
              providerId: loc.providerId,
              latitude: loc.latitude,
              longitude: loc.longitude,
            }));
          } catch (e) {}
        });
      },
      onStompError: () => {},
    });
    client.activate();
    stompRef.current = client;

    return () => { client.deactivate(); };
  }, [token]);

  // ── Leaflet HTML with MarkerCluster + Live Update support ──────────────
  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
        <style>
            body { margin: 0; padding: 0; font-family: -apple-system, system-ui, sans-serif; }
            #map { width: 100vw; height: 100vh; }
            .custom-marker {
              border-radius: 50%; width: 20px; height: 20px;
              border: 2.5px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              transition: transform 0.2s;
            }
            .custom-marker:hover { transform: scale(1.2); }
            .leaflet-popup-content { margin: 10px 14px; }
            .popup-name { font-weight: 700; font-size: 14px; margin-bottom: 3px; color: #1E293B; }
            .popup-cat { color: #3B82F6; font-size: 12px; font-weight: 500; margin-bottom: 2px; }
            .popup-rating { font-size: 12px; color: #F59E0B; margin-bottom: 2px; }
            .popup-rate { color: #10B981; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
            .popup-btn {
              width: 100%; background: linear-gradient(135deg, #3B82F6, #2563EB);
              color: white; border: none; padding: 8px; border-radius: 8px;
              font-weight: 600; font-size: 13px; cursor: pointer;
            }
            /* Cluster styles */
            .marker-cluster-small { background-color: rgba(59,130,246,0.3); }
            .marker-cluster-small div { background-color: rgba(59,130,246,0.7); color: white; font-weight: 700; }
            .marker-cluster-medium { background-color: rgba(245,158,11,0.3); }
            .marker-cluster-medium div { background-color: rgba(245,158,11,0.7); color: white; font-weight: 700; }
            .marker-cluster-large { background-color: rgba(239,68,68,0.3); }
            .marker-cluster-large div { background-color: rgba(239,68,68,0.7); color: white; font-weight: 700; }
            .my-location-pulse {
              border: 3px solid rgba(59,130,246,0.4);
              border-radius: 50%;
              animation: pulse 2s ease-out infinite;
            }
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
              70% { box-shadow: 0 0 0 15px rgba(59,130,246,0); }
              100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var CATEGORY_COLORS = ${JSON.stringify(CATEGORY_COLORS)};
            var CATEGORY_ICONS = ${JSON.stringify(CATEGORY_ICONS)};
            var map = L.map('map', { zoomControl: false }).setView([${myLocation.latitude}, ${myLocation.longitude}], 14);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);

            // My location marker with pulse effect
            var myIcon = L.divIcon({
                className: '',
                html: '<div class="my-location-pulse" style="width:16px;height:16px;background:#3B82F6;border-radius:50%;"></div>',
                iconSize: [22, 22], iconAnchor: [11, 11]
            });
            var myLocationMarker = L.marker([${myLocation.latitude}, ${myLocation.longitude}], { icon: myIcon, zIndexOffset: 1000 }).addTo(map);

            // MarkerCluster group
            var clusterGroup = L.markerClusterGroup({
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                disableClusteringAtZoom: 17,
            });
            map.addLayer(clusterGroup);

            var markerMap = {}; // providerId -> marker (for live updates)

            function renderMarkers(data) {
                clusterGroup.clearLayers();
                markerMap = {};
                data.forEach(function(p) {
                    if(!p.latitude || !p.longitude) return;
                    var color = p.isAvailable ? (CATEGORY_COLORS[p.serviceCategory] || '#3B82F6') : '#9CA3AF';
                    var emoji = CATEGORY_ICONS[p.serviceCategory] || '🔵';
                    var icon = L.divIcon({
                        className: '',
                        html: '<div class="custom-marker" style="background-color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:12px;">' + emoji + '</div>',
                        iconSize: [28, 28], iconAnchor: [14, 14]
                    });
                    var marker = L.marker([p.latitude, p.longitude], { icon: icon });

                    var stars = '';
                    if (p.averageRating) {
                        stars = '★ ' + p.averageRating.toFixed(1) + ' (' + (p.totalReviews || 0) + ')';
                    }

                    var popupHtml = '<div class="popup-name">' + (p.name || 'Provider') + '</div>' +
                                    '<div class="popup-cat">' + (p.serviceCategory || '').replace(/_/g, ' ') + '</div>' +
                                    (stars ? '<div class="popup-rating">' + stars + '</div>' : '') +
                                    (p.hourlyRate ? '<div class="popup-rate">৳' + p.hourlyRate + '/hr</div>' : '') +
                                    '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'NAVIGATE\\', providerId:\\'' + p.providerId + '\\'}))" >View Profile →</button>';

                    marker.bindPopup(popupHtml);
                    clusterGroup.addLayer(marker);
                    markerMap[p.providerId] = marker;
                });
            }

            // Initial render
            renderMarkers(${JSON.stringify(providers || [])});

            // Debounced region change — only fires event, no auto-fetch
            var moveTimer = null;
            map.on('moveend', function() {
                clearTimeout(moveTimer);
                moveTimer = setTimeout(function() {
                    var center = map.getCenter();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'REGION_CHANGE',
                        latitude: center.lat,
                        longitude: center.lng
                    }));
                }, 300);
            });

            // Message handler from React Native
            var messageHandler = function(event) {
                try {
                    var data = JSON.parse(event.data);
                    if (data.type === 'UPDATE_PROVIDERS') {
                        renderMarkers(data.providers);
                    } else if (data.type === 'SET_CENTER') {
                        myLocationMarker.setLatLng([data.latitude, data.longitude]);
                        map.setView([data.latitude, data.longitude], 14);
                    } else if (data.type === 'RECENTER') {
                        myLocationMarker.setLatLng([data.latitude, data.longitude]);
                        map.flyTo([data.latitude, data.longitude], 14, { duration: 1.2 });
                    } else if (data.type === 'FLY_TO') {
                        map.flyTo([data.latitude, data.longitude], 16, { duration: 1 });
                    } else if (data.type === 'LIVE_UPDATE') {
                        // Move existing marker smoothly
                        if (markerMap[data.providerId]) {
                            markerMap[data.providerId].setLatLng([data.latitude, data.longitude]);
                        }
                    }
                } catch(e) {}
            };

            document.addEventListener('message', messageHandler);
            window.addEventListener('message', messageHandler);
        </script>
    </body>
    </html>
  `, [myLocation.latitude, myLocation.longitude, providers]);

  return (
    <View style={styles.container}>
      {/* ── Map ──────────────────────────────────────────────────────── */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: htmlContent }}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
      />

      {/* ── Category Filter Overlay ──────────────────────────────────── */}
      <View style={styles.filterOverlay}>
        {/* I7: Search bar on map */}
        <View style={styles.mapSearchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.mapSearchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Search providers…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => fetchProviders(mapCenter.latitude, mapCenter.longitude)}
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); fetchProviders(mapCenter.latitude, mapCenter.longitude); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <CategoryPills selected={category} onSelect={setCategory} />
      </View>

      {/* ── "Search This Area" Button ────────────────────────────────── */}
      {hasPanned && (
        <TouchableOpacity style={styles.searchAreaBtn} onPress={handleSearchThisArea} activeOpacity={0.85}>
          <Ionicons name="search" size={15} color={Colors.white} />
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      {/* ── Filter Button ────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fabFilter, showFilters && styles.fabFilterActive]}
        onPress={() => setShowFilters(p => !p)}
      >
        <Ionicons name="options-outline" size={20} color={showFilters ? Colors.white : Colors.primary} />
      </TouchableOpacity>

      {/* ── Advanced Filters Panel ────────────────────────────────────── */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Filters</Text>

          <Text style={styles.filterLabel}>Min Rating</Text>
          <View style={styles.chipRow}>
            {[3, 4, 4.5].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, minRating === r && styles.chipActive]}
                onPress={() => setMinRating(minRating === r ? undefined : r)}
              >
                <Ionicons name="star" size={12} color={minRating === r ? Colors.white : Colors.warning} />
                <Text style={[styles.chipText, minRating === r && styles.chipTextActive]}> {r}+</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Max Rate (৳/hr)</Text>
          <View style={styles.chipRow}>
            {[300, 500, 1000].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, maxRate === r && styles.chipActive]}
                onPress={() => setMaxRate(maxRate === r ? undefined : r)}
              >
                <Text style={[styles.chipText, maxRate === r && styles.chipTextActive]}>≤ ৳{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Radius</Text>
          <View style={styles.chipRow}>
            {[5, 10, 25].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, radius === r && styles.chipActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={[styles.chipText, radius === r && styles.chipTextActive]}>{r} km</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.clearFiltersBtn}
            onPress={() => { setMinRating(undefined); setMaxRate(undefined); setRadius(10); setShowFilters(false); }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Provider Count Badge ─────────────────────────────────────── */}
      {!loading && providers.length > 0 && !showFilters && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{providers.length} providers nearby</Text>
        </View>
      )}

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {/* ── Recenter / My Location FAB ────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.myLocBtn, isOffCenter && styles.myLocBtnActive]}
        onPress={getMyLocation}
        disabled={locating}
      >
        {locating
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Ionicons name="navigate" size={20} color={isOffCenter ? Colors.white : Colors.primary} />
        }
      </TouchableOpacity>

      {/* ── Legend ────────────────────────────────────────────────────── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Available</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} /><Text style={styles.legendText}>Busy</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>You</Text></View>
      </View>

      {/* ── Bottom Sheet ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        <View style={styles.sheetHandle} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>
            {providers.length} Provider{providers.length !== 1 ? 's' : ''} Nearby
          </Text>
        </View>
        <FlatList
          data={providers}
          keyExtractor={(item) => item.providerId}
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={() => handleListItemPress(item)}
              compact
            />
          )}
          contentContainerStyle={styles.sheetList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          ListEmptyComponent={
            <View style={styles.emptySheet}>
              <Ionicons name="map-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptySheetText}>No providers in this area</Text>
              <Text style={styles.emptySheetSub}>Try panning the map or changing filters</Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  map:            { width, height: SCREEN_HEIGHT },

  // Category filter
  filterOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },

  // I7: Map search bar
  mapSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, height: 40,
  },
  mapSearchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },

  // Search This Area
  searchAreaBtn:  {
    position: 'absolute', top: 60, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 11,
    elevation: 8, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  searchAreaText: { fontSize: 14, color: Colors.white, fontWeight: '700', letterSpacing: 0.3 },

  // Provider count badge
  countBadge:     { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(30,41,59,0.85)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, elevation: 4 },
  countText:      { fontSize: 12, color: Colors.white, fontWeight: '600' },

  // Loading
  loadingOverlay: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: Colors.surface, borderRadius: 20, padding: 10, elevation: 4 },

  // My location / recenter button
  myLocBtn:       {
    position: 'absolute', right: 16,
    bottom: SNAP_COLLAPSED + 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6,
  },
  myLocBtnActive: {
    backgroundColor: Colors.accent,
  },

  // Filter FAB
  fabFilter:      {
    position: 'absolute', right: 16,
    bottom: SNAP_COLLAPSED + 72,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  fabFilterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  // Filter Panel
  filterPanel: {
    position: 'absolute', right: 16, left: 16,
    bottom: SNAP_COLLAPSED + 130,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
  },
  filterTitle:    { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  filterLabel:    { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: 13, color: Colors.text, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  clearFiltersBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.error },
  clearFiltersText: { fontSize: 13, color: Colors.error, fontWeight: '600' },

  // Legend
  legend:         {
    position: 'absolute', left: 16,
    bottom: SNAP_COLLAPSED + 16,
    backgroundColor: Colors.surface, borderRadius: 10, padding: 10, gap: 5,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendText:     { fontSize: 11, color: Colors.text },

  // Bottom Sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 8,
    overflow: 'hidden',
  },
  sheetHandle: {
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  handleBar:    { width: 40, height: 5, borderRadius: 3, backgroundColor: Colors.textMuted, marginBottom: 6 },
  sheetTitle:   { fontSize: 14, fontWeight: '700', color: Colors.text },
  sheetList:    { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
  emptySheet:   { alignItems: 'center', paddingTop: 24, gap: 8 },
  emptySheetText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  emptySheetSub: { fontSize: 12, color: Colors.textMuted },
});