import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const CHAT_ROOM_POLL_MS = 3500;

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
  const { isDark, screenTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chatId, chatName, chatAvatar, initialMessage } = useLocalSearchParams();
  const chatIdValue = Array.isArray(chatId) ? chatId[0] : chatId;
  const chatNameValue = Array.isArray(chatName) ? chatName[0] : chatName;
  const chatAvatarValue = Array.isArray(chatAvatar) ? chatAvatar[0] : chatAvatar;
  const log = (..._args: any[]) => {};
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingInFlightRef = useRef(false);
  const lastMessageIdRef = useRef<number | null>(null);

  const theme = {
    bg: screenTheme.bg,
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    border: screenTheme.border,
    primary: screenTheme.primary,
  };

  const initialMessageText =
    typeof initialMessage === "string"
      ? initialMessage
      : Array.isArray(initialMessage)
        ? initialMessage[0] || ""
        : "";

  const headerAvatarUri =
    typeof chatAvatarValue === "string" && chatAvatarValue.trim()
      ? chatAvatarValue.trim()
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          chatNameValue || "User",
        )}&background=3B66F5&color=fff`;

  useEffect(() => {
    log("[chat] params", { chatId, chatIdValue, chatName });
  }, [chatId, chatIdValue, chatName]);

  const getMessageId = useCallback((msg: any) => {
    return (
      msg?.id ??
      msg?.message_id ??
      msg?.messageId ??
      msg?._id ??
      `${msg?.sent_at || ""}-${msg?.sender_id || ""}-${msg?.content || ""}`
    );
  }, []);

  const normalizeMessage = useCallback(
    (msg: any) => ({
      ...msg,
      id: getMessageId(msg),
      content: msg?.content ?? msg?.message ?? "",
    }),
    [getMessageId],
  );

  const getLastNumericMessageId = useCallback(
    (items: any[]) => {
      let maxId: number | null = null;
      items.forEach((msg) => {
        const rawId = getMessageId(msg);
        const num = Number(rawId);
        if (Number.isFinite(num)) {
          maxId = maxId === null ? num : Math.max(maxId, num);
        }
      });
      return maxId;
    },
    [getMessageId],
  );

  const mergeMessages = useCallback(
    (prev: any[], next: any[]) => {
      if (!next.length) return prev;
      const existingIds = new Set(prev.map((msg) => String(getMessageId(msg))));
      const filtered = next.filter(
        (msg) => !existingIds.has(String(getMessageId(msg))),
      );
      return [...prev, ...filtered];
    },
    [getMessageId],
  );

  const markAsRead = async (token: string) => {
    try {
      await fetch(`${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/mark-chat-as-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chat_id: chatIdValue }), // Must be POST with body
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

      log("[chat] fetchMessages", { chatId: chatIdValue });
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/get-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ chat_id: chatIdValue, limit: 50, offset: 0 }),
        },
      );

      const json = await response.json();
      log("[chat] send response", { status: json?.status });
      if (json.status) {
        const rawMessages = json.data?.messages || [];
        const normalized = rawMessages.map(normalizeMessage);
        if (normalized.length > 0) {
          const ordered = normalized.reverse();
          setMessages(ordered);
          const lastId = getLastNumericMessageId(ordered);
          if (lastId !== null) lastMessageIdRef.current = lastId;
        } else if (initialMessageText.trim()) {
          setMessages([
            {
              id: `temp-${Date.now()}`,
              content: initialMessageText.trim(),
              sender_id: user.id,
              sent_at: new Date().toISOString(),
            },
          ]);
        }
        markAsRead(user.token); // Trigger mark as read
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [chatIdValue, getLastNumericMessageId, initialMessageText, normalizeMessage]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const pollMessages = useCallback(async () => {
    if (pollingInFlightRef.current) return;
    pollingInFlightRef.current = true;
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      log("[chat] poll tick", { chatId: chatIdValue, after: lastMessageIdRef.current });
      const requestMessages = async (useAfterId: boolean) => {
        const payload: any = {
          chat_id: chatIdValue,
          limit: 50,
          offset: 0,
        };
        if (useAfterId && lastMessageIdRef.current !== null) {
          payload.after_message_id = lastMessageIdRef.current;
        }

        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/get-messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify(payload),
          },
        );
        const json = await response.json();
        log("[chat] poll response", { status: json?.status, count: json?.data?.messages?.length, usedAfterId: useAfterId });
        if (!json.status && useAfterId) {
          return requestMessages(false);
        }
        return json;
      };

      const json = await requestMessages(true);
      if (json?.status) {
        const rawMessages = json.data?.messages || [];
        if (rawMessages.length > 0) {
          const normalized = rawMessages.map(normalizeMessage);
          const ordered = normalized.reverse();
          setMessages((prev) => {
            const next = mergeMessages(prev, ordered);
            const lastId = getLastNumericMessageId(next);
            if (lastId !== null) lastMessageIdRef.current = lastId;
            return next;
          });
          markAsRead(user.token);
        }
      }
    } catch (error) {
    } finally {
      pollingInFlightRef.current = false;
    }
  }, [chatIdValue, getLastNumericMessageId, mergeMessages, normalizeMessage]);

  const startPolling = useCallback(() => {
    if (!chatIdValue) return;
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      pollMessages();
    }, CHAT_ROOM_POLL_MS);
  }, [chatIdValue, pollMessages]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const deleteChat = useCallback(async () => {
    if (!chatIdValue || deletingChat) return;

    setDeletingChat(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        router.replace("/screens/ChatItem");
        return;
      }
      const user = JSON.parse(userString);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/delete-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ chat_id: String(chatIdValue) }),
        },
      );
      const json = await response.json();

      if (response.ok && json?.status) {
        stopPolling();
        router.replace("/screens/ChatItem");
        return;
      }

      Alert.alert("Delete failed", json?.message || "Unable to delete chat.");
    } catch {
      Alert.alert("Error", "Unable to delete chat right now.");
    } finally {
      setDeletingChat(false);
    }
  }, [chatIdValue, deletingChat, router, stopPolling]);

  const handleDeleteChatPress = useCallback(() => {
    if (!chatIdValue || deletingChat) return;

    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteChat();
          },
        },
      ],
    );
  }, [chatIdValue, deleteChat, deletingChat]);

  useEffect(() => {
    if (!chatIdValue) return;
    startPolling();
    return () => {
      stopPolling();
    };
  }, [chatIdValue, startPolling, stopPolling]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (!chatIdValue) return;
      if (nextState === "active") {
        startPolling();
        pollMessages();
      } else {
        stopPolling();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [chatIdValue, pollMessages, startPolling, stopPolling]);

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
            chat_id: chatIdValue,
            content: tempMsg,
            type: "text",
          }),
        },
      );
      const json = await response.json();
      log("[chat] fetchMessages response", { status: json?.status, count: json?.data?.messages?.length });
      if (json.status) {
        const nextMessage = normalizeMessage(json.data);
        setMessages((prev) => {
          const next = [...prev, nextMessage];
          const lastId = getLastNumericMessageId(next);
          if (lastId !== null) lastMessageIdRef.current = lastId;
          return next;
        });
      }
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
          <Image source={{ uri: headerAvatarUri }} style={styles.headerAvatar} />
          <Text style={[styles.headerName, { color: theme.text }]}>
            {chatNameValue}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDeleteChatPress}
          style={styles.headerDeleteBtn}
          disabled={deletingChat}
        >
          {deletingChat ? (
            <ActivityIndicator size="small" color={theme.subText} />
          ) : (
            <Feather name="trash-2" size={19} color={theme.subText} />
          )}
        </TouchableOpacity>
      </View>
      {loading ? (
        <SkeletonLoader variant="chat" count={6} withScroll={false} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => String(item?.id ?? item?.message_id ?? index)}
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
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: "#E2E8F0",
  },
  headerName: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
  headerDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
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
