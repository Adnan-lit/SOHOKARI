import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '@theme/colors';
import { DEFAULT_LOCATION } from '@constants/config';
import Button from '@components/common/Button';
import type { RootStackParamList } from '@app-types/navigation.types';

const { width, height } = Dimensions.get('window');

type LocationPickerRouteProp = RouteProp<RootStackParamList, 'LocationPicker'>;

export default function LocationPickerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<LocationPickerRouteProp>();
  const { returnScreen, currentLat, currentLng } = route.params;

  const [region, setRegion] = useState({
    latitude: currentLat || DEFAULT_LOCATION.latitude,
    longitude: currentLng || DEFAULT_LOCATION.longitude,
  });
  
  const [isLocating, setIsLocating] = useState(false);
  const webViewRef = React.useRef<WebView>(null);

  const getMyLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const newRegion = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setRegion(newRegion);
      webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_CENTER', ...newRegion }));
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!currentLat || !currentLng) {
      getMyLocation();
    }
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'REGION_CHANGE') {
        setRegion({ latitude: data.latitude, longitude: data.longitude });
      }
    } catch (e) {}
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            #map { width: 100vw; height: 100vh; }
            .center-marker {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -100%);
              z-index: 1000;
              pointer-events: none;
            }
            .center-marker svg { width: 40px; height: 40px; fill: #E84C3D; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4)); }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div class="center-marker">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <script>
            var map = L.map('map', { zoomControl: false }).setView([${region.latitude}, ${region.longitude}], 16);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            map.on('moveend', function() {
                var center = map.getCenter();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'REGION_CHANGE',
                    latitude: center.lat,
                    longitude: center.lng
                }));
            });
            
            var messageHandler = function(event) {
                try {
                    var data = JSON.parse(event.data);
                    if (data.type === 'SET_CENTER') {
                        map.setView([data.latitude, data.longitude], 16);
                    }
                } catch(e) {}
            };
            
            document.addEventListener('message', messageHandler);
            window.addEventListener('message', messageHandler);
        </script>
    </body>
    </html>
  `;

  const handleConfirm = () => {
    navigation.navigate(returnScreen, { pickedLocation: region });
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: htmlContent }}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
      />

      <TouchableOpacity style={styles.myLocBtn} onPress={getMyLocation} disabled={isLocating}>
        {isLocating ? <ActivityIndicator size="small" color={Colors.primary} /> : <Ionicons name="locate" size={24} color={Colors.primary} />}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.coordinatesText}>
          Lat: {region.latitude.toFixed(5)}, Lng: {region.longitude.toFixed(5)}
        </Text>
        <Button title="Confirm Location" onPress={handleConfirm} style={styles.confirmBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { width, flex: 1 },
  myLocBtn: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  coordinatesText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmBtn: {
    width: '100%',
  },
});
