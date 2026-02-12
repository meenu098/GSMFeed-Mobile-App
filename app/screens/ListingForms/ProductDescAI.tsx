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

const ProductDescAI = ({ listingData, onNext, onBack }: any) => {
  const { isDark } = useTheme();
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedDesc, setSelectedDesc] = useState("");

  const colors = {
    bg: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    primary: "#3B82F6",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  /**
   * AI GENERATION LOGIC
   * Hits the AI service (Port 3000)
   */
  const generateAIDescription = async (emotion: string) => {
    setSelectedTone(emotion);
    setIsCompiling(true);
    setRecommendations([]);

    // Build details string exactly like web snippet
    const productDetails = [
      listingData.condition && `Condition: ${listingData.condition}`,
      listingData.grade && `Grade: ${listingData.grade}`,
      listingData.model && `Model: ${listingData.model}`,
      listingData.color && `Color: ${listingData.color}`,
      listingData.storage && `Storage: ${listingData.storage}`,
      listingData.specs && `Spec: ${listingData.specs}`,
      listingData.quantity && `Quantity: ${listingData.quantity}`,
      `Type: ${listingData.type === "Buy" ? "WTB" : "WTS"}`,
    ]
      .filter(Boolean)
      .join(", ");

    try {
      // Points to Port 3000 as identified in your remote address logs
      const res = await fetch(
        `http://192.168.1.178:3000/api/ai/product-description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productDetails, emotion }),
        },
      );

      if (res.ok) {
        const result = await res.json();
        const data = result.data;

        // Convert Laravel-style object to array for mapping
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setRecommendations(Object.values(data) as string[]);
        } else if (Array.isArray(data)) {
          setRecommendations(data);
        }
      } else {
        console.error("AI API returned error status:", res.status);
      }
    } catch (error) {
      console.error("AI Fetch Error:", error);
      Alert.alert(
        "Connection Error",
        "Could not reach AI service on port 3000.",
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

      // 3. Product Mapping (Trading Feeds)
      const index = 0;
      shapedData.append(
        `trading_feeds[${index}][type]`,
        listingData.type?.toLowerCase() === "buy" ? "wtb" : "wts",
      );

      // CRITICAL FIX: Ensure product_id is sent. If missing, send product_name fallback.
      if (listingData.modelId) {
        shapedData.append(
          `trading_feeds[${index}][product_id]`,
          String(listingData.modelId),
        );
      } else {
        // Fallback if ID is missing (per your validation error)
        shapedData.append(
          `trading_feeds[${index}][product_name]`,
          listingData.model,
        );
        shapedData.append(`trading_feeds[${index}][brand]`, "Apple"); // You may want to make this dynamic
        shapedData.append(`trading_feeds[${index}][category]`, "Mobile Phones");
      }

      // Use IDs for selections if they exist, otherwise use labels
      shapedData.append(
        `trading_feeds[${index}][condition]`,
        listingData.condition?.toLowerCase(),
      );
      shapedData.append(
        `trading_feeds[${index}][storage_id]`,
        String(listingData.storageId || ""),
      );
      shapedData.append(
        `trading_feeds[${index}][color_id]`,
        String(listingData.colorId || ""),
      );
      shapedData.append(
        `trading_feeds[${index}][spec_id]`,
        String(listingData.specsId || ""),
      );

      // Pricing & Quantity
      shapedData.append(
        `trading_feeds[${index}][qty]`,
        String(listingData.quantity || 1),
      );
      shapedData.append(
        `trading_feeds[${index}][currency]`,
        (listingData.currency || "usd").toLowerCase(),
      );
      shapedData.append(
        `trading_feeds[${index}][price]`,
        String(listingData.price || 0),
      );
      shapedData.append(
        `trading_feeds[${index}][ai_description]`,
        selectedDesc,
      );

      // 4. Extra Details & 5. Images (Keep your existing logic for these)
      // ... [existing logic for extraDetails and images] ...

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
        onNext();
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
              <Text style={styles.postBtnText}>Skip & Post</Text>
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
