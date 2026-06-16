import React from 'react';
import type { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@theme/colors';

interface ProviderBadgeProps {
  badge: string;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

const BADGE_CONFIG: Record<string, { label: string, icon: IconName, color: string, bg: string }> = {
  MOST_BOOKED: {
    label: 'Most Booked',
    icon: 'flame',
    color: '#E84118',
    bg: '#FAD390',
  },
  TOP_RATED: {
    label: 'Top Rated',
    icon: 'star',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  RISING_STAR: {
    label: 'Rising Star',
    icon: 'trending-up',
    color: '#8C7AE6',
    bg: '#E0E7FF',
  },
  VERIFIED: {
    label: 'Verified',
    icon: 'checkmark-circle',
    color: Colors.success,
    bg: '#E1F5EE',
  }
};

export default function ProviderBadge({ badge }: ProviderBadgeProps) {
  const config = BADGE_CONFIG[badge] || {
    label: badge.replace(/_/g, ' '),
    icon: 'medal' as IconName,
    color: Colors.primary,
    bg: Colors.primaryLight + '20',
  };

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  }
});
