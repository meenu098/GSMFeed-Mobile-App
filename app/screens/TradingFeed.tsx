import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import { useTheme } from "../utils/themeContext";

const TradingFeed = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  // Placeholder data - replace with your API fetch logic
  const broadcasts = [
    {
      id: "1",
      type: "Request",
      brand: "Apple",
      title: "iPhone 17",
      color: "#e8f5e9",
      textColor: "#2e7d32",
    },
    {
      id: "2",
      type: "Offer",
      brand: "Apple",
      title: "iPhone 15 Pro Max",
      color: "#eef2ff",
      textColor: "#3730a3",
    },
    {
      id: "3",
      type: "Offer",
      brand: "Apple",
      title: "iPhone 14",
      color: "#eef2ff",
      textColor: "#3730a3",
    },
    // ... add more from your API
  ];

  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <View style={styles.columnType}>
        <View style={[styles.badge, { backgroundColor: item.color }]}>
          <Text style={[styles.badgeText, { color: item.textColor }]}>
            {item.type}
          </Text>
        </View>
      </View>
      <Text style={[styles.columnBrand, { color: isDark ? "#fff" : "#333" }]}>
        {item.brand}
      </Text>
      <Text
        style={[styles.columnTitle, { color: isDark ? "#fff" : "#333" }]}
        numberOfLines={1}
      >
        {item.title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#f8f9fa" },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header with Search and Filter */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.mainTitle, { color: isDark ? "#fff" : "#000" }]}>
          Tradingfeed
        </Text>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}
          >
            <TextInput
              placeholder="Search"
              placeholderTextColor="#999"
              style={[styles.searchInput, { color: isDark ? "#fff" : "#000" }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}
          >
            <Ionicons name="filter-outline" size={20} color="#666" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats and Grid Toggle */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>606 broadcasts found</Text>
        <View style={styles.toggleIcons}>
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={24}
            color="#3b66f5"
          />
          <MaterialCommunityIcons
            name="view-grid-outline"
            size={24}
            color="#999"
            style={{ marginLeft: 10 }}
          />
        </View>
      </View>

      {/* Table Header Labels */}
      <View
        style={[
          styles.tableHeader,
          { backgroundColor: isDark ? "#111" : "#f1f3f5" },
        ]}
      >
        <Text style={styles.headerLabelType}>Type</Text>
        <Text style={styles.headerLabelBrand}>Brand</Text>
        <Text style={styles.headerLabelTitle}>Title</Text>
      </View>

      <FlatList
        data={broadcasts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Action Button for Chat */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#000" />
      </TouchableOpacity>

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 15, paddingBottom: 15 },
  mainTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 15 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBar: {
    flex: 1,
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
  },
  searchInput: { fontSize: 16 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterText: { marginLeft: 5, color: "#666" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    alignItems: "center",
  },
  statsText: { color: "#666", fontSize: 14 },
  toggleIcons: { flexDirection: "row" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerLabelType: { width: "25%", fontWeight: "bold", color: "#666" },
  headerLabelBrand: { width: "25%", fontWeight: "bold", color: "#666" },
  headerLabelTitle: { width: "50%", fontWeight: "bold", color: "#666" },
  row: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  columnType: { width: "25%" },
  columnBrand: { width: "25%", fontSize: 14 },
  columnTitle: { width: "50%", fontSize: 14, fontWeight: "500" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});

export default TradingFeed;
