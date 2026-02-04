import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../navigation/FooterLinks";
import CONFIG from "../utils/config";
import { setUser } from "../utils/storage";
// Import your theme context
import { useTheme } from "../utils/themeContext";

const { width } = Dimensions.get("window");

const Login = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 1. Hook into your theme context
  const { isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // 2. Define dynamic theme based on isDark
  const theme = {
    colors: {
      primary: "#3B66F5",
      background: isDark ? "#020205" : "#F8FAFC",
      surface: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
      border: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
      text: isDark ? "#FFFFFF" : "#0F172A",
      textMuted: isDark ? "#94A3B8" : "#64748B",
      // If Light mode, maybe use a lighter gradient or just a solid color
      gradient: isDark
        ? (["#1A0B2E", "#020205", "#050A1A"] as const)
        : (["#F1F5F9", "#F8FAFC", "#FFFFFF"] as const),
    },
    spacing: {
      padding: 35,
      borderRadius: 16,
      inputHeight: 64,
    },
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data?.message || "Invalid credentials");
        return;
      }
      await setUser(data.data);
      router.replace("/screens/Newsfeed");
    } catch (error) {
      Alert.alert("Network Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
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
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Image
          source={
            isDark
              ? require("../../assets/common/logo-dark.png")
              : require("../../assets/common/logo.png") // Ensure you have a light logo
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.text}
              style={{ opacity: 0.7 }}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.colors.text}
              style={{ opacity: 0.7 }}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons
                name={secure ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.text}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rowActions}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRemember(!remember)}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: theme.colors.textMuted },
                  remember && { borderColor: theme.colors.primary },
                ]}
              >
                {remember && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.subText, { color: theme.colors.text }]}>
                Remember me
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity>
              <Text style={[styles.subText, { color: theme.colors.text }]}>
                Forgot password?
              </Text>
            </TouchableOpacity> */}
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push("/screens/Registration/stage-1")}
          >
            <Text style={[styles.signUpText, { color: theme.colors.primary }]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        <FooterLinks />
      </ScrollView>
    </View>
  );
};

// Styles remain largely the same, but remove hardcoded colors
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 35, alignItems: "center" },
  logo: { width: width * 0.5, height: 80, marginBottom: 60 },
  formContainer: { width: "100%" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 64,
    marginBottom: 16,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 15 },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 35,
  },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  subText: { fontSize: 14, opacity: 0.8 },
  loginButton: {
    height: 62,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  signUpButton: { marginTop: 25, alignItems: "center" },
  signUpText: { fontSize: 16, fontWeight: "500" },
});

export default Login;
