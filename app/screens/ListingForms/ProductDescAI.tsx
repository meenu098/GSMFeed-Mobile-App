import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AiIcon } from "../../../components/icons/icons";
import CONFIG from "../../../shared/config";
import { useTheme } from "../../../shared/themeContext";

const TONES = [
  { label: "Professional", value: "Professional" },
  { label: "Casual", value: "Casual" },
  { label: "Funny", value: "Funny" },
  { label: "Simple", value: "Simple" },
];

type UploadableImage = {
  uri: string;
  name: string;
  type: string;
};

const extensionToMimeType: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
};

const inferFileMeta = (
  uri: string,
  index: number,
): { name: string; type: string } => {
  const cleanUri = uri.split("?")[0] || uri;
  const fileNameCandidate = cleanUri.split("/").pop() || "";
  const hasExtension = fileNameCandidate.includes(".");
  const generatedName = `photo-${Date.now()}-${index}.jpg`;
  const name = hasExtension ? fileNameCandidate : generatedName;
  const extension = name.split(".").pop()?.toLowerCase() || "jpg";
  const type = extensionToMimeType[extension] || "image/jpeg";
  return { name, type };
};

const normalizeMimeType = (value: unknown, fallbackType: string): string => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw || raw === "image" || raw === "file") return fallbackType;
  if (raw.startsWith("image/")) return raw;
  return extensionToMimeType[raw] || fallbackType;
};

const normalizeUploadImages = (value: unknown): UploadableImage[] => {
  if (!value) return [];

  const inputItems = Array.isArray(value) ? value : [value];
  const output: UploadableImage[] = [];
  const seenUris = new Set<string>();

  inputItems.forEach((item: any, index) => {
    let uri = "";
    let name = "";
    let type = "";

    if (typeof item === "string") {
      uri = item.trim();
      if (!uri) return;
      const inferred = inferFileMeta(uri, index);
      name = inferred.name;
      type = inferred.type;
    } else if (
      item &&
      typeof item === "object" &&
      typeof item.uri === "string"
    ) {
      uri = item.uri.trim();
      if (!uri) return;
      const inferred = inferFileMeta(uri, index);
      name =
        (typeof item.name === "string" && item.name.trim()) ||
        (typeof item.fileName === "string" && item.fileName.trim()) ||
        inferred.name;
      type = normalizeMimeType(
        (typeof item.type === "string" && item.type.trim()) ||
          (typeof item.mimeType === "string" && item.mimeType.trim()) ||
          inferred.type,
        inferred.type,
      );
    } else {
      return;
    }

    if (seenUris.has(uri)) return;
    seenUris.add(uri);
    output.push({ uri, name, type });
  });

  return output;
};

const ProductDescAI = ({ listingData, onNext, onBack }: any) => {
  const { screenTheme } = useTheme();
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedDesc, setSelectedDesc] = useState("");
  const submitButtonLabel = selectedDesc?.trim() ? "Post" : "Skip & Post";

  const colors = {
    bg: screenTheme.bg,
    card: screenTheme.card,
    text: screenTheme.text,
    primary: "#3B82F6",
    border: screenTheme.border,
  };

  const products =
    Array.isArray(listingData?.products) && listingData.products.length > 0
      ? listingData.products
      : [listingData];
  const aiApiCandidates = [
    `${CONFIG.APP_URL}/api/ai/product-description`,
    `${CONFIG.API_ENDPOINT}/api/ai/product-description`,
  ];

  const mapTypeToTradingType = (type: string | undefined) => {
    return type?.toLowerCase() === "buy" ? "wtb" : "wts";
  };

  const mapCondition = (condition: string | undefined) => {
    return condition?.toUpperCase() === "USED" ? "used" : "new";
  };

  const selectionEndpointByField: Record<
    "storage" | "color" | "spec" | "grade",
    string
  > = {
    storage: "selections/storage",
    color: "selections/colors",
    spec: "selections/specs",
    grade: "selection/grades",
  };

  const selectionIdCache = new Map<string, string | null>();

  const resolveSelectionId = async (
    field: "storage" | "color" | "spec" | "grade",
    rawValue: unknown,
  ) => {
    const normalized = String(rawValue ?? "").trim();
    if (!normalized) return null;

    const key = `${field}:${normalized.toLowerCase()}`;
    if (selectionIdCache.has(key)) {
      return selectionIdCache.get(key) || null;
    }

    try {
      const endpoint = selectionEndpointByField[field];
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/${endpoint}?search=${encodeURIComponent(normalized)}`,
      );
      if (!response.ok) {
        selectionIdCache.set(key, null);
        return null;
      }

      const result = await response.json();
      const options = Array.isArray(result?.data) ? result.data : [];

      const exactMatch =
        options.find(
          (entry: any) =>
            String(entry?.name ?? "")
              .trim()
              .toLowerCase() === normalized.toLowerCase(),
        ) || options[0];

      const resolvedId =
        exactMatch?.id !== undefined && exactMatch?.id !== null
          ? String(exactMatch.id)
          : null;

      selectionIdCache.set(key, resolvedId);
      return resolvedId;
    } catch {
      selectionIdCache.set(key, null);
      return null;
    }
  };

  const toUploadFile = (image: UploadableImage, index: number) => {
    const inferred = inferFileMeta(image.uri, index);
    const type = normalizeMimeType(image.type, inferred.type);
    const name = image.name || inferred.name;
    return { uri: image.uri, name, type } as any;
  };

  const parseAiSuggestions = (rawData: any): string[] => {
    if (Array.isArray(rawData)) {
      return rawData.map((item) => String(item)).filter(Boolean);
    }

    if (typeof rawData === "string") {
      try {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item)).filter(Boolean);
        }
      } catch {}
      return rawData ? [rawData] : [];
    }

    if (rawData && typeof rawData === "object") {
      return Object.values(rawData)
        .map((item) => String(item))
        .filter(Boolean);
    }

    return [];
  };

  /**
   * AI GENERATION LOGIC
   * Hits the AI service (Port 3000)
   */
  const generateAIDescription = async (emotion: string) => {
    setSelectedTone(emotion);
    setIsCompiling(true);
    setRecommendations([]);

    const productDetails = products
      .map((product: any, index: number) => {
        const details = [
          product.condition && `Condition: ${product.condition}`,
          product.grade && `Grade: ${product.grade}`,
          product.model && `Model: ${product.model}`,
          product.color && `Color: ${product.color}`,
          product.storage && `Storage: ${product.storage}`,
          product.specs && `Spec: ${product.specs}`,
          product.quantity && `Quantity: ${product.quantity}`,
          `Type: ${mapTypeToTradingType(product.type)}`,
        ]
          .filter(Boolean)
          .join(", ");
        return `Product ${index + 1}: ${details}`;
      })
      .join(" | ");

    try {
      let resolved = false;
      let lastStatus = 0;

      for (const aiUrl of aiApiCandidates) {
        const res = await fetch(aiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productDetails, emotion }),
        });

        lastStatus = res.status;
        if (!res.ok) continue;

        const result = await res.json();
        if (result?.success === false || result?.status === false) {
          Alert.alert(
            "AI Error",
            result?.message || "Failed to generate AI descriptions.",
          );
          return;
        }

        const suggestions = parseAiSuggestions(result?.data);
        setRecommendations(suggestions);
        if (suggestions.length > 0) {
          setSelectedDesc(suggestions[0]);
        } else {
          Alert.alert("AI Error", "No descriptions were generated.");
        }
        resolved = true;
        break;
      }

      if (!resolved) {
        Alert.alert(
          "AI API Not Found",
          `Could not reach AI route. Last status: ${lastStatus}.`,
        );
      }
    } catch (error) {
      console.error("AI Fetch Error:", error);
      Alert.alert("Connection Error", "Could not reach AI service.");
    } finally {
      setIsCompiling(false);
    }
  };

  /**
   * FINAL POSTING LOGIC
   * Triggered by "Skip & Post"
   */
  const handleFinalPost = async () => {
    if (isPosting) return;
    setIsPosting(true);

    try {
      const userString = await AsyncStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;
      const shapedData = new FormData();

      // 1. Basic Metadata
      const selectedAiContent = String(
        selectedDesc || recommendations[0] || "",
      ).trim();
      const fallbackRemarks = String(listingData.remarks || "").trim();
      shapedData.append("content", selectedAiContent || fallbackRemarks);
      shapedData.append("visibility", "public");
      shapedData.append("type", "normal");

      // 2. Hashtags
      if (listingData.hashtags) {
        listingData.hashtags.forEach((tag: string) => {
          shapedData.append("hashtags[]", tag.replace("#", ""));
        });
      }

      const allUploadImages = products.flatMap((product: any) =>
        normalizeUploadImages(product?.images),
      );
      const unsupportedImage = allUploadImages.find((image: any) => {
        const lowerType = String(image?.type || "").toLowerCase();
        const lowerName = String(image?.name || "").toLowerCase();
        const uri = String(image?.uri || "").toLowerCase();
        return (
          uri.startsWith("ph://") ||
          lowerType.includes("heic") ||
          lowerType.includes("heif") ||
          lowerName.endsWith(".heic") ||
          lowerName.endsWith(".heif")
        );
      });

      if (unsupportedImage) {
        Alert.alert(
          "Unsupported Image",
          "Please upload JPG or PNG images. HEIC/HEIF photos are not supported by this API.",
        );
        return;
      }

      for (const [index, product] of products.entries()) {
        const aiDescription =
          selectedDesc || recommendations[0] || product?.remarks || "";

        const storageId =
          product.storageId ||
          (await resolveSelectionId("storage", product.storage));
        const colorId =
          product.colorId || (await resolveSelectionId("color", product.color));
        const specId =
          product.specsId || (await resolveSelectionId("spec", product.specs));
        const isUsedProduct =
          String(product.condition || "").toLowerCase() === "used";
        const gradeId = isUsedProduct
          ? product.gradeId ||
            (await resolveSelectionId("grade", product.grade))
          : null;

        shapedData.append(
          `trading_feeds[${index}][type]`,
          mapTypeToTradingType(product.type),
        );

        if (product.modelId) {
          shapedData.append(
            `trading_feeds[${index}][product_id]`,
            String(product.modelId),
          );
        } else {
          shapedData.append(
            `trading_feeds[${index}][product_name]`,
            product.model || "",
          );
          shapedData.append(`trading_feeds[${index}][brand]`, "Apple");
          shapedData.append(
            `trading_feeds[${index}][category]`,
            "Mobile Phones",
          );
        }

        shapedData.append(
          `trading_feeds[${index}][condition]`,
          mapCondition(product.condition),
        );
        if (gradeId) {
          shapedData.append(
            `trading_feeds[${index}][grade_id]`,
            String(gradeId),
          );
        }
        if (isUsedProduct && product.grade) {
          shapedData.append(
            `trading_feeds[${index}][grade_name]`,
            String(product.grade),
          );
          shapedData.append(
            `trading_feeds[${index}][grade]`,
            String(product.grade),
          );
        }
        if (storageId) {
          shapedData.append(
            `trading_feeds[${index}][storage_id]`,
            String(storageId),
          );
        }
        if (product.storage) {
          shapedData.append(
            `trading_feeds[${index}][storage_name]`,
            String(product.storage),
          );
          shapedData.append(
            `trading_feeds[${index}][storage]`,
            String(product.storage),
          );
        }
        if (colorId) {
          shapedData.append(
            `trading_feeds[${index}][color_id]`,
            String(colorId),
          );
        }
        if (product.color) {
          shapedData.append(
            `trading_feeds[${index}][color_name]`,
            String(product.color),
          );
          shapedData.append(
            `trading_feeds[${index}][color]`,
            String(product.color),
          );
        }
        if (specId) {
          shapedData.append(`trading_feeds[${index}][spec_id]`, String(specId));
        }
        if (product.specs) {
          shapedData.append(
            `trading_feeds[${index}][spec_name]`,
            String(product.specs),
          );
          shapedData.append(
            `trading_feeds[${index}][spec]`,
            String(product.specs),
          );
          shapedData.append(
            `trading_feeds[${index}][psec]`,
            String(product.specs),
          );
        }
        const qtyValue = String(product.quantity ?? "").trim();
        shapedData.append(`trading_feeds[${index}][qty]`, qtyValue || "1");
        shapedData.append(
          `trading_feeds[${index}][currency]`,
          (product.currency || "usd").toLowerCase(),
        );
        shapedData.append(
          `trading_feeds[${index}][price]`,
          String(product.price || 0),
        );
        shapedData.append(
          `trading_feeds[${index}][ai_description]`,
          aiDescription,
        );

        if (Array.isArray(product.extraDetails)) {
          product.extraDetails.forEach((detail: any, detailIndex: number) => {
            const label = detail?.label || detail?.name;
            const value = detail?.value;
            if (!label && !value) return;
            shapedData.append(
              `trading_feeds[${index}][extra_details][${detailIndex}][name]`,
              String(label || ""),
            );
            shapedData.append(
              `trading_feeds[${index}][extra_details][${detailIndex}][value]`,
              String(value || ""),
            );
          });
        }

        const productImages = normalizeUploadImages(product?.images);
        productImages.forEach((image: UploadableImage, imageIndex: number) => {
          const imageUri = String(image?.uri || "").trim();
          if (
            !imageUri ||
            imageUri.startsWith("http://") ||
            imageUri.startsWith("https://")
          ) {
            return;
          }
          shapedData.append(
            `trading_feeds[${index}][images][${imageIndex}]`,
            toUploadFile(image, imageIndex),
          );
        });
      }

      // 6. Submit to API
      const res = await fetch(`${CONFIG.API_ENDPOINT}/api/feed/new-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          Accept: "application/json",
        },
        body: shapedData,
      });

      const result = await res.json();
      if (res.ok && result.status) {
        const createdPostId =
          result?.data?.main_post_id ??
          result?.data?.post_id ??
          result?.data?.id ??
          result?.post_id ??
          result?.id;

        onNext({
          selectedDesc,
          postId: createdPostId ? String(createdPostId) : undefined,
        });
      } else {
        // Improved error reporting
        const hasHeicImage = products.some((product: any) =>
          normalizeUploadImages(product?.images).some((image) => {
            const lowerType = String(image?.type || "").toLowerCase();
            const lowerName = String(image?.name || "").toLowerCase();
            return (
              lowerType.includes("heic") ||
              lowerType.includes("heif") ||
              lowerName.endsWith(".heic") ||
              lowerName.endsWith(".heif")
            );
          }),
        );
        const errorMsg = result.errors
          ? Object.values(result.errors).flat().join("\n")
          : result.message;
        if (
          hasHeicImage &&
          String(errorMsg || "")
            .toLowerCase()
            .includes("must be an image")
        ) {
          Alert.alert(
            "Validation Error",
            `${errorMsg}\n\nYour photo appears to be HEIC/HEIF. Please upload JPG/PNG, or set iPhone Camera > Formats to Most Compatible.`,
          );
          return;
        }

        Alert.alert("Validation Error", errorMsg);
      }
    } catch (error) {
      console.error("Post Error:", error);
      Alert.alert("Network Error", "Please check your server connection.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.aiCard,
            { backgroundColor: colors.card, borderColor: colors.primary },
          ]}
        >
          <TouchableOpacity
            style={[styles.aiHeaderBtn, { borderColor: colors.primary }]}
            onPress={() => generateAIDescription(selectedTone)}
          >
            <AiIcon color={colors.primary} />
            <Text style={[styles.aiHeaderBtnText, { color: colors.primary }]}>
              Use AI generated description
            </Text>
          </TouchableOpacity>

          <View style={styles.toneRow}>
            {TONES.map((tone) => (
              <TouchableOpacity
                key={tone.value}
                style={[
                  styles.toneBtn,
                  { borderColor: colors.border },
                  selectedTone === tone.value && styles.toneBtnActive,
                ]}
                onPress={() => generateAIDescription(tone.value)}
              >
                <Text
                  style={[
                    styles.toneText,
                    { color: colors.text },
                    selectedTone === tone.value && { color: "#FFF" },
                  ]}
                >
                  {tone.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.contentArea}>
            {isCompiling ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ margin: 40 }}
              />
            ) : (
              recommendations.map((desc, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.descItem,
                    selectedDesc === desc && styles.selectedDescItem,
                  ]}
                  onPress={() => setSelectedDesc(desc)}
                >
                  <AiIcon
                    color={selectedDesc === desc ? colors.primary : "#94A3B8"}
                  />
                  <Text style={[styles.descText, { color: colors.text }]}>
                    {desc}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.postBtn, isPosting && { opacity: 0.7 }]}
          onPress={handleFinalPost}
          disabled={isPosting}
        >
          {isPosting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.postBtnText}>{submitButtonLabel}</Text>
              <Feather name="send" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          disabled={isPosting}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  aiCard: { borderRadius: 30, borderWidth: 2, padding: 20, minHeight: 400 },
  aiHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 50,
    height: 55,
    marginBottom: 20,
  },
  aiHeaderBtnText: { fontSize: 18, fontWeight: "500", marginLeft: 10 },
  toneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  toneBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toneBtnActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  toneText: { fontWeight: "600", fontSize: 13 },
  descItem: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 10,
  },
  selectedDescItem: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  descText: { marginLeft: 15, fontSize: 14, lineHeight: 20, flex: 1 },
  postBtn: {
    backgroundColor: "#3B82F6",
    height: 60,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    gap: 10,
  },
  postBtnText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  backBtn: { alignItems: "center", marginTop: 20 },
  contentArea: { minHeight: 300 },
});

export default ProductDescAI;
