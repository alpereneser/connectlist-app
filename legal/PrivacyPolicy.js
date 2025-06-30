import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

export const PrivacyPolicyContent = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to ConnectList ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ConnectList (the "Service"). Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        
        <Text style={styles.subsectionTitle}>2.1 Personal Information</Text>
        <Text style={styles.paragraph}>
          We collect personal information that you voluntarily provide to us when you:
          {'\n'}• Register for an account
          {'\n'}• Create your profile
          {'\n'}• Create and share lists
          {'\n'}• Communicate with other users
          {'\n'}• Contact us for support
        </Text>
        
        <Text style={styles.paragraph}>
          This information may include:
          {'\n'}• Email address
          {'\n'}• Username
          {'\n'}• Full name
          {'\n'}• Profile picture
          {'\n'}• Bio and other profile information
          {'\n'}• Content you create (lists, comments, messages)
        </Text>

        <Text style={styles.subsectionTitle}>2.2 Usage Information</Text>
        <Text style={styles.paragraph}>
          We automatically collect certain information when you use our Service:
          {'\n'}• Device information (device type, operating system, unique device identifiers)
          {'\n'}• Usage patterns and preferences
          {'\n'}• Log data (IP address, access times, app features used)
          {'\n'}• Location data (with your permission)
        </Text>

        <Text style={styles.subsectionTitle}>2.3 Third-Party Information</Text>
        <Text style={styles.paragraph}>
          We may collect information from third-party services you connect to our app:
          {'\n'}• Social media profiles (if you choose to connect them)
          {'\n'}• External content databases (TMDB, Google Books, etc.)
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
          {'\n'}• Provide, operate, and maintain our Service
          {'\n'}• Improve, personalize, and expand our Service
          {'\n'}• Understand and analyze how you use our Service
          {'\n'}• Develop new products, services, features, and functionality
          {'\n'}• Communicate with you for customer service and support
          {'\n'}• Send you updates, security alerts, and administrative messages
          {'\n'}• Prevent fraud and ensure security
          {'\n'}• Comply with legal obligations
        </Text>

        <Text style={styles.sectionTitle}>4. Information Sharing and Disclosure</Text>
        
        <Text style={styles.subsectionTitle}>4.1 Public Information</Text>
        <Text style={styles.paragraph}>
          Information you choose to make public (such as public lists and profile information) will be visible to other users of the Service.
        </Text>

        <Text style={styles.subsectionTitle}>4.2 Service Providers</Text>
        <Text style={styles.paragraph}>
          We may share your information with third-party service providers who perform services on our behalf:
          {'\n'}• Cloud hosting providers (Supabase)
          {'\n'}• Analytics providers
          {'\n'}• Content delivery networks
          {'\n'}• Push notification services
        </Text>

        <Text style={styles.subsectionTitle}>4.3 Legal Requirements</Text>
        <Text style={styles.paragraph}>
          We may disclose your information if required to do so by law or in response to valid requests by public authorities.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>6. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete your personal information, though some information may remain in backup systems for a limited time.
        </Text>

        <Text style={styles.sectionTitle}>7. Your Privacy Rights</Text>
        <Text style={styles.paragraph}>
          Depending on your location, you may have certain rights regarding your personal information:
          {'\n'}• Access: Request access to your personal information
          {'\n'}• Rectification: Request correction of inaccurate information
          {'\n'}• Deletion: Request deletion of your personal information
          {'\n'}• Portability: Request a copy of your data in a portable format
          {'\n'}• Objection: Object to certain processing of your information
          {'\n'}• Restriction: Request restriction of processing
        </Text>

        <Text style={styles.paragraph}>
          To exercise these rights, please contact us using the information provided below.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe we have collected information from your child, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>10. Third-Party Links</Text>
        <Text style={styles.paragraph}>
          Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>11. Push Notifications</Text>
        <Text style={styles.paragraph}>
          We may send you push notifications. You can disable these notifications at any time through your device settings or app preferences.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us:
          {'\n'}• Email: privacy@connectlist.app
          {'\n'}• Address: [Your Company Address]
        </Text>

        <Text style={styles.sectionTitle}>14. GDPR Compliance (EU Users)</Text>
        <Text style={styles.paragraph}>
          If you are in the European Union, we process your personal information based on the following legal bases:
          {'\n'}• Consent: When you provide explicit consent
          {'\n'}• Contract: To fulfill our contract with you
          {'\n'}• Legitimate interests: For our business operations
          {'\n'}• Legal obligation: To comply with legal requirements
        </Text>

        <Text style={styles.sectionTitle}>15. CCPA Compliance (California Users)</Text>
        <Text style={styles.paragraph}>
          If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
          {'\n'}• Right to know what personal information is collected
          {'\n'}• Right to delete personal information
          {'\n'}• Right to opt-out of the sale of personal information
          {'\n'}• Right to non-discrimination for exercising your rights
        </Text>
        
        <Text style={styles.paragraph}>
          We do not sell personal information to third parties.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify',
  },
});

export default PrivacyPolicyContent;