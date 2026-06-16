import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
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
      <Image
        source={require('../../../assets/logo.jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Your trusted home service partner</Text>
      <ActivityIndicator size="small" color={Colors.accentLight} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logo:      { width: 200, height: 200, borderRadius: 24, marginBottom: 16 },
  tagline:   { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, letterSpacing: 1, fontWeight: '500' },
});