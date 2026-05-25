import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery }      from '@tanstack/react-query';
import { Ionicons }      from '@expo/vector-icons';
import { useAuthStore }  from '@store/authStore';
import { bookingsApi }   from '@api/bookings';
import { Colors }        from '@theme/colors';
import Button            from '@components/common/Button';
import type { RootNavProp } from '@app-types/navigation.types';

interface MenuItem {
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  label:   string;
  onPress: () => void;
  danger?: boolean;
}

export default function CustomerProfileScreen() {
  const navigation        = useNavigation<RootNavProp>();
  const { name, email, logout } = useAuthStore();

  const { data: bookings } = useQuery({
    queryKey: ['myBookings', 'ALL'],
    queryFn:  () => bookingsApi.getMy(),
    staleTime: 60_000,
  });

  const stats = {
    total:     bookings?.length ?? 0,
    completed: bookings?.filter(b => b.status === 'COMPLETED').length ?? 0,
    pending:   bookings?.filter(b => b.status === 'REQUESTED').length ?? 0,
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'calendar-outline',      label: 'My Bookings',      onPress: () => navigation.navigate('Bookings') },
    { icon: 'chatbubbles-outline',   label: 'Messages',         onPress: () => navigation.navigate('Chat') },
    { icon: 'notifications-outline', label: 'Notifications',    onPress: () => navigation.navigate('Notifications') },
    { icon: 'help-circle-outline',   label: 'Help & Support',   onPress: () => {} },
    { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => {} },
    { icon: 'log-out-outline',       label: 'Sign Out',         onPress: handleLogout, danger: true },
  ];

  const initials = name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name ?? 'Customer'}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="person" size={12} color={Colors.accent} />
          <Text style={styles.roleText}>Customer</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total',     value: stats.total     },
          { label: 'Completed', value: stats.completed },
          { label: 'Pending',   value: stats.pending   },
        ].map(({ label, value }) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statVal}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map(({ icon, label, onPress, danger }) => (
          <TouchableOpacity key={label} style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
              <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
            </View>
            <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
            {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Sohokari v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero:       { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: 32, paddingBottom: 32 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  avatarText: { fontSize: 30, color: Colors.white, fontWeight: '700' },
  name:       { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  email:      { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  roleBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  roleText:   { fontSize: 12, color: Colors.accentLight, fontWeight: '600' },

  statsRow:   { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: -20, borderRadius: 14, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  stat:       { flex: 1, alignItems: 'center' },
  statVal:    { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLabel:  { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  menu:         { backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  menuIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF0F8', alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: '#FFEBEB' },
  menuLabel:    { flex: 1, fontSize: 15, color: Colors.text },
  menuLabelDanger: { color: Colors.error },

  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 24, marginBottom: 40 },
});