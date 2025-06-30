import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

export const TermsOfServiceContent = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using ConnectList (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          ConnectList is a social platform that allows users to create, share, and discover curated lists of content across multiple categories including movies, books, games, places, and more. The Service includes features such as:
          {'\n'}• Creating and managing lists
          {'\n'}• Following other users
          {'\n'}• Commenting and messaging
          {'\n'}• Content discovery and search
          {'\n'}• Social interactions and notifications
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        
        <Text style={styles.subsectionTitle}>3.1 Registration</Text>
        <Text style={styles.paragraph}>
          To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Account Security</Text>
        <Text style={styles.paragraph}>
          You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </Text>

        <Text style={styles.subsectionTitle}>3.3 Account Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate your account at any time for any reason, including if you violate these Terms of Service.
        </Text>

        <Text style={styles.sectionTitle}>4. User Content</Text>
        
        <Text style={styles.subsectionTitle}>4.1 Content Ownership</Text>
        <Text style={styles.paragraph}>
          You retain ownership of any content you submit, post, or display on the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with the Service.
        </Text>

        <Text style={styles.subsectionTitle}>4.2 Content Standards</Text>
        <Text style={styles.paragraph}>
          You agree that your User Content will not:
          {'\n'}• Violate any applicable laws or regulations
          {'\n'}• Infringe on intellectual property rights
          {'\n'}• Contain harmful, threatening, or abusive material
          {'\n'}• Include spam, advertising, or promotional content
          {'\n'}• Contain personal information of others without consent
          {'\n'}• Be false, misleading, or deceptive
          {'\n'}• Contain malware or malicious code
        </Text>

        <Text style={styles.subsectionTitle}>4.3 Content Moderation</Text>
        <Text style={styles.paragraph}>
          We reserve the right to review, modify, or remove any User Content at our discretion, with or without notice. We do not endorse any User Content or any opinion, recommendation, or advice expressed therein.
        </Text>

        <Text style={styles.sectionTitle}>5. Prohibited Uses</Text>
        <Text style={styles.paragraph}>
          You may not use the Service:
          {'\n'}• For any unlawful purpose or to solicit others to perform unlawful acts
          {'\n'}• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
          {'\n'}• To infringe upon or violate our intellectual property rights or the intellectual property rights of others
          {'\n'}• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
          {'\n'}• To submit false or misleading information
          {'\n'}• To upload or transmit viruses or any other type of malicious code
          {'\n'}• To spam, phish, pharm, pretext, spider, crawl, or scrape
          {'\n'}• For any obscene or immoral purpose
          {'\n'}• To interfere with or circumvent the security features of the Service
        </Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        
        <Text style={styles.subsectionTitle}>6.1 Our Rights</Text>
        <Text style={styles.paragraph}>
          The Service and its original content, features, and functionality are and will remain the exclusive property of ConnectList and its licensors. The Service is protected by copyright, trademark, and other laws.
        </Text>

        <Text style={styles.subsectionTitle}>6.2 Third-Party Content</Text>
        <Text style={styles.paragraph}>
          The Service may include content from third-party sources (such as TMDB, Google Books, etc.). Such content is the property of their respective owners and is used under appropriate licenses.
        </Text>

        <Text style={styles.sectionTitle}>7. Privacy Policy</Text>
        <Text style={styles.paragraph}>
          Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimers</Text>
        
        <Text style={styles.subsectionTitle}>8.1 Service Availability</Text>
        <Text style={styles.paragraph}>
          We do not guarantee that the Service will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Service, resulting in interruptions, delays, or errors.
        </Text>

        <Text style={styles.subsectionTitle}>8.2 Content Accuracy</Text>
        <Text style={styles.paragraph}>
          We make no representations or warranties about the accuracy, reliability, completeness, or timeliness of any content on the Service.
        </Text>

        <Text style={styles.subsectionTitle}>8.3 Third-Party Services</Text>
        <Text style={styles.paragraph}>
          The Service may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of any third-party websites or services.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL CONNECTLIST BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
        </Text>

        <Text style={styles.sectionTitle}>10. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to defend, indemnify, and hold harmless ConnectList and its affiliates, officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees).
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        
        <Text style={styles.subsectionTitle}>11.1 Termination by You</Text>
        <Text style={styles.paragraph}>
          You may terminate your account at any time by contacting us or using the account deletion feature in the app.
        </Text>

        <Text style={styles.subsectionTitle}>11.2 Termination by Us</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </Text>

        <Text style={styles.subsectionTitle}>11.3 Effect of Termination</Text>
        <Text style={styles.paragraph}>
          Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account, you may simply discontinue using the Service.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
        </Text>

        <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
        </Text>

        <Text style={styles.sectionTitle}>14. Severability</Text>
        <Text style={styles.paragraph}>
          If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.
        </Text>

        <Text style={styles.sectionTitle}>15. Entire Agreement</Text>
        <Text style={styles.paragraph}>
          These Terms constitute the entire agreement between you and ConnectList regarding the use of the Service, superseding any prior agreements between you and ConnectList relating to your use of the Service.
        </Text>

        <Text style={styles.sectionTitle}>16. Contact Information</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms of Service, please contact us:
          {'\n'}• Email: legal@connectlist.app
          {'\n'}• Address: [Your Company Address]
        </Text>

        <Text style={styles.sectionTitle}>17. Digital Millennium Copyright Act (DMCA)</Text>
        <Text style={styles.paragraph}>
          We respect the intellectual property rights of others. If you believe that any content on our Service infringes your copyright, please contact us with the following information:
          {'\n'}• A description of the copyrighted work that you claim has been infringed
          {'\n'}• A description of where the allegedly infringing material is located on our Service
          {'\n'}• Your contact information
          {'\n'}• A statement by you that you have a good faith belief that the disputed use is not authorized
          {'\n'}• A statement by you that the above information is accurate and that you are the copyright owner
        </Text>

        <Text style={styles.sectionTitle}>18. Age Requirements</Text>
        <Text style={styles.paragraph}>
          The Service is not intended for children under the age of 13. By using the Service, you represent that you are at least 13 years old. If you are between 13 and 18 years old, you represent that you have your parent's or guardian's permission to use the Service.
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

export default TermsOfServiceContent;