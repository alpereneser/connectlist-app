import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptic feedback utilities for enhanced user experience
export const hapticFeedback = {
  // Light impact for subtle interactions
  light: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  // Medium impact for standard interactions
  medium: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  // Heavy impact for significant interactions
  heavy: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  // Success feedback for positive actions
  success: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  // Warning feedback for cautionary actions
  warning: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  // Error feedback for negative actions
  error: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  // Selection feedback for picking items
  selection: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  },
};

// Context-specific haptic patterns
export const hapticPatterns = {
  // Button press feedback
  buttonPress: (type = 'primary') => {
    switch (type) {
      case 'primary':
        hapticFeedback.medium();
        break;
      case 'secondary':
        hapticFeedback.light();
        break;
      case 'destructive':
        hapticFeedback.warning();
        break;
      default:
        hapticFeedback.light();
    }
  },

  // Tab selection feedback
  tabSelection: () => {
    hapticFeedback.selection();
  },

  // Like/heart button feedback
  likeButton: (isLiked) => {
    if (isLiked) {
      hapticFeedback.success();
    } else {
      hapticFeedback.light();
    }
  },

  // Pull to refresh feedback
  pullToRefresh: () => {
    hapticFeedback.light();
  },

  // Swipe actions feedback
  swipeAction: (actionType) => {
    switch (actionType) {
      case 'delete':
        hapticFeedback.warning();
        break;
      case 'archive':
        hapticFeedback.medium();
        break;
      case 'share':
        hapticFeedback.light();
        break;
      default:
        hapticFeedback.light();
    }
  },

  // Form validation feedback
  formValidation: (isValid) => {
    if (isValid) {
      hapticFeedback.success();
    } else {
      hapticFeedback.error();
    }
  },

  // Search interaction feedback
  searchInteraction: () => {
    hapticFeedback.selection();
  },

  // Navigation feedback
  navigation: (direction) => {
    if (direction === 'back') {
      hapticFeedback.light();
    } else {
      hapticFeedback.medium();
    }
  },

  // List item selection feedback
  listItemSelection: () => {
    hapticFeedback.selection();
  },

  // Toggle switch feedback
  toggleSwitch: (isOn) => {
    if (isOn) {
      hapticFeedback.light();
    } else {
      hapticFeedback.light();
    }
  },

  // Photo/image interaction feedback
  imageInteraction: () => {
    hapticFeedback.light();
  },

  // Long press feedback
  longPress: () => {
    hapticFeedback.medium();
  },

  // Drag and drop feedback
  dragAndDrop: {
    start: () => hapticFeedback.medium(),
    drop: () => hapticFeedback.light(),
    cancel: () => hapticFeedback.warning(),
  },

  // Achievement/completion feedback
  achievement: () => {
    hapticFeedback.success();
  },

  // Loading completion feedback
  loadingComplete: () => {
    hapticFeedback.light();
  },
};

// Utility functions for haptic management
export const hapticUtils = {
  // Check if haptics are available
  isAvailable: () => Platform.OS === 'ios',

  // Delayed haptic feedback
  delayed: (feedbackFn, delay = 100) => {
    setTimeout(feedbackFn, delay);
  },

  // Conditional haptic feedback based on user preferences
  conditional: (feedbackFn, enabled = true) => {
    if (enabled && Platform.OS === 'ios') {
      feedbackFn();
    }
  },

  // Sequence of haptic feedbacks
  sequence: (feedbacks, interval = 100) => {
    feedbacks.forEach((feedback, index) => {
      setTimeout(feedback, index * interval);
    });
  },
};

export default {
  hapticFeedback,
  hapticPatterns,
  hapticUtils,
};