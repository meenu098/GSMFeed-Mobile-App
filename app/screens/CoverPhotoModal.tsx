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
import { useTheme } from "../../shared/themeContext";

const { width } = Dimensions.get("window");

const CoverEditModal = ({
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
              Edit Cover Photo
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Rectangular Crop Area */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.previewImage, { transform: [{ scale: zoom }] }]}
              resizeMode="contain"
            />
            {/* The white rectangular border indicating the 3:1 crop area */}
            <View style={styles.rectOverlay} />

            {/* Darkened areas outside the crop box to focus the user */}
            <View style={styles.topMask} />
            <View style={styles.bottomMask} />
          </View>

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
    width: width * 0.95,
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
  closeBtn: { padding: 5 },
  imageContainer: {
    width: "100%",
    height: 250, // Reduced container height for rectangular focus
    backgroundColor: "#000",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  rectOverlay: {
    position: "absolute",
    width: "95%",
    height: 110, // Approximately 3:1 Aspect Ratio
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
  // Masks to create the "Cutout" look
  topMask: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: (250 - 110) / 2, // Container height minus crop height divided by 2
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomMask: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: (250 - 110) / 2,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sliderSection: { width: "100%", marginVertical: 30, alignItems: "center" },
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

export default CoverEditModal;
