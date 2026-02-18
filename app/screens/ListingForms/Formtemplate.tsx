import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { getEmojiFlag, TCountryCode } from "countries-list";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
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

const { width } = Dimensions.get("window");
const MAX_PHOTOS = 3;

type SelectOption = {
  label: string;
  value: number | string | null;
  isCustom?: boolean;
  colors?: unknown;
  storages?: unknown;
};

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

interface FormTemplateProps {
  type: "Sell" | "Buy";
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

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

const normalizeMimeType = (
  value: unknown,
  fallbackType: string,
): string => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || raw === "image" || raw === "file") return fallbackType;
  if (raw.startsWith("image/")) return raw;
  return extensionToMimeType[raw] || fallbackType;
};

const normalizeSelectedImages = (value: unknown): SelectedImage[] => {
  if (!value) return [];

  const inputItems = Array.isArray(value) ? value : [value];
  const output: SelectedImage[] = [];
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
    } else if (item && typeof item === "object" && typeof item.uri === "string") {
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

const FormTemplate = ({
  type: initialType,
  initialData,
  onNext,
  onBack,
}: FormTemplateProps) => {
  const { isDark, screenTheme } = useTheme();
  const [activeType, setActiveType] = useState(
    initialData?.type || initialType,
  );
  const [condition, setCondition] = useState(initialData?.condition || "New");

  const [price, setPrice] = useState(
    initialData?.price ? String(initialData.price) : "",
  );
  const [quantity, setQuantity] = useState(
    initialData?.quantity ? String(initialData.quantity) : "",
  );

  const [models, setModels] = useState<SelectOption[]>([]);
  const [storages, setStorages] = useState<SelectOption[]>([]);
  const [colorsData, setColorsData] = useState<SelectOption[]>([]);
  const [specsData, setSpecsData] = useState<SelectOption[]>([]);
  const [gradesData, setGradesData] = useState<SelectOption[]>([]);

  // UPDATED: Now tracks IDs for API compatibility
  const [searchQuery, setSearchQuery] = useState({
    model: initialData?.model || "",
    modelId: initialData?.modelId ?? null,
    storage: initialData?.storage || "",
    storageId: initialData?.storageId ?? null,
    color: initialData?.color || "",
    colorId: initialData?.colorId ?? null,
    specs: initialData?.specs || "",
    specsId: initialData?.specsId ?? null,
    grade: initialData?.grade || "",
    gradeId: initialData?.gradeId ?? null,
  });

  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const [currency, setCurrency] = useState(initialData?.currency || "USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>(
    normalizeSelectedImages(initialData?.images),
  );
  const [extraDetails, setExtraDetails] = useState<
    { label: string; value: string }[]
  >(Array.isArray(initialData?.extraDetails) ? initialData.extraDetails : []);

  const currencyOptions = [
    { label: `${getEmojiFlag("US" as TCountryCode)} USD`, value: "USD" },
    { label: `${getEmojiFlag("AE" as TCountryCode)} AED`, value: "AED" },
    { label: `${getEmojiFlag("EU" as TCountryCode)} EUR`, value: "EUR" },
  ];

  const colors = {
    bg: screenTheme.bg,
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    border: screenTheme.border,
    inputBg: isDark ? "#0F172A" : screenTheme.card,
  };

  useEffect(() => {
    if (!initialData) return;
    setActiveType(initialData?.type || initialType);
    setCondition(initialData?.condition || "New");
    setPrice(initialData?.price ? String(initialData.price) : "");
    setQuantity(initialData?.quantity ? String(initialData.quantity) : "");
    setCurrency(initialData?.currency || "USD");
    setSelectedImages(normalizeSelectedImages(initialData?.images));
    setExtraDetails(
      Array.isArray(initialData?.extraDetails) ? initialData.extraDetails : [],
    );
    setSearchQuery({
      model: initialData?.model || "",
      modelId: initialData?.modelId ?? null,
      storage: initialData?.storage || "",
      storageId: initialData?.storageId ?? null,
      color: initialData?.color || "",
      colorId: initialData?.colorId ?? null,
      specs: initialData?.specs || "",
      specsId: initialData?.specsId ?? null,
      grade: initialData?.grade || "",
      gradeId: initialData?.gradeId ?? null,
    });
  }, [initialData, initialType]);

  const normalizeCsvOptions = (value: unknown) => {
    if (!value) return [] as string[];
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [];
  };

  const fetchSelectionOptions = async (
    field: "storage" | "color" | "specs" | "grade",
    searchText: string,
  ): Promise<SelectOption[]> => {
    let endpoint =
      field === "specs" ? "selections/specs" : `selections/${field}s`;
    if (field === "storage") endpoint = "selections/storage";
    if (field === "grade") endpoint = "selection/grades";

    const response = await fetch(
      `${CONFIG.API_ENDPOINT}/api/${endpoint}?search=${searchText}`,
    );
    if (!response.ok) return [];
    const result = await response.json();
    return (
      result?.data?.map((item: any) => ({
        label: item?.name,
        value: item?.id,
      })) || []
    );
  };

  const handleContinue = () => {
    // UPDATED: Passing IDs to the parent flow
    const data = {
      type: activeType,
      model: searchQuery.model,
      modelId: searchQuery.modelId, // Required for backend product_id
      storage: searchQuery.storage,
      storageId: searchQuery.storageId,
      color: searchQuery.color,
      colorId: searchQuery.colorId,
      specs: searchQuery.specs,
      specsId: searchQuery.specsId,
      grade: searchQuery.grade,
      gradeId: searchQuery.gradeId,
      condition: condition,
      currency: currency,
      price: price,
      quantity: quantity,
      images: [...selectedImages],
      extraDetails: extraDetails,
    };

    onNext(data);
  };

  const handleApiSearch = async (
    field: string,
    text: string,
    options?: { resetId?: boolean; allowEmpty?: boolean },
  ) => {
    const shouldResetId = options?.resetId !== false;
    const allowEmpty = options?.allowEmpty === true;

    if (shouldResetId) {
      // Reset ID when user types manually to ensure we don't send a stale ID
      setSearchQuery((prev) => ({
        ...prev,
        [field]: text,
        [`${field}Id`]: null,
      }));
    }

    const query = text.trim();
    if (query.length < 1 && !allowEmpty) {
      setShowDropdown(null);
      return;
    }

    setLoadingField(field);
    try {
      if (field === "model") {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selection/products?search=${query}`,
        );
        if (response.ok) {
          const result = await response.json();
          const formatted =
            result?.data?.map((item: any) => ({
              label: item?.name,
              value: item?.id,
              colors: item?.colors ?? item?.color ?? item?.colours,
              storages: item?.storages ?? item?.storage,
            })) || [];
          setModels(formatted);
          setShowDropdown(field);
        }
      } else if (
        field === "storage" ||
        field === "color" ||
        field === "specs" ||
        field === "grade"
      ) {
        const formatted = await fetchSelectionOptions(field, query);
        if (field === "storage") setStorages(formatted);
        else if (field === "color") setColorsData(formatted);
        else if (field === "specs") setSpecsData(formatted);
        else if (field === "grade") setGradesData(formatted);
        setShowDropdown(field);
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoadingField(null);
    }
  };

  // UPDATED: Properly stores label and value (ID)
  const selectItem = async (field: string, item: SelectOption) => {
    const isCustom = item?.isCustom === true;
    const nextValue = isCustom ? null : item?.value ?? null;

    setSearchQuery((prev) => ({
      ...prev,
      [field]: item.label,
      [`${field}Id`]: nextValue,
    }));
    setShowDropdown(null);

    if (field === "model") {
      const productColors = normalizeCsvOptions(item?.colors);
      const productStorages = normalizeCsvOptions(item?.storages);

      if (productColors.length > 0) {
        setColorsData(
          productColors.map((value) => ({
            label: value,
            value,
            isCustom: true,
          })),
        );
      } else {
        const fallbackColors = await fetchSelectionOptions("color", "");
        setColorsData(fallbackColors);
      }

      if (productStorages.length > 0) {
        setStorages(
          productStorages.map((value) => ({
            label: value,
            value,
            isCustom: true,
          })),
        );
      } else {
        const fallbackStorages = await fetchSelectionOptions("storage", "");
        setStorages(fallbackStorages);
      }

      setSearchQuery((prev) => ({
        ...prev,
        storage: "",
        storageId: null,
        color: "",
        colorId: null,
      }));
    }
  };

  // --- Image Handlers ---
  const pickImage = async () => {
    try {
      if (selectedImages.length >= MAX_PHOTOS) {
        Alert.alert(
          "Limit reached",
          `You can upload up to ${MAX_PHOTOS} photos.`,
        );
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow Photos access from iPhone settings to upload images.",
        );
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, MAX_PHOTOS - selectedImages.length),
        quality: 1,
      };

      const compatibleMode = (ImagePicker as any)
        ?.UIImagePickerPreferredAssetRepresentationMode?.Compatible;
      if (Platform.OS === "ios" && compatibleMode) {
        (pickerOptions as any).preferredAssetRepresentationMode = compatibleMode;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets?.length) return;

      const newImages = normalizeSelectedImages(result.assets);
      setSelectedImages((prev) => {
        const merged = [...prev];
        const seenUris = new Set(prev.map((item) => item.uri));
        newImages.forEach((item) => {
          if (seenUris.has(item.uri)) return;
          seenUris.add(item.uri);
          merged.push(item);
        });
        return merged.slice(0, MAX_PHOTOS);
      });
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateDetailField = (
    index: number,
    field: "label" | "value",
    text: string,
  ) => {
    const updated = [...extraDetails];
    updated[index][field] = text;
    setExtraDetails(updated);
  };

  const renderDropdown = (field: string, data: SelectOption[]) => {
    if (showDropdown !== field) return null;
    return (
      <View
        style={[
          styles.floatingDropdown,
          { backgroundColor: colors.card, borderColor: "#3B82F6" },
        ]}
      >
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 200 }}
        >
          {data.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={[styles.dropdownEmptyText, { color: colors.subText }]}>
                Start typing to search
              </Text>
            </View>
          ) : (
            data.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  searchQuery[field as keyof typeof searchQuery] ===
                    item.label && { backgroundColor: "#3B82F6" },
                ]}
                onPress={() => selectItem(field, item)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    {
                      color:
                        searchQuery[field as keyof typeof searchQuery] ===
                        item.label
                          ? "#FFF"
                          : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.headerNav}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backCircle, { backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create your listing
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
            Tell us what youre looking for
          </Text>
        </View>

        {/* Buy/Sell Toggle */}
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

        {/* Card 1: Product Details */}
        <View
          style={[styles.card, { backgroundColor: colors.card, zIndex: 3000 }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Product Details
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Model"
              value={searchQuery.model}
              onChangeText={(t) => handleApiSearch("model", t)}
              onFocus={() => {
                if (models.length > 0) {
                  setShowDropdown("model");
                  return;
                }
                handleApiSearch("model", searchQuery.model, {
                  resetId: false,
                  allowEmpty: true,
                });
              }}
              style={[
                styles.input,
                {
                  borderColor:
                    showDropdown === "model" ? "#3B82F6" : colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholderTextColor={colors.subText}
            />
            {loadingField === "model" && (
              <ActivityIndicator
                style={styles.loader}
                size="small"
                color="#3B82F6"
              />
            )}
            {renderDropdown("model", models)}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Storage"
              value={searchQuery.storage}
              onChangeText={(t) => handleApiSearch("storage", t)}
              onFocus={() => {
                if (storages.length > 0) {
                  setShowDropdown("storage");
                  return;
                }
                handleApiSearch("storage", searchQuery.storage, {
                  resetId: false,
                  allowEmpty: true,
                });
              }}
              style={[
                styles.input,
                {
                  borderColor:
                    showDropdown === "storage" ? "#3B82F6" : colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholderTextColor={colors.subText}
            />
            {loadingField === "storage" && (
              <ActivityIndicator
                style={styles.loader}
                size="small"
                color="#3B82F6"
              />
            )}
            {renderDropdown("storage", storages)}
          </View>

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
                onPress={() => {
                  setCondition(item);
                  if (item === "New") {
                    setSearchQuery((prev) => ({
                      ...prev,
                      grade: "",
                      gradeId: null,
                    }));
                  }
                }}
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

          {condition === "Used" && (
            <View style={[styles.inputWrapper, { marginTop: 15, marginBottom: 0 }]}>
              <TextInput
                placeholder="Grade"
                value={searchQuery.grade}
                onChangeText={(t) => handleApiSearch("grade", t)}
                onFocus={() => {
                  if (gradesData.length > 0) {
                    setShowDropdown("grade");
                    return;
                  }
                  handleApiSearch("grade", searchQuery.grade, {
                    resetId: false,
                    allowEmpty: true,
                  });
                }}
                style={[
                  styles.input,
                  {
                    borderColor:
                      showDropdown === "grade" ? "#3B82F6" : colors.border,
                    color: colors.text,
                    backgroundColor: colors.inputBg,
                  },
                ]}
                placeholderTextColor={colors.subText}
              />
              {loadingField === "grade" && (
                <ActivityIndicator
                  style={styles.loader}
                  size="small"
                  color="#3B82F6"
                />
              )}
              {renderDropdown("grade", gradesData)}
            </View>
          )}
        </View>

        {/* Card 2: Pricing */}
        <View
          style={[styles.card, { backgroundColor: colors.card, zIndex: 2000 }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pricing
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(true)}
              style={[
                styles.currencyBox,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
              ]}
            >
              <Text style={{ color: colors.text }}>
                {currencyOptions.find((c) => c.value === currency)?.label ||
                  currency}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.subText} />
            </TouchableOpacity>
            <TextInput
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
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
            value={quantity}
            onChangeText={setQuantity}
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

        {/* Card 3: Specs & Extra Details */}
        <View
          style={[styles.card, { backgroundColor: colors.card, zIndex: 1000 }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Specifications
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Color"
              value={searchQuery.color}
              onChangeText={(t) => handleApiSearch("color", t)}
              onFocus={() => {
                if (colorsData.length > 0) {
                  setShowDropdown("color");
                  return;
                }
                handleApiSearch("color", searchQuery.color, {
                  resetId: false,
                  allowEmpty: true,
                });
              }}
              style={[
                styles.input,
                {
                  borderColor:
                    showDropdown === "color" ? "#3B82F6" : colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholderTextColor={colors.subText}
            />
            {renderDropdown("color", colorsData)}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Specs"
              value={searchQuery.specs}
              onChangeText={(t) => handleApiSearch("specs", t)}
              onFocus={() => {
                if (specsData.length > 0) {
                  setShowDropdown("specs");
                  return;
                }
                handleApiSearch("specs", searchQuery.specs, {
                  resetId: false,
                  allowEmpty: true,
                });
              }}
              style={[
                styles.input,
                {
                  borderColor:
                    showDropdown === "specs" ? "#3B82F6" : colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholderTextColor={colors.subText}
            />
            {renderDropdown("specs", specsData)}
          </View>

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
                Extra Detail
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
                <TouchableOpacity
                  onPress={() =>
                    setExtraDetails(extraDetails.filter((_, i) => i !== index))
                  }
                >
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
            onPress={() =>
              setExtraDetails([...extraDetails, { label: "", value: "" }])
            }
          >
            <Text style={styles.addDetailsFullText}>Add Extra Details</Text>
            <Feather name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Photos Section */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.photoHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Photos
            </Text>
            <Text style={styles.photoCount}>
              {selectedImages.length}/{MAX_PHOTOS}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}
          >
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

            {selectedImages.map((image, index) => (
              <View
                key={`${image.uri}-${index}`}
                style={[
                  styles.selectedPhotoBox,
                  {
                    backgroundColor: colors.inputBg,
                  },
                ]}
              >
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={styles.removePhotoBtn}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {selectedImages.length === 0 ? (
            <Text style={[styles.photoHint, { color: colors.subText }]}>
              {`You can select up to ${MAX_PHOTOS} photos.`}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={handleContinue} style={styles.continueBtn}>
          <Text style={styles.continueText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="#FFF" />
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
            <FlatList
              data={currencyOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
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
                  {currency === item.value && (
                    <Feather name="check" size={18} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
            />
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
    padding: 20,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
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
  scrollContent: { padding: 20, paddingBottom: 60 },
  titleSection: { alignItems: "center", marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: 16, marginTop: 5 },
  toggleTabContainer: {
    flexDirection: "row",
    borderRadius: 25,
    padding: 5,
    marginBottom: 30,
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
  card: { borderRadius: 20, padding: 16, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 10, marginTop: 10 },
  inputWrapper: { position: "relative", width: "100%", marginBottom: 15 },
  input: {
    height: 55,
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  loader: { position: "absolute", right: 15, top: 18 },
  floatingDropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 9999,
    elevation: 10,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  dropdownText: { fontSize: 16, fontWeight: "500" },
  dropdownEmpty: { padding: 15 },
  dropdownEmptyText: { fontSize: 14, fontWeight: "500" },
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
  row: { flexDirection: "row", gap: 12 },
  currencyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    flex: 0.8,
  },
  extraDetailGroup: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
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
  },
  addDetailsFullBtn: {
    backgroundColor: "#3B82F6",
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 15,
  },
  addDetailsFullText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  photoCount: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  photoStrip: { alignItems: "center", paddingRight: 4 },
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
  selectedPhotoBox: {
    width: (width - 100) / 4,
    height: (width - 100) / 4,
    borderRadius: 15,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%", borderRadius: 15 },
  removePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  photoHint: { marginTop: 10, fontSize: 12, fontWeight: "500" },
  continueBtn: {
    height: 60,
    backgroundColor: "#3B82F6",
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  continueText: { color: "#FFF", fontWeight: "800", fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: { width: "80%", borderRadius: 20, padding: 10 },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: { fontSize: 16, fontWeight: "600" },
});

export default FormTemplate;
