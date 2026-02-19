import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDistanceToNow, parseISO } from "date-fns";
import { countries } from "countries-list";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const LIMIT = 30;

type IdValue = string | number;

type CountryOption = {
  code: string;
  name: string;
};

type SelectionOption = {
  id: IdValue;
  name: string;
  label?: string;
};

type ProductOption = {
  id: IdValue;
  name: string;
  brand?: string;
  category?: string;
};

type PickerOption = CountryOption | SelectionOption;

type TradingFilters = {
  country: CountryOption | null;
  category: SelectionOption | null;
  type: "wts" | "wtb" | null;
  condition: "new" | "used" | null;
  brand: SelectionOption | null;
  grade: SelectionOption | null;
  color: SelectionOption | null;
  spec: SelectionOption | null;
  storage: SelectionOption | null;
};

const createDefaultFilters = (): TradingFilters => ({
  country: null,
  category: null,
  type: null,
  condition: null,
  brand: null,
  grade: null,
  color: null,
  spec: null,
  storage: null,
});

type PickerType =
  | "country"
  | "category"
  | "brand"
  | "grade"
  | "color"
  | "spec"
  | "storage";

const TradingFeed = () => {
  const { isDark, screenTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState("dateDesc");
  const [sortOpen, setSortOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TradingFilters>(createDefaultFilters());
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerOptions, setPickerOptions] = useState<PickerOption[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const [selectedFeed, setSelectedFeed] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetAnim = React.useRef(new Animated.Value(0)).current;

  const sortOptions = [
    { label: "Newest First", value: "dateDesc" },
    { label: "Oldest First", value: "dateAsc" },
    { label: "Price: High to Low", value: "priceDesc" },
    { label: "Price: Low to High", value: "priceAsc" },
  ];
  const activeSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ||
    "Newest First";

  const countryOptions = useMemo<CountryOption[]>(() => {
    return Object.entries(countries)
      .map(([code, data]) => ({ code, name: data.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const pickerTitles: Record<PickerType, string> = {
    country: "Country",
    category: "Category",
    brand: "Brand",
    grade: "Grade",
    color: "Color",
    spec: "Specification",
    storage: "Storage",
  };
  const activePickerTitle = activePicker ? pickerTitles[activePicker] : "";

  const isPickerView = !!activePicker;
  const sheetTitle = isPickerView ? activePickerTitle : "Filter";

  const closeSheet = () => {
    setFilterOpen(false);
    closePicker();
  };

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  const openPicker = (type: PickerType) => {
    setFilterOpen(true);
    setActivePicker(type);
    setPickerSearch("");
    setPickerOptions([]);
    setSortOpen(false);
    setProductOpen(false);
  };

  const closePicker = () => {
    setActivePicker(null);
    setPickerSearch("");
    setPickerOptions([]);
    setPickerLoading(false);
  };

  const clearFilters = () => {
    setFilters(createDefaultFilters());
  };

  const toggleType = (value: "wts" | "wtb") => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type === value ? null : value,
    }));
  };

  const toggleCondition = (value: "new" | "used") => {
    setFilters((prev) => ({
      ...prev,
      condition: prev.condition === value ? null : value,
    }));
  };

  const flattenCategories = useCallback(
    function flattenCategoriesTree(
      nodes: any[],
      prefix = "",
    ): SelectionOption[] {
      const items: SelectionOption[] = [];
      nodes.forEach((node) => {
        const nodeName = String(node?.name || "");
        const label = prefix ? `${prefix} / ${nodeName}` : nodeName;
        items.push({ id: node?.id as IdValue, name: nodeName, label });
        if (node.children && node.children.length) {
          items.push(...flattenCategoriesTree(node.children, label));
        }
      });
      return items;
    },
    [],
  );

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activePicker]);

  useEffect(() => {
    if (filterOpen) {
      setSheetVisible(true);
      sheetAnim.stopAnimation();
      sheetAnim.setValue(0);
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (sheetVisible) {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSheetVisible(false);
      });
    }
  }, [filterOpen, sheetVisible, sheetAnim]);

  useEffect(() => {
    if (filterOpen) {
      setProductOpen(false);
    }
  }, [filterOpen]);

  useEffect(() => {
    if (!activePicker) return;
    if (activePicker === "country") {
      const term = pickerSearch.trim().toLowerCase();
      const filtered = countryOptions.filter((country) =>
        term
          ? country.name.toLowerCase().includes(term) ||
            country.code.toLowerCase().includes(term)
          : true,
      );
      setPickerOptions(filtered);
      return;
    }

    let isActive = true;
    const timeout = setTimeout(async () => {
      try {
        setPickerLoading(true);
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);
        let endpoint = "";
        if (activePicker === "category") {
          endpoint = `/api/selection/categories/tree?search=${encodeURIComponent(pickerSearch)}`;
        } else if (activePicker === "brand") {
          endpoint = `/api/selection/brands?search=${encodeURIComponent(pickerSearch)}`;
        } else if (activePicker === "grade") {
          endpoint = `/api/selection/grades?search=${encodeURIComponent(pickerSearch)}`;
        } else if (activePicker === "color") {
          endpoint = `/api/selections/colors${pickerSearch ? `?search=${encodeURIComponent(pickerSearch)}` : ""}`;
        } else if (activePicker === "spec") {
          endpoint = `/api/selections/specs${pickerSearch ? `?search=${encodeURIComponent(pickerSearch)}` : ""}`;
        } else if (activePicker === "storage") {
          endpoint = `/api/selections/storage${pickerSearch ? `?search=${encodeURIComponent(pickerSearch)}` : ""}`;
        }
        if (!endpoint) return;
        const response = await fetch(`${CONFIG.API_ENDPOINT}${endpoint}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });
        const json = await response.json();
        if (!isActive) return;
        if (activePicker === "category") {
          const flat = flattenCategories(
            json.status && Array.isArray(json.data) ? json.data : [],
          );
          setPickerOptions(flat);
        } else {
          setPickerOptions(
            json.status && Array.isArray(json.data)
              ? (json.data as SelectionOption[])
              : [],
          );
        }
      } catch {
        if (isActive) setPickerOptions([]);
      } finally {
        if (isActive) setPickerLoading(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [activePicker, pickerSearch, countryOptions, flattenCategories]);


  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSortOpen(false);
    if (selectedProduct && value.trim() !== selectedProduct.name) {
      setSelectedProduct(null);
    }
    if (!value.trim()) {
      setProductOptions([]);
      setProductOpen(false);
    } else {
      setProductOpen(true);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSelectedProduct(null);
    setProductOptions([]);
    setProductOpen(false);
  };

  useEffect(() => {
    const query = search.trim();
    if (!query || selectedProduct) {
      setProductLoading(false);
      setProductOptions([]);
      return;
    }

    let isActive = true;
    const timeout = setTimeout(async () => {
      try {
        setProductLoading(true);
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selection/products?search=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          },
        );
        const json = await response.json();
        if (isActive) {
          setProductOptions(
            json.status && Array.isArray(json.data)
              ? (json.data as ProductOption[])
              : [],
          );
        }
      } catch {
        if (isActive) setProductOptions([]);
      } finally {
        if (isActive) setProductLoading(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [search, selectedProduct]);

  const theme = {
    bg: screenTheme.bg,
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    border: screenTheme.border,
    primary: screenTheme.primary,
    chipBg: isDark ? "#111827" : "#F1F5F9",
  };

  const getPickerItemKey = (item: PickerOption, index: number) =>
    "id" in item ? String(item.id) : `${item.code}-${index}`;

  const getPickerItemLabel = (item: PickerOption) => {
    if ("code" in item) {
      return `${item.name} (${item.code})`;
    }
    if (activePicker === "category") {
      return item.label || item.name;
    }
    return item.name;
  };

  const applyPickerSelection = (picker: PickerType, item: PickerOption) => {
    if (picker === "country") {
      if (!("code" in item)) return;
      setFilters((prev) => ({ ...prev, country: item }));
      return;
    }

    if ("id" in item) {
      setFilters((prev) => ({
        ...prev,
        [picker]: item,
      }));
    }
  };

  const resolveUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace("http://localhost:8000", CONFIG.API_ENDPOINT);
  };

  const getUrl = (path: string) => {
    const base = CONFIG.API_ENDPOINT.endsWith("/")
      ? CONFIG.API_ENDPOINT.slice(0, -1)
      : CONFIG.API_ENDPOINT;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const buildDefaultMessage = (item: any) => {
    const name = item?.product?.name || "your product";
    return `Hi, I am interested in your product: ${name}. Can I get more details?`;
  };

  const openDetail = (item: any) => {
    setSelectedFeed(item);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setMessageVisible(false);
  };

  const openMessage = () => {
    if (!selectedFeed) return;
    setMessageText(buildDefaultMessage(selectedFeed));
    setMessageVisible(true);
  };

  const closeMessage = () => {
    setMessageVisible(false);
  };

  const formatType = (value?: string) => {
    if (!value) return "Offer";
    return value.toLowerCase() === "wtb" ? "Request" : "Offer";
  };

  const formatCondition = (value?: string) => {
    if (!value) return "N/A";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const currencySymbol = (value?: string) => {
    const code = (value || "").toLowerCase();
    if (code === "usd") return "$";
    if (code === "eur") return "€";
    if (code === "gbp") return "£";
    if (code === "aed") return "AED ";
    return value ? value.toUpperCase() + " " : "";
  };

  const formatPrice = (price?: string | number | null, currency?: string) => {
    if (price === null || price === undefined || price === "") {
      return "Negotiable";
    }
    const symbol = currencySymbol(currency);
    const numeric = Number(price);
    if (Number.isFinite(numeric)) {
      return `${symbol}${numeric.toFixed(2)}`;
    }
    return `${symbol}${price}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    try {
      return formatDistanceToNow(parseISO(value), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const findExistingChatId = useCallback(async (token: string, memberId: number) => {
    let offsetValue = 0;
    const limit = 50;

    while (offsetValue < 200) {
      const response = await fetch(getUrl("/api/gsmfeed-chat/get-chats"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offset: offsetValue, limit }),
      });

      if (!response.ok) return null;
      const json = await response.json();
      if (!json.status || !Array.isArray(json.data)) return null;

      const match = json.data.find((chat: any) =>
        chat?.members?.some((member: any) => Number(member?.id) === memberId),
      );
      if (match?.id) return match.id;

      if (json.data.length < limit) break;
      offsetValue += limit;
    }

    return null;
  }, []);

  const handleSendMessage = useCallback(async () => {
    const targetUserId = selectedFeed?.user?.id;
    if (!targetUserId) {
      Alert.alert("Unavailable", "Contact information is not available.");
      return;
    }

    const content = messageText.trim();
    if (!content) return;

    setSendingMessage(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        Alert.alert("Error", "User session not found.");
        return;
      }
      const user = JSON.parse(userString);
      const memberId = Number(targetUserId);
      const chatId = await findExistingChatId(user.token, memberId);
      const chatName =
        selectedFeed?.user?.name ||
        selectedFeed?.user?.username ||
        "Chat";

      if (chatId) {
        const response = await fetch(getUrl("/api/gsmfeed-chat/new-message"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            chat_id: chatId,
            content,
            type: "text",
          }),
        });
        const json = await response.json();
        if (!response.ok || !json.status) {
          Alert.alert("Failed", json.message || "Could not send message.");
          return;
        }

        setMessageVisible(false);
        setDetailVisible(false);
        router.push({
          pathname: "/screens/MessageBubble",
          params: {
            chatId: String(chatId),
            chatName,
            chatAvatar: selectedFeed?.user?.avatar || "",
          },
        });
        return;
      }

      const response = await fetch(getUrl("/api/gsmfeed-chat/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          members: [memberId],
          message: content,
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        Alert.alert("Failed", `Server returned ${response.status}.`);
        return;
      }
      const json = JSON.parse(responseText);
      if (!json.status) {
        Alert.alert("Failed", json.message || "Could not create chat.");
        return;
      }
      const createdChatId =
        json.data?.chat_id ?? json.data?.chat?.id ?? json.data?.id;
      if (!createdChatId) {
        Alert.alert("Failed", "Chat ID not found in response.");
        return;
      }

      setMessageVisible(false);
      setDetailVisible(false);
      router.push({
        pathname: "/screens/MessageBubble",
        params: {
          chatId: String(createdChatId),
          chatName,
          chatAvatar: selectedFeed?.user?.avatar || "",
          initialMessage: content,
        },
      });
    } catch {
      Alert.alert("Network Error", "Please check your connection.");
    } finally {
      setSendingMessage(false);
    }
  }, [findExistingChatId, messageText, router, selectedFeed]);

  const fetchFeeds = useCallback(
    async (nextOffset: number, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (nextOffset === 0) {
        setLoading(true);
      }

      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);
        const payload: any = {
          limit: LIMIT,
          offset: nextOffset,
          sortBy,
        };
        if (selectedProduct?.id) {
          payload.product_id = selectedProduct.id;
        }

        if (filters.country?.code) {
          payload.country_id = filters.country.code;
        }
        if (filters.category?.id) {
          payload.category_id = filters.category.id;
        }
        if (filters.type) {
          payload.type = filters.type;
        }
        if (filters.condition) {
          payload.condition = filters.condition;
        }
        if (filters.brand?.id) {
          payload.brand_id = filters.brand.id;
        }
        if (filters.grade?.id) {
          payload.grade_id = filters.grade.id;
        }
        if (filters.color?.id) {
          payload.color_id = filters.color.id;
        }
        if (filters.spec?.id) {
          payload.spec_id = filters.spec.id;
        }
        if (filters.storage?.id) {
          payload.storage_id = filters.storage.id;
        }

        const response = await fetch(`${CONFIG.API_ENDPOINT}/api/tradingfeed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json();
        if (json.status && json.data) {
          const records = json.data?.data || [];
          const total = Number(json.data?.total_records || 0);

          setFeeds((prev) => (isRefresh ? records : [...prev, ...records]));
          if (total) setTotalRecords(total);

          const nextHasMore = total
            ? nextOffset + records.length < total
            : records.length === LIMIT;
          setHasMore(nextHasMore);
        }
      } catch {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sortBy, selectedProduct?.id, filters.country?.code, filters.category?.id, filters.type, filters.condition, filters.brand?.id, filters.grade?.id, filters.color?.id, filters.spec?.id, filters.storage?.id],
  );

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setFeeds([]);
    setTotalRecords(0);
    fetchFeeds(0);
  }, [fetchFeeds]);

  const onRefresh = () => {
    setOffset(0);
    fetchFeeds(0, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading || refreshing) return;
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchFeeds(nextOffset);
  };

  const filteredFeeds = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return feeds;
    return feeds.filter((item) => {
      const productName = item?.product?.name || "";
      const brandName = item?.product?.brand?.name || "";
      const companyName =
        item?.user?.companyName ||
        item?.user?.name ||
        item?.user?.username ||
        "";
      return (
        productName.toLowerCase().includes(term) ||
        brandName.toLowerCase().includes(term) ||
        companyName.toLowerCase().includes(term)
      );
    });
  }, [feeds, search]);

  const renderItem = ({ item }: any) => {
    const typeLabel = formatType(item?.type);
    const typeColors =
      typeLabel === "Request"
        ? { bg: "#E8F5E9", text: "#2E7D32" }
        : { bg: "#EEF2FF", text: "#3730A3" };

    const imageUrl = resolveUrl(item?.images?.[0] || item?.product?.image);
    const brandName = item?.product?.brand?.name || "Unknown";
    const productName = item?.product?.name || "Unknown";
    const companyName =
      item?.user?.companyName ||
      item?.user?.name ||
      item?.user?.username ||
      "Unknown";
    const countryName = item?.spec?.name || item?.user?.country || "N/A";
    const condition = formatCondition(item?.condition);
    const priceLabel = formatPrice(item?.price, item?.currency);
    const qtyLabel =
      item?.qty === null || item?.qty === undefined ? "N/A" : String(item?.qty);
    const dateLabel = formatDate(item?.created_at);

    const chips = [
      item?.storage?.name,
      item?.grade?.name,
      item?.color?.name,
      item?.spec?.name,
    ].filter(Boolean);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        activeOpacity={0.9}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
            <Text style={[styles.typeText, { color: typeColors.text }]}>
              {typeLabel}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.subText }]}>
            {dateLabel}
          </Text>
        </View>

        <View style={styles.titleRow}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="image-outline" size={18} color={theme.subText} />
            </View>
          )}
          <View style={styles.titleBlock}>
            <Text style={[styles.productName, { color: theme.text }]}>
              {productName}
            </Text>
            <Text style={[styles.brandName, { color: theme.subText }]}>
              {brandName}
            </Text>
            {chips.length > 0 ? (
              <View style={styles.chipRow}>
                {chips.map((chip, index) => (
                  <View
                    key={`${item.id}-chip-${index}`}
                    style={[styles.chip, { backgroundColor: theme.chipBg }]}
                  >
                    <Text style={[styles.chipText, { color: theme.subText }]}>
                      {chip}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>
              Condition
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {condition}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>
              Price
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    priceLabel === "Negotiable" ? theme.subText : "#16A34A",
                },
              ]}
            >
              {priceLabel}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>
              Qty
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {qtyLabel}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>
              Country
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {countryName}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>
              Company
            </Text>
            <Text
              style={[styles.infoValue, { color: theme.text }]}
              numberOfLines={1}
            >
              {companyName}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>
              Date
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {dateLabel || "N/A"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeFeed = selectedFeed;
  const activeUser = selectedFeed?.user;
  const detailTypeLabel = activeFeed ? formatType(activeFeed?.type) : "";
  const detailTypeColors =
    detailTypeLabel === "Request"
      ? { bg: "#E8F5E9", text: "#2E7D32" }
      : { bg: "#EEF2FF", text: "#3730A3" };
  const detailImage = resolveUrl(
    activeFeed?.images?.[0] || activeFeed?.product?.image,
  );
  const detailPrice = activeFeed
    ? formatPrice(activeFeed?.price, activeFeed?.currency)
    : "";
  const detailCondition = formatCondition(activeFeed?.condition);
  const detailQty =
    activeFeed?.qty === null || activeFeed?.qty === undefined
      ? "N/A"
      : String(activeFeed?.qty);
  const detailSpecs = activeFeed?.spec?.name || "N/A";
  const detailStorage = activeFeed?.storage?.name || "N/A";
  const detailGrade = activeFeed?.grade?.name || "N/A";
  const detailColor = activeFeed?.color?.name || "N/A";
  const detailExtras = activeFeed?.extra_details || [];
  const contactName =
    activeUser?.name || activeUser?.username || "Unknown";
  const contactCompany = activeUser?.companyName || "N/A";
  const contactEmail = activeUser?.email || "N/A";
  const contactPhone = activeUser?.phone
    ? `${activeUser?.phone_country_code ? `+${activeUser.phone_country_code} ` : ""}${activeUser.phone}`
    : "N/A";
  const contactAvatar = resolveUrl(
    activeUser?.avatar_url || activeUser?.companyLogo,
  );
  const canMessage = !!activeUser?.id;

  const statsLabel = selectedProduct
    ? `${totalRecords || filteredFeeds.length} broadcasts found`
    : search.trim()
      ? `${filteredFeeds.length} results`
      : `${totalRecords || filteredFeeds.length} broadcasts found`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: 4 }]}>
        <Text style={[styles.mainTitle, { color: theme.text }]}>
          Tradingfeed
        </Text>
        <View style={styles.searchArea}>
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search-outline" size={18} color={theme.subText} />
              <TextInput
                placeholder="Search"
                placeholderTextColor={theme.subText}
                style={[styles.searchInput, { color: theme.text }]}
                value={search}
                onChangeText={handleSearchChange}
                onFocus={() => setProductOpen(true)}
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={16} color={theme.subText} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => {
                setFilterOpen(true);
                closePicker();
                setSortOpen(false);
                setProductOpen(false);
              }}
            >
              <Ionicons name="filter-outline" size={18} color={theme.subText} />
              <Text style={[styles.filterText, { color: theme.subText }]}>
                Filter
              </Text>
            </TouchableOpacity>
          </View>
          
          {productOpen && search.trim().length > 0 && !selectedProduct ? (
            <View
              style={[
                styles.productDropdown,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {productLoading ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <FlatList
                  data={productOptions}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.productOption}
                      onPress={() => {
                        setSelectedProduct(item);
                        setSearch(item.name);
                        setProductOpen(false);
                      }}
                    >
                      <Text style={[styles.productName, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.productMeta, { color: theme.subText }]}>
                        {item.brand} • {item.category}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.productList}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  ListEmptyComponent={() => (
                    <Text style={[styles.productEmpty, { color: theme.subText }]}>
                      No products found.
                    </Text>
                  )}
                />
              )}
            </View>
          ) : null}

        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: theme.subText }]}>
          {statsLabel}
        </Text>
        <View style={styles.sortWrapper}>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={() => setSortOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortText, { color: theme.text }]}>
              {activeSortLabel}
            </Text>
            <Ionicons
              name={sortOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.subText}
            />
          </TouchableOpacity>
          {sortOpen ? (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {sortOptions.map((option) => {
                const isActive = option.value === sortBy;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSortBy(option.value);
                      setSortOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: isActive ? theme.primary : theme.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={theme.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      {loading && feeds.length === 0 ? (
        <SkeletonLoader variant="feed" count={3} />
      ) : (
        <FlatList
          data={filteredFeeds}
          keyExtractor={(item, index) => String(item?.id || index)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          onScrollBeginDrag={() => {
            setSortOpen(false);
            setProductOpen(false);
          }}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={{ color: theme.subText, marginTop: 30 }}>
                No broadcasts found.
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
          ListFooterComponent={
            hasMore && !loading && filteredFeeds.length > 0 ? (
              <ActivityIndicator
                style={{ marginTop: 12 }}
                color={theme.primary}
              />
            ) : null
          }
        />
      )}

      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <View style={styles.detailOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeDetail}
          />
          <View
            style={[
              styles.detailCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: detailTypeColors.bg },
                  ]}
                >
                  <Text style={[styles.typeText, { color: detailTypeColors.text }]}>
                    {detailTypeLabel || "Offer"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={closeDetail}
                >
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.detailTitle, { color: theme.text }]}>
                {activeFeed?.product?.name || "Product"}
              </Text>
              <Text style={[styles.detailSubtitle, { color: theme.subText }]}>
                {activeFeed?.product?.brand?.name || ""}
              </Text>

              {detailImage ? (
                <Image source={{ uri: detailImage }} style={styles.detailImage} />
              ) : (
                <View style={[styles.detailImage, styles.detailImagePlaceholder]}>
                  <Ionicons name="image-outline" size={24} color={theme.subText} />
                </View>
              )}

              <View
                style={[
                  styles.detailSection,
                  { backgroundColor: theme.bg, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Overview</Text>
                <View style={styles.detailInfoGrid}>
                {[
                  { label: "Condition", value: detailCondition },
                  { label: "Qty", value: detailQty },
                  { label: "Specs", value: detailSpecs },
                  { label: "Storage", value: detailStorage },
                  { label: "Grade", value: detailGrade },
                  { label: "Color", value: detailColor },
                ].map((info) => (
                  <View key={info.label} style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: theme.subText }]}>
                      {info.label}
                    </Text>
                    <Text style={[styles.detailItemValue, { color: theme.text }]}>
                      {info.value}
                    </Text>
                  </View>
                ))}
                </View>
              </View>

              {detailExtras.length > 0 ? (
                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                    Details
                  </Text>
                  {detailExtras.map((extra: any, index: number) => (
                    <View key={`extra-${index}`} style={styles.detailExtraRow}>
                      <Text style={[styles.detailExtraLabel, { color: theme.subText }]}>
                        {extra?.name || ""}
                      </Text>
                      <Text style={[styles.detailExtraValue, { color: theme.text }]}>
                        {String(extra?.value ?? "") || "-"}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.detailActionRow}>
                <TouchableOpacity
                  style={[
                    styles.sendMessageBtn,
                    {
                      backgroundColor: canMessage ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={openMessage}
                  disabled={!canMessage}
                >
                  <Text
                    style={[
                      styles.sendMessageText,
                      { color: canMessage ? "#FFFFFF" : theme.subText },
                    ]}
                  >
                    Send Message
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.detailPricePill,
                    { borderColor: theme.border, backgroundColor: theme.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailPrice,
                      {
                        color:
                          detailPrice === "Negotiable" ? theme.subText : "#16A34A",
                      },
                    ]}
                  >
                    {detailPrice || "Negotiable"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.detailDivider,
                  { backgroundColor: theme.border },
                ]}
              />

              <View
                style={[
                  styles.detailSection,
                  { backgroundColor: theme.bg, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Contact</Text>
                <View style={styles.contactRow}>
                {contactAvatar ? (
                  <Image source={{ uri: contactAvatar }} style={styles.contactAvatar} />
                ) : (
                  <View
                    style={[
                      styles.contactAvatar,
                      styles.contactAvatarPlaceholder,
                    ]}
                  >
                    <Ionicons name="person" size={24} color={theme.subText} />
                  </View>
                )}
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactLabel, { color: theme.subText }]}>
                    Contact Person
                  </Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>
                    {contactName}
                  </Text>
                  <Text style={[styles.contactLabel, { color: theme.subText }]}>
                    Mobile
                  </Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>
                    {contactPhone}
                  </Text>
                  <Text style={[styles.contactLabel, { color: theme.subText }]}>
                    Email
                  </Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>
                    {contactEmail}
                  </Text>
                  <Text style={[styles.contactLabel, { color: theme.subText }]}>
                    Company
                  </Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>
                    {contactCompany}
                  </Text>
                </View>
                </View>
              </View>
            </ScrollView>

            {messageVisible ? (
              <View style={styles.messageLayer}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={closeMessage}
                />
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                  <View
                    style={[
                      styles.messageCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={[styles.messageTitle, { color: theme.text }]}>
                        Send Message
                      </Text>
                      <TouchableOpacity onPress={closeMessage}>
                        <Ionicons name="close" size={22} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      value={messageText}
                      onChangeText={setMessageText}
                      placeholder="Write a message..."
                      placeholderTextColor={theme.subText}
                      style={[
                        styles.messageInput,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                      multiline
                      maxLength={300}
                    />
                    <View style={styles.messageFooter}>
                      <Text style={[styles.messageCount, { color: theme.subText }]}>
                        {messageText.length}/300
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.messageSendBtn,
                          {
                            backgroundColor: theme.primary,
                            opacity:
                              sendingMessage || !messageText.trim() ? 0.6 : 1,
                          },
                        ]}
                        onPress={handleSendMessage}
                        disabled={sendingMessage || !messageText.trim()}
                      >
                        {sendingMessage ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.messageSendText}>Send</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>





      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                paddingBottom: insets.bottom + 8,
                transform: [{ translateY: sheetTranslateY }],
                opacity: sheetAnim,
              },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: theme.border }]}
            />
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}
            >
              <View style={styles.sheetHeaderLeft}>
                {isPickerView ? (
                  <TouchableOpacity style={styles.backBtn} onPress={closePicker}>
                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                  </TouchableOpacity>
                ) : null}
                <Text style={[styles.sheetTitle, { color: theme.text }]}>{sheetTitle}</Text>
              </View>
              <TouchableOpacity onPress={closeSheet}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            {isPickerView ? (
              <>
                <View
                  style={[
                    styles.pickerSearch,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="search-outline" size={18} color={theme.subText} />
                  <TextInput
                    placeholder={`Search ${activePickerTitle}`}
                    placeholderTextColor={theme.subText}
                    style={[styles.pickerInput, { color: theme.text }]}
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                  />
                </View>
                {pickerLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={theme.primary} size="large" />
                  </View>
                ) : (
                  <FlatList
                    data={pickerOptions}
                    keyExtractor={getPickerItemKey}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                      const label = getPickerItemLabel(item);
                      return (
                        <TouchableOpacity
                          style={[styles.pickerRow, { borderBottomColor: theme.border }]}
                          onPress={() => {
                            if (!activePicker) return;
                            applyPickerSelection(activePicker, item);
                            closePicker();
                          }}
                        >
                          <Text style={[styles.pickerText, { color: theme.text }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={() => (
                      <Text style={[styles.productEmpty, { color: theme.subText }]}>No results.</Text>
                    )}
                  />
                )}
              </>
            ) : (
              <>
                <ScrollView
                  contentContainerStyle={styles.filterContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("country")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.country ? theme.text : theme.subText },
                      ]}
                    >
                      {filters.country
                        ? `${filters.country.name} (${filters.country.code})`
                        : "Country"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("category")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.category ? theme.text : theme.subText },
                      ]}
                      numberOfLines={1}
                    >
                      {filters.category?.label || filters.category?.name || "Category"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.segmentRow,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        filters.type === "wts" && styles.segmentActive,
                      ]}
                      onPress={() => toggleType("wts")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              filters.type === "wts" ? theme.primary : theme.subText,
                          },
                        ]}
                      >
                        Offer
                      </Text>
                    </TouchableOpacity>
                    <View style={[styles.segmentDivider, { backgroundColor: theme.border }]} />
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        filters.type === "wtb" && styles.segmentActive,
                      ]}
                      onPress={() => toggleType("wtb")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              filters.type === "wtb" ? theme.primary : theme.subText,
                          },
                        ]}
                      >
                        Request
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("brand")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.brand ? theme.text : theme.subText },
                      ]}
                    >
                      {filters.brand?.name || "Brand"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.segmentRow,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        filters.condition === "new" && styles.segmentActive,
                      ]}
                      onPress={() => toggleCondition("new")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              filters.condition === "new"
                                ? theme.primary
                                : theme.subText,
                          },
                        ]}
                      >
                        New
                      </Text>
                    </TouchableOpacity>
                    <View style={[styles.segmentDivider, { backgroundColor: theme.border }]} />
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        filters.condition === "used" && styles.segmentActive,
                      ]}
                      onPress={() => toggleCondition("used")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color:
                              filters.condition === "used"
                                ? theme.primary
                                : theme.subText,
                          },
                        ]}
                      >
                        Used
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("grade")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.grade ? theme.text : theme.subText },
                      ]}
                    >
                      {filters.grade?.name || "Grade"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("color")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.color ? theme.text : theme.subText },
                      ]}
                    >
                      {filters.color?.name || "Color"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("spec")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.spec ? theme.text : theme.subText },
                      ]}
                    >
                      {filters.spec?.name || "Specification"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterField,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                    onPress={() => openPicker("storage")}
                  >
                    <Text
                      style={[
                        styles.filterValue,
                        { color: filters.storage ? theme.text : theme.subText },
                      ]}
                    >
                      {filters.storage?.name || "Storage"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                  </TouchableOpacity>
                </ScrollView>
                <View
                  style={[
                    styles.sheetFooter,
                    { borderTopColor: theme.border, backgroundColor: theme.bg },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.clearBtn,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    onPress={clearFilters}
                  >
                    <Text style={[styles.clearText, { color: theme.text }]}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                    onPress={() => setFilterOpen(false)}
                  >
                    <Text style={styles.applyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  mainTitle: { fontSize: 26, fontWeight: "800", marginBottom: 12 },
  searchArea: { marginBottom: 8 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { fontSize: 15, flex: 1 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  statsText: { fontSize: 13 },
  sortWrapper: { position: "relative", alignItems: "flex-end" },
  sortBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sortText: { fontSize: 12, fontWeight: "600" },
  dropdown: {
    position: "absolute",
    right: 0,
    top: 38,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 190,
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dropdownText: { fontSize: 13, fontWeight: "600" },
  productDropdown: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    maxHeight: 220,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  productList: {
    maxHeight: 220,
    flexGrow: 0,
  },
  productOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  productMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  productEmpty: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: { fontSize: 12, fontWeight: "700" },
  dateText: { fontSize: 12 },
  titleRow: { flexDirection: "row", gap: 12 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  titleBlock: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "700" },
  brandName: { fontSize: 13, marginTop: 2 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  infoItem: {
    width: "50%",
    marginBottom: 10,
  },
  infoLabel: { fontSize: 11, fontWeight: "600" },
  infoValue: { fontSize: 13, marginTop: 2, fontWeight: "600" },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    padding: 16,
  },
  detailCard: {
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "90%",
    overflow: "hidden",
    position: "relative",
  },
  detailContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailCloseBtn: { padding: 4 },
  detailSubtitle: { fontSize: 13, fontWeight: "600" },
  detailTitle: { fontSize: 22, fontWeight: "800" },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  detailImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  detailSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  detailInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  detailItem: { width: "48%" },
  detailItemLabel: { fontSize: 12, fontWeight: "600" },
  detailItemValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  detailExtras: { gap: 8 },
  detailSectionTitle: { fontSize: 14, fontWeight: "700" },
  detailExtraRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailExtraLabel: { fontSize: 12, fontWeight: "600" },
  detailExtraValue: { fontSize: 13, fontWeight: "700" },
  detailPricePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  detailActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sendMessageBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
  },
  sendMessageText: { fontSize: 15, fontWeight: "700" },
  detailPrice: { fontSize: 16, fontWeight: "800" },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  contactRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  contactAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E2E8F0",
  },
  contactAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 12, fontWeight: "600", marginTop: 8 },
  contactValue: { fontSize: 14, fontWeight: "700" },
  messageLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    justifyContent: "center",
    padding: 16,
    zIndex: 10,
  },
  messageCard: {
    borderRadius: 20,
    padding: 16,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  messageTitle: { fontSize: 18, fontWeight: "700" },
  messageInput: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  messageCount: { fontSize: 12, fontWeight: "600" },
  messageSendBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  messageSendText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "88%",
    overflow: "hidden",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtn: { paddingRight: 4, paddingVertical: 2 },
  filterContent: { padding: 16, paddingBottom: 120, gap: 12 },
  filterField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterValue: { fontSize: 14, fontWeight: "600", flex: 1 },
  segmentRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "rgba(59, 102, 245, 0.12)",
  },
  segmentText: { fontSize: 14, fontWeight: "600" },
  segmentDivider: { width: StyleSheet.hairlineWidth },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  clearText: { fontSize: 14, fontWeight: "600" },
  applyBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  applyText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  pickerSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerInput: { flex: 1, fontSize: 14 },
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: { fontSize: 14, fontWeight: "600" },
});

export default TradingFeed;
