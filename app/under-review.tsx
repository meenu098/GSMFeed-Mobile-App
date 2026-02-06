import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";

export default function UnderReviewScreen() {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#0A0A1A", "#1A0B2E", "#020205"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.contentWrapper}>
        <View style={styles.glassWrapper}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 100}
            tint="dark"
            style={styles.blurContainer}
          >
            <View style={styles.innerCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={50} color="#3B66F5" />
              </View>

              <Text style={styles.title}>Your account is under review</Text>
              <Text style={styles.subtitle}>
                We are currently reviewing your account. This takes a maximum of
                48 hours.
              </Text>

              <View style={styles.divider} />

              <Text style={styles.infoText}>
                You will receive a notification once your access has been
                granted.
              </Text>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },
  glassWrapper: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  blurContainer: {
    padding: 35,
    alignItems: "center",
  },
  innerCard: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(59, 102, 245, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(59, 102, 245, 0.3)",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 15,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
  divider: {
    width: "40%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 25,
  },
  infoText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontStyle: "italic",
  },
});
