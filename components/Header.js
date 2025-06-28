import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChatCircle } from 'phosphor-react-native';
import { hapticPatterns } from '../utils/haptics';
import { a11yProps } from '../utils/accessibility';
import tokens from '../utils/designTokens';

const Header = ({ 
  showBackButton = false, 
  onBackPress,
  onMessagesPress,
  title,
  customStyle,
  rightComponent = null,
  backgroundColor = tokens.colors.background.primary,
}) => {
  const insets = useSafeAreaInsets();
  
  const handleBackPress = () => {
    hapticPatterns.navigation('back');
    onBackPress?.();
  };
  
  const handleMessagesPress = () => {
    hapticPatterns.buttonPress('secondary');
    onMessagesPress?.();
  };

  return (
    <View style={[
      styles.header, 
      { 
        paddingTop: insets.top,
        backgroundColor,
      },
      customStyle
    ]}>
      <View style={styles.container}>
        {/* Left Side - Back Button */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              {...a11yProps.button('Go back', 'Navigate to previous screen')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={tokens.colors.gray[500]} weight="regular" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {/* Center - Logo or Title */}
        <View style={styles.centerSection}>
          {title ? (
            <Text 
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
              {...a11yProps.header(1, title)}
            >
              {title}
            </Text>
          ) : (
            <Image 
              source={require('../assets/connectlist-beta-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
              {...a11yProps.image('ConnectList logo')}
            />
          )}
        </View>

        {/* Right Side - Messages or Custom Component */}
        <View style={styles.rightSection}>
          {rightComponent || (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMessagesPress}
              activeOpacity={0.7}
              {...a11yProps.button('Messages', 'Open messages screen')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChatCircle size={24} color={tokens.colors.gray[500]} weight="regular" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.gray[200],
    ...tokens.shadows.small,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    minHeight: Platform.OS === 'ios' ? 44 : 56, // Platform-specific minimum heights
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 3, // More space for title
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.sm,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: tokens.touchTarget.minimum,
    height: tokens.touchTarget.minimum,
    borderRadius: tokens.touchTarget.minimum / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 171,
    height: 20,
    maxWidth: '100%',
  },
  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
    textAlign: 'center',
    maxWidth: '100%',
  },
});

export default Header;