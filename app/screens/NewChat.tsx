import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

export default function NewChatScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
  };

  // Helper to ensure URL formatting is correct
  const getUrl = (path: string) => {
    const base = CONFIG.API_ENDPOINT.endsWith("/")
      ? CONFIG.API_ENDPOINT.slice(0, -1)
      : CONFIG.API_ENDPOINT;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  // Search User Logic
  const handleSearch = useCallback(
    async (query: string, signal: AbortSignal) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);

        const url = getUrl("/api/gsmfeed-chat/search-chat-users");

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ search: query }),
          signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const json = await response.json();
        if (json.status) {
          setSearchResults(json.data);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced search effect with AbortController
  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery, controller.signal);
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery, handleSearch]);

  const handleStartChat = async () => {
    if (!selectedUser || !message.trim()) return;
    setIsSending(true);

    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) throw new Error("User session not found");
      const user = JSON.parse(userString);

      const url = getUrl("/api/chat/new");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: message,
          type: "text",
        }),
      });

      // Capture raw text first to debug HTML responses (like 404/500)
      const responseText = await response.text();

      if (!response.ok) {
        Alert.alert(
          "Error",
          `Server returned ${response.status}. Check console for details.`,
        );
        setIsSending(false);
        return;
      }

      const json = JSON.parse(responseText);
      if (json.status) {
        router.replace({
          pathname: "/screens/MessageBubble",
          params: { chatId: json.data.chat_id, chatName: selectedUser.name },
        });
      } else {
        Alert.alert("Failed", json.message || "Could not start chat.");
      }
    } catch (error: any) {
      Alert.alert(
        "Network Error",
        "Check your internet connection or server status.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            New Message
          </Text>
        </View>
      </View>

      {/* Recipient Selection */}
      <View style={[styles.searchSection, { borderBottomColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.subText }]}>To:</Text>
        {selectedUser ? (
          <View
            style={[
              styles.selectedUserBadge,
              { backgroundColor: theme.primary },
            ]}
          >
            <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Feather name="x-circle" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Add recipient"
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        )}
      </View>

      {/* Search Results */}
      {!selectedUser && (
        <View style={styles.resultsContainer}>
          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              color={theme.primary}
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                searchQuery.length > 0 ? (
                  <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No users found
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.resultItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => setSelectedUser(item)}
                >
                  <Image
                    source={{
                      uri: item.avatar || "https://via.placeholder.com/150",
                    }}
                    style={styles.avatar}
                  />
                  <Text style={[styles.resultName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Message Input Area */}
      {selectedUser && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputFlex}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={{ flex: 1 }} />
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
                placeholder="Type a message..."
                placeholderTextColor={theme.subText}
                value={message}
                onChangeText={setMessage}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.primary,
                  opacity: message.trim() ? 1 : 0.6,
                },
              ]}
              onPress={handleStartChat}
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  label: { fontSize: 15, fontWeight: "500" },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  selectedUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  selectedUserName: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  resultsContainer: { flex: 1 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  resultName: { fontSize: 15, fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 14 },
  inputFlex: { flex: 1 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    justifyContent: "center",
  },
  input: { fontSize: 15, paddingVertical: 10 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
