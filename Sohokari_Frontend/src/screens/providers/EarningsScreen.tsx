import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { providersApi } from '@api/providers';
import { Colors } from '@theme/colors';

export default function EarningsScreen() {
  const { data: earnings, isLoading, isError } = useQuery({
    queryKey: ['providerEarnings'],
    queryFn: providersApi.getEarnings,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !earnings) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load earnings.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings Dashboard</Text>
        <Text style={styles.subtitle}>Track your performance and income</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={32} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.label}>Total Earnings</Text>
          <Text style={styles.amount}>৳{earnings.totalEarnings.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Recent Earnings</Text>
          <Text style={styles.amountSmall}>৳{earnings.recentEarnings.toLocaleString()}</Text>
          <Text style={styles.hint}>This Month</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Completed Jobs</Text>
          <Text style={styles.amountSmall}>{earnings.totalCompleted}</Text>
          <Text style={styles.hint}>All Time</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Hourly Rate</Text>
        <Text style={styles.amountSmall}>৳{earnings.hourlyRate}/hr</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  halfCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
