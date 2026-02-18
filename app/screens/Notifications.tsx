import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

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

  const getNotificationSection = (item: any) => {
    const rawDate = item?.created_at || item?.createdAt;
    if (!rawDate) return "Earlier";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return "Earlier";

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfNotifDay = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    );
    const diffMs = startOfToday.getTime() - startOfNotifDay.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays <= 0) return "Today";
    if (diffDays <= 7) return "This Week";
    return "Earlier";
  };

  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const getNotificationCopy = (item: any) => {
    const actorName = String(item?.notified_by?.name || "User").trim();
    const rawMessage = String(item?.message || "").trim();
    if (!rawMessage) {
      return { actorName, message: "sent you a notification." };
    }

    if (!actorName) {
      return { actorName: "User", message: rawMessage };
    }

    const withoutActor = rawMessage.replace(
      new RegExp(`^${escapeRegex(actorName)}\\s+`, "i"),
      "",
    );

    return {
      actorName,
      message: withoutActor.trim() || rawMessage,
    };
  };

  const getTypeMeta = (typeValue: unknown) => {
    const normalized = String(typeValue || "")
      .trim()
      .toLowerCase();

    if (normalized.includes("comment")) {
      return { icon: "comment-text-outline", color: "#0EA5E9", bg: "#BAE6FD" };
    }
    if (normalized.includes("react") || normalized.includes("like")) {
      return { icon: "heart-outline", color: "#EC4899", bg: "#FBCFE8" };
    }
    if (normalized.includes("follow")) {
      return { icon: "account-plus-outline", color: "#10B981", bg: "#BBF7D0" };
    }
    if (normalized.includes("mention")) {
      return { icon: "at", color: "#8B5CF6", bg: "#DDD6FE" };
    }

    return { icon: "bell-outline", color: "#3B82F6", bg: "#DBEAFE" };
  };

  const theme = {
    background: screenTheme.bg,
    card: screenTheme.card,
    cardMuted: isDark ? "#101A2E" : "#F8FAFC",
    cardUnread: isDark ? "#13243F" : "#EEF4FF",
    header: screenTheme.bg,
    textPrimary: screenTheme.text,
    textSecondary: screenTheme.subText,
    textTertiary: screenTheme.textTertiary,
    primary: screenTheme.primary,
    danger: screenTheme.danger,
    border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  const unreadCount = countUnread(notifications);

  const visibleNotifications = useMemo(() => {
    if (!showUnreadOnly) return notifications;
    return notifications.filter((item) => isUnread(item?.is_read));
  }, [notifications, showUnreadOnly]);

  const listData = useMemo(() => {
    const rows: (
      | { type: "section"; id: string; label: string }
      | { type: "item"; id: string; item: any }
    )[] = [];
    let currentSection = "";

    visibleNotifications.forEach((item, index) => {
      const label = getNotificationSection(item);
      if (label !== currentSection) {
        currentSection = label;
        rows.push({
          type: "section",
          id: `section-${label}-${index}`,
          label,
        });
      }
      rows.push({
        type: "item",
        id: `notif-${item?.id ?? index}`,
        item,
      });
    });

    return rows;
  }, [visibleNotifications]);

  useEffect(() => {
    let mounted = true;
    const initUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!mounted) return;

        if (!userString) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userString);
        if (user?.token) {
          setUserToken(user.token);
          return;
        }

        setLoading(false);
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userToken) return;
    fetchNotifications(userToken, true);
    refreshUnreadCount();
    // Fetch once when auth token becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken, refreshUnreadCount]);

  const fetchNotifications = async (token: string, initial = false) => {
    if ((!initial && loading) || (!hasMoreData && !initial)) return;
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

  const renderRightActions = (id: string, progress: Animated.AnimatedInterpolation<number>) => {
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

  const markNotificationReadLocal = (id: string | number) => {
    setNotifications((prev) => {
      const next = prev.map((notif) => {
        if (String(notif?.id) !== String(id)) return notif;
        if (!isUnread(notif?.is_read)) return notif;
        return { ...notif, is_read: 1 };
      });
      setUnreadCount(countUnread(next));
      return next;
    });
  };

  const handleNotificationPress = (item: any) => {
    const actionId =
      item?.actions?.view?.id ||
      item?.extra_data?.post_id ||
      item?.extra_data?.comment_id;
    markNotificationReadLocal(item?.id);
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
  };

  const renderNotificationCard = (item: any) => {
    const unread = isUnread(item?.is_read);
    const copy = getNotificationCopy(item);
    const typeMeta = getTypeMeta(item?.type);
    const avatarUri =
      item?.notified_by?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        copy.actorName,
      )}&background=3B66F5&color=fff`;

    return (
      <Swipeable
        renderRightActions={(progress) => renderRightActions(item.id, progress)}
        friction={2}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleNotificationPress(item)}
          style={[
            styles.notificationCard,
            {
              backgroundColor: unread ? theme.cardUnread : theme.cardMuted,
              borderColor: unread ? `${theme.primary}50` : theme.border,
            },
          ]}
        >
          {unread ? (
            <View style={[styles.unreadAccent, { backgroundColor: theme.primary }]} />
          ) : null}

          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
            <View style={[styles.typeBadge, { backgroundColor: typeMeta.bg }]}>
              <MaterialCommunityIcons
                name={typeMeta.icon as any}
                size={12}
                color={typeMeta.color}
              />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text
              numberOfLines={2}
              style={[styles.notifText, { color: theme.textSecondary }]}
            >
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                {copy.actorName}{" "}
              </Text>
              {copy.message}
            </Text>
            <View style={styles.timeRow}>
              <Feather name="clock" size={12} color={theme.textTertiary} />
              <Text style={[styles.timeText, { color: theme.textTertiary }]}>
                {item.time || item.created_at_human}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            {unread ? (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            ) : null}
            <Feather name="chevron-right" size={16} color={theme.textTertiary} />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderItem = ({ item }: any) => {
    if (item.type === "section") {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: theme.textTertiary }]}>
            {item.label}
          </Text>
        </View>
      );
    }
    return renderNotificationCard(item.item);
  };

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
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { borderColor: theme.border }]}
            >
              <Feather name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Notifications
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
              style={[
                styles.actionBtn,
                {
                  borderColor: theme.border,
                  opacity: unreadCount === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Feather name="check-circle" size={14} color={theme.primary} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                Read all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearAllNotifications}
              disabled={notifications.length === 0}
              style={[
                styles.actionBtn,
                {
                  borderColor: theme.border,
                  opacity: notifications.length === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Feather name="trash-2" size={14} color={theme.danger} />
              <Text style={[styles.actionBtnText, { color: theme.danger }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  borderColor: theme.border,
                  backgroundColor: !showUnreadOnly ? theme.primary : "transparent",
                },
              ]}
              onPress={() => setShowUnreadOnly(false)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: !showUnreadOnly ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  borderColor: theme.border,
                  backgroundColor: showUnreadOnly ? theme.primary : "transparent",
                },
              ]}
              onPress={() => setShowUnreadOnly(true)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: showUnreadOnly ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                Unread
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && notifications.length === 0 && !refreshing ? (
          <SkeletonLoader variant="list" count={7} />
        ) : (
          <FlatList
            data={listData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
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
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                    {showUnreadOnly
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    {showUnreadOnly
                      ? "Switch to All to review older updates."
                      : "When activity happens, you will see it here."}
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  headerSubtitle: { marginTop: 2, fontSize: 12, fontWeight: "500" },
  headerActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: { paddingHorizontal: 15, paddingTop: 14, paddingBottom: 120 },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  notificationCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  unreadAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  avatarWrap: {
    position: "relative",
    marginLeft: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#333" },
  typeBadge: {
    position: "absolute",
    right: -2,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: { flex: 1, marginLeft: 12 },
  notifText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  userName: { fontWeight: "700" },
  timeRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: { fontSize: 12 },
  cardRight: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    minWidth: 16,
    gap: 8,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  deleteAction: {
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
    width: 76,
    borderRadius: 14,
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 14,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 260,
  },
});
