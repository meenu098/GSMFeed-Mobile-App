import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const MessageBubble = ({ item, theme, isDark, currentUserId }: any) => {
  const isMine = item.sender_id === currentUserId;
  const time = item.sent_at ? format(parseISO(item.sent_at), "HH:mm") : "";

  return (
    <View style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}>
      {isMine ? (
        <LinearGradient
          colors={["#3B66F5", "#A855F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.bubble, styles.myBubble]}
        >
          <Text style={styles.messageTextMine}>{item.content}</Text>
          <Text style={styles.messageTimeMine}>{time}</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.bubble,
            styles.theirBubble,
            { backgroundColor: isDark ? theme.card : "#FFFFFF" },
          ]}
        >
          <Text style={[styles.messageText, { color: theme.text }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, { color: theme.subText }]}>
            {time}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function IndividualChatScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chatId, chatName } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
  };

  const markAsRead = async (token: string) => {
    try {
      await fetch(`${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/mark-chat-as-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chat_id: chatId }), // Must be POST with body
      });
    } catch (e) {
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      setCurrentUserId(user.id);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/get-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ chat_id: chatId, limit: 50, offset: 0 }),
        },
      );

      const json = await response.json();
      if (json.status) {
        setMessages(json.data.messages.reverse());
        markAsRead(user.token); // Trigger mark as read
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userString = await AsyncStorage.getItem("user");
    const user = JSON.parse(userString!);
    const tempMsg = inputText;
    setInputText("");

    try {
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/new-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            chat_id: chatId,
            content: tempMsg,
            type: "text",
          }),
        },
      );
      const json = await response.json();
      if (json.status) setMessages((prev) => [...prev, json.data]);
    } catch (e) {
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerUser}>
          <Text style={[styles.headerName, { color: theme.text }]}>
            {chatName}
          </Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => (
            <MessageBubble
              item={item}
              theme={theme}
              isDark={isDark}
              currentUserId={currentUserId}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View
          style={[
            styles.inputWrapper,
            {
              paddingBottom: insets.bottom + 15,
              borderTopColor: theme.border,
              backgroundColor: theme.bg,
            },
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Message..."
              placeholderTextColor={theme.subText}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSendMessage}
          >
            <Ionicons name="arrow-up" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: { paddingRight: 10 },
  headerUser: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: "700" },
  listContent: { padding: 15 },
  messageRow: { flexDirection: "row", marginBottom: 12, gap: 10 },
  myRow: { justifyContent: "flex-end" },
  theirRow: { justifyContent: "flex-start" },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: "80%",
  },
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4 },
  messageTextMine: { fontSize: 15, color: "#FFF" },
  messageText: { fontSize: 15 },
  messageTimeMine: {
    fontSize: 9,
    marginTop: 4,
    textAlign: "right",
    color: "rgba(255,255,255,0.7)",
  },
  messageTime: { fontSize: 9, marginTop: 4, textAlign: "right" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  input: { fontSize: 15, paddingVertical: 8 },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
