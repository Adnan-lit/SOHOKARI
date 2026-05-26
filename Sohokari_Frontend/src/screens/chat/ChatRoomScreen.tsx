import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Client } from "@stomp/stompjs";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { chatApi } from "@api/chat";
import { getToken } from "@api/client";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@theme/colors";
import { WS_URL } from "@constants/config";
import type { RootStackParamList } from "@app-types/navigation.types";
import type { ChatMessageResponse } from "@api/chat";

type RoutePropType = RouteProp<RootStackParamList, "ChatRoom">;

export default function ChatRoomScreen() {
  const { params } = useRoute<RoutePropType>();
  const { userId } = useAuthStore();
  const qc = useQueryClient();
  const listRef = useRef<FlatList>(null);
  const stompRef = useRef<Client | null>(null);

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  // Load existing messages (poll every 3s on web since WS is skipped)
  const { isLoading, data: initialMessages } = useQuery({
    queryKey: ["messages", params.bookingId],
    queryFn: () => chatApi.getMessages(params.bookingId),
    refetchInterval: Platform.OS === 'web' ? 3000 : false,
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // Listen for foreground push notifications to trigger chat reload
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.type === "NEW_MESSAGE" && data?.bookingId === params.bookingId) {
        qc.invalidateQueries({ queryKey: ["messages", params.bookingId] });
      }
    });
    return () => subscription.remove();
  }, [params.bookingId, qc]);

  // WebSocket connection
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let client: Client;

    const connect = async () => {
      const token = await getToken();
      if (!token) return;

      client = new Client({
        brokerURL: WS_URL,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        debug: (str) => console.log('STOMP DEBUG:', str),
        onWebSocketError: (evt) => console.error('STOMP WS ERROR:', evt),
        onStompError: (frame) => console.error('STOMP ERROR FRAME:', frame.headers['message'], frame.body),
        onConnect: () => {
          setConnected(true);
          client.subscribe(`/user/queue/messages`, (frame) => {
            try {
              const msg: ChatMessageResponse = JSON.parse(frame.body);
              if (msg.bookingId === params.bookingId) {
                setMessages((prev) => [...prev, msg]);
                setTimeout(
                  () => listRef.current?.scrollToEnd({ animated: true }),
                  100,
                );
              }
            } catch {}
          });
        },
        onDisconnect: () => setConnected(false),
      });

      client.activate();
      stompRef.current = client;
    };

    connect();
    return () => {
      stompRef.current?.deactivate();
    };
  }, [params.bookingId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    try {
      if (stompRef.current?.connected) {
        stompRef.current.publish({
          destination: "/app/chat.send",
          body: JSON.stringify({
            bookingId: params.bookingId,
            content: text,
            messageType: "TEXT",
            receiverId: params.receiverId ?? "",
          }),
        });
        // Optimistic update
        const optimistic: ChatMessageResponse = {
          messageId: `tmp-${Date.now()}`,
          bookingId: params.bookingId,
          senderId: userId ?? "",
          receiverId: params.receiverId ?? "",
          content: text,
          messageType: "TEXT",
          sentAt: new Date().toISOString(),
          senderName: "Me",
          read: true,
        };
        setMessages((prev) => [...prev, optimistic]);
      } else {
        // REST fallback
        const msg = await chatApi.sendMessage({
          bookingId: params.bookingId,
          receiverId: params.receiverId ?? "",
          content: text,
          messageType: "TEXT",
        });
        setMessages((prev) => [...prev, msg]);
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
    } finally {
      setSending(false);
    }
  }, [input, sending, params.bookingId, userId]);

  const renderMessage = ({ item }: { item: ChatMessageResponse }) => {
    const isMe = item.senderId === userId;
    return (
      <View
        style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}
      >
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {params.participantName.charAt(0)}
            </Text>
          </View>
        )}
        <View
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
        >
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {dayjs(item.sentAt).format("HH:mm")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Connection status */}
      {!connected && Platform.OS !== "web" && (
        <View style={styles.connecting}>
          <ActivityIndicator size="small" color={Colors.white} />
          <Text style={styles.connectingText}>Connecting…</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.messageId}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      {/* Input row */}
      <SafeAreaView edges={["bottom"]} style={styles.inputSafeArea}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  connecting: {
    backgroundColor: Colors.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
  },
  connectingText: { fontSize: 12, color: Colors.white, fontWeight: "600" },

  list: { padding: 16, paddingBottom: 8 },

  msgRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowLeft: { justifyContent: "flex-start" },
  msgRowRight: { justifyContent: "flex-end" },

  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  msgAvatarText: { fontSize: 12, color: Colors.white, fontWeight: "700" },

  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  bubbleTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: "right",
  },
  bubbleTimeMe: { color: "rgba(255,255,255,0.6)" },

  inputSafeArea: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: Colors.surface,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: Colors.textMuted },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
});