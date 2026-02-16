import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { useNotificationCenter } from "../../shared/notifications/NotificationCenterContext";
import { useTheme } from "../../shared/themeContext";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, screenTheme } = useTheme();
  const { refreshUnreadCount, setUnreadCount } = useNotificationCenter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  const isUnread = (value: unknown) => {
    if (typeof value === "boolean") return !value;
    if (typeof value === "number") return value === 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "0" || normalized === "false" || normalized === "no";
    }
    return true;
  };

  const countUnread = (items: any[]) =>
    items.reduce(
      (count, item) => count + (isUnread(item?.is_read) ? 1 : 0),
      0,
    );

  const theme = {
    background: screenTheme.bg,
    card: screenTheme.card,
    header: screenTheme.bg,
    textPrimary: screenTheme.text,
    textSecondary: screenTheme.subText,
    textTertiary: screenTheme.textTertiary,
    primary: screenTheme.primary,
    danger: screenTheme.danger,
    border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  useEffect(() => {
    const initUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setUserToken(user.token);
        fetchNotifications(user.token, true);
        refreshUnreadCount();
      }
    };

    initUser();
  }, [refreshUnreadCount]);

  const fetchNotifications = async (token: string, initial = false) => {
    if (loading || (!hasMoreData && !initial)) return;
    setLoading(true);
    const offset = initial ? 0 : notifications.length;
    const url = `${CONFIG.API_ENDPOINT}/api/user/notifications?offset=${offset}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.status) {
          const newNotifs = Array.isArray(json.data) ? json.data : [];
          let unread = 0;
          setNotifications((prev) => {
            const next = initial ? newNotifs : [...prev, ...newNotifs];
            unread = countUnread(next);
            return next;
          });
          setUnreadCount(unread);
          setHasMoreData(newNotifs.length >= 10);
        }
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      setUnreadCount(countUnread(next));
      return next;
    });
    try {
      await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/notifications/delete/${id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );
    } catch {
    } finally {
      refreshUnreadCount();
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    try {
      await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/notifications/mark-as-read`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );
    } catch {
    } finally {
      refreshUnreadCount();
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert("Clear All", "Delete all notifications permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setNotifications([]);
          setUnreadCount(0);
          try {
            await fetch(
              `${CONFIG.API_ENDPOINT}/api/user/notifications/delete`,
              {
                method: "GET",
                headers: { Authorization: `Bearer ${userToken}` },
                },
              );
            } catch {
            } finally {
              refreshUnreadCount();
            }
          },
        },
      ]);
  };

  const handleRefresh = () => {
    if (!userToken) return;
    setRefreshing(true);
    setHasMoreData(true);
    fetchNotifications(userToken, true);
  };

  const renderRightActions = (id: string, progress: any) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <TouchableOpacity
        onPress={() => deleteNotification(id)}
        style={styles.deleteAction}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Feather name="trash-2" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: any) => (
    <Swipeable
      renderRightActions={(progress) => renderRightActions(item.id, progress)}
      friction={2}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          const actionId =
            item?.actions?.view?.id ||
            item?.extra_data?.post_id ||
            item?.extra_data?.comment_id;
          if (!actionId) return;
          const commentTypes = new Set([
            "comment-reply",
            "comment-react",
            "comment-mention",
          ]);
          const openComments = commentTypes.has(item?.type);
          router.push({
            pathname: "/screens/Newsfeed",
            params: {
              postId: String(actionId),
              openComments: openComments ? "1" : "0",
            },
          });
        }}
        style={[
          styles.notificationCard,
          {
            backgroundColor: theme.card,
            opacity: item.is_read === 1 || item.is_read === true ? 0.6 : 1,
          },
        ]}
      >
        {/* MAPPING FIXED: notified_by.avatar */}
        <Image
          source={{
            uri: item.notified_by?.avatar || "https://via.placeholder.com/150",
          }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.notifText, { color: theme.textSecondary }]}>
            <Text style={[styles.userName, { color: theme.textPrimary }]}>
              {/* {item.notified_by?.name || "User"}{" "} */}
            </Text>
            {item.message}
          </Text>
          <Text style={[styles.timeText, { color: theme.textTertiary }]}>
            {item.time || item.created_at_human}
          </Text>
        </View>

        {/* UNREAD LOGIC: is_read can be bool or int */}
        {(!item.is_read || item.is_read === 0) && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 10,
              backgroundColor: theme.header,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Notifications
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{ marginRight: 15 }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Read All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAllNotifications}>
              <Text
                style={{ color: theme.danger, fontWeight: "600", fontSize: 13 }}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && notifications.length === 0 && !refreshing ? (
          <SkeletonLoader variant="list" count={7} />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReached={() => userToken && fetchNotifications(userToken)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              loading && !refreshing ? (
                <ActivityIndicator style={{ margin: 20 }} color={theme.primary} />
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="bell-off-outline"
                    size={60}
                    color={theme.textTertiary}
                  />
                  <Text style={{ color: theme.textSecondary, marginTop: 10 }}>
                    No notifications yet
                  </Text>
                </View>
              ) : null
            }
          />
        )}
        <BottomNav />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  listContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 120 },
  notificationCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#333" },
  textContainer: { flex: 1, marginLeft: 14 },
  notifText: { fontSize: 14, lineHeight: 20 },
  userName: { fontWeight: "700" },
  timeText: { fontSize: 12, marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
  deleteAction: {
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "88%",
    borderRadius: 14,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
});
