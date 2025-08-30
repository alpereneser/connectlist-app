import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';

const AboutScreen = ({ onTabPress, onBackPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLinkPress = url => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  const handleMenuPress = action => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (action) {
      case 'privacy':
        handleLinkPress('https://connectlist.com/privacy');
        break;
      case 'terms':
        handleLinkPress('https://connectlist.com/terms');
        break;
      case 'support':
        handleLinkPress('mailto:support@connectlist.com');
        break;
      case 'website':
        handleLinkPress('https://connectlist.com');
        break;
      default:
        break;
    }
  };

  return (
    <ScreenLayout
      title="About"
      showBackButton={true}
      onBackPress={onBackPress}
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab="profile"
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* App Logo & Info */}
          <View style={styles.appSection}>
            <Image
              source={require('../../assets/connectlist-logo.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>ConnectList</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Create, share, and discover amazing lists with friends and the
              community. From movies to places, books to music - organize
              everything you love.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Feather name="list" size={20} color={Colors.orange} />
                <Text style={styles.featureText}>Create unlimited lists</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="users" size={20} color={Colors.orange} />
                <Text style={styles.featureText}>Share with friends</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="search" size={20} color={Colors.orange} />
                <Text style={styles.featureText}>Discover new content</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="heart" size={20} color={Colors.orange} />
                <Text style={styles.featureText}>Like and save favorites</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather
                  name="message-circle"
                  size={20}
                  color={Colors.orange}
                />
                <Text style={styles.featureText}>Chat and collaborate</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="smartphone" size={20} color={Colors.orange} />
                <Text style={styles.featureText}>Cross-platform sync</Text>
              </View>
            </View>
          </View>

          {/* Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleMenuPress('website')}
              activeOpacity={0.6}
            >
              <View style={styles.linkIconContainer}>
                <Feather name="globe" size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.linkText}>Website</Text>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleMenuPress('privacy')}
              activeOpacity={0.6}
            >
              <View style={styles.linkIconContainer}>
                <Feather name="shield" size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleMenuPress('terms')}
              activeOpacity={0.6}
            >
              <View style={styles.linkIconContainer}>
                <Feather
                  name="file-text"
                  size={20}
                  color={Colors.textSecondary}
                />
              </View>
              <Text style={styles.linkText}>Terms of Service</Text>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleMenuPress('support')}
              activeOpacity={0.6}
            >
              <View style={styles.linkIconContainer}>
                <Feather name="mail" size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.linkText}>Contact Support</Text>
              <Feather
                name="external-link"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Developer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <Text style={styles.developerText}>
              Built with ❤️ using React Native, Expo, and Supabase.
            </Text>
            <Text style={styles.copyrightText}>
              © 2025 ConnectList. All rights reserved.
            </Text>
          </View>

          {/* Tech Stack */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technology</Text>
            <View style={styles.techStack}>
              <View style={styles.techItem}>
                <Text style={styles.techName}>React Native</Text>
                <Text style={styles.techVersion}>0.79.5</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techName}>Expo</Text>
                <Text style={styles.techVersion}>~53.0.20</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techName}>Supabase</Text>
                <Text style={styles.techVersion}>Database & Auth</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techName}>Inter Font</Text>
                <Text style={styles.techVersion}>Typography</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.medium,
  },
  appSection: {
    alignItems: 'center',
    marginBottom: Spacing.large,
    paddingVertical: Spacing.large,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: Spacing.medium,
  },
  appName: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  appVersion: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.medium,
  },
  appDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.medium,
  },
  section: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  featuresList: {
    gap: Spacing.small,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
  },
  featureText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    marginLeft: Spacing.medium,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  linkText: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  developerText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.small,
  },
  copyrightText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  techStack: {
    gap: Spacing.small,
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.small,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  techName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  techVersion: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});

export default AboutScreen;
