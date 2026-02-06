import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseIcon, WTBIcon, WTSIcon } from "../../components/icons/icons";
import { useTheme } from "../../shared/themeContext";

interface BroadcastSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: "Sell" | "Buy") => void;
}

const BroadcastSelection = ({
  visible,
  onClose,
  onSelect,
}: BroadcastSelectionProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const navigation = useNavigation<any>();
  const router = useRouter();

  const theme = {
    bg: isDark ? "#000000" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    cardBg: isDark ? "#1A1A1A" : "#F4F7FF",
    iconBlue: "#3B66F5",
  };

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
    router.replace("/screens/Newsfeed");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.closeButtonWrapper, { top: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            style={styles.touchTarget}
          >
            <CloseIcon color={theme.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            Hello, what are you listing today?
          </Text>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.cardBg }]}
              onPress={() => {
                if (typeof onSelect === "function") {
                  onSelect("Sell");
                }
              }}
            >
              <View style={styles.iconContainer}>
                <WTSIcon width={65} height={65} fill={theme.iconBlue} />
              </View>
              <Text style={[styles.cardLabel, { color: theme.text }]}>
                Want to sell
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.cardBg }]}
              onPress={() => onSelect?.("Buy")}
            >
              <View style={styles.iconContainer}>
                <WTBIcon width={65} height={65} fill={theme.iconBlue} />
              </View>
              <Text style={[styles.cardLabel, { color: theme.text }]}>
                Want to buy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButtonWrapper: { position: "absolute", right: 20, zIndex: 100 },
  touchTarget: { padding: 10, borderRadius: 20 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 50,
    paddingHorizontal: 40,
    lineHeight: 34,
  },
  cardRow: { flexDirection: "row", gap: 20 },
  card: {
    width: 155,
    height: 165,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconContainer: { marginBottom: 15 },
  cardLabel: { fontSize: 15, fontWeight: "600" },
});

export default BroadcastSelection;
