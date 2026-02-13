import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../shared/themeContext";

export type SkeletonVariant =
  | "list"
  | "feed"
  | "profile"
  | "profilePage"
  | "form"
  | "chat";

type SkeletonBlockProps = {
  width?: number | `${number}%` | "100%";
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

type SkeletonLoaderProps = {
  variant?: SkeletonVariant;
  count?: number;
  style?: ViewStyle;
  withScroll?: boolean;
};

const SkeletonBlock = ({
  width = "100%",
  height = 14,
  radius = 8,
  style,
}: SkeletonBlockProps) => {
  const { isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          opacity: pulse,
          backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
        },
        style,
      ]}
    />
  );
};

const ListRowSkeleton = () => (
  <View style={styles.listRow}>
    <SkeletonBlock width={48} height={48} radius={24} />
    <View style={styles.listTextWrap}>
      <SkeletonBlock width="58%" height={14} />
      <SkeletonBlock width="38%" height={12} style={styles.mt8} />
    </View>
    <SkeletonBlock width={86} height={32} radius={10} />
  </View>
);

const FeedCardSkeleton = () => (
  <View style={styles.feedCard}>
    <View style={styles.feedHeader}>
      <SkeletonBlock width={42} height={42} radius={21} />
      <View style={styles.feedHeaderText}>
        <SkeletonBlock width={120} height={14} />
        <SkeletonBlock width={72} height={11} style={styles.mt8} />
      </View>
    </View>
    <SkeletonBlock width="100%" height={220} radius={14} style={styles.mt12} />
    <SkeletonBlock width="92%" height={13} style={styles.mt12} />
    <SkeletonBlock width="76%" height={13} style={styles.mt8} />
    <View style={[styles.row, styles.mt12]}>
      <SkeletonBlock width={62} height={24} radius={12} />
      <SkeletonBlock width={62} height={24} radius={12} />
      <SkeletonBlock width={62} height={24} radius={12} />
    </View>
  </View>
);

const ProfileSkeleton = () => (
  <View>
    <SkeletonBlock width="100%" height={210} radius={0} />
    <View style={styles.profileTop}>
      <SkeletonBlock width={96} height={96} radius={48} />
      <View style={styles.profileTopText}>
        <SkeletonBlock width={150} height={18} />
        <SkeletonBlock width={110} height={13} style={styles.mt8} />
      </View>
    </View>
    <SkeletonBlock width="100%" height={84} radius={14} style={styles.mt16} />
    <SkeletonBlock width="100%" height={84} radius={14} style={styles.mt12} />
    <FeedCardSkeleton />
  </View>
);

const ProfilePageSkeleton = () => (
  <View style={styles.profilePageRoot}>
    <View>
      <SkeletonBlock width="100%" height={180} radius={0} />
      <View style={styles.profileBackBtn}>
        <SkeletonBlock width={20} height={20} radius={6} />
      </View>
    </View>

    <View style={styles.profileAvatarOverlay}>
      <SkeletonBlock width={100} height={100} radius={50} />
    </View>

    <View style={styles.profileCenterText}>
      <SkeletonBlock width={170} height={22} radius={10} />
      <SkeletonBlock width={118} height={14} style={styles.mt8} />
    </View>

    <View style={styles.profileButtonsRow}>
      <SkeletonBlock width="48%" height={40} radius={20} />
      <SkeletonBlock width="48%" height={40} radius={20} />
    </View>

    <View style={styles.profileStatsRow}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <View key={`stat-${idx}`} style={styles.profileStatCol}>
          <SkeletonBlock width={36} height={18} radius={8} />
          <SkeletonBlock width={62} height={12} style={styles.mt8} />
        </View>
      ))}
    </View>

    <View style={styles.profileTabRow}>
      <SkeletonBlock width={58} height={18} radius={8} />
      <SkeletonBlock width={72} height={2} radius={1} style={styles.mt8} />
    </View>

    <View style={styles.profilePostCard}>
      <View style={styles.profilePostHeader}>
        <View style={styles.profilePostHeaderLeft}>
          <SkeletonBlock width={42} height={42} radius={21} />
          <View style={styles.feedHeaderText}>
            <SkeletonBlock width={128} height={14} />
            <SkeletonBlock width={92} height={11} style={styles.mt8} />
          </View>
        </View>
        <View style={styles.profilePostHeaderRight}>
          <SkeletonBlock width={56} height={18} radius={9} />
          <SkeletonBlock width={30} height={12} style={styles.mt8} />
          <SkeletonBlock width={14} height={14} radius={7} style={styles.mt8} />
        </View>
      </View>

      <View style={styles.profilePostTitleRow}>
        <SkeletonBlock width="58%" height={20} />
        <SkeletonBlock width="28%" height={24} radius={8} />
      </View>
      <SkeletonBlock width="35%" height={14} style={styles.mt8} />

      <SkeletonBlock width="100%" height={250} radius={14} style={styles.mt12} />

      <SkeletonBlock width="90%" height={12} style={styles.mt12} />
      <SkeletonBlock width="72%" height={12} style={styles.mt8} />

      <View style={[styles.row, styles.mt12]}>
        <SkeletonBlock width={64} height={24} radius={12} />
        <SkeletonBlock width={64} height={24} radius={12} />
        <SkeletonBlock width={64} height={24} radius={12} />
      </View>
    </View>

    <View style={styles.profileBottomNav}>
      <SkeletonBlock width={22} height={22} radius={11} />
      <SkeletonBlock width={22} height={22} radius={11} />
      <SkeletonBlock width={22} height={22} radius={11} />
      <SkeletonBlock width={22} height={22} radius={11} />
      <SkeletonBlock width={30} height={30} radius={15} />
    </View>
  </View>
);

const FormSkeleton = () => (
  <View>
    <SkeletonBlock width={150} height={24} />
    <SkeletonBlock width="68%" height={14} style={styles.mt12} />
    <SkeletonBlock width="100%" height={54} radius={12} style={styles.mt20} />
    <SkeletonBlock width="100%" height={54} radius={12} style={styles.mt12} />
    <SkeletonBlock width="100%" height={54} radius={12} style={styles.mt12} />
    <SkeletonBlock width="100%" height={54} radius={12} style={styles.mt12} />
    <SkeletonBlock width="100%" height={48} radius={12} style={styles.mt20} />
  </View>
);

const ChatSkeleton = () => (
  <View>
    <SkeletonBlock width={110} height={18} />
    <View style={styles.mt16}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <View
          key={`chat-row-${idx}`}
          style={[
            styles.chatBubbleRow,
            idx % 2 === 0 ? styles.chatLeft : styles.chatRight,
          ]}
        >
          <SkeletonBlock
            width={idx % 2 === 0 ? "70%" : "62%"}
            height={42}
            radius={16}
          />
        </View>
      ))}
    </View>
  </View>
);

const getVariantContent = (variant: SkeletonVariant, count: number) => {
  switch (variant) {
    case "feed":
      return (
        <View>
          <SkeletonBlock width="100%" height={44} radius={12} />
          <View style={styles.mt12}>
            {Array.from({ length: count }).map((_, idx) => (
              <FeedCardSkeleton key={`feed-card-${idx}`} />
            ))}
          </View>
        </View>
      );
    case "profile":
      return <ProfileSkeleton />;
    case "profilePage":
      return <ProfilePageSkeleton />;
    case "form":
      return <FormSkeleton />;
    case "chat":
      return <ChatSkeleton />;
    case "list":
    default:
      return (
        <View>
          {Array.from({ length: count }).map((_, idx) => (
            <ListRowSkeleton key={`list-row-${idx}`} />
          ))}
        </View>
      );
  }
};

export default function SkeletonLoader({
  variant = "list",
  count = 6,
  style,
  withScroll = true,
}: SkeletonLoaderProps) {
  const { screenTheme } = useTheme();
  const edgeToEdge = variant === "profilePage";

  const content = useMemo(
    () => getVariantContent(variant, Math.max(1, count)),
    [variant, count],
  );

  const body = (
    <View
      style={[
        styles.container,
        edgeToEdge && styles.containerEdgeToEdge,
        { backgroundColor: screenTheme.bg },
        style,
      ]}
    >
      {content}
    </View>
  );

  if (!withScroll) {
    return body;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: screenTheme.bg }}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  containerEdgeToEdge: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  mt16: {
    marginTop: 16,
  },
  mt20: {
    marginTop: 20,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  listTextWrap: {
    flex: 1,
  },
  feedCard: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedHeaderText: {
    marginLeft: 10,
    flex: 1,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -48,
    paddingHorizontal: 12,
  },
  profileTopText: {
    marginLeft: 12,
    flex: 1,
  },
  profilePageRoot: {
    flex: 1,
    paddingBottom: 100,
  },
  profileBackBtn: {
    position: "absolute",
    left: 20,
    top: 52,
  },
  profileAvatarOverlay: {
    marginTop: -50,
    alignItems: "center",
  },
  profileCenterText: {
    alignItems: "center",
    marginTop: 10,
  },
  profileButtonsRow: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileStatsRow: {
    marginTop: 24,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  profileStatCol: {
    alignItems: "center",
    minWidth: 72,
  },
  profileTabRow: {
    marginTop: 30,
    marginHorizontal: 20,
    width: 90,
  },
  profilePostCard: {
    marginTop: 14,
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 15,
  },
  profilePostHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  profilePostHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  profilePostHeaderRight: {
    alignItems: "flex-end",
  },
  profilePostTitleRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  profileBottomNav: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatBubbleRow: {
    width: "100%",
    marginBottom: 10,
  },
  chatLeft: {
    alignItems: "flex-start",
  },
  chatRight: {
    alignItems: "flex-end",
  },
});
