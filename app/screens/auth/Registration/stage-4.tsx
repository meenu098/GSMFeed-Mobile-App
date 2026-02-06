// import { Ionicons } from "@expo/vector-icons";
// import { countries, getEmojiFlag, TCountryCode } from "countries-list";
// import { LinearGradient } from "expo-linear-gradient";
// import * as Localization from "expo-localization";
// import { useRouter } from "expo-router";
// import React, { useMemo, useRef, useState } from "react";
// import {
//   Alert,
//   Dimensions,
//   FlatList,
//   Image,
//   Modal,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Recaptcha from "react-native-recaptcha-that-works";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import FooterLinks from "../../../../components/FooterLinks";
// import { useTheme } from "../../../../shared/themeContext";

// // Define the Ref type locally for absolute compatibility
// interface RecaptchaRef {
//   open(): void;
//   close(): void;
// }

// const numberOnlyWithNoStartingZero = (value: string) => {
//   const cleaned = value.replace(/[^0-9]/g, "");
//   if (cleaned.startsWith("0")) {
//     return cleaned.substring(1);
//   }
//   return cleaned;
// };

// const { height } = Dimensions.get("window");

// export default function RegistrationScreen4() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { isDark } = useTheme();
//   const recaptcha = useRef<RecaptchaRef>(null);

//   // --- State Management ---
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [captchaToken, setCaptchaToken] = useState<string | null>(null);

//   // Detect Region
//   const deviceRegion = (Localization.getLocales()[0]?.regionCode ||
//     "AE") as TCountryCode;
//   const [selectedCountry, setSelectedCountry] =
//     useState<TCountryCode>(deviceRegion);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const countryData = countries[selectedCountry] || countries["AE"];

//   const countryList = useMemo(() => {
//     return Object.entries(countries)
//       .map(([code, data]) => ({
//         code: code as TCountryCode,
//         name: data.name,
//         emoji: getEmojiFlag(code as TCountryCode),
//         phone: data.phone[0],
//       }))
//       .filter(
//         (c) =>
//           c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           c.code.toLowerCase().includes(searchQuery.toLowerCase()),
//       );
//   }, [searchQuery]);

//   const theme = {
//     colors: {
//       primary: "#3B66F5",
//       background: isDark ? "#020205" : "#F8FAFC",
//       text: isDark ? "#FFFFFF" : "#0F172A",
//       subText: isDark ? "#94A3B8" : "#64748B",
//       cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
//       cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
//       inputBg: isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9",
//       gradient: isDark
//         ? ["#1A0B2E", "#020205", "#050A1A"]
//         : ["#F8FAFC", "#E2E8F0", "#FFFFFF"],
//     },
//   };

//   const handlePhoneChange = (text: string) => {
//     setPhone(numberOnlyWithNoStartingZero(text));
//   };

//   // Logic: Valid only if all strings have content and captchaToken exists
//   const canGoNext =
//     firstName.trim().length > 0 &&
//     lastName.trim().length > 0 &&
//     email.trim().length > 0 &&
//     phone.trim().length > 0 &&
//     captchaToken !== null;

//   const handleNext = () => {
//     if (canGoNext) {
//       router.push("/screens/auth/Registration/stage-5");
//     } else if (!captchaToken) {
//       Alert.alert(
//         "Verification Required",
//         "Please complete the reCAPTCHA verification.",
//       );
//     } else {
//       Alert.alert(
//         "Missing Information",
//         "Please fill in all the required fields.",
//       );
//     }
//   };

//   return (
//     <View
//       style={[styles.container, { backgroundColor: theme.colors.background }]}
//     >
//       <StatusBar
//         barStyle={isDark ? "light-content" : "dark-content"}
//         translucent
//         backgroundColor="transparent"
//       />
//       <LinearGradient
//         colors={theme.colors.gradient as any}
//         style={StyleSheet.absoluteFillObject}
//       />

//       <ScrollView
//         contentContainerStyle={[
//           styles.scrollContent,
//           { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
//         ]}
//         keyboardShouldPersistTaps="handled"
//       >
//         <Image
//           source={
//             isDark
//               ? require("../../../../assets/common/logo-dark.png")
//               : require("../../../../assets/common/logo.png")
//           }
//           style={styles.logo}
//           resizeMode="contain"
//         />

//         <View style={styles.textHeader}>
//           <Text style={[styles.title, { color: theme.colors.text }]}>
//             Representative Info
//           </Text>
//           <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
//             Step 4: Contact Person Details
//           </Text>
//         </View>

//         <View
//           style={[
//             styles.card,
//             {
//               backgroundColor: theme.colors.cardBg,
//               borderColor: theme.colors.cardBorder,
//             },
//           ]}
//         >
//           <View style={styles.row}>
//             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
//               <Text style={[styles.label, { color: theme.colors.text }]}>
//                 First Name
//               </Text>
//               <TextInput
//                 placeholder="eg: John"
//                 placeholderTextColor={theme.colors.subText}
//                 style={[
//                   styles.input,
//                   {
//                     backgroundColor: theme.colors.inputBg,
//                     color: theme.colors.text,
//                     borderColor: theme.colors.cardBorder,
//                   },
//                 ]}
//                 value={firstName}
//                 onChangeText={setFirstName}
//               />
//             </View>
//             <View style={[styles.inputGroup, { flex: 1 }]}>
//               <Text style={[styles.label, { color: theme.colors.text }]}>
//                 Last Name
//               </Text>
//               <TextInput
//                 placeholder="eg: Doe"
//                 placeholderTextColor={theme.colors.subText}
//                 style={[
//                   styles.input,
//                   {
//                     backgroundColor: theme.colors.inputBg,
//                     color: theme.colors.text,
//                     borderColor: theme.colors.cardBorder,
//                   },
//                 ]}
//                 value={lastName}
//                 onChangeText={setLastName}
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, { color: theme.colors.text }]}>
//               Your Company Email
//             </Text>
//             <TextInput
//               placeholder="eg: example@company.com"
//               placeholderTextColor={theme.colors.subText}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               style={[
//                 styles.input,
//                 {
//                   backgroundColor: theme.colors.inputBg,
//                   color: theme.colors.text,
//                   borderColor: theme.colors.cardBorder,
//                 },
//               ]}
//               value={email}
//               onChangeText={setEmail}
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, { color: theme.colors.text }]}>
//               Your Phone Number
//             </Text>
//             <View style={styles.phoneRow}>
//               <TouchableOpacity
//                 style={[
//                   styles.flagBox,
//                   {
//                     backgroundColor: theme.colors.inputBg,
//                     borderColor: theme.colors.cardBorder,
//                   },
//                 ]}
//                 onPress={() => setIsModalVisible(true)}
//               >
//                 <Text style={styles.flagEmoji}>
//                   {getEmojiFlag(selectedCountry)}
//                 </Text>
//                 <Text style={[styles.prefix, { color: theme.colors.text }]}>
//                   +{countryData.phone[0]}
//                 </Text>
//               </TouchableOpacity>
//               <TextInput
//                 placeholder="501234567"
//                 placeholderTextColor={theme.colors.subText}
//                 keyboardType="phone-pad"
//                 maxLength={15}
//                 style={[
//                   styles.input,
//                   {
//                     flex: 1,
//                     backgroundColor: theme.colors.inputBg,
//                     color: theme.colors.text,
//                     borderColor: theme.colors.cardBorder,
//                   },
//                 ]}
//                 value={phone}
//                 onChangeText={handlePhoneChange}
//               />
//             </View>
//           </View>

//           <View style={styles.captchaSection}>
//             <TouchableOpacity
//               style={[
//                 styles.captchaButton,
//                 {
//                   borderColor: captchaToken
//                     ? "#10B981"
//                     : theme.colors.cardBorder,
//                 },
//               ]}
//               onPress={() => recaptcha.current?.open()}
//             >
//               <View style={styles.captchaLeft}>
//                 <Ionicons
//                   name={captchaToken ? "checkmark-circle" : "square-outline"}
//                   size={24}
//                   color={captchaToken ? "#10B981" : theme.colors.subText}
//                 />
//                 <Text
//                   style={[styles.captchaText, { color: theme.colors.text }]}
//                 >
//                   {captchaToken ? "Verification Successful" : "I'm not a robot"}
//                 </Text>
//               </View>
//               {/* Optional: Add recaptcha icon here */}
//             </TouchableOpacity>
//           </View>

//           <View style={styles.navButtons}>
//             <TouchableOpacity
//               style={[
//                 styles.navButton,
//                 {
//                   backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
//                 },
//               ]}
//               onPress={() => router.back()}
//             >
//               <Text
//                 style={[styles.backButtonText, { color: theme.colors.text }]}
//               >
//                 Back
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 styles.navButton,
//                 {
//                   backgroundColor: canGoNext ? theme.colors.primary : "#CBD5E1",
//                 },
//               ]}
//               onPress={handleNext}
//               disabled={false} // Leave enabled so handleNext can show an Alert explaining why it's failing
//             >
//               <Text style={styles.nextButtonText}>Next</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//         <FooterLinks />
//       </ScrollView>

//       <Recaptcha
//         ref={recaptcha}
//         siteKey="6LeL7kcqAAAAAEJP8_APZTG7ZMbOzaOBIx1h3j5-"
//         baseUrl="https://app.gsmfeed.com"
//         onVerify={(token) => {
//           setCaptchaToken(token);
//         }}
//         onExpire={() => setCaptchaToken(null)}
//         onError={(error) => console.log("Recaptcha Error:", error)}
//         size="normal"
//       />

//       <Modal visible={isModalVisible} animationType="slide" transparent={true}>
//         <View style={styles.modalOverlay}>
//           <View
//             style={[
//               styles.modalContent,
//               { backgroundColor: theme.colors.background },
//             ]}
//           >
//             <View style={styles.modalHeader}>
//               <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
//                 Select Country
//               </Text>
//               <TouchableOpacity onPress={() => setIsModalVisible(false)}>
//                 <Ionicons name="close" size={24} color={theme.colors.text} />
//               </TouchableOpacity>
//             </View>
//             <TextInput
//               placeholder="Search..."
//               placeholderTextColor={theme.colors.subText}
//               style={[
//                 styles.searchInput,
//                 {
//                   backgroundColor: theme.colors.inputBg,
//                   color: theme.colors.text,
//                 },
//               ]}
//               onChangeText={setSearchQuery}
//               value={searchQuery}
//             />
//             <FlatList
//               data={countryList}
//               keyExtractor={(item) => item.code}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.countryItem}
//                   onPress={() => {
//                     setSelectedCountry(item.code);
//                     setIsModalVisible(false);
//                     setSearchQuery("");
//                   }}
//                 >
//                   <Text style={styles.countryEmoji}>{item.emoji}</Text>
//                   <Text
//                     style={[styles.countryName, { color: theme.colors.text }]}
//                   >
//                     {item.name}
//                   </Text>
//                   <Text
//                     style={[
//                       styles.countryPhone,
//                       { color: theme.colors.subText },
//                     ]}
//                   >
//                     +{item.phone}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   scrollContent: { flexGrow: 1, alignItems: "center", paddingHorizontal: 25 },
//   logo: { width: 120, height: 80, marginTop: 10 },
//   textHeader: { alignItems: "center", marginTop: 20, marginBottom: 30 },
//   title: { fontSize: 26, fontWeight: "800" },
//   subtitle: { fontSize: 14, marginTop: 5 },
//   card: {
//     width: "100%",
//     borderRadius: 24,
//     padding: 24,
//     borderWidth: 1,
//     marginBottom: 30,
//   },
//   row: { flexDirection: "row" },
//   inputGroup: { marginBottom: 20 },
//   label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginLeft: 4 },
//   input: {
//     height: 56,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     fontSize: 15,
//     borderWidth: 1,
//   },
//   phoneRow: { flexDirection: "row", alignItems: "center" },
//   flagBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     height: 56,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     marginRight: 10,
//   },
//   flagEmoji: { fontSize: 20, marginRight: 8 },
//   prefix: { fontSize: 15, fontWeight: "600" },
//   captchaSection: { marginBottom: 20 },
//   captchaButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: 12,
//     borderWidth: 1,
//     borderRadius: 12,
//     backgroundColor: "rgba(0,0,0,0.02)",
//   },
//   captchaLeft: { flexDirection: "row", alignItems: "center" },
//   captchaText: { marginLeft: 12, fontSize: 14, fontWeight: "500" },
//   navButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
//   navButton: {
//     flex: 1,
//     height: 56,
//     borderRadius: 16,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   backButtonText: { fontWeight: "700", fontSize: 16 },
//   nextButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     height: height * 0.7,
//     borderTopLeftRadius: 25,
//     borderTopRightRadius: 25,
//     padding: 20,
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },
//   modalTitle: { fontSize: 18, fontWeight: "bold" },
//   searchInput: {
//     height: 50,
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//   },
//   countryItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 15,
//     borderBottomWidth: 0.5,
//     borderBottomColor: "rgba(150,150,150,0.2)",
//   },
//   countryEmoji: { fontSize: 24, marginRight: 15 },
//   countryName: { flex: 1, fontSize: 16 },
//   countryPhone: { fontSize: 14 },
// });

import { Ionicons } from "@expo/vector-icons";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";
import { LinearGradient } from "expo-linear-gradient";
import * as Localization from "expo-localization";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Recaptcha from "react-native-recaptcha-that-works";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../../../../components/FooterLinks";
import { useTheme } from "../../../../shared/themeContext";

// Interface for the reCAPTCHA ref
interface RecaptchaRef {
  open(): void;
  close(): void;
}

const numberOnlyWithNoStartingZero = (value: string) => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned.startsWith("0") ? cleaned.substring(1) : cleaned;
};

const { height } = Dimensions.get("window");

export default function RegistrationScreen4() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const recaptcha = useRef<RecaptchaRef>(null);

  // --- State Management ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Device Location
  const deviceRegion = (Localization.getLocales()[0]?.regionCode ||
    "AE") as TCountryCode;
  const [selectedCountry, setSelectedCountry] =
    useState<TCountryCode>(deviceRegion);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const countryData = countries[selectedCountry] || countries["AE"];

  const countryList = useMemo(() => {
    return Object.entries(countries)
      .map(([code, data]) => ({
        code: code as TCountryCode,
        name: data.name,
        emoji: getEmojiFlag(code as TCountryCode),
        phone: data.phone[0],
      }))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [searchQuery]);

  const theme = {
    colors: {
      primary: "#3B66F5",
      background: isDark ? "#020205" : "#F8FAFC",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
      cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      inputBg: isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9",
      gradient: isDark
        ? ["#1A0B2E", "#020205", "#050A1A"]
        : ["#F8FAFC", "#E2E8F0", "#FFFFFF"],
    },
  };

  const handlePhoneChange = (text: string) => {
    setPhone(numberOnlyWithNoStartingZero(text));
  };

  const canGoNext =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    captchaToken;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.colors.gradient as any}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={
            isDark
              ? require("../../../../assets/common/logo-dark.png")
              : require("../../../../assets/common/logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.textHeader}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Representative Info
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            Step 4: Verification & Contact
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                First Name
              </Text>
              <TextInput
                placeholder="John"
                placeholderTextColor={theme.colors.subText}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Last Name
              </Text>
              <TextInput
                placeholder="Doe"
                placeholderTextColor={theme.colors.subText}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Your Company Email
            </Text>
            <TextInput
              placeholder="example@company.com"
              placeholderTextColor={theme.colors.subText}
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBg,
                  color: theme.colors.text,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Your Phone Number
            </Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={[
                  styles.flagBox,
                  {
                    backgroundColor: theme.colors.inputBg,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.flagEmoji}>
                  {getEmojiFlag(selectedCountry)}
                </Text>
                <Text style={[styles.prefix, { color: theme.colors.text }]}>
                  +{countryData.phone[0]}
                </Text>
              </TouchableOpacity>
              <TextInput
                placeholder="501234567"
                placeholderTextColor={theme.colors.subText}
                keyboardType="phone-pad"
                maxLength={15}
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                value={phone}
                onChangeText={handlePhoneChange}
              />
            </View>
          </View>

          {/* reCAPTCHA Checkbox UI */}
          <View style={styles.captchaSection}>
            <TouchableOpacity
              style={[
                styles.captchaButton,
                {
                  borderColor: captchaToken
                    ? "#10B981"
                    : theme.colors.cardBorder,
                },
              ]}
              onPress={() => recaptcha.current?.open()}
            >
              <View style={styles.captchaLeft}>
                <Ionicons
                  name={captchaToken ? "checkmark-circle" : "square-outline"}
                  size={24}
                  color={captchaToken ? "#10B981" : theme.colors.subText}
                />
                <Text
                  style={[styles.captchaText, { color: theme.colors.text }]}
                >
                  {captchaToken ? "Verified" : "I'm not a robot"}
                </Text>
              </View>
              <Image
                // source={require("../../../../assets/common/recaptcha-logo.png")}
                style={styles.recaptchaLogo}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                },
              ]}
              onPress={() => router.back()}
            >
              <Text
                style={[styles.backButtonText, { color: theme.colors.text }]}
              >
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: canGoNext ? theme.colors.primary : "#CBD5E1",
                },
              ]}
              onPress={() =>
                canGoNext && router.push("/screens/auth/Registration/stage-5")
              }
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FooterLinks />
      </ScrollView>

      {/* reCAPTCHA Engine */}
      <Recaptcha
        ref={recaptcha}
        siteKey="6LeL7kcqAAAAAEJP8_APZTG7ZMbOzaOBIx1h3j5-"
        baseUrl="https://app.gsmfeed.com" // This must match the domain associated with your key
        onVerify={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        size="normal"
      />

      {/* Country Modal - (Logic simplified for brevity) */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Country
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Search..."
              placeholderTextColor={theme.colors.subText}
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.inputBg,
                  color: theme.colors.text,
                },
              ]}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={countryList}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item.code);
                    setIsModalVisible(false);
                  }}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text
                    style={[styles.countryName, { color: theme.colors.text }]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: "center", paddingHorizontal: 25 },
  logo: { width: 120, height: 80, marginTop: 10 },
  textHeader: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 5 },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 30,
  },
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginLeft: 4 },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  phoneRow: { flexDirection: "row", alignItems: "center" },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  flagEmoji: { fontSize: 20, marginRight: 8 },
  prefix: { fontSize: 15, fontWeight: "600" },
  captchaSection: { marginBottom: 20 },
  captchaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  captchaLeft: { flexDirection: "row", alignItems: "center" },
  captchaText: { marginLeft: 12, fontSize: 14, fontWeight: "500" },
  recaptchaLogo: { width: 30, height: 30, opacity: 0.8 },
  navButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
  navButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: { fontWeight: "700", fontSize: 16 },
  nextButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: height * 0.7,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  searchInput: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  countryEmoji: { fontSize: 24, marginRight: 15 },
  countryName: { flex: 1, fontSize: 16 },
});
