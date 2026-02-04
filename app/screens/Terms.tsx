import { useRouter } from "expo-router";
import {
  Linking,
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

const Terms = () => {
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
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Terms & Conditions
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
          // paddingTop: insets.top + 40, // Enough room for the close button and text
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          1. Entity Overview
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          These Terms and Conditions (hereinafter referred to as “rules”) set
          forth the terms and conditions that govern your use of the gsmfeed.com
          website. This document serves as an agreement between you, the user
          (“Member”), and gsmfeed.com (“gsmfeed”). A “Member” is defined as any
          individual or entity that accesses the site for any purpose,
          regardless of whether the Member has registered with gsmfeed.com or is
          a paying customer for a specific service provided by gsmfeed.com.By
          accessing or using the site, you agree to be bound by these rules.
          These rules apply to all activities conducted on the site, including
          but not limited to browsing, interacting with other Members, posting
          content, and conducting transactions. These rules will also apply to
          any future upgrades, modifications, additions, or changes to the site.
          If you do not agree to these terms, you must refrain from using the
          site. These rules are applicable to all Members without exception.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          In the event of any conflict or inconsistency between these rules and
          any other applicable terms and conditions, the conflict will be
          resolved in favor of gsmfeed.com and/or its affiliates, unless
          otherwise expressly provided. gsmfeed.com reserves the right to
          modify, amend, or update these rules at any time by posting the
          revised version on the site. Such modifications will become effective
          immediately upon posting. Your continued use of the site after any
          such changes are posted constitutes your acceptance of the revised
          terms. These rules may not be modified in any other way unless done so
          in writing by an authorized officer of gsmfeed.com.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          2. Posting Information by Members
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Only registered Members are permitted to post information on the site
          using the self-help submit and edit tools provided by gsmfeed.com.
          When you post content on the site, you represent and warrant that all
          information provided is accurate, current, and complete. You also
          agree to update such information as necessary to ensure its accuracy
          and completeness. With a member mean both, paid or free membership. By
          posting content on the site, you grant gsmfeed.com an irrevocable,
          perpetual, worldwide, royalty-free, sublicensable license to display,
          use, distribute, reproduce, and modify the content in accordance with
          the purposes set forth in these rules.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          This license extends to any and all media now known or developed in
          the future and includes the right to exercise copyright, publicity,
          and database rights in such content. You represent and warrant that
          you have obtained all necessary third-party licenses, permissions, and
          approvals for any content you post on the site, including but not
          limited to copyrighted materials, trademarks, trade secrets, patents,
          and other proprietary rights. This includes obtaining permissions from
          individuals whose personal data or likenesses are included in your
          content.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          The content you post on the site must not:
        </Text>
        <View style={[styles.list]}>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Contain false, misleading, or fraudulent information
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Promote illegal activities or the sale of counterfeit, stolen, or
            prohibited items.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Misrepresent your identity or affiliation with any person or
            entity, or impersonate others.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Contain defamatory, libelous, harassing, or obscene material, or
            promote discrimination based on race, gender, religion, nationality,
            disability, sexual orientation, or age.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Contain unauthorized advertising, spamming, phishing schemes, or
            any form of malicious software or code.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Compete with gsmfeed.com by soliciting business that conflicts
            with the interests of gsmfeed.com.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Link to or describe goods or services that are prohibited under
            these rules.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Create any liability for gsmfeed.com or its affiliates.
          </Text>
        </View>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com reserves the right to remove any content that it deems to
          be in violation of these rules, unlawful, or otherwise inappropriate.
          Additionally, gsmfeed.com reserves the right to cooperate fully with
          government authorities, private investigators, and/or third parties in
          the investigation of any suspected criminal or civil wrongdoing. This
          cooperation may include disclosing a Member&apos;s identity and
          contact information if requested by a government or law enforcement
          body, an injured third party, or as a result of a subpoena or other
          legal process. gsmfeed.com shall not be liable for any damages
          resulting from such disclosures, and you agree not to bring any action
          or claim against gsmfeed.com for such disclosures.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          3. Transactions Between Members
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com provides a digital platform that facilitates the exchange
          of information between buyers and suppliers of products and services.
          While gsmfeed.com offers tools and resources to assist in these
          transactions, it does not act as an agent, representative, or
          intermediary for either the buyer or the seller. gsmfeed.com does not
          participate in the negotiation, execution, or fulfillment of any
          transactions conducted through the site, and it does not charge
          commissions on completed transactions.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Because gsmfeed.com does not have control over the transactions that
          occur between Members, it is not responsible for the quality, safety,
          legality, or availability of the products or services offered on the
          site. Similarly, gsmfeed.com does not guarantee that suppliers will be
          able to complete sales or that buyers will be able to complete
          purchases. Members are solely responsible for evaluating the
          qualifications and credibility of other Members with whom they conduct
          transactions.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members should be aware that there are inherent risks associated with
          conducting transactions online, particularly when dealing with parties
          whose identities cannot be easily verified. These risks include, but
          are not limited to, the following:
        </Text>
        <View style={styles.list}>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Misrepresentation of products and services, leading to
            transactions that do not meet the buyer&apos;s expectations.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Fraudulent schemes designed to deceive buyers or sellers.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Unsatisfactory quality of goods or services, including defects,
            nonconformity with specifications, or failure to meet advertised
            standards.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Delays, defaults, or failures in delivery or payment.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Unforeseen costs, such as shipping, taxes, duties, or handling
            fees, that may arise after a transaction is initiated.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Breach of warranty or breach of contract, leading to disputes
            between the parties.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Transportation accidents or damage to goods during shipment.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • The possibility that the manufacture, importation, export,
            distribution, offer, display, purchase, sale, or use of products or
            services offered or displayed on the site may violate or may be
            alleged to violate third-party rights, such as intellectual property
            rights or privacy rights.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Create any liability for gsmfeed.com or its affiliates.
          </Text>
        </View>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          In the event of a dispute between Members, gsmfeed.com encourages the
          parties to resolve the matter amicably and in good faith. However,
          Members agree that they will not hold gsmfeed.com liable for any
          damages, losses, or expenses arising from such disputes. Members also
          agree to release and indemnify gsmfeed.com (and its agents,
          affiliates, directors, officers, and employees) from all claims,
          demands, actions, proceedings, costs, expenses, and damages of any
          kind arising out of or in connection with any transaction or attempted
          transaction conducted through the site.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          4. General Membership Terms
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          To become a Registered Member of gsmfeed.com, you are required to
          complete an online registration form by providing accurate and
          complete information, including your name, address, telephone number,
          email address, and relevant business details. If you wish to upgrade
          to a Verified Member status, we may request biometric data and
          references from your industry. If you are registering on behalf of a
          business entity, you represent that (a) you have the authority to bind
          the entity to these rules, (b) the address you provide is the
          principal place of business for the entity, and (c) all other
          information provided during the registration process is true,
          accurate, and complete. For the purposes of these rules, a branch or
          representative office is not considered a separate entity, and its
          principal place of business will be deemed to be that of its head
          office.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          As a Registered Member, you will be provided with an account
          (&quot;Account&quot;) that allows you to access certain features and
          services on the site. You are responsible for maintaining the
          confidentiality of your account credentials, including your username,
          password, and any other information related to your account. You are
          also responsible for all activities that occur under your account,
          whether or not authorized by you.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          By registering, you consent to the inclusion of your personal and
          business data in our database, and you authorize gsmfeed.com to share
          this information with other Members as necessary to facilitate
          transactions and interactions on the site. You acknowledge that
          gsmfeed.com may use your data to improve its services, analyze trends,
          and generate reports. However, gsmfeed.com is committed to protecting
          your privacy and will handle your data in accordance with its Privacy
          Policy.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com reserves the right to suspend or terminate your account at
          any time, with or without notice, for any reason, including but not
          limited to violations of these rules, inactivity, or security
          concerns. Upon termination of your account, you will no longer have
          access to the site or any services provided through the site. However,
          termination of your account does not relieve you of any obligations or
          liabilities that you may have incurred prior to termination.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members may not sell, transfer, or assign their accounts, email IDs,
          data, or passwords to any third party without the prior written
          consent of gsmfeed.com. Any unauthorized sale, transfer, or assignment
          of an account will result in the immediate suspension or termination
          of the account.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com reserves the right to refuse registration and deny the
          issuance of an account or associated credentials to any individual or
          entity for any reason, at its sole discretion. gsmfeed.com may also
          impose additional conditions or requirements for registration, such as
          identity verification or credit checks, as it deems necessary.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          5. Acceptance of Terms
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Access to the gsmfeed.com site and its features is provided to all
          Members free of charge. However, certain areas or features of the site
          may require Paid Access, which is available only to paying Members or
          Members who undergo a specific registration process. gsmfeed.com
          reserves the right to restrict or deny Paid Access to any Member for
          any reason, in order to protect its interests and the interests of its
          community.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          All Members are required to accept and comply with gsmfeed.com&apos;s
          Privacy Policy, which is available on the Privacy Policy page. The
          Privacy Policy outlines how gsmfeed.com collects, uses, and protects
          your personal information. By using the site, you consent to the
          collection and use of your information in accordance with the Privacy
          Policy.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members are permitted to use the site solely for their own personal or
          internal business purposes. You agree not to copy, reproduce, or
          download any content, text, images, video clips, directories, files,
          databases, or listings available on or through the site (&quot;gsmfeed
          Content&quot;) for the purpose of reselling, redistributing, mass
          mailing (via emails, wireless text messages, physical mail, or
          otherwise), operating a competing business, or otherwise commercially
          exploiting gsmfeed Content. Systematic retrieval of gsmfeed Content
          from the site to create or compile, directly or indirectly, a
          collection, compilation, database, or directory (whether through the
          use of robots, spiders, automatic devices, or manual processes)
          without written permission from gsmfeed.com is strictly prohibited.
        </Text>

        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com may provide links to third-party websites, products, or
          services (&quot;Third Party Content&quot;). These links are provided
          for your convenience, and gsmfeed.com does not endorse or assume any
          responsibility for the content, products, or services offered by third
          parties. Members are encouraged to review the terms and conditions and
          privacy policies of any third-party websites they visit through the
          links provided on gsmfeed.com. gsmfeed.com is not responsible for the
          accuracy, propriety, lawfulness, or truthfulness of any Third Party
          Content, and shall not be liable for any damages or losses incurred as
          a result of your use of or reliance on such content.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com reserves the right to limit, deny, or create different
          access to the site and its features for different Members, or to
          change, modify, or introduce new features without prior notice.
          Members acknowledge that the inability to use the site fully or
          partially for any reason may have adverse effects on their business,
          and gsmfeed.com shall not be liable for any such issues.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members must not engage in any activities that compromise the
          security, integrity, or performance of gsmfeed.com&apos;s systems or
          networks. This includes, but is not limited to, attempts to gain
          unauthorized access, distribute malicious software, or launch attacks
          on the site.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          As a condition of using gsmfeed.com, you agree not to use the site or
          its services to infringe upon the intellectual property rights or
          other legal rights of others. gsmfeed.com reserves the right to
          terminate the accounts of Members who are repeat infringers of
          copyrights, trademarks, patents, or other intellectual property
          rights. gsmfeed.com may also terminate your account if it believes
          that your conduct is harmful to the interests of gsmfeed.com, its
          affiliates, or other Members, or for any other reason, at its sole
          discretion.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          6. Limitation of Liability
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          The features and services offered on the gsmfeed.com site are provided
          on an &quot;as is&quot; and &quot;as available&quot; basis, without
          any warranties or conditions of any kind. gsmfeed.com expressly
          disclaims all warranties, whether express, implied, statutory, or
          otherwise, including but not limited to warranties of merchantability,
          fitness for a particular purpose, title, non-infringement, and
          accuracy.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com makes no representations or warranties about the validity,
          accuracy, correctness, reliability, quality, stability, completeness,
          or currency of any information provided on or through the site.
          gsmfeed.com does not warrant that the manufacture, importation,
          exportation, distribution, offer, display, purchase, sale, or use of
          products or services offered or displayed on the site will not violate
          any third-party rights. Furthermore, gsmfeed.com makes no
          representations or warranties of any kind regarding any product or
          service offered or displayed on the site.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Any material or information downloaded or otherwise obtained through
          the site is accessed at your own discretion and risk. You are solely
          responsible for any damage to your computer system or loss of data
          that results from the download of any such material. gsmfeed.com shall
          not be liable for any loss or damage resulting from the use of or
          reliance on information obtained through the site.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Under no circumstances shall gsmfeed.com be held liable for any delay,
          failure, or disruption of the content or services delivered through
          the site, whether caused by natural disasters, technical issues,
          network outages, or other factors beyond gsmfeed.com&apos;s control.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members agree to indemnify and hold gsmfeed.com, its affiliates,
          directors, officers, employees, and agents harmless from any and all
          losses, claims, liabilities, damages, costs, and expenses (including
          legal fees on a full indemnity basis) arising from or in connection
          with their use of the site, including but not limited to the display
          of their content on the site, their breach of these rules, or their
          violation of any third-party rights.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com shall not be liable for any special, indirect, incidental,
          punitive, or consequential damages, or any damages whatsoever
          (including but not limited to damages for loss of profits, business
          interruption, loss of information, or any other pecuniary loss)
          arising out of or in connection with:
        </Text>
        <View style={styles.list}>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • The use or inability to use the site.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Any defect in goods, services, samples, or information purchased
            or obtained from a Member or a third-party service provider through
            the site.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Violation of third-party rights or claims or demands that a
            Member&apos;s manufacture, importation, export, distribution, offer,
            display, purchase, sale, and/or use of products or services offered
            or displayed on the site may violate or may be asserted to violate
            third-party rights.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Unauthorized access by third parties to a Member&apos;s data or
            private information.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Statements or conduct of any Member on the site.
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Any matters relating to Paid Access or premium services, however
            arising, including negligence.
          </Text>
        </View>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Notwithstanding any of the foregoing provisions, gsmfeed.com, its
          employees, agents, affiliates, representatives, or anyone acting on
          its behalf shall not be liable for any actions taken in good faith in
          connection with the use of the site. Members acknowledge and agree
          that they must prove actual damages in order to obtain any remedy or
          relief against gsmfeed.com. All claims arising from the use of the
          site or the gsmfeed.com service must be filed within one (1) year from
          the date the cause of action arose.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          7. Intellectual Property Rights
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed® is a registered trademark. Unauthorized use, reproduction, or
          misrepresentation of our trademark is strictly prohibited and may
          result in legal action. Please respect our intellectual property
          rights.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com is the sole owner or lawful licensee of all rights to the
          site and the gsmfeed Content. The site and gsmfeed Content embody
          trade secrets and intellectual property rights that are protected
          under worldwide copyright, trademark, and other intellectual property
          laws. All title, ownership, and intellectual property rights in the
          site and gsmfeed Content shall remain with gsmfeed.com, its
          affiliates, or licensors of the gsmfeed Content, as applicable. All
          rights not expressly claimed under these rules or by gsmfeed.com are
          hereby reserved.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          The &quot;gsmfeed&quot; name, logo, and related icons and logos are
          registered trademarks or service marks of gsmfeed FZCO (Freezone
          Company) in various jurisdictions and are protected under applicable
          copyright, trademark, and other proprietary rights laws. The
          unauthorized copying, modification, use, or publication of these marks
          is strictly prohibited. You agree not to use any gsmfeed trademarks,
          logos, or other proprietary materials without prior written permission
          from gsmfeed.com.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members are granted a limited, non-exclusive, non-transferable,
          revocable license to access and use the site and gsmfeed Content for
          their own personal or internal business purposes, provided that they
          comply with these rules and all applicable laws. Members agree not to
          modify, create derivative works from, or otherwise exploit gsmfeed
          Content for commercial purposes without the express written consent of
          gsmfeed.com.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com reserves the right to enforce its intellectual property
          rights to the fullest extent of the law, including pursuing legal
          action against Members who infringe on its rights. Members who engage
          in unauthorized use of gsmfeed intellectual property may be subject to
          account suspension, termination, and/or legal action.
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          8. Notices
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          All notices or demands to or upon a Member shall be effective if
          delivered personally, sent by courier, certified email or posted on an
          area of the site that is publicly accessible without a charge. Notices
          to a Member shall be deemed to be received by such Member if and when:
        </Text>
        <View style={styles.list}>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • gsmfeed.com is able to demonstrate that communication, whether in
            physical or electronic form, has been sent to such Member, or
          </Text>
          <Text style={[styles.listItem, { color: theme.subText }]}>
            • Immediately upon gsmfeed.com&apos;s posting such notice on an area
            of the site that is publicly accessible without charge.
          </Text>
        </View>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          Members agree to promptly notify gsmfeed.com of any changes to their
          contact information, including email address, telephone number, or
          mailing address. gsmfeed.com shall not be responsible for any delays
          or failures in communication resulting from a Member&apos;s failure to
          update their contact information.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com may also provide notices to Members by means of a general
          notice on the site, through the Member&apos;s account interface, or by
          other reasonable means as determined by gsmfeed.com. Members agree
          that gsmfeed.com&apos;s provision of notice by any of these methods
          shall constitute effective notice under these rules.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          9. General
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          These rules, along with any additional agreements that may be entered
          into between the Member and gsmfeed.com, constitute the entire
          agreement between gsmfeed.com and the Member with respect to the use
          of the site. These rules supersede any prior written or oral
          agreements or understandings between gsmfeed.com and the Member
          regarding the use of the site.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          gsmfeed.com and the Member are independent contractors, and no agency,
          partnership, joint venture, employee-employer, or
          franchiser-franchisee relationship is intended or created by these
          rules. Neither party shall have the authority to bind the other party
          or act on behalf of the other party in any capacity, except as
          expressly authorized by these rules or any other written agreement.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          If any provision of these rules is found to be invalid, illegal, or
          unenforceable, the remaining provisions shall continue in full force
          and effect. The invalid, illegal, or unenforceable provision shall be
          modified or limited to the extent necessary to render it valid, legal,
          and enforceable, consistent with the intent of the parties as
          reflected in.
        </Text>
        <Text style={[styles.paragraph, { color: theme.subText }]}>
          These Terms of Use were originally written in English (US). In the
          event of any conflict between a translated version and the English
          version, the English version will prevail. We appreciate your
          acceptance of these terms and conditions. If you have any questions
          regarding these terms, please contact us at:
        </Text>
        <Text
          style={[styles.paragraph, styles.link]}
          onPress={() => Linking.openURL("mailto:info@gsmfeed.com")}
        >
          info@gsmfeed.com.
        </Text>

        <Text style={styles.footerText}>
          © {new Date().getFullYear()} gsmfeed.com. All rights reserved.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Terms;

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
  list: {
    marginVertical: 8,
    paddingLeft: 15,
  },
  listItem: {
    fontSize: 15,
    marginBottom: 4,
    textAlign: "justify",
  },
  link: {
    color: "#3B82F6",
    textDecorationLine: "underline",
  },
  footerText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 30,
  },
  touchableArea: {
    padding: 10,
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
