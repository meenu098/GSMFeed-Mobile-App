import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");

export default function InterestSelectionScreen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interestsData, setInterestsData] = useState<any[]>([]);

  // States to hold the IDs and objects of existing user settings
  const [selectedMainIds, setSelectedMainIds] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
    inactive: isDark ? "#1B2331" : "#F1F5F9",
  };

  useEffect(() => {
    // Run both fetches when the component mounts
    const initializeData = async () => {
      setLoading(true);
      await fetchInterests(); // Fetch all available interests
      await fetchUserInterests(); // Fetch what the user has already saved
      setLoading(false);
    };
    initializeData();
  }, []);

  // Fetch all available interests from the general list
  const fetchInterests = async () => {
    try {
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/interests`);
      const json = await response.json();
      if (json.status) {
        setInterestsData(json.data);
      }
    } catch (error) {
    }
  };

  // Fetch the user's current settings to pre-populate the UI
  const fetchUserInterests = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/interests/user/settings`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      const res = await response.json();

      // Filter main interests (parent_id is null)
      const selectedMain = res.filter((item: any) => item.parent_id == null);
      setSelectedMainIds(selectedMain.map((item: any) => item.id));

      // Filter brands (parent_id is NOT null)
      const brands = res.filter((item: any) => item.parent_id != null);
      setSelectedBrands(brands); // This ensures they show as selected in Step 2
    } catch (error) {
    }
  };

  const toggleMainInterest = (id: number) => {
    if (selectedMainIds.includes(id)) {
      setSelectedMainIds(selectedMainIds.filter((item) => item !== id));
    } else {
      if (selectedMainIds.length < 3) {
        setSelectedMainIds([...selectedMainIds, id]);
      } else {
        Alert.alert("Limit Reached", "You can only select up to 3 interests.");
      }
    }
  };

  const toggleBrand = (brand: any, parentId: number) => {
    const isAlreadySelected = selectedBrands.find((b) => b.id === brand.id);
    if (isAlreadySelected) {
      setSelectedBrands(selectedBrands.filter((b) => b.id !== brand.id));
    } else {
      setSelectedBrands([...selectedBrands, { ...brand, parent_id: parentId }]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const mainInterestsObjects = interestsData
        .filter((item) => selectedMainIds.includes(item.id))
        .map((item) => ({ id: item.id, name: item.name, parent_id: null }));

      const brandsObjects = selectedBrands.map((b) => ({
        id: b.id,
        name: b.name,
        parent_id: b.parent_id,
      }));

      const payload = {
        interests: [...mainInterestsObjects, ...brandsObjects],
      };

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/interests/user/settings/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        Alert.alert("Success", "Interests updated successfully");
        router.back();
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
              flex: 1,
              textAlign: "center",
              marginRight: 28,
            },
          ]}
        >
          Customize your gsmfeed
        </Text>
      </View>

      <Text
        style={[styles.subtitle, { color: theme.subText, marginBottom: 30 }]}
      >
        Personalize your interests
      </Text>

      <View style={styles.grid}>
        {interestsData.map((item) => {
          const isSelected = selectedMainIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleMainInterest(item.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? theme.primary : theme.inactive,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? "#FFF" : theme.text },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.counter, { color: theme.subText }]}>
          {selectedMainIds.length} of 3 selected
        </Text>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: theme.primary,
              opacity: selectedMainIds.length > 0 ? 1 : 0.5,
            },
          ]}
          onPress={() => setStep(2)}
          disabled={selectedMainIds.length === 0}
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => {
    const selectedCats = interestsData.filter((cat) =>
      selectedMainIds.includes(cat.id),
    );

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setStep(1)}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, marginLeft: 10 }]}>
            Interests
          </Text>
        </View>

        {selectedCats.map((cat) => (
          <View key={cat.id} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {cat.name}
            </Text>
            <View style={styles.brandGrid}>
              {cat.children.map((child: any) => {
                const isBrandSelected = selectedBrands.some(
                  (b) => b.id === child.id,
                );
                return (
                  <TouchableOpacity
                    key={child.id}
                    onPress={() => toggleBrand(child, cat.id)}
                    style={[
                      styles.brandChip,
                      {
                        borderColor: isBrandSelected
                          ? theme.primary
                          : theme.border,
                        backgroundColor: isBrandSelected
                          ? theme.primary
                          : theme.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.brandText,
                        { color: isBrandSelected ? "#FFF" : theme.text },
                      ]}
                    >
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: theme.primary, marginTop: 30 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.bg, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {step === 1 ? renderStep1() : renderStep2()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, flexGrow: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backBtn: { padding: 5 },
  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 14, textAlign: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: width * 0.4,
  },
  pillText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  footer: { marginTop: "auto", paddingVertical: 20, alignItems: "center" },
  counter: { fontSize: 14, marginBottom: 15 },
  nextBtn: {
    width: "100%",
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  nextBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  brandGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  brandText: { fontSize: 13, fontWeight: "500" },
});
