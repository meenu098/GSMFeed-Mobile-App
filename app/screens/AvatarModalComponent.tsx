import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../utils/themeContext";

const { width } = Dimensions.get("window");

const AvatarEditModal = ({
  visible,
  onClose,
  imageUri,
  zoom,
  setZoom,
  onSave,
}: any) => {
  const { isDark } = useTheme();

  const theme = {
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    primary: "#3B66F5",
    overlay: "rgba(0,0,0,0.9)",
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          {/* Header Row */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Edit Photo
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Image & Circle Preview */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.previewImage, { transform: [{ scale: zoom }] }]}
              resizeMode="contain"
            />
            {/* The white circular border indicating the crop area */}
            <View style={styles.circleOverlay} />
          </View>

          {/* Zoom Slider Control */}
          <View style={styles.sliderSection}>
            <Text style={[styles.zoomLabel, { color: theme.subText }]}>
              Zoom
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={3}
              step={0.01}
              value={zoom}
              onValueChange={setZoom}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={Platform.OS === "ios" ? "#FFFFFF" : theme.primary}
            />
          </View>

          {/* Save Action */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={onSave}
          >
            <Text style={styles.saveText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: width * 0.9,
    borderRadius: 30,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: "#000",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  circleOverlay: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  sliderSection: { width: "100%", marginVertical: 25, alignItems: "center" },
  zoomLabel: { fontSize: 14, marginBottom: 10, fontWeight: "500" },
  slider: { width: "90%", height: 40 },
  saveBtn: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});

export default AvatarEditModal;
