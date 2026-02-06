import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../shared/themeContext";

const ProductSummary = ({
  type,
  onBack,
}: {
  type: string;
  onBack: () => void;
}) => {
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    accent: "#3B82F6",
    summaryBg: isDark ? "#172554" : "#EFF6FF",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Header */}
        <View style={styles.userHeader}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>
                Meenu Madhu
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{type}</Text>
              </View>
            </View>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather
                  key={s}
                  name="star"
                  size={14}
                  color="#F59E0B"
                  fill="#F59E0B"
                />
              ))}
            </View>
          </View>
        </View>

        {/* Product Card Details */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.summaryBg, borderColor: colors.accent },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.productTitle, { color: colors.text }]}>
              iPhone 17{" "}
              <Feather name="edit-2" size={14} color={colors.accent} />
            </Text>
            <Feather name="chevron-up" size={20} color={colors.accent} />
          </View>

          <View style={styles.detailsGrid}>
            <DetailRow label="Price:" value="AED 1250" color="#22C55E" />
            <DetailRow label="Condition:" value="Used" />
            <DetailRow label="Storage:" value="256GB" />
            <DetailRow label="Color:" value="Lavender" />
            <DetailRow label="Spec:" value="JAPAN" />
            <DetailRow label="Quantity:" value="1 Pcs" />
          </View>

          <Image
            source={{ uri: "https://i.pravatar.cc/200" }}
            style={styles.productThumbnail}
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.addMoreBtn}>
          <Text style={styles.addMoreText}>Add more products</Text>
          <Feather name="plus" size={20} color={colors.accent} />
        </TouchableOpacity>

        <TextInput
          placeholder="Remarks"
          multiline
          style={[
            styles.textArea,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholderTextColor={colors.subText}
        />

        <View
          style={[
            styles.hashtagInput,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: colors.subText }}>Hashtags</Text>
          <Feather name="chevron-down" size={20} color={colors.subText} />
        </View>

        <Text style={styles.suggestions}>
          Suggestions:{" "}
          <Text style={{ color: colors.accent }}>#WTS #Apple #iPhone17</Text>
        </Text>

        <TouchableOpacity style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: colors.subText }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value, color }: any) => {
  const { isDark } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text
        style={[styles.detailLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          { color: color || (isDark ? "#F8FAFC" : "#1E293B") },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  userHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userInfo: { marginLeft: 15 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  userName: { fontSize: 18, fontWeight: "700" },
  badge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
  },
  badgeText: { color: "#6366F1", fontSize: 12, fontWeight: "600" },
  ratingRow: { flexDirection: "row", marginTop: 4 },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  productTitle: { fontSize: 18, fontWeight: "800" },
  detailsGrid: { marginBottom: 15 },
  detailRow: { flexDirection: "row", marginBottom: 6 },
  detailLabel: { width: 100, fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: "600" },
  productThumbnail: { width: 80, height: 80, borderRadius: 12 },
  addMoreBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#3B82F6",
    borderRadius: 12,
    marginBottom: 20,
  },
  addMoreText: { color: "#3B82F6", fontWeight: "700" },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  hashtagInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  suggestions: { fontSize: 12, marginBottom: 30 },
  nextBtn: {
    backgroundColor: "#3B82F6",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  nextBtnText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  backBtn: { alignSelf: "center", padding: 10 },
});

export default ProductSummary;
