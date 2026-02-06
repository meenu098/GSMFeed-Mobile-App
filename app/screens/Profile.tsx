import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");

const PostItem = ({ item, theme }: any) => {
  const tradingData = item.trading_feeds?.[0];
  const images = tradingData?.images || item.media || [];

  const [reactions, setReactions] = useState(item.total_reactions);
  const [isLiked, setIsLiked] = useState(item.my_reaction !== null);

  const recordInteraction = useCallback(async () => {
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
    } catch (error) {
    }
  }, [item.id]);

  const handleLike = () => {
    recordInteraction();
    const newLikedStatus = !isLiked;
    setIsLiked(newLikedStatus);
    setReactions((prev: any) => ({
      ...prev,
      total: newLikedStatus ? prev.total + 1 : Math.max(0, prev.total - 1),
    }));
  };

  return (
    <View style={[styles.postCard, { backgroundColor: theme.card }]}>
      <View style={styles.postHeader}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
          {item.author.is_verified === 1 && (
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
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {item.author.name}
            </Text>
            {tradingData?.type && (
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor:
                      tradingData.type === "wts" ? "#3B66F5" : "#15803D",
                  },
                ]}
              >
                <Text style={styles.typePillText}>
                  {tradingData.type === "wts" ? "Sell" : "Buy"}
                </Text>
              </View>
            )}
            <Text style={[styles.timeText, { color: theme.subText }]}>
              {item.created_at_human_short}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={12}
                color={
                  i < (item.author.rating?.averageRating || 0)
                    ? "#FBBF24"
                    : "#E5E7EB"
                }
              />
            ))}
            <Text style={styles.countryFlag}>
              {item.author.country === "AE" ? "🇦🇪" : "🇮🇳"}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Feather name="more-horizontal" size={20} color={theme.subText} />
        </TouchableOpacity>
      </View>

      <View style={styles.titlePriceRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.productTitle, { color: theme.text }]}>
            {tradingData?.product?.name || "Product"}
          </Text>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>
              {tradingData?.condition || "Used"}
            </Text>
          </View>
        </View>
        <Text style={styles.priceText}>
          {tradingData?.currency?.toUpperCase() || "$"}{" "}
          {parseFloat(tradingData?.price || "0").toLocaleString()}
        </Text>
      </View>

      <View style={styles.specsRow}>
        <Text style={styles.specLabel}>
          Grade:{" "}
          <Text style={styles.specValue}>
            {tradingData?.grade?.name || "N/A"}
          </Text>
        </Text>
        <Text style={styles.specLabel}>
          Storage:{" "}
          <Text style={styles.specValue}>
            {tradingData?.storage?.name || "N/A"}
          </Text>
        </Text>
        <Text style={styles.specLabel}>
          Qty: <Text style={styles.specValue}>{tradingData?.qty || "0"}</Text>
        </Text>
      </View>

      {images.length > 0 && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: images[0] }}
            style={styles.postImage}
            resizeMode="cover"
          />
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_: any, index: any) => (
                <View
                  key={index}
                  style={index === 0 ? styles.activeDot : styles.inactiveDot}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.descriptionSection}>
        <Text style={[styles.descriptionText, { color: theme.text }]}>
          {item.content ||
            tradingData?.ai_description ||
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
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#EF4444" : theme.text}
            />
            <Text style={[styles.countText, { color: theme.text }]}>
              {reactions.total}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
            <Text style={[styles.countText, { color: theme.text }]}>
              {item.total_comments}
            </Text>
          </TouchableOpacity>
        </View>
        <Ionicons
          name={item.is_saved ? "bookmark" : "bookmark-outline"}
          size={24}
          color={theme.text}
        />
      </View>
    </View>
  );
};

// --- MAIN PROFILE SCREEN ---
export default function ProfileScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [userData, setUserData] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B66F5",
    border: isDark ? "#1B2331" : "#E2E8F0",
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const loggedUser = JSON.parse(userString);
      const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
      const identifier = normalizedUserId || loggedUser.username;

      // 1. Fetch Profile Details
      const profileRes = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/profile/${identifier}`,
        {
          headers: { Authorization: `Bearer ${loggedUser.token}` },
        },
      );
      const profileJson = await profileRes.json();

      if (profileJson.status) {
        setUserData(profileJson.data);
        const profileId = profileJson.data?.id;
        const profileUsername = profileJson.data?.username;
        const loggedId = loggedUser?.id;
        const loggedUsername = loggedUser?.username;
        const isOwn =
          (profileId && loggedId && String(profileId) === String(loggedId)) ||
          (profileUsername &&
            loggedUsername &&
            profileUsername === loggedUsername) ||
          (normalizedUserId &&
            loggedUsername &&
            normalizedUserId === loggedUsername) ||
          (normalizedUserId &&
            loggedId &&
            String(normalizedUserId) === String(loggedId));
        setIsOwnProfile(Boolean(isOwn));

        // 2. Fetch User's Feed Posts using the ID from profile response
        const feedRes = await fetch(
          `${CONFIG.API_ENDPOINT}/api/feed/posts/user/${profileJson.data.id}`,
          {
            headers: { Authorization: `Bearer ${loggedUser.token}` },
          },
        );
        const feedJson = await feedRes.json();
        if (feedJson.status) setFeed(feedJson.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: userData?.cover || userData?.avatar }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Image
            source={{ uri: userData?.avatar }}
            style={styles.profileAvatar}
          />
          <View style={styles.nameRowCenter}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {userData?.name}
            </Text>
            {userData?.is_verified === 1 && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={18}
                color={theme.primary}
              />
            )}
          </View>
          <Text style={styles.handleText}>@{userData?.username}</Text>

          {isOwnProfile ? (
            <TouchableOpacity
              onPress={() => router.push("/screens/EditProfile")}
              style={styles.editBtnContainer}
            >
              <LinearGradient
                colors={["#8B5CF6", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: theme.text }]}>
              {userData?.posts_count || 0}
            </Text>
            <Text style={styles.statLab}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: theme.text }]}>
              {userData?.followers_count || 0}
            </Text>
            <Text style={styles.statLab}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: theme.text }]}>
              {userData?.following_count || 0}
            </Text>
            <Text style={styles.statLab}>Following</Text>
          </View>
        </View>

        <View
          style={[styles.tabContainer, { borderBottomColor: theme.border }]}
        >
          <Text style={[styles.tabTitle, { color: theme.primary }]}>Posts</Text>
        </View>

        <View style={styles.feedContainer}>
          {feed.length > 0 ? (
            feed.map((post) => (
              <PostItem key={post.id} item={post} theme={theme} />
            ))
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: theme.subText,
                marginTop: 40,
              }}
            >
              No posts available yet.
            </Text>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverContainer: {
    height: 180,
    position: "relative",
    backgroundColor: "#1e1e1e",
  },
  coverImage: { width: "100%", height: "100%" },
  backBtn: { position: "absolute", top: 50, left: 20 },
  profileInfo: { alignItems: "center", marginTop: -50 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#0B0E14",
  },
  nameRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },
  profileName: { fontSize: 20, fontWeight: "bold" },
  handleText: { color: "#3B66F5", fontSize: 14, marginTop: 2 },
  editBtnContainer: { marginTop: 15, width: "45%" },
  editBtn: { paddingVertical: 10, borderRadius: 20, alignItems: "center" },
  editBtnText: { color: "#FFF", fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
    paddingHorizontal: 20,
  },
  stat: { alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "bold" },
  statLab: { color: "#94A3B8", fontSize: 12 },
  tabContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    borderBottomWidth: 2,
    paddingBottom: 10,
    width: 80,
    alignItems: "center",
  },
  tabTitle: { fontSize: 16, fontWeight: "bold" },
  feedContainer: { marginTop: 10 },
  postCard: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 20,
    padding: 15,
  },
  postHeader: { flexDirection: "row", alignItems: "center" },
  avatarWrapper: { position: "relative" },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3B66F5",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#121721",
    padding: 1,
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 16, fontWeight: "bold" },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typePillText: { fontSize: 11, fontWeight: "bold", color: "#FFF" },
  timeText: { fontSize: 12 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  countryFlag: { fontSize: 12, marginLeft: 5 },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  titleContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  productTitle: { fontSize: 18, fontWeight: "bold" },
  conditionBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  conditionText: { color: "#94a3b8", fontSize: 12 },
  priceText: { fontSize: 22, fontWeight: "bold", color: "#3B66F5" },
  specsRow: { flexDirection: "row", gap: 15, marginTop: 10 },
  specLabel: { color: "#94a3b8", fontSize: 13 },
  specValue: { color: "#f8fafc", fontWeight: "bold" },
  imageWrapper: { marginTop: 15, borderRadius: 15, overflow: "hidden" },
  postImage: { width: "100%", height: 300 },
  pagination: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B66F5",
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  descriptionSection: { marginTop: 15, gap: 8 },
  descriptionText: { fontSize: 14, lineHeight: 20 },
  hashtagRow: { flexDirection: "row", flexWrap: "wrap" },
  hashtag: { color: "#3B66F5", fontSize: 14, fontWeight: "500" },
  interactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#2d2d2d",
  },
  leftActions: { flexDirection: "row", gap: 20, alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  countText: { fontWeight: "bold", fontSize: 14 },
});
