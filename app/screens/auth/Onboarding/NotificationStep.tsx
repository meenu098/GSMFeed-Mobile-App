import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../../shared/themeContext";

interface NotificationStepProps {
  onNext: (enabled: boolean) => void;
  onBack: () => void;
}

const NotificationStep = ({ onNext, onBack }: NotificationStepProps) => {
  const { isDark } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);

  const colors = {
    bg: isDark ? "#0F172A" : "#F8F3FF",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1D1D1D",
    subText: isDark ? "#94A3B8" : "#4F4F4F",
    primary: "#8B5CF6",
  };

  const toggleSwitch = () => setIsEnabled((prev) => !prev);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.centerContent}>
          {/* Notification Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={80}
              color={colors.primary}
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Turn on notifications
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Stay updated with in-app alerts in your notification center.
          </Text>

          {/* Toggle Switch */}
          <View style={styles.switchContainer}>
            <Switch
              trackColor={{ false: "#E2E8F0", true: "#C4B5FD" }}
              thumbColor={isEnabled ? colors.primary : "#94A3B8"}
              ios_backgroundColor="#E2E8F0"
              onValueChange={toggleSwitch}
              value={isEnabled}
              style={{ transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }] }}
            />
          </View>
          <Text style={[styles.statusText, { color: colors.subText }]}>
            {isEnabled
              ? "In-app notifications enabled"
              : "In-app notifications paused"}
          </Text>
        </View>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.navBtn} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={colors.text} />
            <Text style={[styles.navText, { color: colors.text }]}> Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => onNext(isEnabled)}
          >
            <Text style={[styles.navText, { color: colors.text }]}>Next </Text>
            <Feather name="arrow-right" size={20} color={colors.text} />
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  centerContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  switchContainer: {
    marginVertical: 20,
  },
  statusText: {
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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

export default NotificationStep;
