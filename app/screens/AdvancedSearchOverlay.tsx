import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurTint, BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");

type SearchBuckets = {
  users: any[];
  hashtags: any[];
  products: any[];
  brands: any[];
};

const EMPTY_SEARCH_BUCKETS: SearchBuckets = {
  users: [],
  hashtags: [],
  products: [],
  brands: [],
};

export default function AdvancedSearchOverlay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchBuckets, setSearchBuckets] =
    useState<SearchBuckets>(EMPTY_SEARCH_BUCKETS);
  const [loading, setLoading] = useState(false);
  const [suggestedProfiles, setSuggestedProfiles] = useState<any[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);

  const blurTint: BlurTint = isDark ? "dark" : "light";

  const theme = {
    bg: isDark ? "rgba(11, 14, 20, 0.9)" : "rgba(248, 250, 252, 0.8)",
    pillBg: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    placeholder: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B66F5",
    border: isDark ? "#1B2331" : "#E2E8F0",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getArrayByPath = useCallback((obj: any, path: string[]) => {
    return path.reduce((acc: any, key: string) => acc?.[key], obj);
  }, []);

  const extractListFromPayload = useCallback(
    (payload: any, paths: string[][]) => {
      for (const path of paths) {
        const value = getArrayByPath(payload, path);
        if (Array.isArray(value)) return value;
      }
      return [];
    },
    [getArrayByPath],
  );

  const dedupeByKey = useCallback(
    (items: any[], keyResolver: (item: any) => string) => {
      const map = new Map<string, any>();
      items.forEach((item, index) => {
        const key = keyResolver(item);
        const fallbackKey = `item-${index}`;
        map.set(key || fallbackKey, item);
      });
      return Array.from(map.values());
    },
    [],
  );

  const extractUsersArray = useCallback((payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.users?.data)) return payload.users.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, []);

  const fetchSuggestedProfiles = useCallback(async () => {
    setSuggestedLoading(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        setSuggestedProfiles([]);
        return;
      }

      const user = JSON.parse(userString);
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/suggestions?page=1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const json = await response.json();
      if (response.ok && json?.status) {
        setSuggestedProfiles(extractUsersArray(json?.data));
      } else {
        setSuggestedProfiles([]);
      }
    } catch {
      setSuggestedProfiles([]);
    } finally {
      setSuggestedLoading(false);
    }
  }, [extractUsersArray]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchBuckets(EMPTY_SEARCH_BUCKETS);
        return;
      }

      setLoading(true);

      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) {
          setSearchBuckets(EMPTY_SEARCH_BUCKETS);
          return;
        }

        const user = JSON.parse(userString);
        const commonHeaders = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        };

        const encodedQuery = encodeURIComponent(query.trim());

        const [
          usersResponse,
          hashtagsResponse,
          productsResponse,
          brandsResponse,
        ] = await Promise.allSettled([
          fetch(`${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/search-chat-users`, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify({ search: query }),
          }),
          fetch(`${CONFIG.API_ENDPOINT}/api/hashtag/query`, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify({ search: query }),
          }),
          fetch(
            `${CONFIG.API_ENDPOINT}/api/selection/products?search=${encodedQuery}`,
            {
              method: "GET",
              headers: commonHeaders,
            },
          ),
          fetch(
            `${CONFIG.API_ENDPOINT}/api/selection/brands?search=${encodedQuery}`,
            {
              method: "GET",
              headers: commonHeaders,
            },
          ),
        ]);

        const parseJson = async (result: PromiseSettledResult<Response>) => {
          if (result.status !== "fulfilled") return null;
          try {
            return await result.value.json();
          } catch {
            return null;
          }
        };

        const [usersJson, hashtagsJson, productsJson, brandsJson] =
          await Promise.all([
            parseJson(usersResponse),
            parseJson(hashtagsResponse),
            parseJson(productsResponse),
            parseJson(brandsResponse),
          ]);

        const users = dedupeByKey(extractUsersArray(usersJson?.data), (item) =>
          String(
            item?.id ??
              item?.user_id ??
              item?.username ??
              item?.user_name ??
              "",
          ),
        );

        const hashtags = dedupeByKey(
          extractListFromPayload(hashtagsJson, [
            ["data", "data"],
            ["data"],
            ["hashtags", "data"],
            ["hashtags"],
          ]).filter((item: any) =>
            String(item?.name ?? item?.label ?? "").trim(),
          ),
          (item) =>
            String(item?.id ?? item?.name ?? item?.label ?? "").toLowerCase(),
        );

        const products = dedupeByKey(
          extractListFromPayload(productsJson, [
            ["data", "products", "data"],
            ["data", "data"],
            ["data"],
            ["products", "data"],
            ["products"],
          ]).filter((item: any) =>
            String(item?.name ?? item?.label ?? "").trim(),
          ),
          (item) =>
            String(item?.id ?? item?.name ?? item?.label ?? "").toLowerCase(),
        );

        const brands = dedupeByKey(
          extractListFromPayload(brandsJson, [
            ["data", "brands", "data"],
            ["data", "data"],
            ["data"],
            ["brands", "data"],
            ["brands"],
          ]).filter((item: any) =>
            String(item?.name ?? item?.label ?? "").trim(),
          ),
          (item) =>
            String(item?.id ?? item?.name ?? item?.label ?? "").toLowerCase(),
        );

        setSearchBuckets({ users, hashtags, products, brands });
      } catch {
        setSearchBuckets(EMPTY_SEARCH_BUCKETS);
      } finally {
        setLoading(false);
      }
    },
    [dedupeByKey, extractListFromPayload, extractUsersArray],
  );

  const resolveProfileIdentifier = useCallback((item: any) => {
    const identifier =
      item?.username ?? item?.user_name ?? item?.id ?? item?.user_id ?? null;
    if (identifier === null || identifier === undefined) return null;
    return String(identifier);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    fetchSuggestedProfiles();
  }, [fetchSuggestedProfiles]);

  const renderProfileRow = useCallback(
    (item: any, compact = false) => {
      const userId = resolveProfileIdentifier(item);
      const userName =
        item?.name || item?.username || item?.user_name || "Unknown User";
      const handle =
        item?.username ||
        item?.user_name ||
        String(userName).toLowerCase().replace(/\s+/g, "");

      return (
        <TouchableOpacity
          style={[
            compact
              ? [styles.suggestedThumbItem, { borderColor: theme.border }]
              : [
                  styles.userCard,
                  {
                    backgroundColor: theme.pillBg,
                    borderColor: theme.border,
                  },
                ],
          ]}
          onPress={() => {
            if (!userId) return;
            router.push({
              pathname: "/screens/Profile",
              params: { userId },
            });
          }}
        >
          <Image
            source={{
              uri:
                item?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userName,
                )}&background=3B66F5&color=fff`,
            }}
            style={compact ? styles.suggestedAvatar : styles.avatar}
          />
          <View style={compact ? styles.suggestedNameWrap : styles.userInfo}>
            <Text
              style={[
                compact ? styles.suggestedName : styles.userName,
                { color: theme.text },
              ]}
              numberOfLines={1}
            >
              {userName}
            </Text>
            {compact ? (
              <Text
                style={[styles.suggestedHandle, { color: theme.placeholder }]}
              >
                @{handle}
              </Text>
            ) : (
              <Text style={[styles.userHandle, { color: theme.placeholder }]}>
                @{handle}
              </Text>
            )}
          </View>
          {!compact ? (
            <Feather name="external-link" size={16} color={theme.primary} />
          ) : null}
        </TouchableOpacity>
      );
    },
    [
      resolveProfileIdentifier,
      router,
      theme.border,
      theme.pillBg,
      theme.placeholder,
      theme.primary,
      theme.text,
    ],
  );

  const renderHashtagRow = useCallback(
    (item: any, index: number) => {
      const rawName = String(
        item?.name ?? item?.label ?? item?.value ?? "",
      ).trim();
      const hashtagName = rawName.replace(/^#/, "");
      if (!hashtagName) return null;

      return (
        <TouchableOpacity
          key={`hashtag-${hashtagName}-${index}`}
          style={styles.searchRow}
          onPress={() =>
            router.push({
              pathname: "/screens/HashFeed",
              params: { tag: hashtagName },
            })
          }
        >
          <View style={styles.searchIconCircle}>
            <Feather name="hash" size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.searchLabel, { color: theme.text }]}>
            #{hashtagName}
          </Text>
        </TouchableOpacity>
      );
    },
    [router, theme.text],
  );

  const renderSimpleRow = useCallback(
    (
      item: any,
      index: number,
      section: "products" | "brands",
      icon: "package" | "award",
    ) => {
      const label = String(
        item?.name ?? item?.label ?? item?.value ?? "",
      ).trim();
      if (!label) return null;

      return (
        <View key={`${section}-${label}-${index}`} style={styles.searchRow}>
          <View style={styles.searchIconCircle}>
            <Feather name={icon} size={19} color="#FFFFFF" />
          </View>
          <Text style={[styles.searchLabel, { color: theme.text }]}>
            {label}
          </Text>
        </View>
      );
    },
    [theme.text],
  );

  const renderUserSearchRow = useCallback(
    (item: any, index: number) => {
      const userId = resolveProfileIdentifier(item);
      const userName =
        item?.name || item?.username || item?.user_name || "Unknown User";
      const avatarUri = item?.avatar;

      return (
        <TouchableOpacity
          key={`user-${String(userId ?? userName)}-${index}`}
          style={styles.searchRow}
          onPress={() => {
            if (!userId) return;
            router.push({
              pathname: "/screens/Profile",
              params: { userId },
            });
          }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.searchAvatar} />
          ) : (
            <View style={styles.searchIconCircle}>
              <Feather name="user" size={19} color="#FFFFFF" />
            </View>
          )}
          <Text style={[styles.searchLabel, { color: theme.text }]}>
            {userName}
          </Text>
        </TouchableOpacity>
      );
    },
    [resolveProfileIdentifier, router, theme.text],
  );

  const renderSection = useCallback(
    (
      title: string,
      data: any[],
      rowRenderer: (item: any, index: number) => React.ReactNode,
    ) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      const limitedData = data.slice(0, 6);

      return (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {title}
          </Text>
          {limitedData.map((item, index) => rowRenderer(item, index))}
        </View>
      );
    },
    [theme.text],
  );

  const isSearching = searchQuery.trim().length > 0;
  const hasSearchResults =
    searchBuckets.users.length > 0 ||
    searchBuckets.hashtags.length > 0 ||
    searchBuckets.products.length > 0 ||
    searchBuckets.brands.length > 0;

  return (
    <View style={styles.container}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}
        onPress={() => router.back()}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 30 : 15}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Search Input */}
        <View
          style={[
            styles.pill,
            {
              backgroundColor: theme.pillBg,
              borderColor: theme.border,
              borderWidth: isDark ? 1 : 0.5,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.primary}
            style={{ marginRight: 12 }}
          />
          <TextInput
            ref={inputRef}
            placeholder="Search for companies or traders..."
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsWrapper}>
          {isSearching && loading ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ marginTop: 30 }}
            />
          ) : !isSearching ? (
            suggestedLoading ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginTop: 30 }}
              />
            ) : (
              <View style={styles.suggestedSection}>
                <View style={styles.suggestedHeader}>
                  <Text style={[styles.suggestedTitle, { color: theme.text }]}>
                    Suggested profiles
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/screens/Contacts",
                        params: { tab: "Suggestions" },
                      })
                    }
                  >
                    <Text
                      style={[styles.suggestedSeeAll, { color: theme.primary }]}
                    >
                      See all
                    </Text>
                  </TouchableOpacity>
                </View>

                {suggestedProfiles.length > 0 ? (
                  <FlatList
                    data={suggestedProfiles}
                    keyExtractor={(item, index) =>
                      `suggested-${String(
                        item?.id ?? item?.user_id ?? item?.username ?? index,
                      )}`
                    }
                    renderItem={({ item }) => renderProfileRow(item, true)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestedListContent}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={{ color: theme.placeholder }}>
                      Start typing to search traders and companies.
                    </Text>
                  </View>
                )}
              </View>
            )
          ) : (
            <ScrollView
              style={styles.sectionListContainer}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {hasSearchResults ? (
                <View
                  style={[
                    styles.searchCard,
                    {
                      backgroundColor: theme.pillBg,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  {renderSection(
                    "Users",
                    searchBuckets.users,
                    renderUserSearchRow,
                  )}
                  {renderSection(
                    "Hashtags",
                    searchBuckets.hashtags,
                    renderHashtagRow,
                  )}
                  {renderSection(
                    "Products",
                    searchBuckets.products,
                    (item, index) =>
                      renderSimpleRow(item, index, "products", "package"),
                  )}
                  {renderSection(
                    "Brands",
                    searchBuckets.brands,
                    (item, index) =>
                      renderSimpleRow(item, index, "brands", "award"),
                  )}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.placeholder }}>
                    No results found matching {searchQuery}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <BottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  content: { flex: 1, alignItems: "center" },
  pill: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    width: width * 0.92,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  resultsWrapper: { width: "100%", flex: 1, marginTop: 15 },
  sectionListContainer: { width: "100%" },
  listContent: { paddingHorizontal: 16, paddingBottom: 150 },
  searchCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sectionBlock: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#316AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  searchAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  searchLabel: { fontSize: 18, fontWeight: "600", flex: 1 },
  suggestedSection: { paddingHorizontal: 16, paddingBottom: 150 },
  suggestedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  suggestedTitle: { fontSize: 16, fontWeight: "700" },
  suggestedSeeAll: { fontSize: 13, fontWeight: "700" },
  suggestedListContent: { paddingVertical: 6, paddingRight: 12 },
  suggestedThumbItem: {
    width: 98,
    marginRight: 12,
    alignItems: "center",
  },
  suggestedAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    borderWidth: 1,
  },
  suggestedNameWrap: { alignItems: "center", width: "100%" },
  suggestedName: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  suggestedHandle: { fontSize: 11, marginTop: 2, textAlign: "center" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700" },
  userHandle: { fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  bottomSection: { position: "absolute", bottom: 0, width: "100%", zIndex: 10 },
});
