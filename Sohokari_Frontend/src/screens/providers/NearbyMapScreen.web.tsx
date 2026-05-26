import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@theme/colors';
import EmptyState from '@components/common/EmptyState';

export default function NearbyMapScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="map-outline"
        title="Map Unavailable on Web"
        description="The interactive map is only available on our iOS and Android mobile apps."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
