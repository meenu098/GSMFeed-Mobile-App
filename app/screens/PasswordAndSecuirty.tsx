import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../shared/themeContext";
import PasswordChangeModal from "./PasswordChangeModal";

const PasswordSecurityScreen = () => {
  const { screenTheme } = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const theme = {
    bg: screenTheme.bg,
    card: screenTheme.card,
    text: screenTheme.text,
    subText: screenTheme.subText,
    border: screenTheme.border,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Password and security
        </Text>
      </View>

      <View style={styles.content}>
        {/* Change Password Card */}
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Change password
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.subText }]}>
              Reset password here
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <PasswordChangeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 15 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  content: { padding: 20 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubTitle: { fontSize: 14, marginTop: 4 },
});

export default PasswordSecurityScreen;
