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
import FooterLinks from "../../../../components/FooterLinks";

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
        <Image
          source={require("../../../../assets/common/logo-dark.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Registration</Text>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              placeholder="eg: XYZ Co"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              placeholder="eg: XYZ Co"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.flagBox}>
                <Image
                  source={{ uri: "https://flagcdn.com/w20/ae.png" }}
                  style={styles.flag}
                />
                <Text style={styles.prefix}>+971</Text>
              </View>
              <TextInput
                placeholder="eg: 561234567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                style={[styles.input, { flex: 1 }]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="eg: info@xyz.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={() => router.push("../Registration/stage-1")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/screens/auth/UserRegistration/stage-2")}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>

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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  flag: {
    width: 20,
    height: 14,
    marginRight: 5,
  },
  prefix: {
    color: "#333",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
  avButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#e0e0e0",
    marginRight: 10,
  },
  backButtonText: { color: "#333", fontWeight: "600", fontSize: 16 },
});
