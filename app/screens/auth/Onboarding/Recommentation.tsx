import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CONFIG from "../../../../shared/config";
import { useTheme } from "../../../../shared/themeContext";

interface FollowRecommendationsStepProps {
  user: any;
  onFinish: () => void;
  onBack: () => void;
}

const isTruthyFollow = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
};

const getActionUserId = (item: any) => {
  const idValue = item?.id_for_actions ?? item?.id;
  const parsedId = Number(idValue);
  return Number.isFinite(parsedId) ? parsedId : null;
};

const isInitiallyFollowing = (item: any) => {
  if (isTruthyFollow(item?.followedByMe)) return true;
  if (isTruthyFollow(item?.is_following)) return true;
  if (isTruthyFollow(item?.is_followed)) return true;
  return false;
};

const parseCountValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim().toLowerCase();
    if (!normalized) return null;

    const compactMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*([kmb])$/i);
    if (compactMatch) {
      const amount = Number(compactMatch[1]);
      const suffix = compactMatch[2].toLowerCase();
      const multiplier =
        suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1_000_000_000;
      const compactValue = Math.floor(amount * multiplier);
      return Number.isFinite(compactValue) ? Math.max(0, compactValue) : null;
    }

    const directParsed = Number(normalized);
    if (Number.isFinite(directParsed)) {
      return Math.max(0, Math.floor(directParsed));
    }

    const numericInText = normalized.match(/(\d+(?:\.\d+)?\s*[kmb]?)/i);
    if (numericInText?.[1]) {
      return parseCountValue(numericInText[1].replace(/\s+/g, ""));
    }
    return null;
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const nestedCandidates = [
      obj.total,
      obj.count,
      obj.followers,
      obj.followers_count,
      obj.total_followers,
      obj.follower_count,
      obj.followersCount,
      obj.totalFollowers,
      obj.value,
      obj.data,
    ];
    for (const candidate of nestedCandidates) {
      const parsed = parseCountValue(candidate);
      if (parsed !== null) return parsed;
    }

    const dynamicFollowerKey = Object.keys(obj).find((key) =>
      key.toLowerCase().includes("follower"),
    );
    if (dynamicFollowerKey) {
      const parsed = parseCountValue(obj[dynamicFollowerKey]);
      if (parsed !== null) return parsed;
    }
  }

  return null;
};

const getFollowersCount = (item: any) => {
  const candidates = [
    item?.total_followers,
    item?.followers_count,
    item?.follower_count,
    item?.followers,
    item?.followersCount,
    item?.totalFollowers,
    item?.no_of_followers,
    item?.number_of_followers,
    item?.additional_data?.followers_count,
    item?.meta?.followers_count,
    item?.user?.total_followers,
    item?.user?.followers_count,
    item?.user?.follower_count,
    item?.user?.followers,
    item?.user?.followersCount,
    item?.user_data?.followers_count,
    item?.profile?.followers_count,
    item?.stats?.followers,
    item?.stats?.followers_count,
  ];

  for (const candidate of candidates) {
    const parsed = parseCountValue(candidate);
    if (parsed !== null) return parsed;
  }

  return 0;
};

const extractSuggestions = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users?.data)) return payload.users.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const mergeAccounts = (existing: any[], incoming: any[]) => {
  const map = new Map<string, any>();
  existing.forEach((item, index) => {
    const id = String(getActionUserId(item) ?? item?.id ?? `existing-${index}`);
    map.set(id, item);
  });
  incoming.forEach((item, index) => {
    const id = String(getActionUserId(item) ?? item?.id ?? `incoming-${index}`);
    map.set(id, item);
  });
  return Array.from(map.values());
};

const FollowRecommendationsStep = ({
  user,
  onFinish,
  onBack,
}: FollowRecommendationsStepProps) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const [actionLoadingIds, setActionLoadingIds] = useState<number[]>([]);

  const colors = {
    bg: isDark ? "#0F172A" : "#F0F7FF",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#000000",
    subText: isDark ? "#94A3B8" : "#4F4F4F",
    primary: "#3B66F5",
  };

  const fetchSuggestions = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!user?.token) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (pageNum === 1 || isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/user/suggestions?page=${pageNum}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          },
        );
        const result = await response.json();

        if (response.ok && result?.status && result?.data) {
          const payload = result.data;
          const suggestions = extractSuggestions(payload);
          const initialFollowIds = suggestions
            .filter((item: any) => isInitiallyFollowing(item))
            .map((item: any) => getActionUserId(item))
            .filter((id: number | null): id is number => id !== null);

          setAccounts((prev) =>
            pageNum === 1 || isRefresh
              ? suggestions
              : mergeAccounts(prev, suggestions),
          );
          setFollowingIds((prev) =>
            pageNum === 1 || isRefresh
              ? initialFollowIds
              : Array.from(new Set([...prev, ...initialFollowIds])),
          );

          const pagination = payload?.users;
          const currentPage =
            Number(pagination?.current_page) || Number(pageNum) || 1;
          const lastPage = Number(pagination?.last_page) || Number(pageNum) || 1;

          setPage(currentPage);
          setHasMore(currentPage < lastPage);
        } else if (pageNum === 1 || isRefresh) {
          setAccounts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Suggestion fetch error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user?.token],
  );

  // Fetch Suggestions from API (same pagination style as Contacts screen)
  useEffect(() => {
    if (user?.token) {
      setPage(1);
      setHasMore(true);
      fetchSuggestions(1, true);
    } else {
      setLoading(false);
    }
  }, [user?.token, fetchSuggestions]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      fetchSuggestions(page + 1);
    }
  };

  const setActionLoading = (accountId: number, isLoading: boolean) => {
    setActionLoadingIds((prev) =>
      isLoading
        ? prev.includes(accountId)
          ? prev
          : [...prev, accountId]
        : prev.filter((id) => id !== accountId),
    );
  };

  // Handle Follow / Unfollow API
  const handleFollowToggle = async (item: any) => {
    const accountId = getActionUserId(item);
    if (!accountId) {
      Alert.alert("Error", "Invalid user.");
      return;
    }

    if (actionLoadingIds.includes(accountId)) {
      return;
    }

    const isFollowing = followingIds.includes(accountId);
    const endpoint = isFollowing ? "unfollow" : "follow";

    setActionLoading(accountId, true);
    try {
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/connection/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: accountId }),
        },
      );
      const result = await res.json();
      if (res.ok && result?.status) {
        setFollowingIds((prev) => {
          if (isFollowing) {
            return prev.filter((id) => id !== accountId);
          }
          return prev.includes(accountId) ? prev : [...prev, accountId];
        });
      }
    } catch {
      Alert.alert(
        "Error",
        isFollowing ? "Could not unfollow user." : "Could not follow user.",
      );
    } finally {
      setActionLoading(accountId, false);
    }
  };

  const renderAccount = ({ item }: { item: any }) => {
    const accountId = getActionUserId(item);
    const isFollowing = accountId ? followingIds.includes(accountId) : false;
    const isActionLoading = accountId
      ? actionLoadingIds.includes(accountId)
      : false;
    const followersCount = getFollowersCount(item);

    return (
      <View style={styles.accountRow}>
        <View style={styles.profileInfo}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
            ]}
          >
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <Feather name="user" size={24} color={colors.subText} />
            )}
          </View>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.nameText, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name || item.username}
              </Text>
              {item.is_verified === 1 && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={16}
                  color={colors.primary}
                  style={styles.verifyIcon}
                />
              )}
            </View>
            <Text style={[styles.followerText, { color: colors.subText }]}>
              {followersCount} followers
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.followBtn,
            { borderColor: colors.primary },
            isFollowing && { backgroundColor: colors.primary },
            isActionLoading && { opacity: 0.7 },
          ]}
          onPress={() => handleFollowToggle(item)}
          disabled={isActionLoading || accountId === null}
        >
          {isActionLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? "#FFF" : colors.primary}
            />
          ) : (
            <Text
              style={[
                styles.followBtnText,
                { color: colors.primary },
                isFollowing && { color: "#FFF" },
              ]}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: colors.text }]}>
            Dont miss out
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Accounts recommended based on your interests.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ flex: 1 }}
          />
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item, index) =>
              String(getActionUserId(item) ?? item?.id ?? index)
            }
            renderItem={renderAccount}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreWrapper}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.navBtn} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={colors.text} />
            <Text style={[styles.navText, { color: colors.text }]}> Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={onFinish}>
            <Text style={[styles.navText, { color: colors.text }]}>
              Finish{" "}
            </Text>
            <Feather name="arrow-right" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles remain the same as previous step...
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: { borderRadius: 40, padding: 30, height: "85%", width: "100%" },
  headerArea: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center" },
  list: { flex: 1 },
  loadingMoreWrapper: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  nameContainer: { marginLeft: 12, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  nameText: { fontSize: 16, fontWeight: "600", maxWidth: "85%" },
  verifyIcon: { marginLeft: 4 },
  followerText: { fontSize: 13, marginTop: 2 },
  followBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  followBtnText: { fontSize: 14, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
  },
  navBtn: { flexDirection: "row", alignItems: "center", padding: 10 },
  navText: { fontSize: 18, fontWeight: "500" },
});

export default FollowRecommendationsStep;
