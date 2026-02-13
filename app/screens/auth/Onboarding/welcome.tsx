import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../../shared/themeContext";

interface OnboardingWelcomeProps {
  onStart: () => void;
  onLogout: () => void;
}

const OnboardingWelcome = ({ onStart, onLogout }: OnboardingWelcomeProps) => {
  const { isDark, screenTheme } = useTheme();

  // Theme-aware colors, though the screenshot shows a specific light blue palette
  const colors = {
    bg: isDark ? "#0F172A" : "#F0F7FF", // keep onboarding-specific tint
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    primary: screenTheme.primary,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.card : "#FFFFFF" },
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoRow}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome to{" "}
          </Text>
          <Image
            source={
              isDark
                ? require("../../../../assets/common/logo-dark.png")
                : require("../../../../assets/common/logo.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Message Section */}
        <Text style={[styles.description, { color: colors.subText }]}>
          Your account is all set up, and we are excited to help you make the
          most of it. Lets get started with a few quick steps to personalize
          your experience!
        </Text>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={onStart}
        >
          <Text style={styles.startBtnText}>Start Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Feather
            name="power"
            size={16}
            color={colors.subText}
            style={styles.logoutIcon}
          />
          <Text style={[styles.logoutText, { color: colors.subText }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    borderRadius: 40,
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: "center",
    // Elevation for Android
    elevation: 2,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
  },
  logo: {
    width: 120,
    height: 30,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
    fontWeight: "500",
  },
  startBtn: {
    width: "80%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default OnboardingWelcome;
