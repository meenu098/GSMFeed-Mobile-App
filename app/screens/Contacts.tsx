import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const tabMapping: Record<string, string> = {
  Suggestions: "user/suggestions",
  Requests: "connection/requests-received",
  Following: "connection/following",
  Followers: "connection/followers",
};

export default function ContactsScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tab } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState("Following");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
    badge: "#316aff",
  };

  const fetchContacts = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        const userString = await AsyncStorage.getItem("user");

        if (!userString) {
          setLoading(false);
          return;
        }

        const userObj = JSON.parse(userString);
        const token = userObj.token;

        const endpoint = tabMapping[activeTab];
        const url = `${CONFIG.API_ENDPOINT}/api/${endpoint}?page=${pageNum}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await response.json();


        if (json.status && json.data) {
          const usersArray = Array.isArray(json.data)
            ? json.data
            : json.data.users?.data || json.data.data || [];
          setContacts((prev) =>
            isRefresh ? usersArray : [...prev, ...usersArray],
          );

          if (json.data.additional_data) {
            setCounts({
              following: json.data.additional_data.following_count || 0,
              followers: json.data.additional_data.followers_count || 0,
            });
          }

          const pagination = json.data.users;
          setHasMore(
            pagination ? pagination.current_page < pagination.last_page : false,
          );
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchContacts(1, true);
  }, [activeTab]);

  useEffect(() => {
    if (typeof tab === "string" && tabMapping[tab]) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContacts(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchContacts(1, true);
  };

  const handleAction = async (item: any) => {
    try {
      // 1. Get the full user string from AsyncStorage
      const userString = await AsyncStorage.getItem("user");

      if (!userString) {
        return;
      }

      // 2. Parse the string and extract the token property
      const userObj = JSON.parse(userString);
      const token = userObj.token;

      if (!token) {
        return;
      }

      const isFollowed =
        activeTab === "Following" ||
        item.followedByMe === true ||
        item.followedByMe === 1 ||
        item.followedByMe === "1" ||
        item.followedByMe === "true" ||
        (item.followedByMe && typeof item.followedByMe === "object");

      let actionEndpoint = isFollowed ? "unfollow" : "follow";
      if (activeTab === "Requests") actionEndpoint = "accept-request";

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/connection/${actionEndpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`, // Correct token string used here
          },
          body: JSON.stringify({ user_id: item.id_for_actions || item.id }),
        },
      );

      const json = await response.json();
      if (json.status) {
        onRefresh(); // Refresh list to reflect changes
      }
    } catch (error) {
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {Object.keys(tabMapping).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && { borderBottomColor: theme.primary },
            ]}
          >
            <View style={styles.tabContent}>
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
              {(tab === "Following" || tab === "Followers") && (
                <View
                  style={[styles.countBadge, { backgroundColor: theme.badge }]}
                >
                  <Text style={styles.countText}>
                    {tab === "Following" ? counts.following : counts.followers}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => (item.id || index).toString()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={{ color: theme.subText, marginTop: 40 }}>
                No users found.
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => {
            const isFollowed =
              activeTab === "Following" ||
              item.followedByMe === true ||
              item.followedByMe === 1 ||
              item.followedByMe === "1" ||
              item.followedByMe === "true" ||
              (item.followedByMe && typeof item.followedByMe === "object");

            return (
              <View
                style={[styles.contactRow, { borderBottomColor: theme.border }]}
              >
                <Image
                  source={{
                    uri: item.avatar || "https://via.placeholder.com/150",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.contactInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    {item.is_verified === 1 && (
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color="#3B82F6"
                      />
                    )}
                  </View>
                  <Text style={[styles.followers, { color: theme.subText }]}>
                    @{item.username} • {item.followers_count} followers
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isFollowed && activeTab !== "Requests"
                      ? styles.unfollowBtn
                      : { backgroundColor: theme.primary },
                  ]}
                  onPress={() => handleAction(item)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isFollowed && activeTab !== "Requests"
                        ? { color: theme.text }
                        : { color: "#FFF" },
                    ]}
                  >
                    {activeTab === "Requests"
                      ? "Accept"
                      : isFollowed
                        ? "Following"
                        : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
          }}
        />
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  tabText: { fontSize: 11, fontWeight: "600" },
  countBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  countText: { color: "white", fontSize: 9, fontWeight: "700" },
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
  contactInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { fontSize: 15, fontWeight: "700" },
  followers: { fontSize: 11, marginTop: 2 },
  // ADDED: Button Styles
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  unfollowBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#94A3B8",
  },
  btnText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

// import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import React, { useCallback, useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import BottomNav from "../../components/BottomNav";
// import CONFIG from "../../shared/config";
// import { useTheme } from "../../shared/themeContext";

// const tabMapping: Record<string, string> = {
//   Suggestions: "user/suggestions",
//   Requests: "connection/requests-received",
//   Following: "connection/following",
//   Followers: "connection/followers",
// };

// export default function ContactsScreen() {
//   const { isDark } = useTheme();
//   const insets = useSafeAreaInsets();
//   const router = useRouter();

//   const [activeTab, setActiveTab] = useState("Following");
//   const [contacts, setContacts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [counts, setCounts] = useState({ following: 0, followers: 0 });

//   const theme = {
//     bg: isDark ? "#0B0E14" : "#F8FAFC",
//     text: isDark ? "#F8FAFC" : "#0F172A",
//     subText: isDark ? "#94A3B8" : "#64748B",
//     border: isDark ? "#1B2331" : "#E2E8F0",
//     primary: "#3B66F5",
//     badge: "#316aff",
//   };

//   const fetchContacts = useCallback(
//     async (pageNum: number, isRefresh = false) => {
//       try {
//         const userString = await AsyncStorage.getItem("user");

//         if (!userString) {
//           setLoading(false);
//           return;
//         }

//         const userObj = JSON.parse(userString);
//         const token = userObj.token;

//         const endpoint = tabMapping[activeTab];
//         const url = `${CONFIG.API_ENDPOINT}/api/${endpoint}?page=${pageNum}`;

//         const response = await fetch(url, {
//           method: activeTab === "Suggestions" ? "POST" : "GET",
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const json = await response.json();

//         if (json.status && json.data) {
//           const usersArray = json.data.users?.data || [];
//           setContacts((prev) =>
//             isRefresh ? usersArray : [...prev, ...usersArray],
//           );

//           if (json.data.additional_data) {
//             setCounts({
//               following: json.data.additional_data.following_count || 0,
//               followers: json.data.additional_data.followers_count || 0,
//             });
//           }

//           const pagination = json.data.users;
//           setHasMore(
//             pagination ? pagination.current_page < pagination.last_page : false,
//           );
//         }
//       } catch (error) {
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     [activeTab],
//   );

//   useEffect(() => {
//     setLoading(true);
//     setPage(1);
//     fetchContacts(1, true);
//   }, [activeTab, fetchContacts]);

//   const handleAction = async (item: any) => {
//     try {
//       const userString = await AsyncStorage.getItem("user");
//       if (!userString) return;

//       const userObj = JSON.parse(userString);
//       const token = userObj.token;

//       // Logic: If in 'Following' tab or marked as followedByMe, they are followed
//       const isFollowed =
//         activeTab === "Following" ||
//         item.followedByMe === 1 ||
//         item.followedByMe === true;

//       let actionEndpoint = isFollowed ? "unfollow" : "follow";
//       if (activeTab === "Requests") actionEndpoint = "accept-request";

//       // --- OPTIMISTIC UPDATE ---
//       // Update local state immediately so button shows 'Following' or 'Follow'
//       setContacts((prevContacts) =>
//         prevContacts.map((contact) => {
//           if (contact.id === item.id) {
//             return {
//               ...contact,
//               followedByMe: actionEndpoint === "unfollow" ? 0 : 1,
//             };
//           }
//           return contact;
//         }),
//       );

//       const response = await fetch(
//         `${CONFIG.API_ENDPOINT}/api/connection/${actionEndpoint}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ user_id: item.id_for_actions || item.id }),
//         },
//       );

//       const json = await response.json();
//       if (!json.status) {
//         onRefresh(); // If server fails, refresh to correct state
//       } else {
//         // Optionally update the count badges at the top locally
//         if (actionEndpoint === "follow")
//           setCounts((c) => ({ ...c, following: c.following + 1 }));
//         if (actionEndpoint === "unfollow")
//           setCounts((c) => ({ ...c, following: c.following - 1 }));
//       }
//     } catch (error) {
//       onRefresh();
//     }
//   };

//   const handleLoadMore = () => {
//     if (hasMore && !loading && !refreshing) {
//       const nextPage = page + 1;
//       setPage(nextPage);
//       fetchContacts(nextPage);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     setPage(1);
//     fetchContacts(1, true);
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: theme.bg }]}>
//       <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//         <View style={styles.headerTitleRow}>
//           <MaterialCommunityIcons
//             name="account-group"
//             size={26}
//             color={theme.text}
//           />
//           <Text style={[styles.headerTitle, { color: theme.text }]}>
//             Contacts
//           </Text>
//         </View>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Feather name="x" size={24} color={theme.text} />
//         </TouchableOpacity>
//       </View>

//       <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
//         {Object.keys(tabMapping).map((tab) => (
//           <TouchableOpacity
//             key={tab}
//             onPress={() => setActiveTab(tab)}
//             style={[
//               styles.tabItem,
//               activeTab === tab && { borderBottomColor: theme.primary },
//             ]}
//           >
//             <View style={styles.tabContent}>
//               <Text
//                 style={[
//                   styles.tabText,
//                   activeTab === tab
//                     ? { color: theme.primary, fontWeight: "700" }
//                     : { color: theme.subText },
//                 ]}
//               >
//                 {tab}
//               </Text>
//               {(tab === "Following" || tab === "Followers") && (
//                 <View
//                   style={[styles.countBadge, { backgroundColor: theme.badge }]}
//                 >
//                   <Text style={styles.countText}>
//                     {tab === "Following" ? counts.following : counts.followers}
//                   </Text>
//                 </View>
//               )}
//             </View>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {loading && page === 1 ? (
//         <View style={styles.centered}>
//           <ActivityIndicator color={theme.primary} size="large" />
//         </View>
//       ) : (
//         <FlatList
//           data={contacts}
//           keyExtractor={(item, index) => (item.id || index).toString()}
//           onEndReached={handleLoadMore}
//           onEndReachedThreshold={0.5}
//           ListEmptyComponent={() => (
//             <View style={styles.centered}>
//               <Text style={{ color: theme.subText, marginTop: 40 }}>
//                 No users found.
//               </Text>
//             </View>
//           )}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor={theme.primary}
//             />
//           }
//           renderItem={({ item }) => {
//             // Check follow state based on tab or optimistic update
//             const isFollowed =
//               activeTab === "Following" ||
//               item.followedByMe === 1 ||
//               item.followedByMe === true;

//             return (
//               <View
//                 style={[styles.contactRow, { borderBottomColor: theme.border }]}
//               >
//                 <Image
//                   source={{
//                     uri: item.avatar || "https://via.placeholder.com/150",
//                   }}
//                   style={styles.avatar}
//                 />
//                 <View style={styles.contactInfo}>
//                   <View style={styles.nameRow}>
//                     <Text style={[styles.name, { color: theme.text }]}>
//                       {item.name}
//                     </Text>
//                     {item.is_verified === 1 && (
//                       <MaterialCommunityIcons
//                         name="check-decagram"
//                         size={14}
//                         color="#3B82F6"
//                       />
//                     )}
//                   </View>
//                   <Text style={[styles.followers, { color: theme.subText }]}>
//                     @{item.username} • {item.followers_count} followers
//                   </Text>
//                 </View>

//                 <TouchableOpacity
//                   style={[
//                     styles.actionBtn,
//                     isFollowed
//                       ? styles.unfollowBtn
//                       : { backgroundColor: theme.primary },
//                   ]}
//                   onPress={() => handleAction(item)}
//                 >
//                   <Text
//                     style={[
//                       styles.btnText,
//                       isFollowed ? { color: theme.text } : { color: "#FFF" },
//                     ]}
//                   >
//                     {activeTab === "Requests" && !isFollowed
//                       ? "Accept"
//                       : isFollowed
//                         ? "Following"
//                         : "Follow"}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             );
//           }}
//           contentContainerStyle={{
//             paddingHorizontal: 20,
//             paddingBottom: insets.bottom + 100,
//           }}
//         />
//       )}
//       <BottomNav />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   centered: { flex: 1, justifyContent: "center", alignItems: "center" },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingBottom: 15,
//   },
//   headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
//   headerTitle: { fontSize: 24, fontWeight: "800" },
//   tabBar: { flexDirection: "row", borderBottomWidth: 1 },
//   tabItem: {
//     flex: 1,
//     alignItems: "center",
//     paddingVertical: 15,
//     borderBottomWidth: 2,
//     borderBottomColor: "transparent",
//   },
//   tabContent: { flexDirection: "row", alignItems: "center", gap: 4 },
//   tabText: { fontSize: 11, fontWeight: "600" },
//   countBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
//   countText: { color: "white", fontSize: 9, fontWeight: "700" },
//   contactRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 16,
//     borderBottomWidth: 0.5,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "#263145",
//   },
//   contactInfo: { flex: 1, marginLeft: 15 },
//   nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
//   name: { fontSize: 15, fontWeight: "700" },
//   followers: { fontSize: 11, marginTop: 2 },
//   actionBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     minWidth: 80,
//     alignItems: "center",
//   },
//   unfollowBtn: {
//     backgroundColor: "transparent",
//     borderWidth: 1,
//     borderColor: "#94A3B8",
//   },
//   btnText: { fontSize: 12, fontWeight: "700" },
// });
