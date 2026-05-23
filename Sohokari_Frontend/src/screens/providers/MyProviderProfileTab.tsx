import React from 'react';
import { useAuthStore }        from '@store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors }              from '@theme/colors';

// Lazy import so the actual screen code is shared
import ProviderProfileScreen   from '@screens/providers/ProviderProfileScreen';

/**
 * Thin wrapper used in ProviderNavigator's Profile tab.
 * Injects the logged-in provider's own userId as the providerId param,
 * so ProviderProfileScreen (which expects route.params.providerId) works
 * as both a tab screen AND a shared stack screen.
 */
export default function MyProviderProfileTab() {
  const { userId } = useAuthStore();

  if (!userId) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>;
  }

  // Fake the route params that ProviderProfileScreen expects
  const fakeRoute = { params: { providerId: userId } } as any;
  return <ProviderProfileScreen route={fakeRoute} navigation={undefined as any} />;
}