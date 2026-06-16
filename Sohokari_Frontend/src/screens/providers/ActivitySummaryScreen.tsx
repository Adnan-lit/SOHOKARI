import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { providersApi } from '@api/providers';
import { Colors } from '@theme/colors';

export default function ActivitySummaryScreen() {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['activitySummary'],
    queryFn: () => providersApi.getActivitySummary(),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load activity summary.</Text>
      </View>
    );
  }

  const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Summary</Text>
        <Text style={styles.subtitle}>Your performance at a glance</Text>
      </View>

      <View style={styles.grid}>
        <StatCard title="Total Bookings" value={summary.totalBookings} icon="calendar-outline" color={Colors.primary} />
        <StatCard title="Completed" value={summary.completedBookings} icon="checkmark-circle-outline" color={Colors.success} />
        <StatCard title="Pending" value={summary.pendingBookings} icon="time-outline" color={Colors.warning} />
        <StatCard title="Cancelled" value={summary.cancelledBookings} icon="close-circle-outline" color={Colors.error} />
        <StatCard title="Reviews Given" value={summary.reviewsGiven} icon="chatbubble-outline" color={Colors.accent} />
        <StatCard title="Reviews Received" value={summary.reviewsReceived} icon="star-outline" color="#F59E0B" />
        <StatCard title="Avg Rating" value={summary.averageRating.toFixed(1)} icon="star" color="#F59E0B" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'column',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  cardTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
});
