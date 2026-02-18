import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { countries, TCountryCode } from "countries-list";
import { format, isValid, parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bio,
  Birthday,
  CalendarIcon,
  Email,
  Location,
  Phone,
} from "../../components/icons/icons";
import SkeletonLoader from "../../components/SkeletonLoader";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

type AboutData = {
  storedUser: any;
  profile: any;
  details: any;
  personal: any;
};
type AccountType = "individual" | "business";

const parseDateSafe = (value: unknown) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const parsed = parseISO(raw);
  if (isValid(parsed)) return parsed;

  const fallback = new Date(raw);
  return isValid(fallback) ? fallback : null;
};

const formatDateLabel = (value: unknown) => {
  const date = parseDateSafe(value);
  if (!date) return "Not added";
  return format(date, "dd MMMM yyyy");
};

const formatPhoneLabel = (data: any) => {
  const fullPhone = String(data?.phone_full || "").trim();
  if (fullPhone) return fullPhone;

  const phone = String(data?.phone || data?.phone_number || "").trim();
  if (!phone) return "Not added";

  let phoneCode = String(
    data?.phone_country_code || data?.phone_code || "",
  ).trim();
  if (phoneCode && !phoneCode.startsWith("+") && /^\d+$/.test(phoneCode)) {
    phoneCode = `+${phoneCode}`;
  }

  return phoneCode ? `${phoneCode} ${phone}` : phone;
};

const formatCountryLabel = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return "Not added";

  const normalized = raw.toUpperCase();
  if (normalized.length === 2) {
    const country = countries[normalized as TCountryCode];
    if (country?.name) return country.name;
  }
  return raw;
};

const extractLabel = (value: any): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const objectValue =
      value?.name || value?.label || value?.title || value?.companyName || "";
    return typeof objectValue === "string" ? objectValue.trim() : "";
  }
  return "";
};

const getBioLabel = (data: any) => {
  const bioFromObject =
    data?.bio && typeof data.bio === "object"
      ? String(
          data?.bio?.bio || data?.bio?.about || data?.bio?.description || "",
        ).trim()
      : "";
  const bioFromRoot = String(
    data?.about || data?.description || data?.bio_text || "",
  ).trim();
  return bioFromObject || bioFromRoot || "Not added";
};

const getWebsiteLabel = (data: any) => {
  const website = String(
    data?.bio?.website ||
      data?.website ||
      data?.web ||
      data?.site ||
      data?.url ||
      "",
  ).trim();
  return website || "Not added";
};

const getIndustryLabel = (data: any) => {
  return (
    extractLabel(data?.company_category) ||
    extractLabel(data?.industry) ||
    extractLabel(data?.company_industry) ||
    extractLabel(data?.category) ||
    "Not added"
  );
};

const getFoundedLabel = (data: any) => {
  const raw =
    data?.est_year ||
    data?.founded_year ||
    data?.founded ||
    data?.established_year ||
    data?.established_on ||
    data?.company_founded;

  if (typeof raw === "number") return String(raw);

  const str = String(raw || "").trim();
  if (/^\d{4}$/.test(str)) return str;

  const parsed = parseDateSafe(raw);
  if (parsed) return format(parsed, "yyyy");

  return "Not added";
};

const normalizeAccountType = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase();

const resolveAccountType = (data: any): AccountType => {
  const explicit = normalizeAccountType(
    data?.account_type || data?.profile_type || data?.user_type || data?.type,
  );

  if (explicit === "business" || explicit === "individual") {
    return explicit;
  }
  if (explicit.includes("business") || explicit.includes("company")) {
    return "business";
  }
  if (explicit.includes("individual") || explicit.includes("personal")) {
    return "individual";
  }

  const hasBusinessSignals = Boolean(
    extractLabel(data?.company_category) ||
    extractLabel(data?.industry) ||
    data?.est_year ||
    data?.founded_year,
  );
  const hasPersonalSignals = Boolean(
    data?.dob || data?.date_of_birth || extractLabel(data?.position),
  );

  if (hasBusinessSignals && !hasPersonalSignals) return "business";
  return "individual";
};

const makeIonIcon = (name: React.ComponentProps<typeof Ionicons>["name"]) => {
  const IonIcon = ({ width = 24, height = 24, color, fill }: any) => {
    const sizeCandidate = Number(width) || Number(height) || 24;
    const size = Number.isFinite(sizeCandidate) ? sizeCandidate : 24;
    return (
      <Ionicons name={name} size={size} color={color || fill || "#525252"} />
    );
  };
  return IonIcon;
};

const JobIcon = makeIonIcon("briefcase-outline");
const WebsiteIcon = makeIonIcon("globe-outline");
const FoundedIcon = makeIonIcon("flag-outline");
const IndustryIcon = makeIonIcon("business-outline");

const getJobLabel = (data: any) => {
  const role =
    extractLabel(data?.position) ||
    extractLabel(data?.role) ||
    extractLabel(data?.designation) ||
    extractLabel(data?.company_category);

  const companyName =
    extractLabel(data?.companyName) ||
    extractLabel(data?.company_name) ||
    extractLabel(data?.company) ||
    extractLabel(data?.business_name) ||
    extractLabel(data?.organization_name) ||
    extractLabel(data?.trade_name) ||
    extractLabel(data?.employer_name);

  if (role && companyName) {
    return `${role} @ ${companyName}`;
  }

  return role || companyName || "Not added";
};

const getAboutRows = (data: any, accountType: AccountType) => {
  const baseRows = [
    {
      title: "Bio",
      Icon: Bio,
      value: getBioLabel(data),
    },
    {
      title: "Website",
      Icon: WebsiteIcon,
      value: getWebsiteLabel(data),
    },
    {
      title: "Mobile",
      Icon: Phone,
      value: formatPhoneLabel(data),
    },
    {
      title: "Email",
      Icon: Email,
      value: data?.email || "Not added",
    },
    {
      title: "Joined On",
      Icon: CalendarIcon,
      value: formatDateLabel(
        data?.created_at || data?.createdAt || data?.joined_at,
      ),
    },
  ];

  if (accountType === "business") {
    return [
      baseRows[0],
      baseRows[1],
      {
        title: "Founded",
        Icon: FoundedIcon,
        value: getFoundedLabel(data),
      },
      baseRows[2],
      baseRows[3],
      {
        title: "Headquarters",
        Icon: Location,
        value: formatCountryLabel(
          data?.country || data?.country_name || data?.country_code,
        ),
      },
      {
        title: "Industry",
        Icon: IndustryIcon,
        value: getIndustryLabel(data),
      },
      baseRows[4],
    ];
  }

  return [
    baseRows[0],
    {
      title: "Job",
      Icon: JobIcon,
      value: getJobLabel(data),
    },
    baseRows[1],
    {
      title: "Birthday",
      Icon: Birthday,
      value: formatDateLabel(data?.dob || data?.date_of_birth),
    },
    baseRows[2],
    baseRows[3],
    {
      title: "Country",
      Icon: Location,
      value: formatCountryLabel(
        data?.country || data?.country_name || data?.country_code,
      ),
    },
    baseRows[4],
  ];
};

const normalizePlanName = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isPremiumPlan = (user: any) => {
  const planName = normalizePlanName(user?.subscription?.name);
  if (!planName) return false;
  return planName !== "starter";
};

const maskSensitiveValue = (value: string) => {
  const safeValue = String(value || "").trim();
  if (!safeValue || safeValue.toLowerCase() === "not added") return "Not added";
  return "••••••••••••";
};

const AboutRow = ({
  Icon,
  title,
  value,
  theme,
  showDivider,
  locked,
  warningVisible,
  onLockedPress,
}: {
  Icon: React.ComponentType<any>;
  title: string;
  value: string;
  theme: any;
  showDivider?: boolean;
  locked?: boolean;
  warningVisible?: boolean;
  onLockedPress?: () => void;
}) => (
  <TouchableWithoutFeedback
    onPress={() => {
      if (!locked) return;
      onLockedPress?.();
    }}
  >
    <View
      style={[
        styles.infoRow,
        showDivider && {
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.iconBox}>
        <Icon width={24} height={24} fill={theme.icon} color={theme.icon} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoTitle, { color: theme.titleText }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.infoValue,
            { color: theme.valueText },
            locked && styles.lockedValue,
          ]}
        >
          {value}
        </Text>
        {warningVisible ? (
          <View style={styles.warningWrap}>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                These details are only available for Premium members
              </Text>
            </View>
            <View style={styles.warningArrow} />
          </View>
        ) : null}
      </View>
    </View>
  </TouchableWithoutFeedback>
);

export default function AboutMeScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { isDark, screenTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [aboutData, setAboutData] = useState<AboutData>({
    storedUser: null,
    profile: {},
    details: {},
    personal: {},
  });
  const [lockedFieldWarning, setLockedFieldWarning] = useState<string | null>(
    null,
  );

  const theme = {
    bg: screenTheme.bg,
    titleText: screenTheme.titleText,
    valueText: screenTheme.valueText,
    headerText: screenTheme.text,
    border: screenTheme.border,
    icon: isDark ? "#E5E7EB" : "#525252",
    isDark,
  };

  const fetchAuthData = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const storedUser = JSON.parse(userString);
      const token = storedUser?.token;
      const targetUserId = Array.isArray(userId) ? userId[0] : userId;
      const identifier = targetUserId || storedUser?.username || storedUser?.id;
      const isOwnTarget =
        !targetUserId ||
        String(targetUserId) === String(storedUser?.username) ||
        String(targetUserId) === String(storedUser?.id);

      if (!token || !identifier) {
        setAboutData({ storedUser, profile: {}, details: {}, personal: {} });
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const fetchPayload = async (url: string) => {
        try {
          const response = await fetch(url, { method: "GET", headers });
          if (!response.ok) return {};
          const json = await response.json();
          if (json?.status === false) return {};
          return json?.data || {};
        } catch {
          return {};
        }
      };

      const [profile, details, personal] = await Promise.all([
        fetchPayload(`${CONFIG.API_ENDPOINT}/api/user/profile/${identifier}`),
        isOwnTarget
          ? fetchPayload(`${CONFIG.API_ENDPOINT}/api/user/details`)
          : Promise.resolve({}),
        isOwnTarget
          ? fetchPayload(`${CONFIG.API_ENDPOINT}/api/user/details/personal`)
          : Promise.resolve({}),
      ]);

      setAboutData({ storedUser, profile, details, personal });
    } catch {
      // Keep silent fallback values on failure.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAuthData();
  }, [fetchAuthData]);

  const mergedData = useMemo(
    () => ({
      ...(aboutData?.storedUser || {}),
      ...(aboutData?.profile || {}),
      ...(aboutData?.details || {}),
      ...(aboutData?.personal || {}),
    }),
    [aboutData],
  );

  const accountType = useMemo(
    () =>
      resolveAccountType({
        ...mergedData,
        account_type:
          mergedData?.account_type ||
          aboutData?.profile?.account_type ||
          aboutData?.storedUser?.account_type,
      }),
    [
      aboutData?.profile?.account_type,
      aboutData?.storedUser?.account_type,
      mergedData,
    ],
  );

  const rows = useMemo(
    () => getAboutRows(mergedData, accountType),
    [accountType, mergedData],
  );

  const targetUserId = useMemo(
    () => (Array.isArray(userId) ? userId[0] : userId),
    [userId],
  );

  const isOwnProfile = useMemo(() => {
    const viewer = aboutData?.storedUser;
    if (!viewer) return false;
    if (!targetUserId) return true;
    return (
      String(targetUserId) === String(viewer?.id) ||
      String(targetUserId) === String(viewer?.username)
    );
  }, [aboutData?.storedUser, targetUserId]);

  const viewedProfileIsVerified = useMemo(() => {
    const verifiedValue =
      mergedData?.is_verified ?? mergedData?.verified ?? mergedData?.kyc ?? 0;
    return Number(verifiedValue) === 1 || verifiedValue === true;
  }, [mergedData]);

  const viewerIsPremium = useMemo(
    () => isPremiumPlan(aboutData?.storedUser),
    [aboutData?.storedUser],
  );

  const shouldGatePremiumDetails = useMemo(
    () => viewedProfileIsVerified && !viewerIsPremium && !isOwnProfile,
    [isOwnProfile, viewedProfileIsVerified, viewerIsPremium],
  );

  useEffect(() => {
    if (!lockedFieldWarning) return;
    const timeout = setTimeout(() => {
      setLockedFieldWarning(null);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [lockedFieldWarning]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>
          About Me
        </Text>
      </View>

      <View style={[styles.headerDivider, { backgroundColor: theme.border }]} />

      {loading ? (
        <SkeletonLoader variant="profile" count={1} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {rows.map((row, index) => {
            const rowKey = row.title.toLowerCase();
            const isSensitiveRow = rowKey === "mobile" || rowKey === "email";
            const locked = shouldGatePremiumDetails && isSensitiveRow;
            const valueToShow = locked
              ? maskSensitiveValue(String(row.value || ""))
              : String(row.value || "Not added");

            return (
              <AboutRow
                key={row.title}
                Icon={row.Icon}
                title={row.title}
                value={valueToShow}
                showDivider={index < rows.length - 1}
                theme={theme}
                locked={locked}
                warningVisible={locked && lockedFieldWarning === rowKey}
                onLockedPress={() => setLockedFieldWarning(rowKey)}
              />
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  iconBox: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoTextWrap: { flex: 1 },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
  },
  lockedValue: {
    letterSpacing: 1.2,
  },
  warningWrap: {
    marginTop: 8,
    alignItems: "center",
    width: "100%",
  },
  warningBox: {
    backgroundColor: "#121317",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 280,
  },
  warningText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  warningArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#121317",
    marginTop: -1,
  },
});
