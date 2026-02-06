import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../../../../components/FooterLinks";
import CONFIG from "../../../../shared/config";
import { useRegistration } from "../../../../shared/RegistrationContext";

export default function RegistrationScreen6() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formData, updateFormData } = useRegistration();

  const [submitting, setSubmitting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [usernameValidity, setUsernameValidity] = useState({
    valid: null as boolean | null,
    loading: false,
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const cleanedValue = (string: string) => {
    return string.replace(/[^a-zA-Z0-9-_]/g, "").replace(/^[^a-zA-Z0-9]+/, "");
  };

  useEffect(() => {
    const validateUsername = async () => {
      if (!formData.username || formData.username.length < 3) {
        setUsernameValidity({ valid: null, loading: false });
        setSuggestions([]);
        return;
      }
      setUsernameValidity({ valid: null, loading: true });
      try {
        const res = await fetch(
          `${CONFIG.API_ENDPOINT}/api/auth/validate/username`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: formData.username }),
          },
        );
        const result = await res.json();

        setUsernameValidity({
          valid: result?.data?.is_available,
          loading: false,
        });

        // Set suggestions if username is taken
        if (!result?.data?.is_available && result?.data?.suggestions) {
          setSuggestions(result.data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setUsernameValidity({ valid: false, loading: false });
      }
    };
    const timeout = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeout);
  }, [formData.username]);

  const handleSignUp = async () => {
    setSubmitting(true);
    const finalPayload = { ...formData, isLead: false, otp_token: "" };

    try {
      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(finalPayload),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => router.replace("/under-review") },
        ]);
      } else {
        Alert.alert("Signup Failed", result.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = usernameValidity.valid && termsAgreed && !submitting;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#0A0A1A", "#1A0B2E", "#020205"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../../../assets/common/logo-dark.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.glassWrapper}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 100}
            tint="dark"
            style={styles.blurContainer}
          >
            <View style={styles.innerCard}>
              <Text style={styles.cardTitle}>Choose Username</Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="eg: john_doe"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="none"
                    editable={!submitting}
                    style={[
                      styles.input,
                      {
                        borderColor:
                          usernameValidity.valid === false
                            ? "#EF4444"
                            : "rgba(255,255,255,0.15)",
                      },
                    ]}
                    value={formData.username}
                    onChangeText={(val) =>
                      updateFormData({ username: cleanedValue(val) })
                    }
                  />
                  <View style={styles.statusIconContainer}>
                    {usernameValidity.loading ? (
                      <ActivityIndicator size="small" color="#3B66F5" />
                    ) : usernameValidity.valid === true ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#10B981"
                      />
                    ) : usernameValidity.valid === false ? (
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    ) : null}
                  </View>
                </View>

                {/* SUGGESTIONS SECTION */}
                {suggestions.length > 0 && (
                  <View style={styles.suggestionContainer}>
                    <Text style={styles.suggestionLabel}>Suggestions:</Text>
                    <View style={styles.suggestionList}>
                      {suggestions.map((sug, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionChip}
                          onPress={() => updateFormData({ username: sug })}
                        >
                          <Text style={styles.suggestionText}>{sug}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.agreementSection}>
                <TouchableOpacity
                  onPress={() => setTermsAgreed(!termsAgreed)}
                  disabled={submitting}
                  style={styles.checkboxTouch}
                >
                  <Ionicons
                    name={termsAgreed ? "checkbox" : "square-outline"}
                    size={24}
                    color={termsAgreed ? "#3B66F5" : "rgba(255,255,255,0.5)"}
                  />
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.linkText}>Terms</Text>{" "}
                    and <Text style={styles.linkText}>Privacy Policy</Text>.
                  </Text>
                </View>
              </View>

              <View style={styles.navButtons}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  disabled={submitting}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.signUpButton,
                    {
                      backgroundColor: canSubmit
                        ? "#3B66F5"
                        : "rgba(255,255,255,0.2)",
                    },
                  ]}
                  disabled={!canSubmit}
                  onPress={handleSignUp}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text
                      style={[
                        styles.signUpText,
                        { opacity: canSubmit ? 1 : 0.5 },
                      ]}
                    >
                      Sign Up
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
        <FooterLinks />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: "center", paddingHorizontal: 25 },
  logo: { width: 150, height: 60, marginBottom: 40 },
  glassWrapper: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 30,
  },
  blurContainer: { width: "100%", padding: 24 },
  innerCard: { backgroundColor: "transparent" },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  inputGroup: { marginBottom: 20 },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    height: 55,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 45,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#FFFFFF",
    fontSize: 15,
  },
  statusIconContainer: { position: "absolute", right: 15 },
  suggestionContainer: { marginTop: 12 },
  suggestionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  suggestionList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    backgroundColor: "rgba(59, 102, 245, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 102, 245, 0.4)",
  },
  suggestionText: { color: "#3B66F5", fontSize: 13, fontWeight: "600" },
  agreementSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 35,
    width: "100%",
  },
  checkboxTouch: { marginTop: -2 },
  termsTextContainer: { flex: 1, marginLeft: 12 },
  termsText: { fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 18 },
  linkText: { color: "#3B66F5", fontWeight: "600" },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backButton: { marginRight: 25 },
  backText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  signUpButton: {
    height: 52,
    paddingHorizontal: 35,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 130,
  },
  signUpText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
