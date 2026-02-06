// import { Ionicons } from "@expo/vector-icons";
// import { BlurTint, BlurView } from "expo-blur"; // Added BlurTint for typing
// import { useRouter } from "expo-router";
// import React, { useEffect, useRef } from "react";
// import {
//   Dimensions,
//   Platform,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import BottomNav from "../../components/BottomNav";
// import { useTheme } from "../../shared/themeContext";

// const { width } = Dimensions.get("window");

// export default function AdvancedSearchOverlay() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const inputRef = useRef<TextInput>(null);
//   const { isDark } = useTheme();

//   // Explicitly typing the tint to solve the TS(2769) error
//   const blurTint: BlurTint = isDark ? "dark" : "light";

//   const theme = {
//     bg: isDark ? "rgba(11, 14, 20, 0.9)" : "rgba(248, 250, 252, 0.8)",
//     pillBg: isDark ? "#121721" : "#FFFFFF",
//     text: isDark ? "#F8FAFC" : "#0F172A",
//     placeholder: isDark ? "#94A3B8" : "#64748B",
//     primary: "#3B66F5",
//     border: isDark ? "#1B2331" : "#E2E8F0",
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       inputRef.current?.focus();
//     }, 400);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Pressable
//         style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}
//         onPress={() => router.back()}
//       >
//         <BlurView
//           intensity={Platform.OS === "ios" ? 25 : 10}
//           tint={blurTint} // Pass the explicitly typed variable
//           style={StyleSheet.absoluteFill}
//         />
//       </Pressable>

//       <View style={[styles.topSection, { paddingTop: insets.top + 20 }]}>
//         <View
//           style={[
//             styles.pill,
//             {
//               backgroundColor: theme.pillBg,
//               borderColor: theme.border,
//               borderWidth: isDark ? 1 : 0,
//             },
//           ]}
//         >
//           <Ionicons
//             name="sparkles"
//             size={22}
//             color={theme.primary}
//             style={{ marginRight: 12 }}
//           />
//           <TextInput
//             ref={inputRef}
//             placeholder="Advanced AI Search..."
//             placeholderTextColor={theme.placeholder}
//             style={[styles.input, { color: theme.text }]}
//             returnKeyType="search"
//             selectionColor={theme.primary}
//           />
//           <TouchableOpacity
//             onPress={() => router.back()}
//             style={styles.closeBtn}
//           >
//             <Ionicons name="close-circle" size={24} color={theme.placeholder} />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.suggestions}>
//           <Text style={[styles.hintText, { color: theme.placeholder }]}>
//             Try searching for Verified Traders in Dubai
//           </Text>
//         </View>
//       </View>

//       <View style={styles.bottomSection}>
//         <BottomNav />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 9999,
//   },
//   topSection: {
//     position: "absolute",
//     top: 0,
//     width: "100%",
//     alignItems: "center",
//   },
//   pill: {
//     height: 60,
//     borderRadius: 30,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     width: width * 0.92,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.15,
//     shadowRadius: 15,
//     elevation: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   closeBtn: {
//     padding: 2,
//   },
//   suggestions: {
//     marginTop: 20,
//     width: width * 0.85,
//   },
//   hintText: {
//     fontSize: 13,
//     textAlign: "center",
//     fontStyle: "italic",
//   },
//   bottomSection: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     zIndex: 10,
//   },
// });

import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurTint, BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");

export default function AdvancedSearchOverlay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const blurTint: BlurTint = isDark ? "dark" : "light";

  const theme = {
    bg: isDark ? "rgba(11, 14, 20, 0.9)" : "rgba(248, 250, 252, 0.8)",
    pillBg: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    placeholder: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B66F5",
    border: isDark ? "#1B2331" : "#E2E8F0",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/gsmfeed-chat/search-chat-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ search: query }),
        },
      );

      const json = await response.json();
      if (json.status) {
        setSearchResults(json.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  return (
    <View style={styles.container}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}
        onPress={() => router.back()}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 30 : 15}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Search Input */}
        <View
          style={[
            styles.pill,
            {
              backgroundColor: theme.pillBg,
              borderColor: theme.border,
              borderWidth: isDark ? 1 : 0.5,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.primary}
            style={{ marginRight: 12 }}
          />
          <TextInput
            ref={inputRef}
            placeholder="Search for companies or traders..."
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsWrapper}>
          {loading ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ marginTop: 30 }}
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userCard,
                    {
                      backgroundColor: theme.pillBg,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    // NAVIGATE TO PROFILE PAGE
                    router.push({
                      pathname: "/screens/UserProfile",
                      params: { userId: item.id },
                    });
                  }}
                >
                  <Image
                    source={{
                      uri: item.avatar || "https://via.placeholder.com/150",
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.userHandle, { color: theme.placeholder }]}
                    >
                      @
                      {item.username ||
                        item.name.toLowerCase().replace(/\s/g, "")}
                    </Text>
                  </View>
                  <Feather
                    name="external-link"
                    size={16}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 0 && !loading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={{ color: theme.placeholder }}>
                      No users found matching {searchQuery}
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <BottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  content: { flex: 1, alignItems: "center" },
  pill: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    width: width * 0.92,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  resultsWrapper: { width: "100%", flex: 1, marginTop: 15 },
  listContent: { paddingHorizontal: 16, paddingBottom: 150 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700" },
  userHandle: { fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  bottomSection: { position: "absolute", bottom: 0, width: "100%", zIndex: 10 },
});
