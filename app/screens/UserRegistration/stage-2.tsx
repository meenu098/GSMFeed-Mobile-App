import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../../navigation/FooterLinks";

export default function UserRegistrationScreen1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground style={styles.background}>
      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Title */}
        <Image
          source={require("../../../assets/common/logo-dark.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Registration</Text>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              placeholder="eg: 01/01/1990"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Country */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              placeholder="eg: USA"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Company */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company</Text>
            <TextInput
              placeholder="eg: XYZ Co"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Position */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Position</Text>
            <TextInput
              placeholder="eg: Manager"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.backButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => router.push("../Registration/stage-5")}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Links */}
        <FooterLinks />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 15,
    paddingVertical: 25,
    paddingHorizontal: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000",
  },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: "#ccc",
  },
  nextButton: {
    backgroundColor: "#007bff",
  },
  backButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottomLinks: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 30,
  },
  bottomLink: {
    color: "#ccc",
    fontSize: 12,
  },
});
