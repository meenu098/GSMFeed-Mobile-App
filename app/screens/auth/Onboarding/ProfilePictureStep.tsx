import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../../shared/themeContext";

interface ProfilePictureStepProps {
  onNext: (imageUri: string | null) => void | Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
}

const ProfilePictureStep = ({
  onNext,
  onBack,
  isSubmitting = false,
}: ProfilePictureStepProps) => {
  const { isDark } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colors = {
    bg: isDark ? "#0F172A" : "#F0F3FF", // Light lavender/blue background from screenshot
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1D1D1D",
    subText: isDark ? "#94A3B8" : "#4F4F4F",
    border: isDark ? "#334155" : "#D1D5DB",
    primary: "#3B66F5",
  };

  const pickImage = async () => {
    if (isSubmitting) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }

    setLoading(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: colors.text }]}>
            Pick a profile picture
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Choose any photo you want to display.
          </Text>
        </View>

        {/* Upload Circle */}
        <TouchableOpacity
          style={[styles.uploadCircle, { borderColor: colors.border }]}
          onPress={pickImage}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContent}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Feather name="image" size={50} color="#CBD5E1" />
              )}
              <View style={styles.plusBadge}>
                <Feather name="plus" size={14} color="#FFF" />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.subText }]}>
          Only JPEG, JPG, PNG files are allowed
        </Text>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={onBack}
            disabled={isSubmitting}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
            <Text style={[styles.navText, { color: colors.text }]}> Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => onNext(selectedImage)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Text style={[styles.navText, { color: colors.text }]}>
                  {selectedImage ? "Next " : "Skip "}
                </Text>
                <Feather name="arrow-right" size={20} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 40,
    padding: 40,
    alignItems: "center",
    minHeight: 500,
    justifyContent: "space-between",
  },
  headerArea: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  uploadCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginVertical: 40,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  plusBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#CBD5E1",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  hint: {
    fontSize: 14,
    marginBottom: 30,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  navText: {
    fontSize: 18,
    fontWeight: "500",
  },
});

export default ProfilePictureStep;
