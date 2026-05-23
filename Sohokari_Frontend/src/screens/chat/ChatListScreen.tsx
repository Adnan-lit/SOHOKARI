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
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { chatApi } from "@api/chat";
import { Colors } from "@theme/colors";
import type { RootNavProp } from "@app-types/navigation.types";
import type { Conversation } from "@app-types/models";

dayjs.extend(relativeTime);

export default function ChatListScreen() {
  const navigation = useNavigation<RootNavProp>();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatApi.getConversations,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const conversations: Conversation[] = data ?? [];

  const renderItem = ({ item }: { item: Conversation }) => {
    const name = item.participant?.name ?? "Unknown";
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    const lastMsg = item.lastMessage?.content ?? "";
    const time = item.lastMessage?.createdAt
      ? dayjs(item.lastMessage.createdAt).fromNow()
      : "";
    const unread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("ChatRoom", {
            bookingId: item.bookingId,
            participantName: name,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, unread && styles.nameBold]}>{name}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text
              style={[styles.preview, unread && styles.previewBold]}
              numberOfLines={1}
            >
              {lastMsg || "No messages yet"}
            </Text>
            {unread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.bookingId}
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
              name="chatbubbles-outline"
              size={56}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Chat threads appear here once a booking is accepted
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  separator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 80 },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { fontSize: 18, color: Colors.white, fontWeight: "700" },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  content: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  name: { fontSize: 15, color: Colors.text, fontWeight: "500" },
  nameBold: { fontWeight: "700" },
  time: { fontSize: 12, color: Colors.textMuted },
  preview: { fontSize: 13, color: Colors.textMuted, flex: 1, marginRight: 8 },
  previewBold: { color: Colors.text, fontWeight: "600" },

  badge: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, color: Colors.white, fontWeight: "700" },

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
    lineHeight: 20,
  },
});
