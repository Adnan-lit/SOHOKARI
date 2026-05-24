import React, { useState, useRef } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { aiApi } from "@api/ai";
import { Colors } from "@theme/colors";
import ProviderCard from "@components/common/ProviderCard";
import type { RootNavProp } from "@app-types/navigation.types";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  providers?: any[];
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: 'Hello! I am your Sohokari AI assistant. Tell me what service you need — in Bangla or English.\n\nExample: "আমার বাথরুমের পাইপ লিক করছে" or "I need an electrician urgently"',
};

export default function AIChatScreen() {
  const navigation = useNavigation<RootNavProp>();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    try {
      let lat = 23.8103,
        lng = 90.4125;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {}

      const res = await aiApi.chat({
        message: text,
        latitude: lat,
        longitude: lng,
        sessionId,
      });
      setSessionId(res.sessionId);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: res.reply,
        providers: res.suggestedProviders,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Sorry, I had trouble responding. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgWrap, isUser ? styles.msgRight : styles.msgLeft]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
        )}
        <View style={{ maxWidth: "80%" }}>
          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleBot,
            ]}
          >
            <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
              {item.text}
            </Text>
          </View>
          {item.providers && item.providers.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {item.providers.map((p) => (
                <ProviderCard
                  key={p.providerId}
                  provider={p}
                  compact
                  onPress={() =>
                    navigation.navigate("ProviderProfile", {
                      providerId: p.providerId,
                    })
                  }
                />
              ))}
            </View>
          )}
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
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles.typingWrap}>
          <View style={styles.botAvatar}>
            <Text>🤖</Text>
          </View>
          <View style={styles.typing}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>AI is thinking…</Text>
          </View>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type in Bangla or English…"
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 8 },

  msgWrap: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
    gap: 8,
  },
  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },

  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  botAvatarText: { fontSize: 16 },

  bubble: { borderRadius: 16, padding: 12 },
  bubbleBot: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextUser: { color: Colors.white },

  typingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingText: { fontSize: 12, color: Colors.textMuted },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
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
});