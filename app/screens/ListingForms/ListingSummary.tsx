import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CONFIG from "../../../shared/config";
import { useTheme } from "../../../shared/themeContext";

interface ListingSummaryProps {
  onNext: (data: any) => void; // Updated to pass data to parent
  onBack: () => void;
  onAddMore?: () => void;
  onEditProduct?: (index: number) => void;
  listingData: any;
}

const normalizeImageUris = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof item.uri === "string") {
          return item.uri;
        }
        return "";
      })
      .filter((uri) => uri.length > 0);
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? [value] : [];
  }
  return [];
};

const ListingSummary = ({
  onNext,
  onBack,
  onAddMore,
  onEditProduct,
  listingData,
}: ListingSummaryProps) => {
  const { isDark, screenTheme } = useTheme();
  const [remarks, setRemarks] = useState(listingData?.remarks || "");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(
    Array.isArray(listingData?.hashtags) ? listingData.hashtags : [],
  );
  const [expandedProducts, setExpandedProducts] = useState<number[]>([0]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Hashtag States
  const [hashtagInput, setHashtagInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFetchingHashtags, setIsFetchingHashtags] = useState(false);

  const colors = {
    bg: screenTheme.bg,
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    border: screenTheme.border,
    primary: "#3B82F6",
    inputBg: isDark ? "#1E293B" : screenTheme.card,
    labelBg: isDark ? "#1E293B" : "#F1F5F9",
  };

  const products = useMemo(() => {
    if (Array.isArray(listingData?.products) && listingData.products.length > 0) {
      return listingData.products;
    }
    if (listingData?.model || listingData?.price || listingData?.quantity) {
      return [listingData];
    }
    return [];
  }, [listingData]);

  useEffect(() => {
    setRemarks(listingData?.remarks || "");
    setSelectedHashtags(
      Array.isArray(listingData?.hashtags) ? listingData.hashtags : [],
    );
  }, [listingData]);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString || !mounted) return;
        const parsed = JSON.parse(userString);
        if (mounted) setCurrentUser(parsed);
      } catch {}
    };
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Instead of submitting the post here, we pass the current state
   * (remarks and hashtags) to the parent to move to Step 2.5 (AI)
   */
  const handleNextStep = () => {
    onNext({
      remarks,
      hashtags: selectedHashtags,
    });
  };

  // --- Hashtag Logic ---
  const getHashtags = async (inputValue: string) => {
    setHashtagInput(inputValue);
    if (!inputValue.trim()) {
      setSearchResults([]);
      return;
    }

    setIsFetchingHashtags(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;

      const res = await fetch(`${CONFIG.API_ENDPOINT}/api/hashtag/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ search: inputValue }),
      });

      if (res.ok) {
        const data = await res.json();
        const formatted = data?.data
          ?.filter((d: any) => !d?.name?.includes("#"))
          .map((item: any) => ({
            label: `#${item?.name}`,
            value: item?.name,
          }));
        setSearchResults(formatted || []);
      }
    } catch (error) {
      console.error("Hashtag search error:", error);
      setSearchResults([]);
    } finally {
      setIsFetchingHashtags(false);
    }
  };

  const handleAddHashtag = (tag: string) => {
    const cleanTag = tag.replace("#", "").trim();
    if (cleanTag && !selectedHashtags.includes(cleanTag)) {
      setSelectedHashtags([...selectedHashtags, cleanTag]);
    }
    setHashtagInput("");
    setSearchResults([]);
  };

  const removeHashtag = (tag: string) => {
    setSelectedHashtags(selectedHashtags.filter((t) => t !== tag));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: "66%" }]} />
        </View>
        <Text style={[styles.stepLabel, { color: colors.subText }]}>
          Step 2 of 3
        </Text>
      </View>

      <View style={styles.header}>
        <Image
          source={{ uri: "https://gsmfeed.com/logo.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={onBack}>
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                currentUser?.avatar_url ||
                currentUser?.avatar ||
                "https://i.pravatar.cc/150?u=user",
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {currentUser?.name || currentUser?.username || "User"}
              </Text>
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather key={s} name="star" size={14} color="#F59E0B" />
              ))}
            </View>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  listingData?.type === "Buy" ? "#DCFCE7" : "#EEF2FF",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: listingData?.type === "Buy" ? "#166534" : "#6366F1" },
              ]}
            >
              {listingData?.type || "Sell"}
            </Text>
          </View>
        </View>

        {products.map((product, index) => {
          const expanded = expandedProducts.includes(index);
          return (
            <View
              key={`${product?.model || "product"}-${index}`}
              style={[
                styles.productCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.productHeader}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandedProducts((prev) =>
                      prev.includes(index)
                        ? prev.filter((i) => i !== index)
                        : [...prev, index],
                    )
                  }
                  style={styles.productCollapseBtn}
                >
                  <Text style={[styles.productTitle, { color: colors.text }]}>
                    {product?.model || `Product ${index + 1}`}
                  </Text>
                  <Feather
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.subText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (onEditProduct) {
                      onEditProduct(index);
                    } else {
                      onBack();
                    }
                  }}
                >
                  <Feather name="edit-3" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {expanded ? (
                <>
                  <View style={styles.detailList}>
                    <DetailItem
                      label="Price:"
                      value={`${product?.currency || "USD"} ${product?.price || "0"}`}
                      color="#10B981"
                      colors={colors}
                    />
                    <DetailItem
                      label="Condition:"
                      value={product?.condition}
                      colors={colors}
                    />
                    {String(product?.condition || "").toLowerCase() === "used" ? (
                      <DetailItem
                        label="Grade:"
                        value={product?.grade || "Not Set"}
                        colors={colors}
                      />
                    ) : null}
                    <DetailItem
                      label="Storage:"
                      value={product?.storage}
                      colors={colors}
                    />
                    <DetailItem
                      label="Color:"
                      value={product?.color || "Not Set"}
                      colors={colors}
                    />
                    <DetailItem
                      label="Spec:"
                      value={product?.specs || "Not Set"}
                      colors={colors}
                    />
                    <DetailItem
                      label="Quantity:"
                      value={`${product?.quantity || 0} Pcs`}
                      colors={colors}
                    />
                  </View>

                  <View style={styles.imageGallery}>
                    {(() => {
                      const imageUris = normalizeImageUris(product?.images);

                      if (imageUris.length === 0) {
                        return (
                          <View
                            style={[
                              styles.productThumbnail,
                              {
                                backgroundColor: colors.labelBg,
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <Feather name="image" size={24} color={colors.subText} />
                          </View>
                        );
                      }

                      return (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.imageRow}
                        >
                          {imageUris.map((uri: string, imageIndex: number) => (
                            <Image
                              key={`${uri}-${imageIndex}`}
                              source={{ uri }}
                              style={[
                                styles.productThumbnail,
                                imageIndex !== imageUris.length - 1 &&
                                  styles.productThumbnailSpacing,
                              ]}
                            />
                          ))}
                        </ScrollView>
                      );
                    })()}
                  </View>
                </>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addMoreBtn, { borderColor: colors.primary }]}
          onPress={onAddMore || onBack}
        >
          <Text style={[styles.addMoreText, { color: colors.primary }]}>
            Add more products
          </Text>
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Remarks */}
        <View style={styles.inputSection}>
          <View
            style={[
              styles.remarksContainer,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.inputLabel,
                { color: colors.subText, backgroundColor: colors.bg },
              ]}
            >
              Remarks
            </Text>
            <TextInput
              style={[styles.remarksInput, { color: colors.text }]}
              placeholder="Add your remarks here..."
              placeholderTextColor={colors.subText}
              multiline
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>
        </View>

        {/* Hashtags Search & Creation */}
        <View style={styles.inputSection}>
          <View
            style={[
              styles.hashtagContainer,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.inputLabel,
                { color: colors.subText, backgroundColor: colors.bg },
              ]}
            >
              Hashtags
            </Text>
            <View style={styles.tagRow}>
              {selectedHashtags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.labelBg }]}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    #{tag}
                  </Text>
                  <TouchableOpacity onPress={() => removeHashtag(tag)}>
                    <Feather name="x" size={14} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder="Add tag..."
                placeholderTextColor={colors.subText}
                value={hashtagInput}
                onChangeText={getHashtags}
                onSubmitEditing={() => handleAddHashtag(hashtagInput)}
              />
              {isFetchingHashtags && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
          </View>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <View
              style={[
                styles.dropdownContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => handleAddHashtag(item.label)}
                  >
                    <Text style={{ color: colors.text }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleNextStep} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.backBtnText, { color: colors.subText }]}>
            Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailItem = ({ label, value, color, colors }: any) => (
  <View style={styles.detailItem}>
    <Text style={[styles.detailLabel, { color: colors?.subText || "#64748B" }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.detailValue,
        { color: color || colors?.text || "#1E293B" },
      ]}
    >
      {value || "---"}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "center",
  },
  progressBar: { width: "100%", height: 6, borderRadius: 3, marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#3B82F6", borderRadius: 3 },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  logo: { width: 120, height: 30 },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  profileInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  userName: { fontSize: 16, fontWeight: "700" },
  ratingRow: { flexDirection: "row", marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: "600", fontSize: 12 },
  productCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  productCollapseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  productTitle: { fontSize: 18, fontWeight: "800", flex: 1 },
  detailList: { marginBottom: 15 },
  detailItem: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 6,
  },
  detailLabel: { width: 100, fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: "700" },
  imageGallery: { marginTop: 10 },
  imageRow: { paddingRight: 4 },
  productThumbnail: { width: 80, height: 80, borderRadius: 12 },
  productThumbnailSpacing: { marginRight: 10 },
  addMoreBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 25,
  },
  addMoreText: { fontWeight: "700", fontSize: 16 },
  inputSection: { marginBottom: 25, position: "relative", zIndex: 10 },
  remarksContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 120,
    padding: 15,
    position: "relative",
  },
  remarksInput: { fontSize: 15, textAlignVertical: "top", flex: 1 },
  inputLabel: {
    position: "absolute",
    top: -10,
    left: 15,
    paddingHorizontal: 5,
    fontSize: 12,
    fontWeight: "600",
  },
  hashtagContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 60,
    position: "relative",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  tagText: { fontSize: 13, fontWeight: "600" },
  tagInput: { minWidth: 80, fontSize: 14, paddingVertical: 4 },
  dropdownContainer: {
    position: "absolute",
    top: 65,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 150,
    zIndex: 100,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  nextBtn: {
    backgroundColor: "#3B82F6",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
  },
  nextBtnText: { color: "#FFF", fontWeight: "800", fontSize: 18 },
  backBtn: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  backBtnText: { fontWeight: "600", fontSize: 16 },
});

export default ListingSummary;
