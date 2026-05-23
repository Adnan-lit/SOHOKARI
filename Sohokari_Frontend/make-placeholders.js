#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const screens = [
  ['auth',      'SplashScreen'],
  ['auth',      'LoginScreen'],
  ['auth',      'RegisterCustomerScreen'],
  ['auth',      'RegisterProviderScreen'],
  ['home',      'HomeScreen'],
  ['home',      'SearchScreen'],
  ['home',      'AIChatScreen'],
  ['providers', 'ProviderProfileScreen'],
  ['providers', 'NearbyMapScreen'],
  ['bookings',  'BookingsListScreen'],
  ['bookings',  'BookingDetailScreen'],
  ['bookings',  'CreateBookingScreen'],
  ['chat',      'ChatListScreen'],
  ['chat',      'ChatRoomScreen'],
  ['reviews',   'ReviewFormScreen'],
  ['reviews',   'ReviewListScreen'],
  ['profile',   'CustomerProfileScreen'],
  ['profile',   'ProviderDashboardScreen'],
  ['profile',   'NotificationsScreen'],
];

const base = path.join(__dirname, 'src/screens');

screens.forEach(([folder, name]) => {
  const dir  = path.join(base, folder);
  const file = path.join(dir, `${name}.tsx`);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ${name}() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>${name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FB' },
  text:      { fontSize: 20, color: '#1B3A5C', fontWeight: '600' },
});
`);
    console.log('created', file);
  }
});
