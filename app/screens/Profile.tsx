import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { extractPostSpecs, resolvePrimaryTradingFeed } from "../../shared/postSpecs";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");
const COVER_FALLBACK = require("../../assets/common/big-earth.png");
const CARD_WIDTH = width - 30;
const IMAGE_WIDTH = CARD_WIDTH - 30;
const POST_MIN_ASPECT_RATIO = 4 / 5; // Instagram portrait floor
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

const normalizePostMediaUrl = (value: unknown): string => {
  const url = String(value || "").trim();
  if (!url) return "";
  return url
    .replace("http://localhost:8000", CONFIG.API_ENDPOINT)
    .replace("https://localhost:8000", CONFIG.API_ENDPOINT);
};

const normalizePostMediaUrls = (value: unknown): string[] => {
  if (!value) return [];
  const rawItems = Array.isArray(value) ? value : [value];
  return rawItems
    .map((item: any) => {
      if (typeof item === "string") return normalizePostMediaUrl(item);
      if (item && typeof item === "object") {
        return normalizePostMediaUrl(
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

const isTruthyFollow = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
};

const resolveFollowState = (profile: any) => {
  if (isTruthyFollow(profile?.followedByMe)) return true;
  if (isTruthyFollow(profile?.is_following)) return true;
  if (isTruthyFollow(profile?.is_followed)) return true;
  if (isTruthyFollow(profile?.followed)) return true;
  return false;
};

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

const MEMBER_PAYLOAD_KEYS = [
  "members",
  "company_members",
  "companyMembers",
  "employees",
  "team",
  "staff",
  "users",
  "results",
  "items",
  "data",
] as const;

const normalizeLabel = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nested = [
      record.name,
      record.label,
      record.title,
      record.value,
      record.username,
      record.companyName,
    ];
    for (const item of nested) {
      const normalized = normalizeLabel(item);
      if (normalized) return normalized;
    }
  }
  return "";
};

const resolveMemberArray = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];

  for (const key of MEMBER_PAYLOAD_KEYS) {
    const value = payload?.[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of MEMBER_PAYLOAD_KEYS) {
    const nested = resolveMemberArray(payload?.[key]);
    if (nested.length > 0) return nested;
  }

  return [];
};

const normalizeMembers = (rawMembers: any[]) => {
  const byId = new Map<string, any>();

  rawMembers.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const nestedUser =
      entry?.user && typeof entry.user === "object" ? entry.user : null;
    const base = nestedUser ? { ...entry, ...nestedUser } : entry;

    const memberId =
      base?.id ??
      base?.user_id ??
      base?.member_id ??
      base?.profile_id ??
      base?.uuid ??
      base?.username ??
      base?.user_name ??
      null;
    if (memberId === null || memberId === undefined) return;

    const memberName =
      normalizeLabel(base?.name) ||
      `${normalizeLabel(base?.first_name)} ${normalizeLabel(base?.last_name)}`.trim() ||
      normalizeLabel(base?.username) ||
      normalizeLabel(base?.user_name) ||
      "User";

    const memberUsername =
      normalizeLabel(base?.username) || normalizeLabel(base?.user_name);

    const memberRole =
      normalizeLabel(base?.position) ||
      normalizeLabel(base?.role) ||
      normalizeLabel(base?.designation) ||
      normalizeLabel(base?.company_category) ||
      normalizeLabel(base?.industry) ||
      "Member";

    const followersRaw =
      base?.followers_count ??
      base?.follower_count ??
      base?.followers ??
      base?.followersCount ??
      0;
    const parsedFollowers = Number(followersRaw);
    const memberFollowers = Number.isFinite(parsedFollowers) ? parsedFollowers : 0;

    const memberAvatar =
      normalizeLabel(base?.avatar_url) ||
      normalizeLabel(base?.avatar) ||
      normalizeLabel(base?.profile_picture) ||
      normalizeLabel(base?.image);

    const memberCover =
      normalizeLabel(base?.cover_url) ||
      normalizeLabel(base?.cover) ||
      normalizeLabel(base?.banner) ||
      normalizeLabel(base?.header_image);

    const normalized = {
      ...base,
      _member_id: String(memberId),
      _member_name: memberName,
      _member_username: memberUsername,
      _member_role: memberRole,
      _member_followers: memberFollowers,
      _member_avatar: memberAvatar,
      _member_cover: memberCover,
    };

    byId.set(normalized._member_id, normalized);
  });

  return Array.from(byId.values());
};

const isBusinessProfileData = (data: any) => {
  const accountType = String(
    data?.account_type || data?.profile_type || data?.user_type || "",
  )
    .trim()
    .toLowerCase();

  if (accountType.includes("business") || accountType.includes("company")) {
    return true;
  }
  if (accountType.includes("individual") || accountType.includes("personal")) {
    return false;
  }

  return Boolean(
    data?.company_id ||
      data?.company?.id ||
      data?.companyName ||
      data?.company_name ||
      data?.company_category ||
      data?.est_year ||
      data?.industry,
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

const PostItem = ({ item, theme, onSave, canDelete, onDeletePost }: any) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const resolveIsSaved = useCallback((value: any) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") return value === "1" || value === "true";
    return false;
  }, []);
  const [isSaved, setIsSaved] = useState(resolveIsSaved(item.is_saved));
  const [shareVisible, setShareVisible] = useState(false);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

  // Parse reaction count safely
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
      normalizePostMediaUrls(
        tradingData?.images || tradingData?.media || item?.media || item?.images,
      ),
    [item?.images, item?.media, tradingData],
  );
  const specs = extractPostSpecs(item, tradingData);
  const postId = item.main_post_id ?? item.id;
  const deletePostId = item.id ?? item.main_post_id ?? postId;
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

  useEffect(() => {
    if (!shareVisible) {
      setLinkCopied(false);
    }
  }, [shareVisible]);

  const handleCopyLink = useCallback(async () => {
    try {
      Clipboard.setString(pageLink);
      setLinkCopied(true);
    } catch (error) {}
  }, [pageLink]);

  const handleShareTo = useCallback(
    async (platform: "facebook" | "whatsapp" | "twitter") => {
      const encodedLink = encodeURIComponent(pageLink);
      const urlMap: Record<string, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
        whatsapp: `https://wa.me/?text=${encodedLink}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedLink}`,
      };
      const targetUrl = urlMap[platform];
      if (!targetUrl) return;
      try {
        await Linking.openURL(targetUrl);
      } catch (error) {}
    },
    [pageLink],
  );

  const executeDeletePost = useCallback(async () => {
    if (!deletePostId || deletingPost) return;

    try {
      setDeletingPost(true);
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      const user = JSON.parse(userString);
      const url = `${CONFIG.API_ENDPOINT}/api/feed/delete-post/${deletePostId}`;
      let response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (response.status === 405) {
        response = await fetch(url, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        });
      }

      let json: any = {};
      try {
        json = await response.json();
      } catch {
        json = {};
      }

      if (response.ok && (json?.status ?? true)) {
        setPostMenuVisible(false);
        onDeletePost?.(deletePostId, item);
      } else {
        Alert.alert("Delete failed", json?.message || "Unable to delete post.");
      }
    } catch {
      Alert.alert("Error", "Unable to delete post right now.");
    } finally {
      setDeletingPost(false);
    }
  }, [deletePostId, deletingPost, item, onDeletePost]);

  const confirmDeletePost = useCallback(() => {
    if (!canDelete) return;
    setPostMenuVisible(false);
    Alert.alert("Delete post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void executeDeletePost();
        },
      },
    ]);
  }, [canDelete, executeDeletePost]);

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
    [updateCommentReaction],
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

  // Helper: Specs Rendering (Fixes String Error)
  const renderSpecs = () => {
    const items = [
      { key: "qty", label: "Qty", value: specs.qty },
      { key: "spec", label: "Spec", value: specs.spec },
      { key: "grade", label: "Grade", value: specs.grade },
      { key: "storage", label: "Storage", value: specs.storage },
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
        <View style={styles.headerRight}>
          <View style={styles.headerMetaRow}>
            {tradeTypeMeta ? (
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: tradeTypeMeta.bg },
                ]}
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
          {canDelete ? (
            <TouchableOpacity
              style={styles.postMenuBtn}
              onPress={() => setPostMenuVisible(true)}
              disabled={deletingPost}
            >
              {deletingPost ? (
                <ActivityIndicator size="small" color={theme.subText} />
              ) : (
                <Feather name="more-vertical" size={18} color={theme.subText} />
              )}
            </TouchableOpacity>
          ) : null}
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
            onPress={() => setShareVisible(true)}
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
        visible={postMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPostMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPostMenuVisible(false)}>
          <View style={styles.postMenuOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.postMenuCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.postMenuItem}
                  onPress={confirmDeletePost}
                  disabled={deletingPost}
                >
                  {deletingPost ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  )}
                  <Text style={styles.postMenuDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
        <View style={styles.commentModalOverlay}>
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

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={shareVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareVisible(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View
            style={[styles.shareModalCard, { backgroundColor: theme.cardBg }]}
          >
            <View style={styles.shareHeader}>
              <Text style={[styles.shareTitle, { color: theme.text }]}>
                Share
              </Text>
              <TouchableOpacity onPress={() => setShareVisible(false)}>
                <Feather name="x" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.shareIconRow}>
              <TouchableOpacity
                style={[styles.shareIconBtn, { backgroundColor: "#1877F2" }]}
                onPress={() => handleShareTo("facebook")}
              >
                <FontAwesome name="facebook" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareIconBtn, { backgroundColor: "#25D366" }]}
                onPress={() => handleShareTo("whatsapp")}
              >
                <FontAwesome name="whatsapp" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareIconBtn, { backgroundColor: "#0F172A" }]}
                onPress={() => handleShareTo("twitter")}
              >
                <FontAwesome name="twitter" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.shareLabel, { color: theme.subText }]}>
              Page Link
            </Text>
            <View style={styles.shareLinkRow}>
              <View
                style={[
                  styles.shareLinkBox,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC",
                  },
                ]}
              >
                <TextInput
                  value={pageLink}
                  editable={false}
                  selectTextOnFocus
                  style={[styles.shareLinkInput, { color: theme.text }]}
                />
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, { borderColor: theme.border }]}
                onPress={handleCopyLink}
              >
                <Ionicons
                  name={linkCopied ? "checkmark" : "copy-outline"}
                  size={18}
                  color={linkCopied ? "#10B981" : theme.text}
                />
              </TouchableOpacity>
            </View>
            {linkCopied ? (
              <Text style={[styles.copiedText, { color: "#10B981" }]}>
                Copied
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- MAIN PROFILE SCREEN ---
export default function ProfileScreen() {
  const { screenTheme } = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [userData, setUserData] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "members">("posts");
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const theme = screenTheme;

  const formatMediaUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace("http://localhost:8000", CONFIG.API_ENDPOINT);
  };

  const profileName = userData?.name || userData?.username || "User";
  const avatarUri = formatMediaUrl(userData?.avatar || userData?.avatar_url);
  const coverUri = formatMediaUrl(
    userData?.cover ||
      userData?.cover_url ||
      userData?.avatar ||
      userData?.avatar_url,
  );
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profileName,
  )}&background=3B66F5&color=fff`;

  const isBusinessProfile = useMemo(
    () => isBusinessProfileData(userData),
    [userData],
  );
  const isBusinessAccountType = useMemo(() => {
    const accountType = String(
      userData?.account_type || userData?.profile_type || userData?.user_type || "",
    )
      .trim()
      .toLowerCase();
    return (
      accountType === "business" ||
      accountType.includes("business") ||
      accountType.includes("company")
    );
  }, [userData?.account_type, userData?.profile_type, userData?.user_type]);
  const membersCount = useMemo(() => {
    const raw =
      userData?.members_count ??
      userData?.company_members_count ??
      userData?.total_members ??
      members.length;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : members.length;
  }, [members.length, userData]);
  const showMembersTab = isBusinessAccountType || isBusinessProfile;

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
        setIsFollowingProfile(resolveFollowState(profileJson.data));

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

  useEffect(() => {
    if (!showMembersTab && activeTab === "members") {
      setActiveTab("posts");
    }
  }, [activeTab, showMembersTab]);

  const fetchMembers = useCallback(async () => {
    if (!isBusinessProfile || !userData) {
      setMembers([]);
      setMembersError(null);
      return;
    }

    setMembersLoading(true);
    setMembersError(null);

    try {
      const profileMembers = normalizeMembers(resolveMemberArray(userData));
      if (profileMembers.length > 0) {
        setMembers(profileMembers);
        return;
      }

      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        setMembers([]);
        return;
      }

      const loggedUser = JSON.parse(userString);
      const headers = {
        Authorization: `Bearer ${loggedUser?.token}`,
      };

      const profileCompanyId =
        userData?.company_id || userData?.company?.id || userData?.companyId;
      const rawProfileUserId =
        userData?.id || (Array.isArray(userId) ? userId[0] : userId);
      const profileUserId = Number(rawProfileUserId);
      const profileIdentifier =
        userData?.username ||
        userData?.id ||
        (Array.isArray(userId) ? userId[0] : userId);

      const endpointCandidates: string[] = [];

      if (Number.isFinite(profileUserId) && profileUserId > 0) {
        endpointCandidates.push(`/api/user/employees/${profileUserId}`);
      }

      if (profileCompanyId) {
        endpointCandidates.push(
          `/api/company/${profileCompanyId}/members`,
          `/api/company/members/${profileCompanyId}`,
          `/api/companies/${profileCompanyId}/members`,
          `/api/company/${profileCompanyId}/users`,
        );
      }

      if (profileIdentifier) {
        endpointCandidates.push(
          `/api/user/profile/${profileIdentifier}/members`,
          `/api/user/profile/members/${profileIdentifier}`,
          `/api/user/company-members/${profileIdentifier}`,
        );
      }

      let resolvedMembers: any[] = [];

      for (const endpoint of endpointCandidates) {
        try {
          const response = await fetch(`${CONFIG.API_ENDPOINT}${endpoint}`, {
            method: "GET",
            headers,
          });
          if (!response.ok) continue;

          const json = await response.json();
          if (json?.status === false) continue;

          const extracted = normalizeMembers(
            resolveMemberArray(json?.data ?? json),
          );
          if (extracted.length > 0) {
            resolvedMembers = extracted;
            break;
          }
        } catch {}
      }

      setMembers(resolvedMembers);
    } catch {
      setMembers([]);
      setMembersError("Could not load members right now.");
    } finally {
      setMembersLoading(false);
    }
  }, [isBusinessProfile, userData, userId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openMemberProfile = useCallback(
    (member: any) => {
      const targetUserId =
        member?._member_username ||
        member?.username ||
        member?.user_name ||
        member?._member_id ||
        member?.id ||
        member?.user_id;

      if (!targetUserId) return;

      router.push({
        pathname: "/screens/Profile",
        params: { userId: String(targetUserId) },
      });
    },
    [router],
  );

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

  const handleDeletePost = useCallback((deletedPostId: number | string) => {
    setFeed((prev) =>
      prev.filter(
        (post) =>
          String(post?.id ?? "") !== String(deletedPostId) &&
          String(post?.main_post_id ?? "") !== String(deletedPostId),
      ),
    );

    setUserData((prev: any) => {
      if (!prev) return prev;
      const currentCount = Number(prev?.posts_count);
      const safeCount = Number.isFinite(currentCount) ? currentCount : 0;
      return {
        ...prev,
        posts_count: Math.max(0, safeCount - 1),
      };
    });
  }, []);

  const openContactsTab = useCallback(
    (targetTab: "Followers" | "Following" | "Suggestions") => {
      router.push({
        pathname: "/screens/Contacts",
        params: { tab: targetTab },
      });
    },
    [router],
  );

  const handleAboutMePress = useCallback(() => {
    const targetUserId = userData?.username || userData?.id;
    if (!targetUserId) return;

    router.push({
      pathname: "/screens/AboutMe",
      params: {
        userId: String(targetUserId),
        profileName: String(userData?.name || userData?.username || "User"),
      },
    });
  }, [router, userData?.id, userData?.name, userData?.username]);

  const handleFollowToggle = useCallback(async () => {
    if (isOwnProfile || followActionLoading) return;

    const targetUserId =
      userData?.id || userData?.user_id || userData?.id_for_actions;
    if (!targetUserId) return;

    const endpoint = isFollowingProfile ? "unfollow" : "follow";
    const nextFollowValue = !isFollowingProfile;

    setFollowActionLoading(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/connection/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ user_id: Number(targetUserId) }),
        },
      );
      const json = await response.json();

      if (response.ok && json?.status) {
        setIsFollowingProfile(nextFollowValue);
        setUserData((prev: any) => {
          if (!prev) return prev;
          const currentFollowers = Number(prev?.followers_count);
          const fallbackCount = Number.isFinite(currentFollowers)
            ? currentFollowers
            : 0;
          const nextFollowers = Math.max(
            0,
            fallbackCount + (nextFollowValue ? 1 : -1),
          );
          return {
            ...prev,
            followers_count: json?.data?.followers_count ?? nextFollowers,
            followedByMe: nextFollowValue,
            is_following: nextFollowValue,
            is_followed: nextFollowValue,
          };
        });
      } else {
        Alert.alert(
          "Action failed",
          json?.message ||
            `Could not ${isFollowingProfile ? "unfollow" : "follow"} user.`,
        );
      }
    } catch {
      Alert.alert(
        "Error",
        `Could not ${isFollowingProfile ? "unfollow" : "follow"} user right now.`,
      );
    } finally {
      setFollowActionLoading(false);
    }
  }, [
    followActionLoading,
    isFollowingProfile,
    isOwnProfile,
    userData?.id,
    userData?.id_for_actions,
    userData?.user_id,
  ]);

  if (loading)
    return <SkeletonLoader variant="profilePage" withScroll={false} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          <Image
            source={coverUri ? { uri: coverUri } : COVER_FALLBACK}
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
            source={{ uri: avatarUri || fallbackAvatar }}
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

          <View style={[styles.profileActionRow]}>
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
            ) : (
              <TouchableOpacity
                onPress={handleFollowToggle}
                disabled={followActionLoading}
                style={[
                  styles.followBtnContainer,
                  {
                    borderColor: theme.border,
                    backgroundColor: isFollowingProfile
                      ? theme.card
                      : theme.primary,
                  },
                ]}
              >
                {followActionLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isFollowingProfile ? theme.text : "#FFF"}
                  />
                ) : (
                  <Text
                    style={[
                      styles.followBtnText,
                      { color: isFollowingProfile ? theme.text : "#FFF" },
                    ]}
                  >
                    {isFollowingProfile ? "Following" : "Follow"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleAboutMePress}
              style={[
                styles.aboutBtnContainer,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Feather name="info" size={16} color={theme.primary} />
              <Text style={[styles.aboutBtnText, { color: theme.text }]}>
                About
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: theme.text }]}>
              {userData?.posts_count || 0}
            </Text>
            <Text style={styles.statLab}>Posts</Text>
          </View>
          <TouchableOpacity
            style={styles.stat}
            activeOpacity={isOwnProfile ? 0.7 : 1}
            disabled={!isOwnProfile}
            onPress={() => isOwnProfile && openContactsTab("Followers")}
          >
            <Text style={[styles.statVal, { color: theme.text }]}>
              {userData?.followers_count || 0}
            </Text>
            <Text style={styles.statLab}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stat}
            activeOpacity={isOwnProfile ? 0.7 : 1}
            disabled={!isOwnProfile}
            onPress={() => isOwnProfile && openContactsTab("Following")}
          >
            <Text style={[styles.statVal, { color: theme.text }]}>
              {userData?.following_count || 0}
            </Text>
            <Text style={styles.statLab}>Following</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.tabButton}
            onPress={() => setActiveTab("posts")}
          >
            <Text
              style={[
                styles.tabTitle,
                { color: activeTab === "posts" ? theme.primary : theme.subText },
              ]}
            >
              Posts
            </Text>
            <View
              style={[
                styles.tabIndicator,
                {
                  backgroundColor:
                    activeTab === "posts" ? theme.primary : "transparent",
                },
              ]}
            />
          </TouchableOpacity>

          {showMembersTab ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.tabButton}
              onPress={() => setActiveTab("members")}
            >
              <Text
                style={[
                  styles.tabTitle,
                  {
                    color:
                      activeTab === "members" ? theme.primary : theme.subText,
                  },
                ]}
              >
                {membersCount > 0 ? `Members (${membersCount})` : "Members"}
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  {
                    backgroundColor:
                      activeTab === "members" ? theme.primary : "transparent",
                  },
                ]}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.feedContainer}>
          {activeTab === "members" && showMembersTab ? (
            membersLoading ? (
              <SkeletonLoader
                variant="membersGrid"
                count={6}
                withScroll={false}
                style={styles.membersSkeletonLoader}
              />
            ) : (
              <View style={styles.membersContainer}>
                {membersError ? (
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.subText,
                    marginTop: 20,
                  }}
                >
                  {membersError}
                </Text>
                ) : members.length > 0 ? (
                  members.map((member) => {
                  const memberName =
                    member?._member_name || member?.name || member?.username || "User";
                  const memberRole =
                    member?._member_role ||
                    member?.role ||
                    member?.designation ||
                    "Member";
                  const followerValue = Number(
                    member?._member_followers ?? member?.followers_count ?? 0,
                  );
                  const followerCount = Number.isFinite(followerValue)
                    ? followerValue
                    : 0;
                  const followerLabel = `${followerCount} ${
                    followerCount === 1 ? "follower" : "followers"
                  }`;
                  const memberAvatar =
                    formatMediaUrl(
                      member?._member_avatar ||
                        member?.avatar ||
                        member?.avatar_url ||
                        member?.profile_picture,
                    ) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      memberName,
                    )}&background=3B66F5&color=fff`;
                  const memberCover = formatMediaUrl(
                    member?._member_cover ||
                      member?.cover ||
                      member?.cover_url ||
                      member?.banner,
                  );

                  return (
                    <View
                      key={member?._member_id || member?.id || memberName}
                      style={styles.memberGridItem}
                    >
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[
                          styles.memberCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => openMemberProfile(member)}
                      >
                        <View
                          style={[
                            styles.memberCover,
                            { backgroundColor: theme.isDark ? "#1E293B" : "#E5E7EB" },
                          ]}
                        >
                          {memberCover ? (
                            <Image
                              source={{ uri: memberCover }}
                              style={styles.memberCoverImage}
                              resizeMode="cover"
                            />
                          ) : null}
                        </View>
                        <View style={styles.memberAvatarWrap}>
                          <Image
                            source={{ uri: memberAvatar }}
                            style={styles.memberAvatar}
                            resizeMode="cover"
                          />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[styles.memberName, { color: theme.text }]}
                        >
                          {memberName}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[styles.memberRole, { color: theme.subText }]}
                        >
                          {memberRole}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[styles.memberFollowers, { color: theme.subText }]}
                        >
                          {followerLabel}
                        </Text>
                        <View
                          style={[
                            styles.memberProfileButton,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Text style={styles.memberProfileButtonText}>Profile</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                  })
                ) : (
                  <Text
                    style={{
                      textAlign: "center",
                      color: theme.subText,
                      marginTop: 20,
                    }}
                  >
                    No members available yet.
                  </Text>
                )}
              </View>
            )
          ) : feed.length > 0 ? (
            feed.map((post) => (
              <PostItem
                key={post.id}
                item={post}
                theme={theme}
                onSave={handleBookmark}
                canDelete={isOwnProfile}
                onDeletePost={handleDeletePost}
              />
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
    backgroundColor: "#1F2937",
  },
  nameRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },
  profileName: { fontSize: 20, fontWeight: "bold" },
  handleText: { color: "#3B66F5", fontSize: 14, marginTop: 2 },
  profileActionRow: {
    marginTop: 15,
    width: "92%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBtnContainer: { width: "48%" },
  editBtn: { paddingVertical: 10, borderRadius: 20, alignItems: "center" },
  editBtnText: { color: "#FFF", fontWeight: "bold" },
  followBtnContainer: {
    width: "48%",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnText: { fontWeight: "700", fontSize: 14 },
  aboutBtnContainer: {
    width: "48%",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  aboutBtnText: { fontWeight: "700", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
    paddingHorizontal: 20,
  },
  stat: { alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "bold" },
  statLab: { color: "#94A3B8", fontSize: 12 },
  tabsRow: {
    marginHorizontal: 20,
    marginTop: 30,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    paddingBottom: 10,
    alignItems: "center",
  },
  tabTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  tabIndicator: {
    marginTop: 8,
    height: 3,
    borderRadius: 2,
    width: "100%",
  },
  feedContainer: { marginTop: 10 },
  membersSkeletonLoader: {
    backgroundColor: "transparent",
    paddingHorizontal: 15,
    paddingTop: 6,
    paddingBottom: 0,
  },
  membersContainer: {
    paddingHorizontal: 15,
    paddingTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  memberGridItem: {
    width: "48.5%",
    marginBottom: 12,
  },
  memberCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 10,
    alignItems: "center",
  },
  memberCover: {
    width: "100%",
    height: 54,
  },
  memberCoverImage: {
    width: "100%",
    height: "100%",
  },
  memberAvatarWrap: {
    marginTop: -24,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  memberName: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 8,
  },
  memberRole: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  memberFollowers: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  memberProfileButton: {
    marginTop: 8,
    minWidth: 88,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  memberProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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
  headerRight: { alignItems: "flex-end", justifyContent: "center" },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postMenuBtn: {
    marginTop: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
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
  postMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  postMenuCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  postMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  postMenuDeleteText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  commentModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  shareModalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    padding: 16,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  shareTitle: { fontSize: 16, fontWeight: "700" },
  shareIconRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  shareIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  shareLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  shareLinkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  shareLinkBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareLinkInput: { fontSize: 13 },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  copiedText: { marginTop: 8, fontSize: 12, fontWeight: "600" },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentTitle: { fontSize: 16, fontWeight: "700" },
  commentList: { maxHeight: 360, flexGrow: 0 },
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  replyText: { fontSize: 12 },
  replyUser: { color: "#3B66F5", fontWeight: "700" },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 6,
    paddingBottom: 4,
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
  sendBtn: { padding: 8 },
});
