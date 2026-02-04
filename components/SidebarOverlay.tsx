import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import Sidebar from "../app/screens/Sidebar";

export default function SidebarOverlay({ visible, onClose }: any) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) setIsMounted(true);

    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setIsMounted(false);
    });
  }, [visible, slideAnim]);

  if (!isMounted) return null;

  return (
    <View style={styles.container}>
      {/* Dimmed overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sliding sidebar */}
      <Animated.View
        style={[
          styles.sidebarContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Sidebar />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 999,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sidebarContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "75%", // Sidebar width
    backgroundColor: "#fff",
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
