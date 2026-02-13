import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { countries, TCountryCode } from "countries-list";
import { format, isValid, parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";
import {
  Bio,
  Birthday,
  Phone,
  Email,
  Location,
  CalendarIcon,
} from "../../components/icons/icons";

type AboutData = {
  storedUser: any;
  profile: any;
  details: any;
  personal: any;
};

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

const getAboutRows = (data: any) => [
  {
    title: "Job",
    Icon: Bio,
    value: getJobLabel(data),
  },
  {
    title: "Birthday",
    Icon: Birthday,
    value: formatDateLabel(data?.dob || data?.date_of_birth),
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
    title: "Country",
    Icon: Location,
    value: formatCountryLabel(data?.country || data?.country_name || data?.country_code),
  },
  {
    title: "Joined On",
    Icon: CalendarIcon,
    value: formatDateLabel(data?.created_at || data?.createdAt || data?.joined_at),
  },
];

const AboutRow = ({
  Icon,
  title,
  value,
  theme,
  showDivider,
}: {
  Icon: React.ComponentType<any>;
  title: string;
  value: string;
  theme: any;
  showDivider?: boolean;
}) => (
  <View
    style={[
      styles.infoRow,
      showDivider && { borderBottomWidth: 1, borderBottomColor: theme.border },
    ]}
  >
    <View style={styles.iconBox}>
      <Icon width={24} height={24} fill={theme.icon} color={theme.icon} />
    </View>
    <View style={styles.infoTextWrap}>
      <Text style={[styles.infoTitle, { color: theme.titleText }]}>{title}</Text>
      <Text style={[styles.infoValue, { color: theme.valueText }]}>{value}</Text>
    </View>
  </View>
);

export default function AboutMeScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [aboutData, setAboutData] = useState<AboutData>({
    storedUser: null,
    profile: {},
    details: {},
    personal: {},
  });

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    titleText: isDark ? "#E2E8F0" : "#4B5563",
    valueText: isDark ? "#CBD5E1" : "#64748B",
    headerText: isDark ? "#F8FAFC" : "#4B5563",
    border: isDark ? "#1F2937" : "#E2E8F0",
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

  const rows = useMemo(() => getAboutRows(mergedData), [mergedData]);

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
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#3B66F5" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {rows.map((row, index) => (
            <AboutRow
              key={row.title}
              Icon={row.Icon}
              title={row.title}
              value={String(row.value || "Not added")}
              showDivider={index < rows.length - 1}
              theme={theme}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
});
