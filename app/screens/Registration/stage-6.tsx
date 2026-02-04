import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import FooterLinks from "../../navigation/FooterLinks";
import CONFIG from "../../utils/config";
import { useTheme } from "../../utils/themeContext";

export default function RegistrationScreen6() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [username, setUsername] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usernameValidity, setUsernameValidity] = useState({
    valid: null as boolean | null,
    loading: false,
  });

  const cleanedValue = (string: string) => {
    return string.replace(/[^a-zA-Z0-9-_]/g, "").replace(/^[^a-zA-Z0-9]+/, "");
  };

  useEffect(() => {
    const validateUsername = async () => {
      if (username.length < 3) {
        setUsernameValidity({ valid: null, loading: false });
        return;
      }
      setUsernameValidity({ valid: null, loading: true });
      try {
        const res = await fetch(
          `${CONFIG.API_ENDPOINT}/api/auth/validate/username`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          },
        );
        const data = await res.json();
        setUsernameValidity({
          valid: data?.data?.is_available,
          loading: false,
        });
      } catch (err) {
        setUsernameValidity({ valid: false, loading: false });
      }
    };
    const timeout = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const canSubmit = usernameValidity.valid && termsAgreed;

  const handleFinalSignUp = async () => {
    setSubmitting(true);
    // Add your API call to https://api.gsmfeed.com/api/auth/register here
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#1A0B2E", "#020205"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40 },
        ]}
      >
        <Image
          source={require("../../../assets/common/logo-dark.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Username</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="eg: john_doe"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    borderColor:
                      usernameValidity.valid === false ? "#EF4444" : "#E2E8F0",
                  },
                ]}
                value={username}
                onChangeText={(val) => setUsername(cleanedValue(val))}
              />
              <View style={styles.statusIconContainer}>
                {usernameValidity.loading ? (
                  <ActivityIndicator size="small" color="#3B66F5" />
                ) : usernameValidity.valid === true ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : null}
              </View>
            </View>
          </View>

          {/* Corrected Agreement Section */}
          <View style={styles.agreementSection}>
            <TouchableOpacity
              style={styles.checkboxTouch}
              onPress={() => setTermsAgreed(!termsAgreed)}
            >
              <Ionicons
                name={termsAgreed ? "checkbox" : "square-outline"}
                size={24}
                color={termsAgreed ? "#3B66F5" : "#64748B"}
              />
            </TouchableOpacity>

            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                I have read and agree to the{" "}
                <Text style={styles.linkText}>Terms and Conditions</Text> and{" "}
                <Text style={styles.linkText}>Privacy Policy</Text> of gsmfeed,
                including consent to the use of my information.
              </Text>
            </View>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signUpButton,
                { backgroundColor: canSubmit ? "#3B66F5" : "#CBD5E1" },
              ]}
              disabled={!canSubmit || submitting}
              onPress={handleFinalSignUp}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.signUpText}>Sign Up</Text>
              )}
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
  scrollContent: { alignItems: "center", paddingHorizontal: 20 },
  logo: { width: 140, height: 60, marginBottom: 30 },
  card: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  inputGroup: { marginBottom: 20 },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    height: 55,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 45,
    borderWidth: 1,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontSize: 15,
  },
  statusIconContainer: { position: "absolute", right: 15 },

  // Layout Fixes for Terms
  agreementSection: {
    flexDirection: "row",
    alignItems: "flex-start", // Aligns checkbox to top of text
    marginBottom: 30,
  },
  checkboxTouch: {
    marginTop: -2, // Fine-tune checkbox vertical position
  },
  termsTextContainer: {
    flex: 1, // Allows text to take remaining width and wrap
    marginLeft: 10,
  },
  termsText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  linkText: {
    color: "#3B66F5",
    fontWeight: "600",
  },

  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backButton: {
    marginRight: 25,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B66F5",
  },
  signUpButton: {
    height: 50,
    paddingHorizontal: 30,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 120,
  },
  signUpText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
