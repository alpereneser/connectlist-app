import { Platform } from 'react-native';

// Haptic feedback utility with fallback
let Haptics;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Fallback if expo-haptics is not available
  Haptics = {
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    selectionAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: {
      Success: 'success',
      Warning: 'warning',
      Error: 'error',
    },
  };
}

export const HapticFeedback = {
  // Light impact for subtle interactions
  light: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },

  // Medium impact for button presses
  medium: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },

  // Heavy impact for important actions
  heavy: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },

  // Selection feedback for scrolling/swiping
  selection: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },

  // Success notification
  success: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },

  // Warning notification
  warning: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },

  // Error notification
  error: async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
};

// Convenience methods for common interactions
export const HapticPatterns = {
  buttonPress: () => HapticFeedback.medium(),
  tabSwitch: () => HapticFeedback.light(),
  swipeAction: () => HapticFeedback.medium(),
  longPress: () => HapticFeedback.heavy(),
  scrollEnd: () => HapticFeedback.light(),
  pullRefresh: () => HapticFeedback.medium(),
  actionSuccess: () => HapticFeedback.success(),
  actionError: () => HapticFeedback.error(),
  actionWarning: () => HapticFeedback.warning(),
  selection: () => HapticFeedback.selection(),
};
