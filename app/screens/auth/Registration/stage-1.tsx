import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessMan, CompanySvg } from "../../../../components/icons/icons";
import FooterLinks from "../../../../components/FooterLinks";
import { useTheme } from "../../../../shared/themeContext";

const { width } = Dimensions.get("window");

export default function RegistrationScreen1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const theme = {
    colors: {
      primary: "#3B66F5",
      background: isDark ? "#020205" : "#F8FAFC",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      icon: isDark ? "#FFFFFF" : "#3B66F5",
      cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
      cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      circleBg: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(59, 102, 245, 0.1)",
      gradient: isDark
        ? (["#1A0B2E", "#020205", "#050A1A"] as const)
        : (["#F8FAFC", "#E2E8F0", "#FFFFFF"] as const),
    },
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Image
          source={
            isDark
              ? require("../../../../assets/common/logo-dark.png")
              : require("../../../../assets/common/logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.textHeader}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Join the Network
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            Select your account type to get started
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder,
              },
            ]}
            onPress={() => router.push("/screens/auth/Registration/stage-2")}
            activeOpacity={0.7}
          >
            {/* Circle Wrapper added back for better visual hierarchy */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.circleBg },
              ]}
            >
              <CompanySvg color={theme.colors.icon} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Company Owner
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.subText }]}>
                Register a new business entity
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder,
              },
            ]}
            onPress={() => router.push("/screens/auth/UserRegistration/stage-1")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.circleBg },
              ]}
            >
              <BusinessMan color={theme.colors.icon} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Employee / Individual
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.subText }]}>
                I work for an existing company
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNav}>
          <Text style={[styles.footerText, { color: theme.colors.subText }]}>
            Already have an account?{" "}
            <Text
              style={[styles.linkText, { color: theme.colors.primary }]}
              onPress={() => router.push("/screens/auth/Login")}
            >
              Log in
            </Text>
          </Text>
        </View>

        <View style={styles.linksWrapper}>
          <FooterLinks />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 25 },
  logo: { width: 140, height: 100, marginTop: 20 },
  textHeader: { alignItems: "center", marginTop: 30, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 8, textAlign: "center" },
  cardContainer: { width: "100%", gap: 16 },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { marginLeft: 16, flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardDesc: { fontSize: 13, marginTop: 2 },
  footerNav: { marginTop: 40 },
  footerText: { fontSize: 15 },
  linkText: { fontWeight: "700" },
  linksWrapper: {
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 20,
    width: "100%",
  },
});
