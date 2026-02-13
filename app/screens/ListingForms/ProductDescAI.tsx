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
    return type?.toLowerCase() === "buy" ? "WTB" : "WTS";
  };

  const mapCondition = (condition: string | undefined) => {
    return condition?.toUpperCase() === "USED" ? "USED" : "NEW";
  };

  const toUploadFile = (uri: string, index: number) => {
    const cleanUri = uri.split("?")[0] || uri;
    const extension = cleanUri.split(".").pop()?.toLowerCase();
    const mime =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";
    const name = `photo-${Date.now()}-${index}.${extension || "jpg"}`;
    return { uri, name, type: mime } as any;
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
      return Object.values(rawData).map((item) => String(item)).filter(Boolean);
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
      Alert.alert(
        "Connection Error",
        "Could not reach AI service.",
      );
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
      shapedData.append("content", listingData.remarks || "");
      shapedData.append("visibility", "public");
      shapedData.append("type", "normal");

      // 2. Hashtags
      if (listingData.hashtags) {
        listingData.hashtags.forEach((tag: string) => {
          shapedData.append("hashtags[]", tag.replace("#", ""));
        });
      }

      products.forEach((product: any, index: number) => {
        const aiDescription =
          selectedDesc || recommendations[0] || product?.remarks || "";

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
          shapedData.append(`trading_feeds[${index}][category]`, "Mobile Phones");
        }

        shapedData.append(
          `trading_feeds[${index}][condition]`,
          mapCondition(product.condition),
        );
        if (String(product.condition || "").toLowerCase() === "used" && product.gradeId) {
          shapedData.append(
            `trading_feeds[${index}][grade_id]`,
            String(product.gradeId),
          );
        }
        shapedData.append(
          `trading_feeds[${index}][storage_id]`,
          String(product.storageId || ""),
        );
        shapedData.append(
          `trading_feeds[${index}][color_id]`,
          String(product.colorId || ""),
        );
        shapedData.append(
          `trading_feeds[${index}][spec_id]`,
          String(product.specsId || ""),
        );
        shapedData.append(
          `trading_feeds[${index}][qty]`,
          String(product.quantity || 1),
        );
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

        const productImages = normalizeImageUris(product?.images);
        productImages.forEach((uri: string, imageIndex: number) => {
          shapedData.append(
            `trading_feeds[${index}][images][]`,
            toUploadFile(uri, imageIndex),
          );
        });
      });

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
        onNext({ selectedDesc });
      } else {
        // Improved error reporting
        const errorMsg = result.errors
          ? Object.values(result.errors).flat().join("\n")
          : result.message;
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
