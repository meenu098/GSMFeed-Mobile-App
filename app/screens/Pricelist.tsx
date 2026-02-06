import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import { useTheme } from "../../shared/themeContext";

const Pricelist = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("Your Pricelist");

  // Mock data based on your screenshot
  const priceLists = [
    { id: "1", name: "testing", items: 10, lastUpdate: "17:46, 03-Sep-2025" },
    { id: "2", name: "New Test", items: 6, lastUpdate: "12:52, 13-Nov-2025" },
    {
      id: "3",
      name: "New Test Pricelist",
      items: 2,
      lastUpdate: "12:17, 13-Nov-2025",
    },
  ];

  const renderItem = ({ item }: any) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          borderColor: isDark ? "#333" : "#eee",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.listName, { color: isDark ? "#fff" : "#000" }]}>
          {item.name}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="edit" size={18} color={isDark ? "#aaa" : "#555"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="upload" size={18} color={isDark ? "#aaa" : "#555"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather
              name="download"
              size={18}
              color={isDark ? "#aaa" : "#555"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather
              name="trash-2"
              size={18}
              color={isDark ? "#aaa" : "#555"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          Items: <Text style={styles.boldText}>{item.items}</Text>
        </Text>
        <Text style={styles.footerText}>
          Last Update: <Text style={styles.boldText}>{item.lastUpdate}</Text>
        </Text>
      </View>
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

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.mainTitle, { color: isDark ? "#fff" : "#000" }]}>
            Pricelist <Text style={styles.beta}>Beta</Text>
          </Text>
          <TouchableOpacity style={styles.createBtn}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

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
          />
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            {["Your Pricelist", "Shared with me", "On Behalf", "Browse"].map(
              (tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.activeTab,
                    { borderColor: isDark ? "#333" : "#ddd" },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab
                        ? styles.activeTabText
                        : { color: isDark ? "#aaa" : "#666" },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={priceLists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.chatFab}>
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#000" />
      </TouchableOpacity>

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 15 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  mainTitle: { fontSize: 24, fontWeight: "bold" },
  beta: { fontSize: 12, color: "#3B66F5", fontWeight: "normal" },
  createBtn: {
    flexDirection: "row",
    backgroundColor: "#3b66f5",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 5 },
  searchBar: {
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    justifyContent: "center",
  },
  searchInput: { fontSize: 16 },
  tabContainer: { marginBottom: 10 },
  tabScroll: { gap: 8 },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  activeTab: { backgroundColor: "#3b66f5", borderColor: "#3b66f5" },
  tabText: { fontSize: 13, fontWeight: "500" },
  activeTabText: { color: "#fff" },
  listContent: { paddingHorizontal: 15, paddingBottom: 100 },
  card: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  listName: { fontSize: 16, fontWeight: "bold", flex: 1 },
  actionRow: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 12, color: "#666" },
  boldText: { fontWeight: "bold", color: "#333" },
  chatFab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Pricelist;
