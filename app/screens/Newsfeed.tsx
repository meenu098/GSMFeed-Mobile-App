import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEventListener } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Share,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AngryIcon from "../../assets/reaction/angry.svg";
import HahaIcon from "../../assets/reaction/haha.svg";
import LikeIcon from "../../assets/reaction/like.svg";
import LoveIcon from "../../assets/reaction/love.svg";
import SadIcon from "../../assets/reaction/sad.svg";
import WowIcon from "../../assets/reaction/wow.svg";
import BottomNav from "../../components/BottomNav";
import SkeletonLoader from "../../components/SkeletonLoader";
import SidebarOverlay from "../../components/SidebarOverlay";
import { AiIcon } from "../../components/icons/icons";
import { useFeedData } from "../../hooks/useFeedData";
import CONFIG from "../../shared/config";
import { extractPostSpecs, resolvePrimaryTradingFeed } from "../../shared/postSpecs";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 30;
const IMAGE_WIDTH = CARD_WIDTH - 30;
const POST_MIN_ASPECT_RATIO = 4 / 5;
const POST_MAX_ASPECT_RATIO = 1.91; // Instagram landscape ceiling

const clampPostAspectRatio = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(
    Math.max(value, POST_MIN_ASPECT_RATIO),
    POST_MAX_ASPECT_RATIO,
  );
};

const getTradeTypeMeta = (value: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "wts" || normalized === "sell" || normalized === "offer") {
    return {
      label: "Sell",
      bg: "#EEF2FF",
      text: "#6366F1",
    };
  }

  if (
    normalized === "wtb" ||
    normalized === "buy" ||
    normalized === "request"
  ) {
    return {
      label: "Buy",
      bg: "#E8F5E9",
      text: "#2E7D32",
    };
  }

  return null;
};

const getConditionMeta = (value: unknown) => {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? String((value as any)?.name ?? (value as any)?.label ?? "")
        : "";
  const normalized = raw.trim().toLowerCase();

  if (!normalized) return null;

  if (normalized === "used") {
    return {
      label: "Used",
      bg: "#FDEBD7",
      text: "#D97706",
    };
  }

  if (normalized === "new") {
    return {
      label: "New",
      bg: "#E8F5E9",
      text: "#2E7D32",
    };
  }

  return {
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    bg: "#EEF2FF",
    text: "#6366F1",
  };
};

const formatMediaUrl = (value: unknown): string => {
  const url = String(value || "").trim();
  if (!url) return "";
  return url
    .replace("http://localhost:8000", CONFIG.API_ENDPOINT)
    .replace("https://localhost:8000", CONFIG.API_ENDPOINT);
};

const normalizeMediaUrls = (value: unknown): string[] => {
  if (!value) return [];
  const rawItems = Array.isArray(value) ? value : [value];
  return rawItems
    .map((item: any) => {
      if (typeof item === "string") return formatMediaUrl(item);
      if (item && typeof item === "object") {
        return formatMediaUrl(
          item?.url || item?.uri || item?.src || item?.path || item?.image,
        );
      }
      return "";
    })
    .filter((url) => url.length > 0);
};

const REACTION_TYPES = [
  { title: "like", Icon: LikeIcon, color: "#3B66F5" },
  { title: "love", Icon: LoveIcon, color: "#EF4444" },
  { title: "haha", Icon: HahaIcon, color: "#FBBF24" },
  { title: "wow", Icon: WowIcon, color: "#FBBF24" },
  { title: "sad", Icon: SadIcon, color: "#FBBF24" },
  { title: "angry", Icon: AngryIcon, color: "#EA580C" },
];

type AdItem = {
  id: number;
  src: VideoSource;
  srcMobile?: VideoSource;
  link: string;
};

const ADS_ITEMS: AdItem[] = [
  {
    id: 10,
    src: require("../../assets/ads/coolmix.mp4"),
    srcMobile: require("../../assets/ads/coolmix-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=971555177420&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 11,
    src: require("../../assets/ads/blessings.mp4"),
    srcMobile: require("../../assets/ads/blessings-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=971555177420&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 7,
    src: require("../../assets/ads/mobiking.mp4"),
    srcMobile: require("../../assets/ads/mobiking-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=971555177420&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 1,
    src: require("../../assets/ads/universal.mp4"),
    srcMobile: require("../../assets/ads/universal-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=971553304244&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 2,
    src: require("../../assets/ads/equals.mp4"),
    srcMobile: require("../../assets/ads/equals-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=447554569233&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 3,
    src: require("../../assets/ads/usedtrading.mp4"),
    srcMobile: require("../../assets/ads/usedtrading-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=31636453528&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 4,
    src: require("../../assets/ads/onerepair.mp4"),
    srcMobile: require("../../assets/ads/onerepair-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=351918332588&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 5,
    src: require("../../assets/ads/remobile.mp4"),
    srcMobile: require("../../assets/ads/remobile-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=971509277746&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 6,
    src: require("../../assets/ads/wecell.mp4"),
    srcMobile: require("../../assets/ads/wecell-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=31642638686&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 8,
    src: require("../../assets/ads/eurospares.mp4"),
    srcMobile: require("../../assets/ads/eurospares-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=31641876946&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
  {
    id: 9,
    src: require("../../assets/ads/phonetronics.mp4"),
    srcMobile: require("../../assets/ads/phonetronics-mobile.mp4"),
    link: "https://api.whatsapp.com/send?phone=33650081718&text=Hi, I found your details on gsmfeed.com and would like to learn more about your company's services.",
  },
];

const stripHtml = (value: string) => {
  if (!value) return "";
  return value
    .replace(/<\/a>(\S)/g, "</a> $1")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\ufeff/g, "")
    .trim();
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildMentionAnchor = (username: string, id?: number | string) => {
  const safeUsername = escapeHtml(username);
  const dataId = id !== undefined ? ` data-id="${id}"` : ' data-id=""';
  return `<a href="/profile/${safeUsername}" target="_blank" data-username="${safeUsername}" class="mention"${dataId} data-denotation-char="@" data-value="${safeUsername}">\ufeff<span contenteditable="false">@${safeUsername}</span>\ufeff</a>`;
};

const buildCommentHtml = (
  value: string,
  mentionIdMap: Map<string, number | string> = new Map(),
  replyUsername?: string,
) => {
  const regex = /@([\w._-]+)/g;
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(value)) !== null) {
    result += escapeHtml(value.slice(lastIndex, match.index));
    const username = match[1];
    const mentionId = mentionIdMap.get(username);
    result += buildMentionAnchor(username, mentionId);
    lastIndex = match.index + match[0].length;
  }
  result += escapeHtml(value.slice(lastIndex));
  result = result.replace(/\n/g, "<br/>");

  const hasReplyMention =
    replyUsername &&
    new RegExp(`(^|\\s)@${escapeRegex(replyUsername)}(\\s|$)`, "i").test(value);
  if (replyUsername && !hasReplyMention) {
    const mentionId = mentionIdMap.get(replyUsername);
    const prefix = buildMentionAnchor(replyUsername, mentionId);
    result = `${prefix} ${result}`.trim();
  }

  return `<p>${result}</p>`;
};

const SpecItem = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.specItem}>
    <Text style={styles.specLabel}>
      {label}: <Text style={styles.specValue}>{value}</Text>
    </Text>
  </View>
);

const AdsCarousel = ({
  ad,
  theme,
  onPress,
  onFinished,
}: {
  ad: AdItem | null;
  theme: any;
  onPress: (url: string) => void;
  onFinished: () => void;
}) => {
  const source = ad?.srcMobile ?? null;
  const player = useVideoPlayer(source, (player) => {
    player.muted = true;
    player.loop = false;
    player.play();
  });

  useEventListener(player, "playToEnd", () => {
    if (!ad) return;
    onFinished();
  });

  if (!ad) return null;

  return (
    <View style={[styles.adCard, { backgroundColor: theme.cardBg }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(ad.link)}>
        <VideoView
          key={`ad-video-${ad.id}`}
          player={player}
          style={styles.adVideo}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={false}
        />
      </TouchableOpacity>
    </View>
  );
};

const CommentItem = ({
  comment,
  theme,
  level = 0,
  onReply,
  onReact,
  onTogglePicker,
  activePickerId,
  replyMap,
  replyLoadingMap,
  replyNextMap,
  replyPageMap,
  onLoadReplies,
  onLoadMoreReplies,
}: {
  comment: any;
  theme: any;
  level?: number;
  onReply?: (comment: any) => void;
  onReact?: (comment: any, reaction: string) => void;
  onTogglePicker?: (id: string) => void;
  activePickerId?: string | null;
  replyMap?: Record<string, any[]>;
  replyLoadingMap?: Record<string, boolean>;
  replyNextMap?: Record<string, string | null>;
  replyPageMap?: Record<string, number>;
  onLoadReplies?: (id: string) => void;
  onLoadMoreReplies?: (id: string, nextPage: number) => void;
}) => {
  const author = comment?.author || {};
  const content = stripHtml(comment?.content || "");
  const commentId = String(comment?.id ?? "");
  const childReplies = replyMap?.[commentId] ?? comment?.comments ?? [];
  const totalReplies = comment?.total_comments || 0;
  const showViewReplies = totalReplies > 0 && childReplies.length === 0;
  const loadingReplies = !!replyLoadingMap?.[commentId];
  const hasMoreReplies = !!replyNextMap?.[commentId];
  const currentPage = replyPageMap?.[commentId] || 1;
  const bubbleBg = theme.isDark ? "#1E2430" : "#F1F5F9";
  const activeReaction = comment?.my_reaction;
  const reactionColor =
    REACTION_TYPES.find((r) => r.title === activeReaction)?.color ||
    theme.subText;
  const reactionLabel = activeReaction
    ? activeReaction.charAt(0).toUpperCase() + activeReaction.slice(1)
    : "Like";
  const ActiveReactionIcon =
    REACTION_TYPES.find((r) => r.title === activeReaction)?.Icon || LikeIcon;
  const normalizeCount = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };
  const getDominantReaction = (value: any) => {
    if (!value || typeof value !== "object") return null;
    let topType: string | null = null;
    let topCount = 0;
    REACTION_TYPES.forEach((reaction) => {
      const count = normalizeCount(value?.[reaction.title]);
      if (count > topCount) {
        topCount = count;
        topType = reaction.title;
      }
    });
    return topType;
  };
  const totalReactionsRaw = comment?.total_reactions;
  const totalReactionsCount =
    totalReactionsRaw && typeof totalReactionsRaw === "object"
      ? normalizeCount(totalReactionsRaw.total)
      : normalizeCount(totalReactionsRaw);
  const dominantReaction =
    activeReaction || getDominantReaction(totalReactionsRaw);
  const ReactionChipIcon =
    REACTION_TYPES.find((r) => r.title === dominantReaction)?.Icon || LikeIcon;

  const renderCommentText = () => {
    const parts = content.split(/(@[\w._-]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        return (
          <Text key={`m-${comment.id}-${idx}`} style={styles.commentMention}>
            {part}
          </Text>
        );
      }
      return <Text key={`t-${comment.id}-${idx}`}>{part}</Text>;
    });
  };

  return (
    <View>
      <View style={[styles.commentItem, { marginLeft: level * 16 }]}>
        <Image
          source={{
            uri:
              author.avatar ||
              "https://ui-avatars.com/api/?name=User&background=3B66F5&color=fff",
          }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentBody}>
          <View style={[styles.commentBubble, { backgroundColor: bubbleBg }]}>
            <Text style={[styles.commentName, { color: theme.text }]}>
              {author.name || author.username || "User"}
            </Text>
            <Text style={[styles.commentContent, { color: theme.text }]}>
              {renderCommentText()}
            </Text>
          </View>
          <View style={styles.commentMetaRow}>
            <Text style={[styles.commentTime, { color: theme.subText }]}>
              {comment.created_at_human_short || comment.created_at_human || ""}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onReact?.(comment, comment?.my_reaction || "like")}
              onLongPress={() => onTogglePicker?.(commentId)}
              delayLongPress={250}
            >
              <Text
                style={[
                  styles.commentAction,
                  { color: activeReaction ? reactionColor : theme.subText },
                ]}
              >
                {reactionLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onReply?.(comment)}
            >
              <Text style={[styles.commentAction, { color: theme.subText }]}>
                Reply
              </Text>
            </TouchableOpacity>
            {totalReactionsCount > 0 ? (
              <View
                style={[
                  styles.commentReactionChip,
                  {
                    backgroundColor: theme.isDark ? "#0F172A" : "#E2E8F0",
                    borderColor: theme.isDark ? "#1F2937" : "#CBD5F5",
                  },
                ]}
              >
                <ReactionChipIcon width={12} height={12} />
                <Text
                  style={[styles.commentReactionText, { color: theme.text }]}
                >
                  {totalReactionsCount}
                </Text>
              </View>
            ) : null}
          </View>
          {level === 0 && showViewReplies ? (
            <TouchableOpacity
              style={styles.viewRepliesBtn}
              onPress={() => onLoadReplies?.(commentId)}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewRepliesText, { color: theme.primary }]}>
                View replies
              </Text>
            </TouchableOpacity>
          ) : null}
          {level === 0 && loadingReplies ? (
            <View style={styles.repliesLoading}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null}
          {activePickerId === commentId ? (
            <View style={styles.commentReactionPicker}>
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={`c-react-${commentId}-${r.title}`}
                  onPress={() => onReact?.(comment, r.title)}
                  style={styles.commentReactionOption}
                >
                  <r.Icon width={22} height={22} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {childReplies.length > 0
        ? childReplies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              theme={theme}
              level={level + 1}
              onReply={onReply}
              onReact={onReact}
              onTogglePicker={onTogglePicker}
              activePickerId={activePickerId}
              replyMap={replyMap}
              replyLoadingMap={replyLoadingMap}
              replyNextMap={replyNextMap}
              replyPageMap={replyPageMap}
              onLoadReplies={onLoadReplies}
              onLoadMoreReplies={onLoadMoreReplies}
            />
          ))
        : null}
      {level === 0 && childReplies.length > 0 && hasMoreReplies ? (
        <TouchableOpacity
          style={styles.viewRepliesBtn}
          onPress={() => onLoadMoreReplies?.(commentId, currentPage + 1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewRepliesText, { color: theme.primary }]}>
            Load more replies
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const PostItem = ({
  item,
  theme,
  onSave,
  autoOpenPostId,
  onAutoOpenHandled,
}: any) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const resolveIsSaved = useCallback((value: any) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") return value === "1" || value === "true";
    return false;
  }, []);
  const [isSaved, setIsSaved] = useState(resolveIsSaved(item.is_saved));
  const [showPicker, setShowPicker] = useState(false);
  const [myReaction, setMyReaction] = useState(item.my_reaction);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [replyMap, setReplyMap] = useState<Record<string, any[]>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [replyNextMap, setReplyNextMap] = useState<
    Record<string, string | null>
  >({});
  const [replyPageMap, setReplyPageMap] = useState<Record<string, number>>({});
  const [activeCommentPickerId, setActiveCommentPickerId] = useState<
    string | null
  >(null);
  const [mediaAspectRatios, setMediaAspectRatios] = useState<
    Record<number, number>
  >({});
  // const mediaUrls = item.trading_feeds?.[0]?.images || item.media || [];

  const initialTotal =
    typeof item.total_reactions === "object"
      ? item.total_reactions?.total || 0
      : item.total_reactions || 0;
  const [totalLikes, setTotalLikes] = useState<number>(initialTotal);
  const initialCommentsCount =
    typeof item.total_comments === "object"
      ? item.total_comments?.total || 0
      : item.total_comments || 0;
  const [commentCount, setCommentCount] =
    useState<number>(initialCommentsCount);

  const tradingData = useMemo(() => resolvePrimaryTradingFeed(item), [item]);
  const author = item.author || {};
  const mediaUrls = useMemo(
    () =>
      normalizeMediaUrls(
        tradingData?.images || tradingData?.media || item?.media || item?.images,
      ),
    [item?.images, item?.media, tradingData],
  );
  const specs = extractPostSpecs(item, tradingData);
  const postId = item.main_post_id ?? item.id;
  const pageLink = `${CONFIG.APP_URL}/feed/post/${postId}`;
  const tradeTypeMeta = getTradeTypeMeta(tradingData?.type ?? item?.type);
  const conditionMeta = getConditionMeta(
    tradingData?.condition ?? item?.condition,
  );
  const firstMediaAspectRatio = mediaAspectRatios[0] || 1;
  const fixedMediaHeight = IMAGE_WIDTH / firstMediaAspectRatio;

  const handleProfilePress = () => {
    const username = author?.username || author?.user_name || author?.id;
    if (!username) return;
    router.push({ pathname: "/screens/Profile", params: { userId: username } });
  };

  const handleHashtagPress = useCallback(
    (value: unknown) => {
      const rawTag = String(value ?? "").trim();
      const normalizedTag = rawTag.replace(/^#/, "").trim();
      if (!normalizedTag) return;

      router.push({
        pathname: "/screens/HashFeed",
        params: { tag: normalizedTag },
      });
    },
    [router],
  );

  useEffect(() => {
    let active = true;
    setActiveIndex(0);
    setMediaAspectRatios({});

    const firstUrl = mediaUrls[0];
    if (firstUrl) {
      Image.getSize(
        firstUrl,
        (mediaWidth, mediaHeight) => {
          if (!active) return;
          const ratio =
            mediaWidth > 0 && mediaHeight > 0 ? mediaWidth / mediaHeight : 1;
          setMediaAspectRatios({ 0: clampPostAspectRatio(ratio) });
        },
        () => {
          if (!active) return;
          setMediaAspectRatios({ 0: 1 });
        },
      );
    }

    return () => {
      active = false;
    };
  }, [mediaUrls]);

  // API: Record Interaction Stat
  const postInteractStatTrigger = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      await fetch(`${CONFIG.API_ENDPOINT}/api/stats/post/post-interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ post_id: item.id }),
      });
    } catch (error) {}
  }, [item.id]);

  useEffect(() => {
    postInteractStatTrigger();
  }, [postInteractStatTrigger]);

  useEffect(() => {
    setIsSaved(resolveIsSaved(item.is_saved));
  }, [item.is_saved, resolveIsSaved]);

  const handleNativeShare = useCallback(async () => {
    try {
      await Share.share(
        {
          title: "Share post",
          message: `Check out this post on gsmfeed:\n${pageLink}`,
          url: pageLink,
        },
        { dialogTitle: "Share post" },
      );
    } catch (error) {}
  }, [pageLink]);

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

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/feed/post/comments-get?page=1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ id: item.id }),
        },
      );
      const result = await res.json();
      if (result.status) {
        setComments(result.data?.data || []);
        setCommentCount((prev) => result.data?.total ?? prev);
      }
    } catch (error) {
    } finally {
      setCommentsLoading(false);
    }
  }, [item.id]);

  const fetchReplies = useCallback(async (parentId: string, page = 1) => {
    try {
      setReplyLoadingMap((prev) => ({ ...prev, [parentId]: true }));
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/feed/post/comments-get?page=${page}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ post_id: parentId }),
        },
      );
      const result = await res.json();
      if (result.status) {
        const newReplies = result.data?.data || [];
        setReplyMap((prev) => ({
          ...prev,
          [parentId]:
            page === 1
              ? newReplies
              : [...(prev[parentId] || []), ...newReplies],
        }));
        setReplyNextMap((prev) => ({
          ...prev,
          [parentId]: result.data?.next_page_url || null,
        }));
        setReplyPageMap((prev) => ({ ...prev, [parentId]: page }));
      }
    } catch (error) {
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [parentId]: false }));
    }
  }, []);

  const updateCommentReaction = useCallback(
    (list: any[], commentId: string, nextReaction: string): any[] => {
      return list.map((c) => {
        if (String(c.id) === String(commentId)) {
          const prevReaction = c.my_reaction || "none";
          let totalReactions = c.total_reactions;
          if (!totalReactions || typeof totalReactions !== "object") {
            totalReactions = {
              total: 0,
              like: 0,
              love: 0,
              haha: 0,
              wow: 0,
              sad: 0,
              angry: 0,
            };
          }
          const counts = { ...totalReactions };
          let total = counts.total || 0;

          const dec = (type: string) => {
            if (type && type !== "none") {
              counts[type] = Math.max(0, (counts[type] || 0) - 1);
              total = Math.max(0, total - 1);
            }
          };
          const inc = (type: string) => {
            if (type && type !== "none") {
              counts[type] = (counts[type] || 0) + 1;
              total += 1;
            }
          };

          if (prevReaction !== "none") dec(prevReaction);
          if (nextReaction !== "none") inc(nextReaction);

          counts.total = total;

          return {
            ...c,
            my_reaction: nextReaction !== "none" ? nextReaction : null,
            total_reactions: counts,
          };
        }
        if (c.comments && Array.isArray(c.comments)) {
          return {
            ...c,
            comments: updateCommentReaction(
              c.comments,
              commentId,
              nextReaction,
            ),
          };
        }
        return c;
      });
    },
    [],
  );

  const handleCommentReact = useCallback(
    async (comment: any, reaction: string) => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);
        const isRemoving = comment?.my_reaction === reaction;
        const nextReaction = isRemoving ? "none" : reaction;
        const data = new FormData();
        data.append("reaction", nextReaction);
        await fetch(
          `${CONFIG.API_ENDPOINT}/api/feed/post/react/${comment.id}`,
          {
            method: "POST",
            body: data,
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );

        setComments((prev) =>
          updateCommentReaction(prev, String(comment.id), nextReaction),
        );
        setReplyMap((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            next[key] = updateCommentReaction(
              next[key] || [],
              String(comment.id),
              nextReaction,
            );
          });
          return next;
        });
      } catch (error) {
      } finally {
        setActiveCommentPickerId(null);
      }
    },
    [item.id, updateCommentReaction],
  );

  const handleSendComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || commentSubmitting) return;
    try {
      setCommentSubmitting(true);
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      const replyUsername =
        replyTo?.author?.username || replyTo?.author?.user_name;
      const mentionIdMap = new Map<string, number | string>();
      if (replyUsername && replyTo?.author?.id) {
        mentionIdMap.set(replyUsername, replyTo.author.id);
      }
      const payload = {
        content: buildCommentHtml(trimmed, mentionIdMap, replyUsername),
        hashtags: [],
        mentioned_users: [],
        type: "normal",
      };
      const targetId = replyTo?.id || item.id;
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/feed/post/comment/${targetId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const result = await res.json();
      if (result.status) {
        setCommentText("");
        setReplyTo(null);
        setCommentCount((prev) => prev + 1);
        fetchComments();
        if (replyTo?.id) {
          fetchReplies(String(replyTo.id), 1);
        }
      }
    } catch (error) {
    } finally {
      setCommentSubmitting(false);
    }
  };

  useEffect(() => {
    if (commentsVisible) fetchComments();
  }, [commentsVisible, fetchComments]);

  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (!autoOpenPostId || hasAutoOpenedRef.current) return;
    if (String(autoOpenPostId) === String(postId)) {
      setCommentsVisible(true);
      hasAutoOpenedRef.current = true;
      onAutoOpenHandled?.();
    }
  }, [autoOpenPostId, onAutoOpenHandled, postId]);

  // Helper: Specs Rendering (Fixes String Error)
  const renderSpecs = () => {
    const items = [
      { key: "qty", label: "Qty", value: specs.qty },
      { key: "storage", label: "Storage", value: specs.storage },
      { key: "grade", label: "Grade", value: specs.grade },
      { key: "spec", label: "Spec", value: specs.spec },
    ].filter((entry) => entry.value !== null);

    if (!items.length) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.specsRow}
      >
        {items.map((entry) => (
          <SpecItem key={entry.key} label={entry.label} value={entry.value} />
        ))}
      </ScrollView>
    );
  };

  // Helper: Media Rendering (Fixes String Error)
  const renderMedia = () => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    return (
      <View style={[styles.imageWrapper, { height: fixedMediaHeight }]}>
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
              style={[styles.postImage, { height: fixedMediaHeight }]}
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
        <View style={styles.headerMetaRow}>
          {tradeTypeMeta ? (
            <View
              style={[styles.typeBadge, { backgroundColor: tradeTypeMeta.bg }]}
            >
              <Text
                style={[styles.typeBadgeText, { color: tradeTypeMeta.text }]}
              >
                {tradeTypeMeta.label}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.timeText, { color: theme.subText }]}>
            {item.created_at_human_short}
          </Text>
        </View>
      </View>

      <View style={styles.titlePriceRow}>
        <View style={styles.productNameRow}>
          <Text style={[styles.productTitle, { color: theme.text }]}>
            {tradingData.product?.name || "Product"}
          </Text>
          {conditionMeta ? (
            <View
              style={[
                styles.conditionBadge,
                { backgroundColor: conditionMeta.bg },
              ]}
            >
              <Text
                style={[
                  styles.conditionBadgeText,
                  { color: conditionMeta.text },
                ]}
              >
                {conditionMeta.label}
              </Text>
            </View>
          ) : null}
        </View>
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
          {item.content || tradingData.ai_description}
        </Text>
        <View style={styles.hashtagRow}>
          {item.hashtags?.map((h: any, index: number) => {
            const tagName = String(h?.name ?? h ?? "").trim();
            if (!tagName) return null;

            return (
              <Text
                key={String(h?.id ?? `${tagName}-${index}`)}
                style={styles.hashtag}
                onPress={() => handleHashtagPress(tagName)}
              >
                #{tagName}
              </Text>
            );
          })}
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
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setCommentsVisible(true)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
            <Text style={[styles.countText, { color: theme.text }]}>
              {commentCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleNativeShare}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            setIsSaved(!isSaved);
            onSave(item.main_post_id ?? item.id);
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

      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentsVisible(false);
          setReplyTo(null);
          setActiveCommentPickerId(null);
        }}
      >
        <SafeAreaView
          style={styles.commentModalOverlay}
          edges={["top", "left", "right", "bottom"]}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.4)"]}
            locations={[0, 0.2, 1]}
            style={styles.commentBackdrop}
            pointerEvents="none"
          />
          <KeyboardAvoidingView
            style={styles.commentKeyboardAvoid}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          >
            <View
              style={[styles.commentModal, { backgroundColor: theme.cardBg }]}
            >
              <View style={styles.commentHeader}>
                <Text style={[styles.commentTitle, { color: theme.text }]}>
                  Comments
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setCommentsVisible(false);
                    setReplyTo(null);
                    setActiveCommentPickerId(null);
                  }}
                >
                  <Feather name="x" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.commentList}
                contentContainerStyle={{ paddingBottom: 10 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
              >
                {commentsLoading ? (
                  <View style={styles.commentLoading}>
                    <ActivityIndicator color={theme.primary} />
                  </View>
                ) : comments.length === 0 ? (
                  <Text
                    style={[styles.commentEmptyText, { color: theme.subText }]}
                  >
                    No comments yet.
                  </Text>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      theme={theme}
                      replyMap={replyMap}
                      replyLoadingMap={replyLoadingMap}
                      replyNextMap={replyNextMap}
                      replyPageMap={replyPageMap}
                      onLoadReplies={(id) => fetchReplies(id, 1)}
                      onLoadMoreReplies={(id, nextPage) =>
                        fetchReplies(id, nextPage)
                      }
                      onReply={(c) => setReplyTo(c)}
                      onReact={handleCommentReact}
                      onTogglePicker={(id) =>
                        setActiveCommentPickerId((prev) =>
                          prev === id ? null : id,
                        )
                      }
                      activePickerId={activeCommentPickerId}
                    />
                  ))
                )}
              </ScrollView>

              <View
                style={[
                  styles.commentComposer,
                  {
                    paddingBottom:
                      Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8,
                  },
                ]}
              >
                {replyTo ? (
                  <View style={styles.replyBar}>
                    <Text style={[styles.replyText, { color: theme.subText }]}>
                      Replying to{" "}
                      <Text style={styles.replyUser}>
                        @{replyTo?.author?.username || replyTo?.author?.user_name}
                      </Text>
                    </Text>
                    <TouchableOpacity onPress={() => setReplyTo(null)}>
                      <Feather name="x" size={16} color={theme.subText} />
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={styles.commentInputRow}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Write a comment..."
                    placeholderTextColor={theme.subText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.commentInput,
                      { color: theme.text, borderColor: theme.border },
                    ]}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={handleSendComment}
                    disabled={commentSubmitting}
                  >
                    <Feather
                      name="send"
                      size={18}
                      color={commentSubmitting ? "#94A3B8" : theme.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </View>
  );
};

export default function NewsFeedScreen() {
  const { isDark, screenTheme } = useTheme();
  const router = useRouter();
  const {
    postId: routePostId,
    openComments,
    listingCreated,
    listingCreatedAt,
  } = useLocalSearchParams();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);
  const [shouldOpenComments, setShouldOpenComments] = useState(false);
  const [showListingCreatedToast, setShowListingCreatedToast] = useState(false);
  const feedListRef = useRef<FlatList<any>>(null);
  const listingToastOpacity = useRef(new Animated.Value(0)).current;
  const listingToastTranslateY = useRef(new Animated.Value(-16)).current;
  const lastToastKeyRef = useRef<string | null>(null);

  const { feed, isLoading, error, fetchFeed } = useFeedData(
    `${CONFIG.API_ENDPOINT}/api/feed/posts`,
  );

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  useEffect(() => {
    const id = Array.isArray(routePostId) ? routePostId[0] : routePostId;
    if (id) {
      setTargetPostId(String(id));
    }
    const openValue = Array.isArray(openComments)
      ? openComments[0]
      : openComments;
    setShouldOpenComments(openValue === "1" || openValue === "true");
  }, [openComments, routePostId]);

  useEffect(() => {
    const createdFlag = Array.isArray(listingCreated)
      ? listingCreated[0]
      : listingCreated;
    const createdAt = Array.isArray(listingCreatedAt)
      ? listingCreatedAt[0]
      : listingCreatedAt;

    if (createdFlag !== "1" && createdFlag !== "true") return;

    const toastKey = createdAt ? String(createdAt) : "listing-created";
    if (lastToastKeyRef.current === toastKey) return;

    lastToastKeyRef.current = toastKey;
    setShowListingCreatedToast(true);
    fetchFeed(1);
  }, [fetchFeed, listingCreated, listingCreatedAt]);

  useEffect(() => {
    if (!showListingCreatedToast) return;

    listingToastOpacity.setValue(0);
    listingToastTranslateY.setValue(-16);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(listingToastOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(listingToastTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(listingToastOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(listingToastTranslateY, {
          toValue: -12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setShowListingCreatedToast(false);
      }
    });

    return () => {
      animation.stop();
    };
  }, [
    listingToastOpacity,
    listingToastTranslateY,
    showListingCreatedToast,
  ]);

  const theme = screenTheme;

  const handleBookmark = useCallback(async (postId: number | string) => {
    if (!postId) return;
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);
      await fetch(`${CONFIG.API_ENDPOINT}/api/feed/${postId}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
    } catch (error) {}
  }, []);

  const activeAd = ADS_ITEMS.length
    ? ADS_ITEMS[adIndex % ADS_ITEMS.length]
    : null;

  const handleAdFinished = useCallback(() => {
    if (ADS_ITEMS.length === 0) return;
    setAdIndex((prev) => (prev + 1) % ADS_ITEMS.length);
  }, []);

  const handleAdPress = useCallback(async (url: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {}
  }, []);

  useEffect(() => {
    if (!targetPostId) return;
    const index = feed.findIndex(
      (item: any) => String(item.main_post_id ?? item.id) === targetPostId,
    );
    if (index >= 0) {
      try {
        feedListRef.current?.scrollToIndex({ index, animated: true });
      } catch {}
    }
  }, [feed, targetPostId]);

  const handleScrollToIndexFailed = useCallback((info: any) => {
    const offset = info.averageItemLength * info.index;
    feedListRef.current?.scrollToOffset({ offset, animated: true });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/screens/BroadcastManager")}
        >
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

      {isLoading && feed.length === 0 ? (
        <SkeletonLoader variant="feed" count={3} />
      ) : error && feed.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={44} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Couldn&apos;t load feed
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.subText }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.border }]}
            onPress={() => fetchFeed(1)}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: theme.text }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={feedListRef}
          data={feed}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={() => fetchFeed(1)}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.broadcastBtnContainer}
              activeOpacity={0.9}
              onPress={() => router.push("/screens/BroadcastManager")}
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
          renderItem={({ item, index }) => (
            <View>
              <PostItem
                item={item}
                theme={theme}
                onSave={handleBookmark}
                autoOpenPostId={shouldOpenComments ? targetPostId : null}
                onAutoOpenHandled={() => setTargetPostId(null)}
              />
              {index === 0 ? (
                <AdsCarousel
                  key={activeAd?.id ?? "ad"}
                  ad={activeAd}
                  theme={theme}
                  onPress={handleAdPress}
                  onFinished={handleAdFinished}
                />
              ) : null}
            </View>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
      {sidebarVisible && (
        <SidebarOverlay
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />
      )}
      {showListingCreatedToast ? (
        <Animated.View
          style={[
            styles.listingToast,
            {
              opacity: listingToastOpacity,
              transform: [{ translateY: listingToastTranslateY }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.listingToastText}>New listing created</Text>
        </Animated.View>
      ) : null}
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
  adCard: {
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
  },
  adVideo: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
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
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  countryFlag: { fontSize: 12, marginLeft: 4 },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  productNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  productTitle: { fontSize: 16, fontWeight: "bold", flexShrink: 1 },
  conditionBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  conditionBadgeText: { fontSize: 12, fontWeight: "700" },
  priceText: { fontSize: 18, fontWeight: "900", color: "#3B66F5" },
  specsRow: { flexDirection: "row", marginTop: 10 },
  specItem: { marginRight: 15 },
  specLabel: { color: "#94a3b8", fontSize: 12 },
  specValue: { color: "#3B66F5", fontWeight: "bold" },
  imageWrapper: {
    marginTop: 15,
    borderRadius: 15,
    overflow: "hidden",
    width: "100%",
  },
  postImage: { width: IMAGE_WIDTH },
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
  commentModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentKeyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  commentModal: {
    height: "60%",
    maxHeight: "82%",
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentTitle: { fontSize: 16, fontWeight: "700" },
  commentList: { flex: 1 },
  commentLoading: { paddingVertical: 20, alignItems: "center" },
  commentEmptyText: { textAlign: "center", paddingVertical: 20 },
  commentItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBody: { flex: 1 },
  commentBubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commentName: { fontWeight: "700", fontSize: 13, marginBottom: 2 },
  commentTime: { fontSize: 11 },
  commentContent: { fontSize: 13, lineHeight: 18 },
  commentMention: { color: "#3B66F5", fontWeight: "600" },
  commentMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginLeft: 6,
    alignItems: "center",
  },
  commentAction: { fontSize: 12, fontWeight: "600" },
  commentReactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  commentReactionText: { fontSize: 11, fontWeight: "700" },
  commentReactionPicker: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginLeft: 6,
  },
  commentReactionOption: { padding: 2 },
  viewRepliesBtn: {
    marginTop: 6,
    marginLeft: 6,
  },
  viewRepliesText: { fontSize: 12, fontWeight: "600" },
  repliesLoading: { marginTop: 6, marginLeft: 6 },
  replyBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 8,
  },
  commentComposer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 6,
  },
  replyText: { fontSize: 12 },
  replyUser: { color: "#3B66F5", fontWeight: "700" },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 4,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  listingToast: {
    position: "absolute",
    top: 72,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 1500,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  listingToastText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  sendBtn: { padding: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});
