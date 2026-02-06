import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AngryIcon from "../../assets/reaction/angry.svg";
import HahaIcon from "../../assets/reaction/haha.svg";
import LikeIcon from "../../assets/reaction/like.svg";
import LoveIcon from "../../assets/reaction/love.svg";
import SadIcon from "../../assets/reaction/sad.svg";
import WowIcon from "../../assets/reaction/wow.svg";
import BottomNav from "../../components/BottomNav";
import SidebarOverlay from "../../components/SidebarOverlay";
import { AiIcon } from "../../components/icons/icons";
import { useFeedData } from "../../hooks/useFeedData";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 30;
const IMAGE_WIDTH = CARD_WIDTH - 30;

const REACTION_TYPES = [
  { title: "like", Icon: LikeIcon, color: "#3B66F5" },
  { title: "love", Icon: LoveIcon, color: "#EF4444" },
  { title: "haha", Icon: HahaIcon, color: "#FBBF24" },
  { title: "wow", Icon: WowIcon, color: "#FBBF24" },
  { title: "sad", Icon: SadIcon, color: "#FBBF24" },
  { title: "angry", Icon: AngryIcon, color: "#EA580C" },
];

const SpecItem = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.specItem}>
    <Text style={styles.specLabel}>
      {label}: <Text style={styles.specValue}>{value}</Text>
    </Text>
  </View>
);

const PostItem = ({ item, theme, onSave }: any) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(item.is_saved === 1);
  const [showPicker, setShowPicker] = useState(false);
  const [myReaction, setMyReaction] = useState(item.my_reaction);

  // Parse reaction count safely
  const initialTotal =
    typeof item.total_reactions === "object"
      ? item.total_reactions?.total || 0
      : item.total_reactions || 0;
  const [totalLikes, setTotalLikes] = useState<number>(initialTotal);

  const tradingData = item.trading_feeds?.[0] || {};
  const author = item.author || {};
  const mediaUrls = tradingData.images || item.media || [];

  const handleProfilePress = () => {
    const username = author?.username || author?.user_name || author?.id;
    if (!username) return;
    router.push({ pathname: "/screens/Profile", params: { userId: username } });
  };

  // API: Record Interaction Stat
  const postInteractStatTrigger = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      await fetch(
        `${CONFIG.API_ENDPOINT}/api/feed/post/stat/record-interaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ post_id: item.id }),
        },
      );
    } catch (error) {}
  }, [item.id]);

  useEffect(() => {
    postInteractStatTrigger();
  }, [postInteractStatTrigger]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH));
  };

  const handleReact = async (reactionType: string) => {
    setShowPicker(false);
    const isRemoving = myReaction === reactionType;
    const nextReaction = isRemoving ? "none" : reactionType;
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      setMyReaction(isRemoving ? null : reactionType);
      const data = new FormData();
      data.append("reaction", nextReaction);
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/feed/post/react/${item.id}`,
        {
          method: "POST",
          body: data,
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      const result = await res.json();
      if (result.status && result.data) {
        const newCount =
          typeof result.data.total_likes === "object"
            ? result.data.total_likes.total
            : result.data.total_likes;
        setTotalLikes(newCount || 0);
      }
    } catch (error) {}
  };

  const activeReactionData = REACTION_TYPES.find((r) => r.title === myReaction);

  // Helper: Specs Rendering (Fixes String Error)
  const renderSpecs = () => {
    if (
      !tradingData ||
      (!tradingData.storage && !tradingData.grade && !tradingData.qty)
    )
      return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.specsRow}
      >
        {tradingData.storage?.name ? (
          <SpecItem label="Storage" value={tradingData.storage.name} />
        ) : null}
        {tradingData.grade?.name ? (
          <SpecItem label="Grade" value={tradingData.grade.name} />
        ) : null}
        {tradingData.qty ? (
          <SpecItem label="Qty" value={tradingData.qty} />
        ) : null}
      </ScrollView>
    );
  };

  // Helper: Media Rendering (Fixes String Error)
  const renderMedia = () => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    return (
      <View style={styles.imageWrapper}>
        <FlatList
          data={mediaUrls}
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, idx) => `img-${item.id}-${idx}`}
          renderItem={({ item: url }) => (
            <Image
              source={{ uri: url }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
        />
        {mediaUrls.length > 1 ? (
          <View style={styles.pagination}>
            {mediaUrls.map((_: any, idx: number) => (
              <View
                key={`dot-${item.id}-${idx}`}
                style={
                  activeIndex === idx ? styles.activeDot : styles.inactiveDot
                }
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.postCard, { backgroundColor: theme.cardBg }]}>
      {showPicker && (
        <View
          style={[styles.reactionPicker, { backgroundColor: theme.cardBg }]}
        >
          {REACTION_TYPES.map((r) => (
            <TouchableOpacity
              key={r.title}
              onPress={() => handleReact(r.title)}
              style={styles.pickerOption}
            >
              <r.Icon width={32} height={32} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.profileTapArea}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
            {author.is_verified === 1 && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={10}
                  color="white"
                />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {author.name}
            </Text>
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={10}
                  color={
                    i < (author.rating?.averageRating || 0)
                      ? "#FBBF24"
                      : "#E5E7EB"
                  }
                />
              ))}
              <Text style={styles.countryFlag}>
                {author.country === "AE" ? "🇦🇪" : "🇮🇳"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={[styles.timeText, { color: theme.subText }]}>
          {item.created_at_human_short}
        </Text>
      </View>

      <View style={styles.titlePriceRow}>
        <Text style={[styles.productTitle, { color: theme.text }]}>
          {tradingData.product?.name || "Product"}
        </Text>
        <Text style={styles.priceText}>
          {tradingData.currency?.toUpperCase() || "$"}{" "}
          {parseFloat(tradingData.price || "0").toLocaleString()}
        </Text>
      </View>

      {renderSpecs()}
      {renderMedia()}

      <View style={styles.descriptionSection}>
        <Text
          style={[styles.descriptionText, { color: theme.text }]}
          numberOfLines={3}
        >
          {item.content ||
            tradingData.ai_description ||
            "No description provided."}
        </Text>
        <View style={styles.hashtagRow}>
          {item.hashtags?.map((h: any) => (
            <Text key={h.id} style={styles.hashtag}>
              #{h.name}{" "}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.interactionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleReact(myReaction || "like")}
            onLongPress={() => setShowPicker(true)}
            delayLongPress={300}
          >
            {myReaction ? (
              activeReactionData?.Icon ? (
                <activeReactionData.Icon width={22} height={22} />
              ) : null
            ) : (
              <Ionicons name="thumbs-up-outline" size={22} color={theme.text} />
            )}
            <Text
              style={[
                styles.countText,
                { color: myReaction ? activeReactionData?.color : theme.text },
              ]}
            >
              {totalLikes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
            <Text style={[styles.countText, { color: theme.text }]}>
              {typeof item.total_comments === "object"
                ? item.total_comments?.total || 0
                : item.total_comments || 0}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            setIsSaved(!isSaved);
            onSave(item.id);
          }}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? "#3B66F5" : theme.text}
          />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
          <View style={styles.pickerOverlay} />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default function NewsFeedScreen() {
  const { isDark } = useTheme();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { feed, isLoading, fetchFeed } = useFeedData(
    `${CONFIG.API_ENDPOINT}/api/feed/posts`,
  );

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const theme = {
    bg: isDark ? "#050609" : "#F8FAFC",
    cardBg: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B66F5",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Feather name="plus" size={24} color={theme.text} />
        </TouchableOpacity>
        <Image
          source={
            isDark
              ? require("../../assets/common/logo-dark.png")
              : require("../../assets/common/logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          onPress={() => setSidebarVisible(true)}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={26} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={() => fetchFeed(1)}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.broadcastBtnContainer}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#3B66F5", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.broadcastBtnGradient}
            >
              <AiIcon fill="white" />
              <Text style={styles.broadcastText}>Create Broadcast</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
        renderItem={({ item }) => <PostItem item={item} theme={theme} />}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
      {sidebarVisible && (
        <SidebarOverlay
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />
      )}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  logo: { width: 110, height: 40 },
  broadcastBtnContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 16,
    elevation: 4,
  },
  broadcastBtnGradient: {
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  broadcastText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
  postCard: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 20,
    padding: 15,
    elevation: 3,
    position: "relative",
  },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  profileTapArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#3B66F5",
    borderRadius: 10,
    padding: 2,
  },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontSize: 15, fontWeight: "bold" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 2,
  },
  timeText: { fontSize: 11 },
  countryFlag: { fontSize: 12, marginLeft: 4 },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  productTitle: { fontSize: 16, fontWeight: "bold" },
  priceText: { fontSize: 18, fontWeight: "900", color: "#3B66F5" },
  specsRow: { flexDirection: "row", marginTop: 10 },
  specItem: { marginRight: 15 },
  specLabel: { color: "#94a3b8", fontSize: 12 },
  specValue: { color: "#3B66F5", fontWeight: "bold" },
  imageWrapper: { marginTop: 15, borderRadius: 15, overflow: "hidden" },
  postImage: { width: IMAGE_WIDTH, height: 260 },
  pagination: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 4,
    borderRadius: 10,
  },
  activeDot: { width: 14, height: 4, borderRadius: 2, backgroundColor: "#FFF" },
  inactiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  descriptionSection: { marginTop: 10 },
  descriptionText: { fontSize: 14, lineHeight: 20 },
  hashtagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  hashtag: {
    color: "#3B66F5",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
  },
  interactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  leftActions: { flexDirection: "row", gap: 15 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  countText: { fontWeight: "bold", fontSize: 13 },
  reactionPicker: {
    position: "absolute",
    bottom: 65,
    left: 0,
    flexDirection: "row",
    padding: 12,
    borderRadius: 40,
    elevation: 15,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pickerOption: { paddingHorizontal: 8 },
  pickerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 998 },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});
