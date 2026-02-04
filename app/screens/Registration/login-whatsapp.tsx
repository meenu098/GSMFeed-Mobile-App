import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LoginWithWhatsApp = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ImageBackground
        source={require("../../../assets/common/big-earth.png")}
        style={styles.bgImage}
        imageStyle={{ opacity: 0.8 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.header}>
              <Image
                source={require("../../../assets/common/logo-dark.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Log in to your account</Text>
            </View>

            {/* White Login Card */}
            <View style={styles.card}>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity style={styles.countryPicker}>
                  <Image
                    source={{ uri: "https://flagcdn.com/w40/ae.png" }}
                    style={styles.flagIcon}
                  />
                  <Text style={styles.countryCode}>+971</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.phoneInput}
                  placeholder="Whatsapp number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Get OTP</Text>
              </TouchableOpacity>

              {/* Apply the dividerLine style here */}
              <View style={styles.dividerLine} />

              <TouchableOpacity style={styles.outlineBtn}>
                <Image
                  source={{
                    uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
                  }}
                  style={styles.googleIcon}
                />
                <Text style={styles.outlineBtnText}>Sign In With Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => router.push("/screens/Login")}
              >
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#64748B"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.outlineBtnText}>Sign In With Password</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.noAccountText}>Dont have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push("/screens/Registration/stage-1")}
                >
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity>
                <Text style={styles.footerText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerText}>Terms & Condition</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

// FIX: Export it here
export default LoginWithWhatsApp;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  bgImage: { flex: 1, width: "100%" },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 180, height: 50, tintColor: "#fff", marginBottom: 15 },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 10,
    width: 100,
    height: 56,
  },
  flagIcon: { width: 24, height: 16, marginRight: 8, borderRadius: 2 },
  countryCode: { fontSize: 16, color: "#1E293B", fontWeight: "500" },
  phoneInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1E293B",
  },
  primaryBtn: {
    backgroundColor: "#316AFF",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dividerLine: {
    height: 1,
    backgroundColor: "#E2E8F0",
    width: "100%",
    marginVertical: 25,
  },
  outlineBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  outlineBtnText: { color: "#1E293B", fontSize: 16, fontWeight: "600" },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  noAccountText: { color: "#64748B", fontSize: 14 },
  signupLink: { color: "#316AFF", fontSize: 14, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 40,
  },
  footerText: { color: "#fff", fontSize: 12, opacity: 0.8 },
});
