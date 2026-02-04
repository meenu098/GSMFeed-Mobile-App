import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseIcon } from "../../components/icons/icons";
import ScreenWrapper from "../utils/screenWrapper";
import { useTheme } from "../utils/themeContext";

const Privacy = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? "#0B0E14" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    closeIcon: isDark ? "#F8FAFC" : "#1E293B",
  };
  return (
    <ScreenWrapper bg={theme.background}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <StatusBar />
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Privacy policy
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.touchableArea}
          activeOpacity={0.7}
        >
          <CloseIcon
            stroke={theme.closeIcon}
            strokeWidth={2.5}
            width={24}
            height={24}
          />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          // paddingTop: insets.top ,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Introduction
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          At gsmfeed, safeguarding the privacy and protecting the personal and
          financial information of our clients and website visitors is a top
          priority. This Privacy Policy outlines how we collect, use, and
          protect your information. By creating an account or using our website,
          you consent to the collection and use of your personal information as
          detailed in this policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Collection of Personal Information
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We collect information necessary to open your account, facilitate
          business transactions, and ensure the security of your assets and
          privacy. This includes data that helps us understand your needs and
          preferences.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          The information we collect directly from you includes details required
          for communication, such as your name, mailing address, phone number,
          and email address. Additionally, when you open an account, we collect
          demographic information like your birth date, education, and
          occupation. We also assess your trading experience, approximate annual
          income, and net worth to better understand your financial position.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Usage of Personal Information
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We use your personal information solely for purposes that enable us to
          provide high-quality services and security. For example, the
          information you provide helps us verify your identity and contact
          details, set up your trading account, issue account numbers and secure
          passwords, maintain account activity, and communicate with you
          regarding your account. This data also allows us to enhance our
          services, customize your browsing experience, and inform you about
          products, services, or promotions that may be of interest.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Our Affiliates and Partners
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We may share your information with our affiliates when necessary to
          deliver the products or services you’ve requested, or to provide
          opportunities to engage with offerings from our affiliates.
          Additionally, we may partner with other companies to offer
          high-quality products and services that could be valuable to you. To
          ensure these offerings are relevant and beneficial, we may share some
          of your information with our partners and affiliates. The use of your
          personal information by these entities is restricted to the purposes
          identified in our agreements with them.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Non-Affiliated Third Parties
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We do not sell, license, lease, or otherwise disclose your personal
          information to third parties, except as described below.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We reserve the right to disclose your personal information to third
          parties when required by law, such as to regulatory, law enforcement,
          or other government authorities. We may also share your information
          with credit reporting or collection agencies, or as necessary to
          protect our rights or property.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          To enhance our services, we may engage other companies to perform
          certain internal functions, such as account processing, client
          service, or satisfaction surveys. We may also share client information
          from our database with third parties to help us analyze client needs
          and inform clients of relevant product and service offerings. The use
          of this information by third parties is strictly limited to the tasks
          we request and for no other purpose. All third parties with whom we
          share personal information are required to protect it in a manner
          consistent with our standards.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Limitation of Responsibility
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          If you choose to purchase a product or service offered by another
          company, any personal information you provide to that company will no
          longer be covered by our Privacy Policy. We are not responsible for
          the privacy practices or content of sites linked to our website, nor
          do we control the use or protection of information you provide to or
          that is collected by those sites. When linking to a co-branded or
          third-party website, you may be asked to provide registration or other
          information. Please be aware that this information is being provided
          to a third party, and we encourage you to review their privacy policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Opting Out of Non-Public Personal Information Disclosures
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          You have the right to opt out of having your non-public personal
          information shared with certain non-affiliated third parties. To do
          so, please contact our client service representatives. An opt-out
          election by one account holder of a joint account will apply to all
          account holders of that account. Each account you hold with us
          requires a separate opt-out election.
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Use of Cookies
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We use cookies to help secure your trading activities and enhance the
          performance of our website. Cookies are small text files sent from our
          web server to your computer, which do not contain personal or account
          information. They enable the site to recognize that a page request
          comes from someone who has already logged in.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We may share website usage information with reputable advertising
          companies to target our internet banner advertisements on this and
          other sites. For this purpose, pixel tags (also known as clear gifs or
          web beacons) may be used to track the pages you visit. The information
          collected via these pixel tags is not personally identifiable.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          To improve our website, we may use a third party to track and analyze
          usage and statistical volume information. This third party may use
          cookies to monitor behavior and may set cookies on our behalf. These
          cookies do not contain any personally identifiable information.
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Communications
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Unless specified otherwise for a particular service, any
          communications or materials you send through our services, including
          information, data, questions, comments, or suggestions (your
          &quot;Communications&quot;), will be treated as non-proprietary and
          non-confidential.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          By accepting this policy, you grant us a license to use your
          Communications in any manner we see fit, either on the website or
          elsewhere, without liability or obligation to you. We may freely use
          any ideas, concepts, know-how, or techniques contained in your
          Communications for any purpose, including but not limited to
          developing and marketing products.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          While we are entitled to review or retain your Communications, we are
          not obligated to do so. We may monitor your Communications to evaluate
          service quality, ensure compliance with this policy, enhance website
          security, or for other reasons. You agree that such monitoring does
          not entitle you to any cause of action or other rights regarding our
          monitoring methods. We will not be liable for any costs, damages, or
          expenses incurred by you as a result of our monitoring activities.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Changes to This Privacy Policy
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          We may update this Privacy Policy from time to time. If significant
          changes are made, the revised policy will be posted on our website,
          and a notice will be displayed to inform you of these changes. You
          agree that posting the revised policy on the website constitutes
          actual notice to you. Any disputes over our Privacy Policy are subject
          to this notice and our Customer Agreement. We encourage you to
          periodically review this policy to stay informed about how we collect,
          use, and disclose your information. If you have any questions that are
          not addressed here, please contact our Client Services team.
        </Text>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} gsmfeed.com. All rights reserved.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Privacy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 15,
    textAlign: "justify",
  },
  footerText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  touchableArea: {
    padding: 5,
    backgroundColor: "transparent", // Subtle glass effect
    borderRadius: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "left",
  },
});
