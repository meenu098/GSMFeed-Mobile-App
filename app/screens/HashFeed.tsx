import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";
import { PostItem } from "./Newsfeed";

const normalizeTag = (value: unknown) =>
  String(value ?? "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

const toTagText = (value: unknown) => {
  if (Array.isArray(value)) return String(value[0] ?? "").replace(/^#/, "").trim();
  return String(value ?? "").replace(/^#/, "").trim();
};

const isPostLike = (item: any) => {
  if (!item || typeof item !== "object") return false;
  const hasId = item?.id !== undefined || item?.main_post_id !== undefined;
  const hasPostShape =
    item?.author ||
    item?.trading_feeds ||
    item?.content ||
    item?.media ||
    item?.hashtags ||
    item?.created_at_human_short;
  return Boolean(hasId && hasPostShape);
};

const extractPostList = (result: any) => {
  const candidates = [
    result?.data?.posts?.data,
    result?.data?.data,
    result?.posts?.data,
    result?.posts,
    result?.data,
    result,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const posts = candidate.filter(isPostLike);
    if (posts.length > 0) return posts;
  }

  return [];
};

const extractHasMore = (result: any): boolean => {
  const containers = [result?.data?.posts, result?.data, result?.posts, result];

  for (const container of containers) {
    if (!container || typeof container !== "object") continue;

    const currentPage = Number(container?.current_page);
    const lastPage = Number(container?.last_page);
    if (Number.isFinite(currentPage) && Number.isFinite(lastPage)) {
      return currentPage < lastPage;
    }

    if ("next_page_url" in container) {
      return Boolean(container?.next_page_url);
    }
  }

  return false;
};

const extractTotalCount = (result: any): number | null => {
  const candidates = [
    result?.data?.posts?.total,
    result?.data?.total,
    result?.posts?.total,
    result?.total,
    result?.data?.posts_count,
    result?.data?.total_posts,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed);
    }
  }

  return null;
};

const postMatchesTag = (post: any, selectedTag: string) => {
  const normalizedTarget = normalizeTag(selectedTag);
  if (!normalizedTarget) return true;

  const hashtags = Array.isArray(post?.hashtags) ? post.hashtags : [];
  if (!hashtags.length) return true;

  return hashtags.some((tag: any) => {
    const value = typeof tag === "string" ? tag : tag?.name;
    return normalizeTag(value) === normalizedTarget;
  });
};

const mergeUniquePosts = (existing: any[], incoming: any[]) => {
  const map = new Map<string, any>();
  existing.forEach((item, index) => {
    const key = String(item?.main_post_id ?? item?.id ?? `existing-${index}`);
    map.set(key, item);
  });
  incoming.forEach((item, index) => {
    const key = String(item?.main_post_id ?? item?.id ?? `incoming-${index}`);
    map.set(key, item);
  });
  return Array.from(map.values());
};

const buildHashtagUrls = (tag: string, page: number) => {
  const encodedTag = encodeURIComponent(tag);
  return [
    `${CONFIG.API_ENDPOINT}/api/hashtag/trends?page=${page}&hashtag=${encodedTag}`,
    `${CONFIG.API_ENDPOINT}/api/hashtag/trends?page=${page}&tag=${encodedTag}`,
    `${CONFIG.API_ENDPOINT}/api/feed/posts?hashtag=${encodedTag}&page=${page}`,
  ];
};

const HashFeedScreen = () => {
  const { tag } = useLocalSearchParams();
  const router = useRouter();
  const { screenTheme } = useTheme();

  const selectedTag = useMemo(() => toTagText(tag), [tag]);

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const theme = screenTheme;

  const fetchTaggedFeed = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (!selectedTag) {
        setFeed([]);
        setHasMore(false);
        setTotalCount(0);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      if (pageNum === 1) {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) {
          setFeed([]);
          setHasMore(false);
          setTotalCount(0);
          return;
        }

        const user = JSON.parse(userString);
        const urls = buildHashtagUrls(selectedTag, pageNum);

        let selectedPosts: any[] = [];
        let selectedResult: any = null;

        for (const url of urls) {
          try {
            const response = await fetch(url, {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${user?.token}`,
              },
            });

            const result = await response.json();
            if (!response.ok || !result?.status) {
              continue;
            }

            const extracted = extractPostList(result);
            const filtered = extracted.filter((post) =>
              postMatchesTag(post, selectedTag),
            );

            if (filtered.length === 0 && !url.includes("/api/feed/posts")) {
              continue;
            }

            selectedPosts = filtered;
            selectedResult = result;
            break;
          } catch {
            continue;
          }
        }

        const resolvedTotalCount = extractTotalCount(selectedResult);
        setFeed((prev) =>
          pageNum === 1 ? selectedPosts : mergeUniquePosts(prev, selectedPosts),
        );
        if (resolvedTotalCount !== null) {
          setTotalCount(resolvedTotalCount);
        } else if (pageNum === 1) {
          setTotalCount(selectedPosts.length);
        }
        setPage(pageNum);
        setHasMore(extractHasMore(selectedResult));
      } catch {
        if (pageNum === 1) {
          setFeed([]);
          setTotalCount(0);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedTag],
  );

  useEffect(() => {
    fetchTaggedFeed(1);
  }, [fetchTaggedFeed]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    fetchTaggedFeed(page + 1);
  }, [fetchTaggedFeed, hasMore, loading, loadingMore, page, refreshing]);

  const handleBookmark = useCallback(async (postId: number | string) => {
    if (!postId) return;
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      await fetch(`${CONFIG.API_ENDPOINT}/api/feed/${postId}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
    } catch {
      // Keep UI responsive even if bookmark request fails.
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.text }]}>#{selectedTag}</Text>
          <Text style={[styles.postCountText, { color: theme.subText }]}>
            {(totalCount ?? feed.length).toLocaleString()}{" "}
            {(totalCount ?? feed.length) === 1 ? "post" : "posts"}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading && feed.length === 0 ? (
        <SkeletonLoader variant="feed" count={2} />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item, index) =>
            String(item?.main_post_id ?? item?.id ?? `post-${index}`)
          }
          renderItem={({ item }) => (
            <PostItem item={item} theme={theme} onSave={handleBookmark} />
          )}
          onRefresh={() => fetchTaggedFeed(1, true)}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              No posts found with this hashtag.
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreArea}>
                <ActivityIndicator color={theme.primary} size="small" />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 60,
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: { fontSize: 20, fontWeight: "800" },
  postCountText: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  backBtn: { padding: 5 },
  headerSpacer: { width: 34 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingMoreArea: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { textAlign: "center", marginTop: 50, fontSize: 16 },
});

export default HashFeedScreen;
