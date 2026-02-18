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
import FooterLinks from "../../../components/FooterLinks";
import CONFIG from "../../../shared/config";
import { setUser } from "../../../shared/storage";

const { height, width } = Dimensions.get("window");

const Login = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

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
      router.replace("/screens/Contacts");
    } catch (error) {
      Alert.alert("Network Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="transparent"
      />

      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#1A0B2E", "#020205", "#050A1A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject} // Fill entire screen
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Image
          source={require("../../../assets/common/logo-dark.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <View style={styles.inputBox}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#FFFFFF"
              style={{ opacity: 0.7 }}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#FFFFFF"
              style={{ opacity: 0.7 }}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons
                name={secure ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#FFFFFF"
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rowActions}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRemember(!remember)}
            >
              <View style={[styles.radio, remember && styles.radioActive]}>
                {remember && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.subText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.subText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
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
            onPress={() => router.push("/screens/auth/Registration/stage-1")}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        <FooterLinks />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020205",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 35,
    alignItems: "center",
  },
  logo: {
    width: width * 0.5,
    height: 80,
    marginBottom: 60,
  },
  formContainer: {
    width: "100%",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 64,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#FFFFFF",
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 35,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#3B66F5",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B66F5",
  },
  subText: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
  },
  loginButton: {
    backgroundColor: "#3B66F5",
    height: 62,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  signUpButton: {
    marginTop: 25,
    alignItems: "center",
  },
  signUpText: {
    color: "#3B66F5",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    marginTop: 40,
    alignItems: "center",
    paddingBottom: 20,
  },
  footerLink: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.6,
  },
  footerDivider: {
    color: "#FFFFFF",
    marginHorizontal: 15,
    opacity: 0.3,
  },
});

export default Login;
