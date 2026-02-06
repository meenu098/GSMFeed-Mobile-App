import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import { useTheme } from "../../shared/themeContext";

export default function ContactsScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Followers");

  // Initialize state with the contact data
  const [contacts, setContacts] = useState(
    Array(15)
      .fill(null)
      .map((_, i) => ({
        id: i.toString(),
        name: "Jose Arnedo",
        followers: "2,378 followers",
        isFollowing: i === 1, // Pre-set one as 'Following'
        avatar: `https://i.pravatar.cc/100?u=${i + 20}`,
      }))
  );

  // Function to handle follow/unfollow toggle
  const toggleFollow = (id: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? { ...contact, isFollowing: !contact.isFollowing }
          : contact
      )
    );
  };

  const tabs = ["Followers", "Following", "Suggestions", "Requests"];

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, backgroundColor: theme.bg },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons
            name="account-group"
            size={26}
            color={theme.text}
          />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Contacts
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* 2. Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && { borderBottomColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab
                  ? { color: theme.primary, fontWeight: "700" }
                  : { color: theme.subText },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. List Content */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[styles.contactRow, { borderBottomColor: theme.border }]}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.contactInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {item.name}
                </Text>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color="#3B82F6"
                />
              </View>
              <Text style={[styles.followers, { color: theme.subText }]}>
                {item.followers}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.isFollowing
                  ? [styles.unfollowBtn, { borderColor: theme.border }]
                  : [styles.followBtn, { backgroundColor: theme.primary }],
              ]}
              onPress={() => toggleFollow(item.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.btnText,
                  // Use item.isFollowing instead of index
                  item.isFollowing ? { color: theme.text } : { color: "#FFF" },
                ]}
              >
                {item.isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#263145",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  followers: {
    fontSize: 12,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 95, // Increased slightly for "Following" text width
    alignItems: "center",
  },
  followBtn: {},
  unfollowBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  btnText: {
    fontWeight: "700",
    fontSize: 13,
  },
});
