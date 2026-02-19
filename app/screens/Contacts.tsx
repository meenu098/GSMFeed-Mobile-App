import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const tabMapping: Record<string, string> = {
  Suggestions: "user/suggestions",
  Requests: "connection/requests-received",
  Following: "connection/following",
  Followers: "connection/followers",
};

const continents: Record<string, string> = {
  AF: "Africa",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "Latin America",
};

const qualityOptions = ["Brand New", "Used", "Refurbished"];
const verifiedOptions = ["All Members", "Verified"] as const;

type PickerType =
  | "continent"
  | "countries"
  | "interests"
  | "brands"
  | "quality"
  | "verified";

type VerifiedFilter = (typeof verifiedOptions)[number];

type SuggestionFilters = {
  continent: string | null;
  countries: string[];
  interests: number[];
  brands: string[];
  quality: string | null;
  verified: VerifiedFilter;
};

type PickerItem = {
  id: string;
  label: string;
  value: string | number;
  selected: boolean;
  subtitle?: string;
  flag?: string;
};

const createDefaultSuggestionFilters = (): SuggestionFilters => ({
  continent: null,
  countries: [],
  interests: [],
  brands: [],
  quality: null,
  verified: "All Members",
});

const extractUsersArray = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users?.data)) return payload.users.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const flattenInterestsTree = (nodes: any[]) => {
  const flat: any[] = [];
  nodes.forEach((node) => {
    flat.push({ id: node.id, name: node.name, label: node.name });
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        flat.push({
          id: child.id,
          name: child.name,
          label: `${node.name} / ${child.name}`,
        });
      });
    }
  });
  return flat;
};

const buildSummaryLabel = <T extends string | number>(
  values: T[],
  getLabel: (value: T) => string,
) => {
  if (!values.length) return "";
  const firstLabel = getLabel(values[0]);
  return values.length === 1
    ? firstLabel
    : `${firstLabel} +${values.length - 1}`;
};

export default function ContactsScreen() {
  const { screenTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tab } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState("Following");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [isSuggestionAdmin, setIsSuggestionAdmin] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [interestOptions, setInterestOptions] = useState<any[]>([]);
  const [brandOptions, setBrandOptions] = useState<any[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<SuggestionFilters>(
    createDefaultSuggestionFilters(),
  );
  const [draftFilters, setDraftFilters] = useState<SuggestionFilters>(
    createDefaultSuggestionFilters(),
  );
  const sessionCacheRef = React.useRef<{
    cacheKey: string;
    token: string | null;
    isAdmin: boolean;
  }>({
    cacheKey: "",
    token: null,
    isAdmin: false,
  });

  const theme = screenTheme;

  const countryOptions = React.useMemo(
    () =>
      Object.entries(countries)
        .map(([code, data]) => ({
          code,
          name: data.name,
          flag: getEmojiFlag(code as TCountryCode),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const countryNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    countryOptions.forEach((country) => {
      map.set(country.code, country.name);
    });
    return map;
  }, [countryOptions]);

  const interestNameMap = React.useMemo(() => {
    const map = new Map<number, string>();
    interestOptions.forEach((item) => {
      map.set(Number(item.id), item.label || item.name);
    });
    return map;
  }, [interestOptions]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (appliedFilters.continent) count += 1;
    count += appliedFilters.countries.length;
    count += appliedFilters.interests.length;
    count += appliedFilters.brands.length;
    if (appliedFilters.quality) count += 1;
    if (appliedFilters.verified === "Verified") count += 1;
    return count;
  }, [appliedFilters]);

  const getStoredSession = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        sessionCacheRef.current = {
          cacheKey: "",
          token: null,
          isAdmin: false,
        };
        return { token: null, isAdmin: false };
      }

      const userObj = JSON.parse(userString);
      const token = userObj?.token || null;
      const localPlanNameRaw =
        userObj?.subscription?.name ??
        userObj?.user?.subscription?.name ??
        userObj?.data?.subscription?.name ??
        "";
      const localPlanName = String(localPlanNameRaw || "")
        .trim()
        .toLowerCase();
      const profileIdentifierRaw =
        userObj?.username ??
        userObj?.user?.username ??
        userObj?.data?.username ??
        userObj?.id ??
        userObj?.user?.id ??
        userObj?.data?.id ??
        "";
      const profileIdentifier = String(profileIdentifierRaw || "").trim();
      const cacheKey = `${token || ""}|${profileIdentifier}|${localPlanName}`;

      if (sessionCacheRef.current.cacheKey === cacheKey) {
        return {
          token: sessionCacheRef.current.token,
          isAdmin: sessionCacheRef.current.isAdmin,
        };
      }

      let resolvedPlanName = localPlanName;

      if (token && profileIdentifier) {
        try {
          const response = await fetch(
            `${CONFIG.API_ENDPOINT}/api/user/profile/${encodeURIComponent(profileIdentifier)}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );
          const json = await response.json();
          const profilePlanName = String(json?.data?.subscription?.name || "")
            .trim()
            .toLowerCase();
          if (profilePlanName) {
            resolvedPlanName = profilePlanName;
          }
        } catch {}
      }

      const isAdmin = Boolean(
        resolvedPlanName && resolvedPlanName !== "starter",
      );
      sessionCacheRef.current = { cacheKey, token, isAdmin };

      return { token, isAdmin };
    } catch {
      sessionCacheRef.current = {
        cacheKey: "",
        token: null,
        isAdmin: false,
      };
      return { token: null, isAdmin: false };
    }
  }, []);

  const buildSuggestionsPayload = useCallback((filters: SuggestionFilters) => {
    const payload = new FormData();
    if (filters.continent) payload.append("continent", filters.continent);
    filters.countries.forEach((countryCode) =>
      payload.append("country[]", countryCode),
    );
    filters.interests.forEach((interestId) =>
      payload.append("interests[]", String(interestId)),
    );
    filters.brands.forEach((brandName) =>
      payload.append("brands[]", brandName),
    );
    if (filters.quality) payload.append("category", filters.quality);
    payload.append("verified", filters.verified);
    return payload;
  }, []);

  const fetchContacts = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        const { token, isAdmin } = await getStoredSession();
        setIsSuggestionAdmin(isAdmin);
        if (!token) {
          if (pageNum === 1 || isRefresh) {
            setContacts([]);
            setHasMore(false);
          }
          setLoading(false);
          return;
        }

        const endpoint = tabMapping[activeTab];
        const isSuggestionsTab = activeTab === "Suggestions";
        const queryString = isSuggestionsTab
          ? `?page=${pageNum}&search=`
          : `?page=${pageNum}`;
        const url = `${CONFIG.API_ENDPOINT}/api/${endpoint}${queryString}`;

        const requestConfig: RequestInit = {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        if (isSuggestionsTab && isAdmin) {
          requestConfig.body = buildSuggestionsPayload(appliedFilters);
        }

        const response = await fetch(url, requestConfig);

        const json = await response.json();
        if (json.status && json.data) {
          const payload = json.data;
          const usersArray = extractUsersArray(payload);
          setContacts((prev) =>
            isRefresh ? usersArray : [...prev, ...usersArray],
          );

          if (payload.additional_data) {
            setCounts({
              following: payload.additional_data.following_count || 0,
              followers: payload.additional_data.followers_count || 0,
            });
          }

          const pagination = payload.users;
          setHasMore(
            pagination
              ? Number(pagination.current_page) < Number(pagination.last_page)
              : false,
          );
        } else if (pageNum === 1 || isRefresh) {
          setContacts([]);
          setHasMore(false);
        }
      } catch {
        if (pageNum === 1 || isRefresh) {
          setContacts([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, appliedFilters, buildSuggestionsPayload, getStoredSession],
  );

  const fetchInterests = useCallback(async () => {
    if (interestOptions.length > 0) return;
    try {
      setPickerLoading(true);
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/interests`);
      const json = await response.json();
      if (json?.status) {
        setInterestOptions(flattenInterestsTree(json.data || []));
      } else {
        setInterestOptions([]);
      }
    } catch {
      setInterestOptions([]);
    } finally {
      setPickerLoading(false);
    }
  }, [interestOptions.length]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchContacts(1, true);
  }, [fetchContacts]);

  useEffect(() => {
    if (typeof tab === "string" && tabMapping[tab]) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    if (activeTab !== "Suggestions") {
      setFilterVisible(false);
      setActivePicker(null);
      setPickerSearch("");
    }
  }, [activeTab]);

  useEffect(() => {
    if (activePicker !== "brands") return;

    let isActive = true;
    const timeout = setTimeout(async () => {
      try {
        const { token } = await getStoredSession();
        if (!token) {
          if (isActive) setBrandOptions([]);
          return;
        }

        setPickerLoading(true);
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selection/brands?search=${encodeURIComponent(pickerSearch.trim())}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const json = await response.json();
        if (isActive) {
          setBrandOptions(
            json?.status && Array.isArray(json?.data) ? json.data : [],
          );
        }
      } catch {
        if (isActive) setBrandOptions([]);
      } finally {
        if (isActive) setPickerLoading(false);
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [activePicker, getStoredSession, pickerSearch]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContacts(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchContacts(1, true);
  };

  const handleOpenProfile = (item: any) => {
    const userId = item?.username || item?.user_name || item?.id;
    if (!userId) return;
    router.push({ pathname: "/screens/Profile", params: { userId } });
  };

  const handleAction = async (item: any) => {
    try {
      const { token } = await getStoredSession();
      if (!token) {
        return;
      }

      const isFollowed =
        activeTab === "Following" ||
        item.followedByMe === true ||
        item.followedByMe === 1 ||
        item.followedByMe === "1" ||
        item.followedByMe === "true" ||
        (item.followedByMe && typeof item.followedByMe === "object");

      let actionEndpoint = isFollowed ? "unfollow" : "follow";
      if (activeTab === "Requests") actionEndpoint = "accept-request";

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/connection/${actionEndpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: item.id_for_actions || item.id }),
        },
      );

      const json = await response.json();
      if (json.status) {
        onRefresh();
      }
    } catch {}
  };

  const openFilterModal = () => {
    setDraftFilters(appliedFilters);
    setFilterVisible(true);
  };

  const closeFilterModal = () => {
    setFilterVisible(false);
    setActivePicker(null);
    setPickerSearch("");
    setPickerLoading(false);
  };

  const openPicker = (type: PickerType) => {
    setActivePicker(type);
    setPickerSearch("");
    if (type === "interests") {
      fetchInterests();
    }
  };

  const closePicker = () => {
    setActivePicker(null);
    setPickerSearch("");
    setPickerLoading(false);
  };

  const toggleCountry = (code: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      countries: prev.countries.includes(code)
        ? prev.countries.filter((item) => item !== code)
        : [...prev.countries, code],
    }));
  };

  const toggleInterest = (id: number) => {
    setDraftFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((item) => item !== id)
        : [...prev.interests, id],
    }));
  };

  const toggleBrand = (name: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(name)
        ? prev.brands.filter((item) => item !== name)
        : [...prev.brands, name],
    }));
  };

  const isMultiPicker =
    activePicker === "countries" ||
    activePicker === "interests" ||
    activePicker === "brands";

  const pickerTitle =
    activePicker === "continent"
      ? "Continent"
      : activePicker === "countries"
        ? "Countries"
        : activePicker === "interests"
          ? "Category"
          : activePicker === "brands"
            ? "Brands"
            : activePicker === "quality"
              ? "Quality"
              : activePicker === "verified"
                ? "Verified"
                : "";

  const showPickerSearch =
    activePicker === "countries" ||
    activePicker === "interests" ||
    activePicker === "brands";

  const filteredCountries = React.useMemo(() => {
    if (!pickerSearch.trim()) return countryOptions;
    const term = pickerSearch.trim().toLowerCase();
    return countryOptions.filter(
      (country) =>
        country.name.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term),
    );
  }, [countryOptions, pickerSearch]);

  const filteredInterests = React.useMemo(() => {
    if (!pickerSearch.trim()) return interestOptions;
    const term = pickerSearch.trim().toLowerCase();
    return interestOptions.filter((interest) =>
      String(interest.label || interest.name || "")
        .toLowerCase()
        .includes(term),
    );
  }, [interestOptions, pickerSearch]);

  const pickerItems = React.useMemo<PickerItem[]>(() => {
    if (!activePicker) return [];

    if (activePicker === "continent") {
      return Object.entries(continents).map(([value, label]) => ({
        id: value,
        label,
        value,
        selected: draftFilters.continent === value,
      }));
    }

    if (activePicker === "countries") {
      return filteredCountries.map((country) => ({
        id: country.code,
        label: country.name,
        value: country.code,
        subtitle: country.code,
        flag: country.flag,
        selected: draftFilters.countries.includes(country.code),
      }));
    }

    if (activePicker === "interests") {
      return filteredInterests.map((interest) => ({
        id: String(interest.id),
        label: String(interest.label || interest.name || ""),
        value: Number(interest.id),
        selected: draftFilters.interests.includes(Number(interest.id)),
      }));
    }

    if (activePicker === "brands") {
      const uniqueBrandMap = new Map<string, string>();
      brandOptions.forEach((brand) => {
        const name = String(brand?.name || "").trim();
        if (!name) return;
        uniqueBrandMap.set(name.toLowerCase(), name);
      });

      return Array.from(uniqueBrandMap.values()).map((name) => ({
        id: name.toLowerCase(),
        label: name,
        value: name,
        selected: draftFilters.brands.includes(name),
      }));
    }

    if (activePicker === "quality") {
      return qualityOptions.map((value) => ({
        id: value,
        label: value,
        value,
        selected: draftFilters.quality === value,
      }));
    }

    if (activePicker === "verified") {
      return verifiedOptions.map((value) => ({
        id: value,
        label: value,
        value,
        selected: draftFilters.verified === value,
      }));
    }

    return [];
  }, [
    activePicker,
    brandOptions,
    draftFilters.brands,
    draftFilters.continent,
    draftFilters.countries,
    draftFilters.interests,
    draftFilters.quality,
    draftFilters.verified,
    filteredCountries,
    filteredInterests,
  ]);

  const handlePickerSelect = (item: PickerItem) => {
    if (!activePicker) return;
    if (activePicker === "continent") {
      const value = String(item.value);
      setDraftFilters((prev) => ({
        ...prev,
        continent: prev.continent === value ? null : value,
      }));
      closePicker();
      return;
    }

    if (activePicker === "countries") {
      toggleCountry(String(item.value));
      return;
    }

    if (activePicker === "interests") {
      toggleInterest(Number(item.value));
      return;
    }

    if (activePicker === "brands") {
      toggleBrand(String(item.value));
      return;
    }

    if (activePicker === "quality") {
      const value = String(item.value);
      setDraftFilters((prev) => ({
        ...prev,
        quality: prev.quality === value ? null : value,
      }));
      closePicker();
      return;
    }

    if (activePicker === "verified") {
      setDraftFilters((prev) => ({
        ...prev,
        verified: item.value as VerifiedFilter,
      }));
      closePicker();
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    closeFilterModal();
  };

  const handleClearDraftFilters = () => {
    setDraftFilters(createDefaultSuggestionFilters());
  };

  const continentLabel = draftFilters.continent
    ? continents[draftFilters.continent]
    : "";
  const countriesLabel = buildSummaryLabel(
    draftFilters.countries,
    (countryCode) => countryNameMap.get(countryCode) || countryCode,
  );
  const interestsLabel = buildSummaryLabel(
    draftFilters.interests,
    (interestId) =>
      interestNameMap.get(interestId) || `Interest ${String(interestId)}`,
  );
  const brandsLabel = buildSummaryLabel(draftFilters.brands, (brand) => brand);

  const renderFilterField = (
    label: string,
    value: string,
    placeholder: string,
    picker: PickerType,
  ) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.filterField,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      onPress={() => openPicker(picker)}
    >
      <View style={styles.filterFieldTextWrap}>
        <Text style={[styles.filterFieldLabel, { color: theme.subText }]}>
          {label}
        </Text>
        <Text
          style={[
            styles.filterFieldValue,
            { color: value ? theme.text : theme.subText },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={theme.subText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons
            name="account-group"
            size={26}
            color={theme.text}
          />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Contacts
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {Object.keys(tabMapping).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && { borderBottomColor: theme.primary },
            ]}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab
                    ? { color: theme.primary, fontWeight: "700" }
                    : { color: theme.subText },
                ]}
              >
                {tab}
              </Text>
              {(tab === "Following" || tab === "Followers") && (
                <View
                  style={[styles.countBadge, { backgroundColor: theme.badge }]}
                >
                  <Text style={styles.countText}>
                    {tab === "Following" ? counts.following : counts.followers}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Suggestions" && isSuggestionAdmin ? (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={openFilterModal}
          >
            <Ionicons name="options-outline" size={16} color={theme.text} />
            <Text style={[styles.filterButtonText, { color: theme.text }]}>
              Filter
            </Text>
            {activeFilterCount > 0 ? (
              <View
                style={[
                  styles.filterCountBadge,
                  { backgroundColor: theme.badge },
                ]}
              >
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && page === 1 ? (
        <SkeletonLoader variant="list" count={8} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => (item.id || index).toString()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={{ color: theme.subText, marginTop: 40 }}>
                No users found.
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => {
            const isFollowed =
              activeTab === "Following" ||
              item.followedByMe === true ||
              item.followedByMe === 1 ||
              item.followedByMe === "1" ||
              item.followedByMe === "true" ||
              (item.followedByMe && typeof item.followedByMe === "object");

            return (
              <View
                style={[styles.contactRow, { borderBottomColor: theme.border }]}
              >
                <TouchableOpacity
                  style={styles.contactMain}
                  activeOpacity={0.7}
                  onPress={() => handleOpenProfile(item)}
                >
                  <Image
                    source={{
                      uri: item.avatar || "https://via.placeholder.com/150",
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.contactInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      {item.is_verified === 1 && (
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={14}
                          color="#3B82F6"
                        />
                      )}
                    </View>
                    <Text style={[styles.followers, { color: theme.subText }]}>
                      @{item.username} • {item.followers_count} followers
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isFollowed && activeTab !== "Requests"
                      ? styles.unfollowBtn
                      : { backgroundColor: theme.primary },
                  ]}
                  onPress={() => handleAction(item)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isFollowed && activeTab !== "Requests"
                        ? { color: theme.text }
                        : { color: "#FFF" },
                    ]}
                  >
                    {activeTab === "Requests"
                      ? "Accept"
                      : isFollowed
                        ? "Following"
                        : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
          }}
        />
      )}

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          activePicker ? closePicker() : closeFilterModal()
        }
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeFilterModal}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                {activePicker ? (
                  <TouchableOpacity
                    style={styles.sheetBackButton}
                    onPress={closePicker}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                ) : null}
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  {activePicker ? pickerTitle : "Suggestion Filters"}
                </Text>
              </View>
              {activePicker && isMultiPicker ? (
                <TouchableOpacity onPress={closePicker}>
                  <Text style={[styles.doneText, { color: theme.primary }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={closeFilterModal}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>

            {activePicker ? (
              <>
                {showPickerSearch ? (
                  <View
                    style={[
                      styles.pickerSearchBox,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons name="search" size={16} color={theme.subText} />
                    <TextInput
                      style={[styles.pickerSearchInput, { color: theme.text }]}
                      placeholder={`Search ${pickerTitle}`}
                      placeholderTextColor={theme.subText}
                      value={pickerSearch}
                      onChangeText={setPickerSearch}
                    />
                  </View>
                ) : null}

                {pickerLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={theme.primary} size="large" />
                  </View>
                ) : (
                  <FlatList
                    data={pickerItems}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.pickerOption,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => handlePickerSelect(item)}
                      >
                        <View style={styles.pickerTextWrap}>
                          <Text
                            style={[styles.pickerLabel, { color: theme.text }]}
                          >
                            {item.flag
                              ? `${item.flag} ${item.label}`
                              : item.label}
                          </Text>
                          {item.subtitle ? (
                            <Text
                              style={[
                                styles.pickerSubtitle,
                                { color: theme.subText },
                              ]}
                            >
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons
                          name={
                            item.selected
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={19}
                          color={item.selected ? theme.primary : theme.subText}
                        />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                      <Text
                        style={[
                          styles.emptyPickerText,
                          { color: theme.subText },
                        ]}
                      >
                        No results found.
                      </Text>
                    )}
                  />
                )}
              </>
            ) : (
              <>
                <ScrollView
                  contentContainerStyle={styles.filterFields}
                  keyboardShouldPersistTaps="handled"
                >
                  {renderFilterField(
                    "Continent",
                    continentLabel,
                    "Select continent",
                    "continent",
                  )}
                  {renderFilterField(
                    "Countries",
                    countriesLabel,
                    "Select countries",
                    "countries",
                  )}
                  {renderFilterField(
                    "Category",
                    interestsLabel,
                    "Select categories",
                    "interests",
                  )}
                  {renderFilterField(
                    "Brands",
                    brandsLabel,
                    "Select brands",
                    "brands",
                  )}
                  {renderFilterField(
                    "Quality",
                    draftFilters.quality || "",
                    "Select quality",
                    "quality",
                  )}
                  {renderFilterField(
                    "Verified",
                    draftFilters.verified,
                    "All Members",
                    "verified",
                  )}
                </ScrollView>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[
                      styles.sheetActionButton,
                      styles.clearButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={handleClearDraftFilters}
                  >
                    <Text
                      style={[styles.clearButtonText, { color: theme.text }]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sheetActionButton,
                      styles.applyButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleApplyFilters}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  tabText: { fontSize: 11, fontWeight: "600" },
  countBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  countText: { color: "white", fontSize: 9, fontWeight: "700" },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  filterCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  contactMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#263145",
  },
  contactInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { fontSize: 15, fontWeight: "700" },
  followers: { fontSize: 11, marginTop: 2 },
  // ADDED: Button Styles
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  unfollowBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#94A3B8",
  },
  btnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: "84%",
    zIndex: 2,
    elevation: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  sheetBackButton: {
    marginRight: 6,
    padding: 2,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterFields: {
    gap: 10,
    paddingBottom: 12,
  },
  filterField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterFieldTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  filterFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  filterFieldValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  sheetActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  applyButton: {
    borderWidth: 0,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  doneText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pickerSearchBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  pickerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.6,
  },
  pickerTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  pickerSubtitle: {
    marginTop: 2,
    fontSize: 11,
  },
  emptyPickerText: {
    textAlign: "center",
    marginTop: 26,
    fontSize: 13,
    fontWeight: "500",
  },
});
