import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore }  from '@store/authStore';
import { Colors }        from '@theme/colors';
import type { AuthNavProp } from '@app-types/navigation.types';

export default function SplashScreen() {
  const navigation   = useNavigation<AuthNavProp>();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // RootNavigator already called hydrateFromStorage — just wait then redirect
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().isLoggedIn) {
        navigation.replace('Login');
      }
      // if isLoggedIn, RootNavigator will switch to CustomerApp/ProviderApp automatically
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>সহকারী</Text>
        <Text style={styles.logoEn}>SOHOKARI</Text>
      </View>
      <Text style={styles.tagline}>Your trusted home service partner</Text>
      <ActivityIndicator size="small" color={Colors.accentLight} style={{ marginTop: 48 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoBox:   { alignItems: 'center', marginBottom: 16 },
  logo:      { fontSize: 48, color: Colors.white, fontWeight: '700', letterSpacing: 2 },
  logoEn:    { fontSize: 18, color: Colors.accentLight, fontWeight: '600', letterSpacing: 6, marginTop: 4 },
  tagline:   { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, letterSpacing: 1 },
});