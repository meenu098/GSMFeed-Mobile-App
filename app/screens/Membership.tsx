import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // Assuming you are using expo-router based on previous snippets
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../shared/themeContext";

const { width, height } = Dimensions.get("window");

const MembershipScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
  };

  const plans = [
    {
      name: "Starter",
      price: "0.00",
      duration: "lifetime",
      users: "+1 individual user",
      tagline: "As a Starter member you enjoy privileges like",
      features: [
        "Verified membership",
        "Access to Newsfeed",
        "Post 3 offers or requests per week",
        "Build a professional profile page",
        "Access to Tradingfeed",
        "Grow your business with followers reviews",
        "Access to Company Fraud and VAT Check",
        "Access to Blacklisted Serial and IMEI Check",
        "Live Chat Assistance",
      ],
      isPopular: false,
    },
    {
      name: "Max",
      price: "1,799.00",
      oldPrice: "2,299.00",
      discount: "-$ 500",
      duration: "billed Annually",
      users: "+3 individual users",
      tagline: "Everything from Starter Membership and",
      features: [
        "Advanced Tradingfeed",
        "Access to full details of members",
        "Custom Trade Alerts",
        "Filter on Contacts",
        "Post unlimited offers or requests",
        "Initiate chat with other members",
        "Build communities for bulk offers or requests",
        "Gain access to essential trading tools",
      ],
      isPopular: false,
    },
    {
      name: "Ultra",
      price: "2,199.00",
      oldPrice: "2,699.00",
      discount: "-$ 500",
      duration: "billed Annually",
      users: "+5 individual users",
      tagline: "Includes all privileges from Starter and Max membership",
      features: [
        "Pricing Manager",
        "View Analytics and Insights",
        "Advanced Filter on Contacts",
        "Marketplace & Auctions",
        "Advanced Search",
        "One-time Newsletter Marketing",
        "Dedicated Account Manager",
      ],
      isPopular: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.contentWrapper}>
        {/* Header with Back Icon */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pricingTitle, { color: theme.text }]}>
            Pricing Plans
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.85 + 20}
          decelerationRate="fast"
          contentContainerStyle={styles.plansContainer}
        >
          {plans.map((plan, index) => (
            <View
              key={index}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.card,
                  borderColor: plan.isPopular ? theme.primary : theme.border,
                },
              ]}
            >
              {plan.isPopular && (
                <LinearGradient
                  colors={["#4f46e5", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popularHeader}
                >
                  <Text style={styles.popularHeaderText}>Most Popular</Text>
                </LinearGradient>
              )}

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.planName, { color: theme.text }]}>
                  {plan.name}
                </Text>

                <View style={styles.priceContainer}>
                  {plan.oldPrice && (
                    <Text style={styles.oldPrice}>$ {plan.oldPrice}</Text>
                  )}
                  <View style={styles.currentPriceRow}>
                    {plan.discount && (
                      <View
                        style={[
                          styles.discountBadge,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text style={styles.discountText}>{plan.discount}</Text>
                      </View>
                    )}
                    <Text style={[styles.planPrice, { color: theme.primary }]}>
                      $ {plan.price}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.planDuration, { color: theme.primary }]}>
                  {plan.duration}
                </Text>
                <Text style={[styles.planUsers, { color: theme.text }]}>
                  {plan.users}
                </Text>
                <Text style={[styles.tagline, { color: theme.subText }]}>
                  {plan.tagline}
                </Text>

                <View style={styles.featureList}>
                  {plan.features.map((feature, fIndex) => (
                    <View key={fIndex} style={styles.featureRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={theme.primary}
                      />
                      <Text style={[styles.featureText, { color: theme.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  backButton: {
    marginRight: 10,
  },
  pricingTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  plansContainer: {
    paddingHorizontal: width * 0.05,
    alignItems: "center",
  },
  planCard: {
    width: width * 0.85,
    height: height * 0.72,
    marginRight: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: "hidden",
  },
  popularHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  popularHeaderText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  planName: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 35,
  },
  priceContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  oldPrice: {
    fontSize: 18,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  currentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 5,
  },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  planPrice: {
    fontSize: 42,
    fontWeight: "bold",
  },
  planDuration: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
  },
  planUsers: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 8,
  },
  tagline: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 20,
    lineHeight: 20,
  },
  featureList: {
    marginTop: 30,
    gap: 15,
    paddingBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
});

export default MembershipScreen;
