import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Platform-aware design tokens
export const tokens = {
  // Spacing system - Mobile-optimized
  spacing: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    // Common spacing combinations for mobile
    inputPadding: 16,
    buttonPadding: { horizontal: 24, vertical: 12 },
    cardPadding: 16,
    screenPadding: 20,
  },

  // Border radius with platform differences
  borderRadius: {
    small: Platform.OS === 'ios' ? 8 : 4,
    medium: Platform.OS === 'ios' ? 12 : 8,
    large: Platform.OS === 'ios' ? 16 : 12,
    xlarge: Platform.OS === 'ios' ? 24 : 16,
  },

  // Typography scale - Mobile-first with better readability
  typography: {
    fontSize: {
      xs: 12, // Increased from 11 for better mobile readability
      sm: 14, // Increased from 13
      md: 16,
      lg: 18,
      xl: 22,
      xxl: 28,
      xxxl: 34,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.3, // Increased from 1.2 for better readability
      normal: 1.5, // Increased from 1.4
      relaxed: 1.7, // Increased from 1.6
    },
  },

  // Colors
  colors: {
    primary: '#f97316',
    primaryLight: '#ffedd5',
    primaryDark: '#ea580c',
    
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f3f4f6',
    }
  },

  // Platform-specific shadows
  shadows: {
    small: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
    medium: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    large: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Touch targets - Improved for mobile usability
  touchTarget: {
    minimum: 44, // iOS and Android minimum
    comfortable: 48, // Recommended default
    large: 56,
    hitSlop: 8, // Additional touch area around elements
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Screen breakpoints
  breakpoints: {
    small: 320,
    medium: 375,
    large: 414,
    xlarge: 768,
  },

  // Layout constants
  layout: {
    headerHeight: Platform.OS === 'ios' ? 88 : 64,
    tabBarHeight: Platform.OS === 'ios' ? 83 : 64,
    statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
  },

  // Platform-specific adjustments
  platform: {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    screenWidth,
    screenHeight,
    isSmallScreen: screenWidth < 375,
    isLargeScreen: screenWidth >= 414,
  },
};

// Responsive helper functions
export const responsive = {
  // Scale value based on screen size
  scale: (size) => {
    const scale = screenWidth / 375; // Base iPhone size
    return Math.round(size * scale);
  },

  // Get responsive font size
  fontSize: (size) => {
    if (tokens.platform.isSmallScreen) {
      return Math.max(size - 1, 11);
    }
    if (tokens.platform.isLargeScreen) {
      return size + 1;
    }
    return size;
  },

  // Get responsive spacing
  spacing: (size) => {
    if (tokens.platform.isSmallScreen) {
      return Math.max(size - 2, 4);
    }
    if (tokens.platform.isLargeScreen) {
      return size + 2;
    }
    return size;
  },
};

export default tokens;