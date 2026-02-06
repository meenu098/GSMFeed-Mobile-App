import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OpenAISvg } from "../components/icons/bottomNavIcon";
import FooterLinks from "../components/FooterLinks";
import WebSvg from "../components/WebSvg";
import GradientText from "../shared/gradient";
import ScreenWrapper from "../shared/screenWrapper";

const { height: screenHeight } = Dimensions.get("window");

const Index = () => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) {
          router.replace("/screens/Newsfeed");
          return;
        }
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScreenWrapper bg="#000">
      <ImageBackground
        source={{ uri: "https://gsmfeed.com/images/home/hero/big-earth.png" }}
        resizeMode="cover"
        style={styles.bgImage}
        imageStyle={{ opacity: 0.25 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require("../assets/common/logo-dark.png")}
                style={styles.logo}
              />
            </View>

            <View style={styles.mainSection}>
              <GradientText text="AI-Powered" style={styles.aiText} />
              <Text style={styles.title}>Platform with</Text>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Verified Traders</Text>
                <WebSvg
                  uri="https://gsmfeed.com/images/icons/verifiedTraders.svg"
                  width={25}
                  height={25}
                  style={styles.verifiedIcon}
                />
              </View>

              <Text style={styles.powered}>powered by</Text>
              <OpenAISvg color="#fff" style={styles.openaiLogo} />
            </View>

            <View style={styles.features}>
              <Feature
                uri="https://gsmfeed.com/images/icons/verifiedTraders.svg"
                title="No. 1 Platform for"
                subtitle="verified traders"
              />
              <Feature
                uri="https://gsmfeed.com/images/icons/genuine-leads.svg"
                title="Connect with"
                subtitle="Genuine Leads"
              />
              <Feature
                uri="https://gsmfeed.com/images/icons/ai-technology.svg"
                title="Advanced Search"
                subtitle="Powered by OpenAI"
              />
              <Feature
                uri="https://gsmfeed.com/images/icons/tradingfeed.svg"
                title="TradingFeed"
                subtitle="All in One Space"
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.push("/screens/auth/Login")}
              >
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/screens/auth/Registration/stage-1")}
              >
                <Text style={styles.primaryButtonText}>
                  Join now with free membership
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerWrapper}>
            <FooterLinks />
          </View>
        </ScrollView>
      </ImageBackground>
    </ScreenWrapper>
  );
};

const Feature = ({ uri, title, subtitle }: any) => (
  <View style={styles.featureItem}>
    <WebSvg uri={uri} width={28} height={28} style={styles.icon} />
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureSubtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    minHeight: screenHeight - 40,
    flexGrow: 1,
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 80,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: "contain",
  },
  mainSection: {
    alignItems: "center",
    marginTop: 40,
  },
  aiText: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  verifiedIcon: {
    width: 18,
    height: 18,
    marginLeft: 6,
  },
  powered: {
    color: "#aaa",
    marginTop: 15,
    fontSize: 12,
  },
  openaiLogo: {
    width: 100,
    height: 25,
    marginTop: 6,
    tintColor: "#fff",
    resizeMode: "contain",
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  featureItem: {
    width: "45%",
    alignItems: "center",
    marginVertical: 12,
  },
  icon: {
    width: 28,
    height: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
  featureSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 2,
  },
  buttonGroup: {
    width: "90%",
    marginTop: 20,
    paddingBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  loginText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#316AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  footerWrapper: {
    marginTop: "auto",
    width: "90%",
    paddingBottom: 20,
    alignItems: "center",
  },
});

export default Index;
