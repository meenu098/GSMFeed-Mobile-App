import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Required for image selection
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../shared/themeContext";

const { width } = Dimensions.get("window");

interface FormTemplateProps {
  type: "Sell" | "Buy";
  onNext: () => void;
  onBack: () => void;
}

const FormTemplate = ({
  type: initialType,
  onNext,
  onBack,
}: FormTemplateProps) => {
  const { isDark } = useTheme();
  const [activeType, setActiveType] = useState(initialType);
  const [condition, setCondition] = useState("New");

  // Form States
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // To store selected image URIs
  const [extraDetails, setExtraDetails] = useState<
    { label: string; value: string }[]
  >([]);

  const currencies = [
    { label: "🇺🇸 USD", value: "USD" },
    { label: "🇦🇪 AED", value: "AED" },
    { label: "🇪🇺 EUR", value: "EUR" },
  ];

  // Dynamic Theme Colors
  const colors = {
    bg: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    headerIcon: isDark ? "#FFFFFF" : "#000000",
    modalOverlay: "rgba(0,0,0,0.6)",
  };

  // --- Handlers ---

  const pickImage = async () => {
    // Request permission to access library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages([...selectedImages, ...newImages].slice(0, 8)); // Matches 0/8 limit
    }
  };

  const addDetailField = () => {
    setExtraDetails([...extraDetails, { label: "", value: "" }]); //
  };

  const removeDetailField = (index: number) => {
    setExtraDetails(extraDetails.filter((_, i) => i !== index));
  };

  const updateDetailField = (
    index: number,
    field: "label" | "value",
    text: string
  ) => {
    const updatedDetails = [...extraDetails];
    updatedDetails[index][field] = text;
    setExtraDetails(updatedDetails);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Header Navigation */}
      <View style={styles.headerNav}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backCircle, { backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.headerIcon} />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={styles.dotActive} />
          <Text style={[styles.stepText, { color: colors.subText }]}>
            Step 1 of 3
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create your listing
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
            Tell us what youre looking for
          </Text>
        </View>

        {/* Toggle Tab (Buy/Sell) */}
        <View
          style={[
            styles.toggleTabContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveType("Buy")}
            style={[
              styles.tabButton,
              activeType === "Buy" && styles.tabButtonActive,
            ]}
          >
            <Feather
              name="shopping-cart"
              size={16}
              color={activeType === "Buy" ? "#FFF" : colors.subText}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeType === "Buy" ? "#FFF" : colors.subText },
              ]}
            >
              Want to buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveType("Sell")}
            style={[
              styles.tabButton,
              activeType === "Sell" && styles.tabButtonActive,
            ]}
          >
            <MaterialCommunityIcons
              name="tag-outline"
              size={18}
              color={activeType === "Sell" ? "#FFF" : colors.subText}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeType === "Sell" ? "#FFF" : colors.subText },
              ]}
            >
              Want to sell
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Details Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Product Details
            </Text>
          </View>
          <TextInput
            placeholder="Model"
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.inputBg,
              },
            ]}
            placeholderTextColor={colors.subText}
          />
          <TextInput
            placeholder="Storage"
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.inputBg,
              },
            ]}
            placeholderTextColor={colors.subText}
          />
          <Text style={[styles.label, { color: colors.text }]}>Condition</Text>
          <View
            style={[
              styles.conditionRow,
              { backgroundColor: isDark ? "#0F172A" : "#F1F5F9" },
            ]}
          >
            {["New", "Used"].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setCondition(item)}
                style={[
                  styles.conditionBtn,
                  condition === item && styles.activeConditionBtn,
                ]}
              >
                <Text
                  style={[
                    styles.conditionText,
                    { color: condition === item ? "#FFF" : colors.subText },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pricing
            </Text>
          </View>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(true)}
              style={[
                styles.currencyBox,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                },
              ]}
            >
              <Text style={{ color: colors.text }}>
                {currencies.find((c) => c.value === currency)?.label}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.subText} />
            </TouchableOpacity>
            <TextInput
              placeholder="Price"
              style={[
                styles.input,
                {
                  flex: 1,
                  marginBottom: 0,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholderTextColor={colors.subText}
              keyboardType="numeric"
            />
          </View>
          <TextInput
            placeholder="Quantity"
            style={[
              styles.input,
              {
                marginTop: 15,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.inputBg,
              },
            ]}
            placeholderTextColor={colors.subText}
            keyboardType="numeric"
          />
        </View>

        {/* Specifications Card with Dynamic Fields */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Specifications
            </Text>
          </View>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons
              name="palette-outline"
              size={18}
              color={colors.subText}
              style={styles.innerIcon}
            />
            <TextInput
              placeholder="Color"
              style={[
                styles.input,
                {
                  paddingLeft: 45,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholderTextColor={colors.subText}
            />
          </View>
          <TextInput
            placeholder="Specs"
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.inputBg,
              },
            ]}
            placeholderTextColor={colors.subText}
          />

          {/* Render extra details rows */}
          {extraDetails.map((item, index) => (
            <View
              key={index}
              style={[styles.extraDetailGroup, { borderColor: colors.border }]}
            >
              <Text
                style={[
                  styles.extraGroupLabel,
                  { color: colors.subText, backgroundColor: colors.card },
                ]}
              >
                Extra Details
              </Text>
              <View style={styles.extraRow}>
                <TextInput
                  placeholder="Label"
                  value={item.label}
                  onChangeText={(text) =>
                    updateDetailField(index, "label", text)
                  }
                  style={[
                    styles.extraInput,
                    { borderColor: colors.border, color: colors.text },
                  ]}
                  placeholderTextColor="#CBD5E1"
                />
                <TextInput
                  placeholder="Value"
                  value={item.value}
                  onChangeText={(text) =>
                    updateDetailField(index, "value", text)
                  }
                  style={[
                    styles.extraInput,
                    { borderColor: colors.border, color: colors.text },
                  ]}
                  placeholderTextColor="#CBD5E1"
                />
                <TouchableOpacity onPress={() => removeDetailField(index)}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addDetailsFullBtn}
            onPress={addDetailField}
          >
            <Text style={styles.addDetailsFullText}>Add Extra Details</Text>
            <Feather name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Photos Section with Gallery Integration */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.photoHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Photos
            </Text>
            <Text style={styles.photoCount}>{selectedImages.length}/8</Text>
          </View>
          <View style={styles.photoRow}>
            <TouchableOpacity
              style={[
                styles.addPhotoBox,
                {
                  backgroundColor: isDark ? "#0F172A" : "#EFF6FF",
                  borderColor: "#3B82F6",
                },
              ]}
              onPress={pickImage}
            >
              <Feather name="camera" size={24} color="#3B82F6" />
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.emptyPhotoBox,
                  {
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: colors.border,
                  },
                ]}
              >
                {selectedImages[i] ? (
                  <Image
                    source={{ uri: selectedImages[i] }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <Feather
                    name="image"
                    size={24}
                    color={isDark ? "#334155" : "#E2E8F0"}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={onNext}
          style={[styles.continueBtn, { shadowColor: "#3B82F6" }]}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack} style={styles.draftBtn}>
          <Text style={[styles.draftText, { color: colors.subText }]}>
            Save as draft
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showCurrencyPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyPicker(false)}
        >
          <View
            style={[styles.pickerContainer, { backgroundColor: colors.card }]}
          >
            {currencies.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.pickerItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  setCurrency(item.value);
                  setShowCurrencyPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowOpacity: 0.1,
  },
  stepIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  stepText: { fontSize: 14, fontWeight: "500" },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  titleSection: { alignItems: "center", marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: 16, marginTop: 5 },
  toggleTabContainer: {
    flexDirection: "row",
    borderRadius: 25,
    padding: 5,
    marginBottom: 30,
    elevation: 2,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  tabButtonActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 14, fontWeight: "600" },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowOpacity: 0.05,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 10, marginTop: 10 },
  input: {
    width: "100%",
    height: 55,
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  conditionRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
  conditionBtn: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  activeConditionBtn: { backgroundColor: "#3B82F6" },
  conditionText: { fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12, width: "100%" },
  currencyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    gap: 10,
    height: 55,
  },
  inputWithIcon: { position: "relative", width: "100%" },
  innerIcon: { position: "absolute", left: 15, top: 18, zIndex: 1 },
  extraDetailGroup: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
    position: "relative",
  },
  extraGroupLabel: {
    position: "absolute",
    top: -10,
    left: 12,
    paddingHorizontal: 5,
    fontSize: 12,
    fontWeight: "600",
  },
  extraRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  extraInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addDetailsFullBtn: {
    backgroundColor: "#3B82F6",
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  addDetailsFullText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  photoCount: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  photoRow: { flexDirection: "row", gap: 10 },
  addPhotoBox: {
    width: (width - 100) / 4,
    height: (width - 100) / 4,
    borderRadius: 15,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "700",
    marginTop: 4,
  },
  emptyPhotoBox: {
    width: (width - 100) / 4,
    height: (width - 100) / 4,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: { width: "100%", height: "100%", borderRadius: 15 },
  continueBtn: {
    width: "100%",
    height: 60,
    backgroundColor: "#3B82F6",
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    elevation: 4,
    shadowOpacity: 0.3,
  },
  continueText: { color: "#FFF", fontWeight: "800", fontSize: 18 },
  draftBtn: { padding: 20, alignItems: "center" },
  draftText: { fontWeight: "600", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: "80%",
    borderRadius: 20,
    padding: 10,
    elevation: 5,
  },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: { fontSize: 16, fontWeight: "600" },
});

export default FormTemplate;
