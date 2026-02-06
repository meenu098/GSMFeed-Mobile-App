import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FooterLinks = () => {
  const router = useRouter();

  return (
    <View style={styles.bottomLinks}>
      <TouchableOpacity onPress={() => router.push("/screens/Privacy")}>
        <Text style={styles.footerLink}>Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.footerDivider}>|</Text>

      <TouchableOpacity onPress={() => router.push("/screens/Terms")}>
        <Text style={styles.footerLink}>Terms of Service</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    marginTop: 70,
  },
  footerLink: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
  },
  footerDivider: {
    color: "#FFFFFF",
    marginHorizontal: 15,
    opacity: 0.5,
  },
  bottomLinks: {
    position: "absolute",
    bottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
});

export default FooterLinks;
