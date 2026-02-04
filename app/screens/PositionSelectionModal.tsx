import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../utils/themeContext";

const PositionSelectionModal = ({
  visible,
  onClose,
  roles,
  onSelect,
  currentPosition,
}: any) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const theme = {
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#121721" : "#F9FAFB",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
  };

  // Filter roles based on user search
  const filteredRoles = roles.filter((role: any) =>
    role.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Position
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchWrapper,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={20} color={theme.subText} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by position..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredRoles}
            keyExtractor={(item) => item.value.toString()}
            style={{ marginTop: 10 }}
            renderItem={({ item }) => {
              const isSelected = item.label === currentPosition;
              return (
                <TouchableOpacity
                  style={[
                    styles.roleItem,
                    isSelected && { backgroundColor: theme.primary }, // Highlight selected item
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.roleText,
                      { color: isSelected ? "#FFF" : theme.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    height: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  roleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderRadius: 10,
  },
  roleText: { fontSize: 16 },
});

export default PositionSelectionModal;
