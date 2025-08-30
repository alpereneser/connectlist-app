import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const TermsOfServiceScreen = ({ onBackPress, onTabPress }) => {
  return (
    <ScreenLayout
      title="Terms of Service"
      showBackButton={true}
      onBackPress={onBackPress}
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab="profile"
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using ConnectList, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, please 
            do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            ConnectList is a social platform that allows users to create, share, and discover 
            lists of various topics. The service includes features such as:
          </Text>
          <Text style={styles.bulletPoint}>• Creating and managing personal lists</Text>
          <Text style={styles.bulletPoint}>• Following other users and their lists</Text>
          <Text style={styles.bulletPoint}>• Discovering trending content</Text>
          <Text style={styles.bulletPoint}>• Social interactions and engagement</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To use certain features of our service, you must register for an account. You agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
          <Text style={styles.bulletPoint}>• Maintain the security of your password</Text>
          <Text style={styles.bulletPoint}>• Accept responsibility for all activities under your account</Text>
          <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Content</Text>
          <Text style={styles.paragraph}>
            You retain ownership of content you create and share on ConnectList. However, 
            by posting content, you grant us a license to use, modify, and display your content 
            in connection with our service.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for your content and must not post content that:
          </Text>
          <Text style={styles.bulletPoint}>• Violates any laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Infringes on others' rights</Text>
          <Text style={styles.bulletPoint}>• Contains harmful or malicious code</Text>
          <Text style={styles.bulletPoint}>• Is spam or unsolicited content</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Prohibited Uses</Text>
          <Text style={styles.paragraph}>
            You may not use our service:
          </Text>
          <Text style={styles.bulletPoint}>• For any unlawful purpose or to solicit unlawful acts</Text>
          <Text style={styles.bulletPoint}>• To violate any international, federal, provincial, or state regulations or laws</Text>
          <Text style={styles.bulletPoint}>• To transmit or procure the sending of any advertising or promotional material</Text>
          <Text style={styles.bulletPoint}>• To impersonate or attempt to impersonate another person</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Service Availability</Text>
          <Text style={styles.paragraph}>
            We strive to provide reliable service, but we do not guarantee that our service will be 
            uninterrupted or error-free. We reserve the right to modify or discontinue the service 
            at any time without notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            ConnectList shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use of or inability to use the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your account and access to the service immediately, 
            without prior notice, for conduct that we believe violates these Terms of Service 
            or is harmful to other users, us, or third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify users of any 
            material changes by posting the new terms on this page and updating the "Last updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>support@connectlist.app</Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 16,
    color: Colors.orange,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default TermsOfServiceScreen;