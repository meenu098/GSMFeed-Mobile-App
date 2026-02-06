// import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import {
//   Dimensions,
//   FlatList,
//   Image,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import BottomNav from "../../components/BottomNav";
// import { AiIcon } from "../../components/icons/icons";
// import SidebarOverlay from "../../components/SidebarOverlay";
// import { useTheme } from "../_utils/themeContext";
// import BroadcastSelection from "./BroadCastSelection";
// import BuyForm from "./ListingForms/BuyForm";
// import SellForm from "./ListingForms/SellForm";

// const { width } = Dimensions.get("window");

// // --- DUMMY DATA ---
// const DUMMY_POSTS = [
//   {
//     id: "1",
//     user: "Meenu MJ",
//     avatar: "https://i.pravatar.cc/150?u=meenu",
//     verified: true,
//     rating: 5,
//     country: "🇮🇳",
//     time: "4 hours ago",
//     type: "Sell",
//     title: "iPhone 15 Pro Max",
//     price: "899",
//     status: "Used",
//     condition: "Used",
//     grade: "New",
//     quantity: "200",
//     images: [
//       require("../../assets/common/samsung.png"),
//       require("../../assets/common/iphone1.png"),
//     ],
//     likesCount: 1,
//     commentsCount: 1,
//     isLiked: false,
//   },
//   {
//     id: "2",
//     user: "Sarah Chen",
//     avatar: "https://i.pravatar.cc/150?u=SARAH",
//     verified: true,
//     rating: 4,
//     country: "🇺🇸",
//     time: "2 hours ago",
//     type: "Sell",
//     title: "Samsung S24 Ultra",
//     price: "1199",
//     status: "New",
//     condition: "New",
//     grade: "A+",
//     quantity: "50",
//     images: [require("../../assets/common/samsung2.png")],
//     likesCount: 12,
//     commentsCount: 4,
//     isLiked: true,
//   },
// ];

// const PostItem = ({ item, theme, onLike }: any) => {
//   const [activeIndex, setActiveIndex] = useState(0);
//   const images = item.images || [];
//   const [menuVisible, setMenuVisible] = useState(false);

//   return (
//     <View style={[styles.postCard, { backgroundColor: theme.cardBg }]}>
//       {/* 1. Header Area: Verified User + Rating */}
//       <View style={styles.postHeader}>
//         <View style={styles.avatarWrapper}>
//           <Image source={{ uri: item.avatar }} style={styles.avatar} />
//           {item.verified && (
//             <View style={styles.verifiedBadge}>
//               <MaterialCommunityIcons
//                 name="check-decagram"
//                 size={12}
//                 color="white"
//               />
//             </View>
//           )}
//         </View>

//         <View style={styles.headerInfo}>
//           <View style={styles.nameRow}>
//             <Text style={[styles.userName, { color: theme.text }]}>
//               {item.user}
//             </Text>
//             <View
//               style={[
//                 styles.typePill,
//                 {
//                   backgroundColor: item.type === "Sell" ? "#F3E8FF" : "#DCFCE7",
//                 },
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.typePillText,
//                   { color: item.type === "Sell" ? "#7E22CE" : "#15803D" },
//                 ]}
//               >
//                 {item.type}
//               </Text>
//             </View>
//             <Text style={[styles.timeText, { color: theme.subText }]}>
//               {item.time}
//             </Text>
//           </View>
//           <View style={styles.ratingRow}>
//             {[...Array(5)].map((_, i) => (
//               <Ionicons
//                 key={i}
//                 name="star"
//                 size={10}
//                 color={i < item.rating ? "#FBBF24" : "#E5E7EB"}
//               />
//             ))}
//             <Text style={styles.countryFlag}>{item.country}</Text>
//           </View>
//         </View>
//         <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
//           <Feather name="more-horizontal" size={20} color={theme.subText} />
//         </TouchableOpacity>
//         {menuVisible && (
//           <View style={[styles.popupMenu, { backgroundColor: theme.cardBg }]}>
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => setMenuVisible(false)}
//             >
//               <Feather name="eye-off" size={18} color={theme.text} />
//               <Text style={[styles.menuText, { color: theme.text }]}>Hide</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => setMenuVisible(false)}
//             >
//               <Feather name="flag" size={18} color={theme.text} />
//               <Text style={[styles.menuText, { color: theme.text }]}>
//                 Report
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       {/* 2. Content Row: Title + Price */}
//       <View style={styles.titleRow}>
//         <View style={styles.titleGroup}>
//           <Text style={[styles.postTitle, { color: theme.text }]}>
//             {item.title}
//           </Text>
//           <View style={styles.statusBadge}>
//             <Text style={styles.statusBadgeText}>{item.status}</Text>
//           </View>
//         </View>
//         <Text style={styles.priceText}>${item.price}</Text>
//       </View>

//       {/* 3. Specs Row */}
//       <View style={styles.specsRow}>
//         <Text style={[styles.specText, { color: theme.subText }]}>
//           Condition:{" "}
//           <Text style={{ color: theme.text, fontWeight: "600" }}>
//             {item.condition}
//           </Text>
//         </Text>
//         <Text style={[styles.specText, { color: theme.subText }]}>
//           Grade:{" "}
//           <Text style={{ color: theme.text, fontWeight: "600" }}>
//             {item.grade}
//           </Text>
//         </Text>
//         <Text style={[styles.specText, { color: theme.subText }]}>
//           Quantity:{" "}
//           <Text style={{ color: theme.text, fontWeight: "600" }}>
//             {item.quantity}
//           </Text>
//         </Text>
//       </View>

//       {/* 4. Media Section */}
//       <View style={styles.imageContainer}>
//         <FlatList
//           data={images}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onScroll={(e) =>
//             setActiveIndex(
//               Math.round(e.nativeEvent.contentOffset.x / (width - 64)),
//             )
//           }
//           keyExtractor={(_, index) => index.toString()}
//           renderItem={({ item: img }) => (
//             <Image source={img} style={styles.postImage} resizeMode="cover" />
//           )}
//         />
//         {images.length > 1 && (
//           <View style={styles.pagination}>
//             {images.map((_: any, idx: number) => (
//               <View
//                 key={idx}
//                 style={[
//                   styles.dot,
//                   activeIndex === idx ? styles.activeDot : styles.inactiveDot,
//                 ]}
//               />
//             ))}
//           </View>
//         )}
//       </View>

//       {/* 5. Interaction Footer */}
//       <View style={styles.interactionRow}>
//         <View style={styles.leftActions}>
//           <TouchableOpacity
//             style={styles.actionBtn}
//             onPress={() => onLike(item.id)}
//           >
//             <Ionicons
//               name={item.isLiked ? "heart" : "heart-outline"}
//               size={26}
//               color={item.isLiked ? "#EF4444" : theme.text}
//             />
//             <Text style={[styles.countText, { color: theme.text }]}>
//               {item.likesCount}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionBtn}>
//             <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
//             <Text style={[styles.countText, { color: theme.text }]}>
//               {item.commentsCount}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionBtn}>
//             <Ionicons name="paper-plane-outline" size={24} color={theme.text} />
//           </TouchableOpacity>
//         </View>
//         <TouchableOpacity>
//           <Ionicons name="bookmark-outline" size={26} color={theme.text} />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default function NewsFeedScreen() {
//   const router = useRouter();
//   const { isDark } = useTheme();
//   const [sidebarVisible, setSidebarVisible] = useState(false);
//   const [currentView, setCurrentView] = useState<
//     "feed" | "selection" | "sell" | "buy"
//   >("feed");
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [step, setStep] = useState(1);

//   const handleOpenSelection = () => {
//     setCurrentView("selection");
//     setIsModalVisible(true);
//   };

//   const handleSelection = (type: "Sell" | "Buy") => {
//     setIsModalVisible(false);
//     setCurrentView(type === "Sell" ? "sell" : "buy");
//   };

//   const handleBackToFeed = () => {
//     setCurrentView("feed");
//     setIsModalVisible(false);
//   };
//   const handleNextStep = () => setStep(2);

//   const theme = {
//     bg: isDark ? "#050609" : "#F8FAFC",
//     cardBg: isDark ? "#0B0E14" : "#FFFFFF",
//     text: isDark ? "#F8FAFC" : "#1E293B",
//     subText: isDark ? "#94A3B8" : "#64748B",
//   };

//   if (currentView === "sell") {
//     return <SellForm onNext={handleNextStep} onBack={handleBackToFeed} />;
//   }

//   // 2. Show Buy Form
//   if (currentView === "buy") {
//     return <BuyForm onBack={handleBackToFeed} onNext={handleNextStep} />;
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
//       <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
//       <BroadcastSelection
//         visible={isModalVisible}
//         onClose={handleBackToFeed}
//         onSelect={handleSelection}
//       />

//       {/* GSMFeed Original Header */}
//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={handleOpenSelection}>
//           <Feather name="plus" size={24} color={theme.text} />
//         </TouchableOpacity>
//         <Image
//           source={
//             isDark
//               ? require("../../assets/common/logo-dark.png")
//               : require("../../assets/common/logo.png")
//           }
//           style={styles.logo}
//           resizeMode="contain"
//         />
//         <View style={styles.headerRight}>
//           <TouchableOpacity
//             onPress={() => setSidebarVisible(true)}
//             style={{ marginLeft: 15 }}
//           >
//             <Feather name="menu" size={28} color={theme.text} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <FlatList
//         data={DUMMY_POSTS}
//         keyExtractor={(item) => item.id}
//         ListHeaderComponent={
//           <TouchableOpacity
//             style={styles.broadcastBtnContainer}
//             onPress={handleOpenSelection}
//           >
//             <LinearGradient
//               colors={["#3B66F5", "#89A3F9"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={styles.broadcastBtnGradient}
//             >
//               <AiIcon fill="white" />
//               <Text style={styles.broadcastText}>Create your broadcast</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         }
//         renderItem={({ item }) => (
//           <PostItem
//             item={item}
//             theme={theme}
//           />
//         )}
//         contentContainerStyle={{ paddingBottom: 100 }}
//       />
//       {sidebarVisible && (
//         <SidebarOverlay
//           visible={sidebarVisible}
//           onClose={() => setSidebarVisible(false)}
//         />
//       )}
//       <BottomNav />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   topBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//   },
//   logo: { width: 110, height: 35 },
//   headerRight: { flexDirection: "row" },
//   iconCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(0,0,0,0.05)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   broadcastBtn: {
//     backgroundColor: "#3B66F5",
//     margin: 16,
//     padding: 14,
//     borderRadius: 25,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 5,
//   },
//   // broadcastText: {
//   //   color: "white",
//   //   fontWeight: "bold",
//   //   marginLeft: 8,
//   //   fontSize: 16,
//   // },
//   postCard: {
//     marginHorizontal: 13,
//     marginVertical: 4,
//     borderRadius: 15,
//     padding: 16,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//   },
//   postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
//   avatarWrapper: { position: "relative" },
//   avatar: { width: 48, height: 48, borderRadius: 24 },
//   verifiedBadge: {
//     position: "absolute",
//     bottom: -2,
//     right: -2,
//     backgroundColor: "#7C3AED",
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "white",
//   },
//   headerInfo: { flex: 1, marginLeft: 12 },
//   nameRow: { flexDirection: "row", alignItems: "center" },
//   userName: { fontWeight: "bold", fontSize: 16 },
//   typePill: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   typePillText: { fontSize: 11, fontWeight: "bold" },
//   timeText: { fontSize: 12, marginLeft: 16 },
//   ratingRow: { flexDirection: "row", marginTop: 5 },
//   countryFlag: { marginLeft: 6, fontSize: 10 },
//   titleRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 8,
//   },
//   titleGroup: { flexDirection: "row", alignItems: "center" },
//   postTitle: { fontSize: 17, fontWeight: "bold" },
//   statusBadge: {
//     backgroundColor: "#F1F5F9",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 8,
//     marginLeft: 10,
//   },
//   statusBadgeText: { fontSize: 12, color: "#64748B" },
//   priceText: { fontSize: 22, fontWeight: "bold", color: "#3B66F5" },
//   specsRow: { flexDirection: "row", gap: 12, marginVertical: 10 },
//   specText: { fontSize: 13 },
//   imageContainer: { borderRadius: 0, overflow: "hidden", marginVertical: 10 },
//   postImage: { width: width - 64, height: 280 },
//   pagination: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: -25,
//     paddingBottom: 15,
//   },
//   dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
//   activeDot: { backgroundColor: "#3B66F5", width: 20 },
//   inactiveDot: { backgroundColor: "rgba(255,255,255,0.5)" },
//   interactionRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 12,
//   },
//   leftActions: { flexDirection: "row", alignItems: "center", gap: 20 },
//   actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
//   countText: { fontWeight: "600" },
//   broadcastBtnContainer: {
//     margin: 16,
//     borderRadius: 25,
//     // Soft shadow to match the "elevated" look in the screenshot
//     shadowColor: "#3B66F5",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   broadcastBtnGradient: {
//     padding: 14,
//     borderRadius: 25,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   broadcastText: {
//     color: "white",
//     fontWeight: "600",
//     marginLeft: 8,
//     fontSize: 16,
//     // Subtle letter spacing for that modern marketplace look
//     letterSpacing: 0.2,
//   },
//   popupMenu: {
//     position: "absolute",
//     right: 15,
//     top: 40,
//     width: 140,
//     borderRadius: 10,
//     padding: 8,
//     zIndex: 100,
//     elevation: 5,
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 8,
//     gap: 10,
//   },
//   menuText: { fontSize: 14, fontWeight: "500" },
// });

// import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import React, { useEffect, useState } from "react";
// import {
//   Dimensions,
//   FlatList,
//   Image,
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// // Components
// import BottomNav from "../../components/BottomNav";
// import { AiIcon } from "../../components/icons/icons";
// import SidebarOverlay from "../../components/SidebarOverlay";
// import BroadcastSelection from "./BroadCastSelection";

// // Hooks & Utils
// import { useFeedData } from "../../hooks/useFeedData";
// import CONFIG from "../_utils/config";
// import { useTheme } from "../_utils/themeContext";

// const { width } = Dimensions.get("window");

// const PostItem = ({ item, theme, onLike }: any) => {
//   const [activeIndex, setActiveIndex] = useState(0);
//   const [menuVisible, setMenuVisible] = useState(false);

//   // 1. Extract the primary trading data (since your API nests it here)
//   const tradingData = item.trading_feeds?.[0] || {};

//   // 2. Map Media correctly (Check both sources)
//   const mediaUrls = tradingData.images || item.media || [];

//   // 3. Extract Author data
//   const author = item.author || {};

//   const isLiked = item.my_reaction !== null;

//   return (
//     <View style={[styles.postCard, { backgroundColor: theme.cardBg }]}>
//       {/* Header Area */}
//       <View style={styles.postHeader}>
//         <View style={styles.avatarWrapper}>
//           <Image
//             source={{ uri: author.avatar || "https://via.placeholder.com/150" }}
//             style={styles.avatar}
//           />
//           {author.is_verified === 1 && (
//             <View style={styles.verifiedBadge}>
//               <MaterialCommunityIcons
//                 name="check-decagram"
//                 size={12}
//                 color="white"
//               />
//             </View>
//           )}
//         </View>

//         <View style={styles.headerInfo}>
//           <View style={styles.nameRow}>
//             <Text
//               style={[styles.userName, { color: theme.text }]}
//               numberOfLines={1}
//             >
//               {author.name}
//             </Text>
//             <View
//               style={[
//                 styles.typePill,
//                 {
//                   backgroundColor:
//                     tradingData.type === "wts" ? "#F3E8FF" : "#DCFCE7",
//                 },
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.typePillText,
//                   { color: tradingData.type === "wts" ? "#7E22CE" : "#15803D" },
//                 ]}
//               >
//                 {tradingData.type === "wts" ? "Sell" : "Buy"}
//               </Text>
//             </View>
//           </View>
//           {/* Ratings */}
//           <View style={styles.ratingRow}>
//             {[...Array(5)].map((_, i) => (
//               <Ionicons
//                 key={i}
//                 name="star"
//                 size={10}
//                 color={
//                   i < (author.rating?.averageRating || 0)
//                     ? "#FBBF24"
//                     : "#E5E7EB"
//                 }
//               />
//             ))}
//             <Text style={styles.timeText}>{item.created_at_human_short}</Text>
//           </View>
//         </View>

//         <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
//           <Feather name="more-horizontal" size={20} color={theme.subText} />
//         </TouchableOpacity>
//       </View>

//       {/* Product Content */}
//       <View style={styles.titleRow}>
//         <Text style={[styles.postTitle, { color: theme.text }]}>
//           {tradingData.product?.name || "New Product"}
//         </Text>
//         <Text style={styles.priceText}>
//           {tradingData.price ? `$${tradingData.price}` : "$0"}
//         </Text>
//       </View>

//       {/* Specs Row */}
//       <View style={styles.specsRow}>
//         <Text style={[styles.specText, { color: theme.subText }]}>
//           Grade:{" "}
//           <Text style={{ color: theme.text, fontWeight: "600" }}>
//             {tradingData.grade?.name || "N/A"}
//           </Text>
//         </Text>
//         <Text style={[styles.specText, { color: theme.subText }]}>
//           Qty:{" "}
//           <Text style={{ color: theme.text, fontWeight: "600" }}>
//             {tradingData.qty || 0}
//           </Text>
//         </Text>
//       </View>

//       {/* Image Gallery */}
//       {mediaUrls.length > 0 && (
//         <View style={styles.imageContainer}>
//           <FlatList
//             data={mediaUrls}
//             horizontal
//             pagingEnabled
//             showsHorizontalScrollIndicator={false}
//             onScroll={(e) =>
//               setActiveIndex(
//                 Math.round(e.nativeEvent.contentOffset.x / (width - 64)),
//               )
//             }
//             renderItem={({ item: url }) => (
//               <Image
//                 source={{ uri: url }}
//                 style={styles.postImage}
//                 resizeMode="cover"
//               />
//             )}
//           />
//         </View>
//       )}

//       {/* Interaction Footer */}
//       <View style={styles.interactionRow}>
//         <View style={styles.leftActions}>
//           <TouchableOpacity
//             style={styles.actionBtn}
//             onPress={() => onLike(item.id)}
//           >
//             <Ionicons
//               name={isLiked ? "heart" : "heart-outline"}
//               size={26}
//               color={isLiked ? "#EF4444" : theme.text}
//             />
//             <Text style={[styles.countText, { color: theme.text }]}>
//               {item.total_reactions?.total || 0}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionBtn}>
//             <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
//             <Text style={[styles.countText, { color: theme.text }]}>
//               {item.total_comments || 0}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default function NewsFeedScreen() {
//   const { isDark } = useTheme();
//   const [sidebarVisible, setSidebarVisible] = useState(false);
//   const [isModalVisible, setIsModalVisible] = useState(false);

//   const { feed, isLoading, fetchFeed } = useFeedData(
//     `${CONFIG.API_ENDPOINT}/api/feed/posts`,
//   );

//   useEffect(() => {
//     fetchFeed(1);
//   }, []);

//   const theme = {
//     bg: isDark ? "#050609" : "#F8FAFC",
//     cardBg: isDark ? "#0B0E14" : "#FFFFFF",
//     text: isDark ? "#F8FAFC" : "#1E293B",
//     subText: isDark ? "#94A3B8" : "#64748B",
//   };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
//       <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

//       <BroadcastSelection
//         visible={isModalVisible}
//         onClose={() => setIsModalVisible(false)}
//         onSelect={(type: any) => {
//           setIsModalVisible(false);
//           // Handle navigation to Buy/Sell forms here
//         }}
//       />

//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={() => setIsModalVisible(true)}>
//           <Feather name="plus" size={24} color={theme.text} />
//         </TouchableOpacity>
//         <Image
//           source={
//             isDark
//               ? require("../../assets/common/logo-dark.png")
//               : require("../../assets/common/logo.png")
//           }
//           style={styles.logo}
//           resizeMode="contain"
//         />
//         <TouchableOpacity onPress={() => setSidebarVisible(true)}>
//           <Feather name="menu" size={28} color={theme.text} />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={feed}
//         keyExtractor={(item) => item.id.toString()}
//         onEndReached={() => fetchFeed()} // Assuming hook handles page increments
//         onEndReachedThreshold={0.5}
//         refreshControl={
//           <RefreshControl
//             refreshing={isLoading}
//             onRefresh={() => fetchFeed(1)}
//             tintColor="#3B66F5"
//           />
//         }
//         ListHeaderComponent={
//           <TouchableOpacity
//             style={styles.broadcastBtnContainer}
//             onPress={() => setIsModalVisible(true)}
//           >
//             <LinearGradient
//               colors={["#3B66F5", "#89A3F9"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={styles.broadcastBtnGradient}
//             >
//               <AiIcon fill="white" />
//               <Text style={styles.broadcastText}>Create your broadcast</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         }
//         renderItem={({ item }) => (
//           <PostItem
//             item={item}
//             theme={theme}
//           />
//         )}
//         contentContainerStyle={{ paddingBottom: 100 }}
//       />

//       {sidebarVisible && (
//         <SidebarOverlay
//           visible={sidebarVisible}
//           onClose={() => setSidebarVisible(false)}
//         />
//       )}
//       <BottomNav />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   topBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//   },
//   logo: { width: 110, height: 35 },
//   broadcastBtnContainer: {
//     margin: 16,
//     borderRadius: 25,
//     shadowColor: "#3B66F5",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   broadcastBtnGradient: {
//     padding: 14,
//     borderRadius: 25,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   broadcastText: {
//     color: "white",
//     fontWeight: "600",
//     marginLeft: 8,
//     fontSize: 16,
//   },
//   postCard: {
//     marginHorizontal: 13,
//     marginVertical: 4,
//     borderRadius: 15,
//     padding: 16,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//   },
//   postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
//   avatarWrapper: { position: "relative" },
//   avatar: { width: 48, height: 48, borderRadius: 24 },
//   verifiedBadge: {
//     position: "absolute",
//     bottom: -2,
//     right: -2,
//     backgroundColor: "#7C3AED",
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "white",
//   },
//   headerInfo: { flex: 1, marginLeft: 12 },
//   nameRow: { flexDirection: "row", alignItems: "center" },
//   userName: { fontWeight: "bold", fontSize: 16 },
//   typePill: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   typePillText: { fontSize: 11, fontWeight: "bold" },
//   ratingRow: { flexDirection: "row", marginTop: 5 },
//   titleRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 8,
//   },
//   postTitle: { fontSize: 17, fontWeight: "bold" },
//   priceText: { fontSize: 22, fontWeight: "bold", color: "#3B66F5" },
//   specsRow: { flexDirection: "row", gap: 12, marginVertical: 10 },
//   specText: { fontSize: 13 },
//   imageContainer: { borderRadius: 10, overflow: "hidden", marginVertical: 10 },
//   postImage: { width: width - 64, height: 280 },
//   interactionRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 12,
//   },
//   leftActions: { flexDirection: "row", alignItems: "center", gap: 20 },
//   actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
//   countText: { fontWeight: "600" },
// });
