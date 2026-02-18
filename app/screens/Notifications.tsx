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
  StatusBar,
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
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, screenTheme } = useTheme();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  const theme = screenTheme;

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom: insets.bottom + 110,
      },
    ],
    [insets.bottom],
  );

  useEffect(() => {
    const initUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;

      const user = JSON.parse(userString);
      const token = user?.token;
      if (!token) return;

      setUserToken(token);
      setLoading(true);

      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/user/notifications?offset=0`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) return;

        const json = await response.json();
        if (!json?.status) return;

        const initialNotifications = json.data || [];
        setNotifications(initialNotifications);
        setHasMoreData(initialNotifications.length >= 10);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void initUser();
  }, []);

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
          const newNotifs = json.data || [];
          setNotifications((prev) =>
            initial ? newNotifs : [...prev, ...newNotifs],
          );
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
    if (!userToken) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${CONFIG.API_ENDPOINT}/api/user/notifications/delete/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch {}
  };

  const markAllAsRead = async () => {
    if (!userToken) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    try {
      await fetch(`${CONFIG.API_ENDPOINT}/api/user/notifications/mark-as-read`, {
        method: "GET",
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch {}
  };

  const clearAllNotifications = async () => {
    if (!userToken) return;
    Alert.alert("Clear All", "Delete all notifications permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setNotifications([]);
          try {
            await fetch(`${CONFIG.API_ENDPOINT}/api/user/notifications/delete`, {
              method: "GET",
              headers: { Authorization: `Bearer ${userToken}` },
            });
          } catch {}
        },
      },
    ]);
  };

  const renderRightActions = (id: string, progress: any) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <TouchableOpacity
        onPress={() => deleteNotification(id)}
        style={[styles.deleteAction, { backgroundColor: theme.danger }]}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Feather name="trash-2" size={20} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: any) => (
    <Swipeable
      renderRightActions={(progress) => renderRightActions(item.id, progress)}
      friction={2}
      overshootRight={false}
    >
      <TouchableOpacity
        activeOpacity={0.85}
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
            borderColor: theme.border,
            opacity: item.is_read === 1 || item.is_read === true ? 0.68 : 1,
          },
        ]}
      >
        <Image
          source={{
            uri: item.notified_by?.avatar || "https://via.placeholder.com/150",
          }}
          style={[styles.avatar, { borderColor: theme.border }]}
          resizeMode="cover"
        />

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.userName, { color: theme.text }]}
              numberOfLines={1}
            >
              {item?.notified_by?.name ||
                item?.notified_by?.username ||
                "Notification"}
            </Text>
            <Text style={[styles.timeText, { color: theme.textTertiary }]}>
              {item.time || item.created_at_human || ""}
            </Text>
          </View>

          <Text
            style={[styles.notifText, { color: theme.subText }]}
            numberOfLines={2}
          >
            {item.message || "You have a new notification."}
          </Text>
        </View>

        {(!item.is_read || item.is_read === 0) && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.card }]}> 
          <MaterialCommunityIcons
            name="bell-off-outline"
            size={34}
            color={theme.textTertiary}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No notifications yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.subText }]}>New activity will appear here.</Text>
      </View>
    );
  };

  const onRefresh = () => {
    if (!userToken) return;
    setRefreshing(true);
    setHasMoreData(true);
    void fetchNotifications(userToken, true);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 10,
              borderBottomColor: theme.border,
              backgroundColor: theme.bg,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: theme.border }]}
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={markAllAsRead}
              style={[
                styles.headerActionBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Text style={[styles.readAllText, { color: theme.primary }]}>Read All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearAllNotifications}
              style={[
                styles.headerActionBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Text style={[styles.clearText, { color: theme.danger }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          contentContainerStyle={listContentStyle}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => userToken && fetchNotifications(userToken)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loading && !refreshing ? (
              <ActivityIndicator style={styles.footerLoader} color={theme.primary} />
            ) : null
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />

        <BottomNav />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  readAllText: {
    fontWeight: "700",
    fontSize: 12,
  },
  clearText: {
    fontWeight: "700",
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  notificationCard: {
    flexDirection: "row",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  notifText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 8,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    height: "84%",
    borderRadius: 14,
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  footerLoader: {
    marginVertical: 20,
  },
});
