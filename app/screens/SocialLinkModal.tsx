import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../utils/themeContext";

const SocialLinksModal = ({ visible, onClose, onSave, initialData }: any) => {
  const { isDark } = useTheme();
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [link, setLink] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const platforms = [
    "Facebook",
    "Youtube",
    "Instagram",
    "X",
    "LinkedIn",
    "Thread",
  ];

  useEffect(() => {
    if (initialData) {
      setPlatform(initialData.name || "");
      setUsername(initialData.username || "");
      setLink(initialData.link || "");
    } else {
      setPlatform("");
      setUsername("");
      setLink("");
    }
  }, [initialData, visible]);

  const theme = {
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#121721" : "#F9FAFB",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
  };

  const handleSave = () => {
    onSave({ name: platform, username, link });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {initialData?.name
                ? "Edit Social Media Links"
                : "Add Social Media Links"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subHeader, { color: theme.subText }]}>
            Edit Social Media Links.
          </Text>

          {/* Platform Selector */}
          <Text style={[styles.label, { color: theme.text }]}>
            Social media platform
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { borderColor: theme.primary, justifyContent: "center" },
            ]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={{ color: platform ? theme.text : theme.subText }}>
              {platform || "Select..."}
            </Text>
          </TouchableOpacity>

          {showDropdown && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {platforms.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.dropdownItem,
                    platform === p && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    setPlatform(p);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={{ color: platform === p ? "#FFF" : theme.text }}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Username Input */}
          <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
            Username
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={theme.subText}
          />

          {/* Link Input */}
          <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
            Link
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            value={link}
            onChangeText={setLink}
            placeholder="https://..."
            placeholderTextColor={theme.subText}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "90%", borderRadius: 30, padding: 25 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  subHeader: { fontSize: 14, marginVertical: 10 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 5,
    overflow: "hidden",
  },
  dropdownItem: { padding: 15 },
  submitBtn: {
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  submitText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});

export default SocialLinksModal;
