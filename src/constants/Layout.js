import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen dimensions
export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  isLargeDevice: width >= 414,
};

// Spacing constants
export const Spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

// Border radius constants
export const BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 50,
};

// Platform specific constants
export const PlatformConstants = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',

  // Status bar heights
  statusBarHeight: Platform.select({
    ios: 44,
    android: 24,
    default: 0,
  }),

  // Header heights
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    default: 60,
  }),
};
