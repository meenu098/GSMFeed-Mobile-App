import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CONFIG from "../utils/config";
import { useTheme } from "../utils/themeContext";

const PasswordChangeModal = ({ visible, onClose }: any) => {
  const { isDark } = useTheme();

  // States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const theme = {
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#121721" : "#F9FAFB",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
  };

  // POST API logic
  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({
            old_password: currentPassword,
            new_password: newPassword,
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        Alert.alert("Failed", data.message || "Could not change password.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Change password
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.desc, { color: theme.subText }]}>
              Your password should be atleast 8 characters and should include a
              combination of numbers, letters, and symbols.
            </Text>

            {/* Input Group: Current Password */}
            <Text style={[styles.label, { color: theme.text }]}>
              Current password <Text style={{ color: "red" }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <TextInput
                secureTextEntry={!showPass.current}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={[styles.input, { color: theme.text }]}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPass({ ...showPass, current: !showPass.current })
                }
              >
                <Feather
                  name={showPass.current ? "eye" : "eye-off"}
                  size={20}
                  color={theme.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Input Group: New Password */}
            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              New password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <TextInput
                secureTextEntry={!showPass.new}
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.input, { color: theme.text }]}
              />
              <TouchableOpacity
                onPress={() => setShowPass({ ...showPass, new: !showPass.new })}
              >
                <Feather
                  name={showPass.new ? "eye" : "eye-off"}
                  size={20}
                  color={theme.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Input Group: Confirm Password */}
            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              Confirm password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <TextInput
                secureTextEntry={!showPass.confirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { color: theme.text }]}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPass({ ...showPass, confirm: !showPass.confirm })
                }
              >
                <Feather
                  name={showPass.confirm ? "eye" : "eye-off"}
                  size={20}
                  color={theme.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity>
                <Text style={{ color: theme.subText }}>Forgot password?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  container: { padding: 20 },
  modalContent: { borderRadius: 30, padding: 25 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 25 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  input: { flex: 1, height: "100%" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
  },
  submitBtn: { paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 },
  submitText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});

export default PasswordChangeModal;
