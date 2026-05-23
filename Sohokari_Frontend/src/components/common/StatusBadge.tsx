import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED:   '#EF9F27',
  ACCEPTED:    '#378ADD',
  IN_PROGRESS: '#8B5CF6',
  COMPLETED:   '#1D9E75',
  REVIEWED:    '#1D9E75',
  CANCELLED:   '#9CA3AF',
  REJECTED:    '#E24B4A',
  PENDING:     '#EF9F27',
};

interface Props { status: string; size?: 'sm' | 'md' }

export default function StatusBadge({ status, size = 'md' }: Props) {
  const color = STATUS_COLORS[status] ?? '#9CA3AF';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '60' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize: size === 'sm' ? 11 : 13 }]}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  dot:   { width: 7, height: 7, borderRadius: 4 },
  text:  { fontWeight: '600', textTransform: 'capitalize' },
});