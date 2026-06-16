import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import dayjs        from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { notificationsApi }          from '@api/chat';
import type { NotificationResponse } from '@api/chat';
import { Colors }                    from '@theme/colors';
import Button                        from '@components/common/Button';
import { useNavigation } from '@react-navigation/native';
import type { RootNavProp } from '@app-types/navigation.types';

dayjs.extend(relativeTime);

// Use type enum (reliable) instead of title string matching
const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  BOOKING_REQUESTED: { icon: 'time-outline',              color: Colors.warning  },
  BOOKING_ACCEPTED:  { icon: 'checkmark-circle-outline',  color: Colors.success  },
  BOOKING_REJECTED:  { icon: 'close-circle-outline',      color: Colors.error    },
  BOOKING_STARTED:   { icon: 'construct-outline',         color: Colors.info     },
  BOOKING_COMPLETED: { icon: 'trophy-outline',            color: Colors.accent   },
  NEW_MESSAGE:       { icon: 'chatbubble-outline',        color: Colors.primary  },
  REVIEW_RECEIVED:   { icon: 'star-outline',              color: Colors.warning  },
  DEFAULT:           { icon: 'notifications-outline',     color: Colors.textMuted},
};

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const navigation = useNavigation<RootNavProp>();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const notifications: NotificationResponse[] = (data as NotificationResponse[]) ?? [];
  const hasUnread = notifications.some(n => !n.read);

  // I3: Auto-mark all as read after 2 seconds of viewing
  useEffect(() => {
    if (!hasUnread) return;
    const timer = setTimeout(() => {
      markAllRead.mutate();
    }, 2000);
    return () => clearTimeout(timer);
  }, [hasUnread]);

  const handlePress = (item: NotificationResponse) => {
    if (!item.read) {
      notificationsApi.markRead(item.id).then(() => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
        qc.invalidateQueries({ queryKey: ['unreadCount'] });
      }).catch(() => {});
    }

    if (!item.referenceId) return;

    if (item.type.startsWith('BOOKING_')) {
      navigation.navigate('BookingDetail', { bookingId: item.referenceId });
    } else if (item.type === 'NEW_MESSAGE') {
      navigation.navigate('ChatRoom', { bookingId: item.referenceId, participantName: 'Chat' });
    } else if (item.type === 'REVIEW_RECEIVED') {
      navigation.navigate('ReviewList', { providerId: item.referenceId });
    }
  };

  const renderItem = ({ item }: { item: NotificationResponse }) => {
    // Use type enum for reliable icon mapping
    const { icon, color } = TYPE_ICON[item.type] ?? TYPE_ICON.DEFAULT;
    return (
      <TouchableOpacity 
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      {hasUnread && (
        <View style={styles.markAllBar}>
          <Text style={styles.markAllCount}>{notifications.filter(n => !n.read).length} unread</Text>
          <Button
            title="Mark all read"
            variant="ghost"
            onPress={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
            style={{ height: 32 }}
            textStyle={{ fontSize: 13 }}
          />
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch}
            colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No notifications right now</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markAllBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  markAllCount: { fontSize: 13, color: Colors.textSecondary },
  item:         { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12, backgroundColor: Colors.surface },
  itemUnread:   { backgroundColor: '#F0F4FF' },
  iconWrap:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content:      { flex: 1, gap: 3 },
  title:        { fontSize: 14, color: Colors.text, fontWeight: '500' },
  titleUnread:  { fontWeight: '700' },
  body:         { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  time:         { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 6 },
  separator:    { height: 0.5, backgroundColor: Colors.border },
  empty:        { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 16 },
  emptyText:    { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },
});