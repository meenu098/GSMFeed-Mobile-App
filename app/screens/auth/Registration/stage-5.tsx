import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../../../../components/FooterLinks";
import { useTheme } from "../../../../shared/themeContext";

export default function RegistrationScreen5() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validationItems = [
    {
      id: "length",
      label: "At least 8 characters",
      isMet: password.length >= 8,
    },
    {
      id: "upper",
      label: "At least 1 uppercase",
      isMet: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "At least 1 lowercase",
      isMet: /[a-z]/.test(password),
    },
    { id: "number", label: "At least 1 number", isMet: /[0-9]/.test(password) },
    {
      id: "special",
      label: "At least 1 special character",
      isMet: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const isPasswordValid = validationItems.every((item) => item.isMet);
  const passwordsMatch = password === confirmPassword && password !== "";
  const canGoNext = isPasswordValid && passwordsMatch;

  const theme = {
    colors: {
      primary: "#3B66F5",
      background: isDark ? "#020205" : "#F8FAFC",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
      cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      inputBg: isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9",
      success: "#10B981",
      gradient: isDark
        ? ["#1A0B2E", "#020205", "#050A1A"]
        : ["#F8FAFC", "#E2E8F0", "#FFFFFF"],
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
        colors={theme.colors.gradient as any}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
      >
        <Image
          source={
            isDark
              ? require("../../../../assets/common/logo-dark.png")
              : require("../../../../assets/common/logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Set Password
          </Text>

          <View style={styles.dynamicReqContainer}>
            {validationItems.map(
              (item) =>
                !item.isMet && (
                  <Animated.View
                    key={item.id}
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    layout={LinearTransition}
                    style={styles.reqRow}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={theme.colors.subText}
                    />
                    <Text
                      style={[styles.reqText, { color: theme.colors.subText }]}
                    >
                      {item.label}
                    </Text>
                  </Animated.View>
                ),
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Password
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.colors.subText}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onChangeText={setPassword}
              />
              <View style={styles.statusIconContainer}>
                {isPasswordValid && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                  />
                )}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Confirm Password
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.colors.subText}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onChangeText={setConfirmPassword}
              />
              <View style={styles.statusIconContainer}>
                {passwordsMatch && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                  />
                )}
              </View>
            </View>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.back()}
            >
              <Text style={[styles.backText, { color: theme.colors.text }]}>
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: canGoNext ? theme.colors.primary : "#CBD5E1",
                },
              ]}
              onPress={() =>
                canGoNext && router.push("/screens/auth/Registration/stage-6")
              }
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FooterLinks />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: "center", paddingHorizontal: 25 },
  logo: { width: 120, height: 60, marginBottom: 20 },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  dynamicReqContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
    minHeight: 20,
  },
  reqRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  reqText: { fontSize: 13, marginLeft: 8 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    height: 52,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 45,
    borderWidth: 1,
  },
  statusIconContainer: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
  },
  navButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
  navButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontWeight: "700" },
  nextText: { color: "#FFF", fontWeight: "700" },
});
