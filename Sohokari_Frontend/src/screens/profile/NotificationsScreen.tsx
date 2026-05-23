import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { notificationsApi } from "@api/chat";
import { Colors } from "@theme/colors";
import Button from "@components/common/Button";
import type { Notification } from "@app-types/models";

dayjs.extend(relativeTime);

const NOTIF_ICON: Record<string, { icon: string; color: string }> = {
  booking: { icon: "calendar", color: Colors.info },
  accepted: { icon: "checkmark-circle", color: Colors.success },
  completed: { icon: "trophy", color: Colors.accent },
  cancelled: { icon: "close-circle", color: Colors.error },
  message: { icon: "chatbubble", color: Colors.primary },
  default: { icon: "notifications", color: Colors.textMuted },
};

function getIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("accept")) return NOTIF_ICON.accepted;
  if (t.includes("complet")) return NOTIF_ICON.completed;
  if (t.includes("cancel") || t.includes("reject")) return NOTIF_ICON.cancelled;
  if (t.includes("message") || t.includes("chat")) return NOTIF_ICON.message;
  if (t.includes("booking")) return NOTIF_ICON.booking;
  return NOTIF_ICON.default;
}

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getAll,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const notifications: Notification[] = data ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  const renderItem = ({ item }: { item: Notification }) => {
    const { icon, color } = getIcon(item.title);
    return (
      <View style={[styles.item, !item.read && styles.itemUnread]}>
        <View style={[styles.iconWrap, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.read && styles.titleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasUnread && (
        <View style={styles.markAllBar}>
          <Text style={styles.markAllCount}>
            {notifications.filter((n) => !n.read).length} unread
          </Text>
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
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={56}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>
              You have no notifications right now
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  markAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  markAllCount: { fontSize: 13, color: Colors.textSecondary },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
    backgroundColor: Colors.surface,
  },
  itemUnread: { backgroundColor: "#F0F4FF" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: { flex: 1, gap: 3 },
  title: { fontSize: 14, color: Colors.text, fontWeight: "500" },
  titleUnread: { fontWeight: "700" },
  body: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  separator: { height: 0.5, backgroundColor: Colors.border },

  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
});
