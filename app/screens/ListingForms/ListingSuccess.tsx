import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../shared/themeContext";

const ListingSuccess = ({ onFinish }: { onFinish: () => void }) => {
  const { isDark } = useTheme();
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Feather name="check" size={50} color="#FFF" />
        </View>
        <Text style={[styles.title, { color: isDark ? "#FFF" : "#000" }]}>
          Listing Published!
        </Text>
        <Text style={styles.subtitle}>
          Your product is now visible on the feed.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onFinish}>
          <Text style={styles.buttonText}>Back to Feed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", padding: 20 },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 10 },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});

export default ListingSuccess;
