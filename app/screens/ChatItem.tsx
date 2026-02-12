import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, isToday, parseISO } from "date-fns";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ViewToken,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

interface Chat {
  id: string;
  chat_name: string;
  chat_avatar: string | null;
  unread_messages: number;
  last_message?: {
    id?: string | number;
    content?: string;
    sent_at?: string;
    sender_id?: number;
  };
  members: any[];
  created_at: string;
}

const CHAT_LIST_POLL_MS = 8000;

const ChatItem = ({ item, theme, currentUserId }: any) => {
  const router = useRouter();

  // Logic to determine chat name for 1-on-1 vs Group
  const displayChatName =
    item.chat_name ||
    item.members?.find((m: any) => m.id !== currentUserId)?.name ||
    "Chat";

  const sentAt = item.last_message?.sent_at || item.created_at;
  let displayDate = "";

  if (sentAt) {
    try {
      const chatDate = parseISO(sentAt);
      displayDate = isToday(chatDate)
        ? format(chatDate, "HH:mm")
        : format(chatDate, "MMM dd");
    } catch (e) {
    }
  }

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/screens/MessageBubble",
          params: { chatId: item.id.toString(), chatName: displayChatName },
        })
      }
      style={[
        styles.chatCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Image
        source={{ uri: item.chat_avatar || "https://via.placeholder.com/150" }}
        style={styles.avatar}
      />
      <View style={styles.chatContent}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {displayChatName}
          </Text>
          <Text style={[styles.timeText, { color: theme.subText }]}>
            {displayDate}
          </Text>
        </View>
        <View style={styles.messageRow}>
          <Text
            style={[styles.messagePreview, { color: theme.subText }]}
            numberOfLines={1}
          >
            {item.last_message?.content || "No messages yet"}
          </Text>
          {item.unread_messages > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.unreadText}>{item.unread_messages}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingInFlightRef = useRef(false);
  const isScreenFocusedRef = useRef(false);
  const visibleChatIdsRef = useRef<string[]>([]);
  const latestChatsRef = useRef<Chat[]>([]);
  const chatsRef = useRef<Chat[]>([]);

  // Search States
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  const shouldUpdateVisible = useCallback(
    (nextChats: Chat[], visibleIds: string[], prevChats: Chat[]) => {
      if (nextChats.length === 0) return prevChats.length !== 0;
      if (prevChats.length === 0) return true;
      if (visibleIds.length === 0) return true;

      const prevById = new Map(
        prevChats.map((chat) => [String(chat.id), chat] as const),
      );
      const nextById = new Map(
        nextChats.map((chat) => [String(chat.id), chat] as const),
      );

      for (const id of visibleIds) {
        const prevChat = prevById.get(id);
        const nextChat = nextById.get(id);
        if (!prevChat || !nextChat) return true;

        if ((prevChat.unread_messages || 0) !== (nextChat.unread_messages || 0)) {
          return true;
        }

        const prevMsg = prevChat.last_message;
        const nextMsg = nextChat.last_message;
        const prevKey = `${prevMsg?.id ?? ""}|${prevMsg?.sent_at ?? ""}|${prevMsg?.content ?? ""}`;
        const nextKey = `${nextMsg?.id ?? ""}|${nextMsg?.sent_at ?? ""}|${nextMsg?.content ?? ""}`;
        if (prevKey !== nextKey) return true;
      }

      const isAtTop =
        visibleIds[0] &&
        String(prevChats[0]?.id) === String(visibleIds[0]);
      if (isAtTop && String(nextChats[0]?.id) !== String(prevChats[0]?.id)) {
        return true;
      }

      return false;
    },
    [],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const ordered = viewableItems
        .filter((v) => v.isViewable && (v.item as Chat)?.id != null)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

      const ids = ordered.map((v) => String((v.item as Chat).id));
      visibleChatIdsRef.current = ids;

      const latest = latestChatsRef.current;
      if (!latest.length) return;

      if (shouldUpdateVisible(latest, ids, chatsRef.current)) {
        setChats(latest);
      }
    },
  );

  // Local Filter Logic
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;

    return chats.filter((chat) => {
      const chatName =
        chat.chat_name ||
        chat.members?.find((m: any) => m.id !== currentUserId)?.name ||
        "";

      return chatName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, chats, currentUserId]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const applyChats = useCallback(
    (nextChats: Chat[]) => {
      latestChatsRef.current = nextChats;
      if (shouldUpdateVisible(nextChats, visibleChatIdsRef.current, chatsRef.current)) {
        setChats(nextChats);
      }
    },
    [shouldUpdateVisible],
  );

  const fetchChats = useCallback(async () => {
    if (pollingInFlightRef.current) return;
    pollingInFlightRef.current = true;
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      setCurrentUserId(user.id);

      // Using the same base path logic to avoid 404s
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/get-chats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ offset: 0, limit: 20 }),
        },
      );

      const json = await response.json();
      if (json.status) {
        const nextChats = Array.isArray(json.data) ? json.data : [];
        applyChats(nextChats);
      }
    } catch (error) {
    } finally {
      pollingInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyChats]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      fetchChats();
    }, CHAT_LIST_POLL_MS);
  }, [fetchChats]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        if (isScreenFocusedRef.current) {
          fetchChats();
          startPolling();
        }
      } else {
        stopPolling();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchChats, startPolling, stopPolling]);

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;
      if (AppState.currentState === "active") {
        fetchChats();
        startPolling();
      }

      return () => {
        isScreenFocusedRef.current = false;
        stopPolling();
      };
    }, [fetchChats, startPolling, stopPolling]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Dynamic Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: theme.border },
        ]}
      >
        {isSearching ? (
          <View style={styles.searchBarContainer}>
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery("");
              }}
            >
              <Feather name="arrow-left" size={20} color={theme.text} />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search conversations..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={18} color={theme.subText} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Messages
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.actionIcon, { backgroundColor: theme.card }]}
                onPress={() => setIsSearching(true)}
              >
                <Feather name="search" size={20} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionIcon, { backgroundColor: theme.primary }]}
                onPress={() => router.push("/screens/NewChat")}
              >
                <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChatItem item={item} theme={theme} currentUserId={currentUserId} />
          )}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchChats();
              }}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: theme.subText }}>
                {searchQuery ? "No matches found" : "No conversations yet"}
              </Text>
            </View>
          }
        />
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerRight: { flexDirection: "row", gap: 10 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 8,
  },
  listContent: { paddingHorizontal: 16, paddingTop: 15 },
  chatCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#E2E8F0",
  },
  chatContent: { flex: 1, marginLeft: 12 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: "700" },
  messagePreview: { fontSize: 14, flex: 1, paddingRight: 10 },
  timeText: { fontSize: 12, fontWeight: "500" },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
});
