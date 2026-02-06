import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");
const COVER_FALLBACK = require("../../assets/common/big-earth.png");
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
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

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
    new RegExp(`(^|\\s)@${escapeRegex(replyUsername)}(\\s|$)`, "i").test(
      value,
    );
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
  const totalReactionsRaw = comment?.total_reactions;
  const totalReactionsCount =
    totalReactionsRaw && typeof totalReactionsRaw === "object"
      ? normalizeCount(totalReactionsRaw.total)
      : normalizeCount(totalReactionsRaw);

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
                <ActiveReactionIcon width={12} height={12} />
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

const PostItem = ({ item, theme, onSave }: any) => {
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
  const [replyNextMap, setReplyNextMap] = useState<Record<string, string | null>>(
    {},
  );
  const [replyPageMap, setReplyPageMap] = useState<Record<string, number>>({});
  const [activeCommentPickerId, setActiveCommentPickerId] = useState<string | null>(
    null,
  );

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
  const [commentCount, setCommentCount] = useState<number>(
    initialCommentsCount,
  );

  const tradingData = item.trading_feeds?.[0] || {};
  const author = item.author || {};
  const mediaUrls = tradingData.images || item.media || [];
  const postId = item.main_post_id ?? item.id;
  const pageLink = `${CONFIG.APP_URL}/feed/post/${postId}`;

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

  const fetchReplies = useCallback(
    async (parentId: string, page = 1) => {
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
    },
    [],
  );

  const updateCommentReaction = useCallback(
    (list: any[], commentId: string, nextReaction: string) => {
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
            comments: updateCommentReaction(c.comments, commentId, nextReaction),
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
            <Ionicons name="share-social-outline" size={20} color={theme.text} />
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
        <View style={styles.commentModalOverlay}>
          <View style={[styles.commentModal, { backgroundColor: theme.cardBg }]}>
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
                  style={[
                    styles.commentEmptyText,
                    { color: theme.subText },
                  ]}
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
          <View style={[styles.shareModalCard, { backgroundColor: theme.cardBg }]}>
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
    cardBg: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B66F5",
    border: isDark ? "#1B2331" : "#E2E8F0",
    isDark,
  };

  const formatMediaUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace("http://localhost:8000", CONFIG.API_ENDPOINT);
  };

  const profileName = userData?.name || userData?.username || "User";
  const avatarUri = formatMediaUrl(userData?.avatar || userData?.avatar_url);
  const coverUri = formatMediaUrl(
    userData?.cover || userData?.cover_url || userData?.avatar || userData?.avatar_url,
  );
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profileName,
  )}&background=3B66F5&color=fff`;

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

  const openContactsTab = useCallback(
    (targetTab: "Followers" | "Following" | "Suggestions") => {
      router.push({ pathname: "/screens/Contacts", params: { tab: targetTab } });
    },
    [router],
  );

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

        <View
          style={[styles.tabContainer, { borderBottomColor: theme.border }]}
        >
          <Text style={[styles.tabTitle, { color: theme.primary }]}>Posts</Text>
        </View>

        <View style={styles.feedContainer}>
          {feed.length > 0 ? (
            feed.map((post) => (
              <PostItem
                key={post.id}
                item={post}
                theme={theme}
                onSave={handleBookmark}
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
