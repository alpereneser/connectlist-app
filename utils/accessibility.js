import { Platform } from 'react-native';

// Accessibility utilities and helper functions
export const a11yProps = {
  // Button accessibility props
  button: (label, hint = null, state = {}) => ({
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
    ...(Object.keys(state).length > 0 && { accessibilityState: state }),
  }),

  // Header accessibility props
  header: (level, text) => ({
    accessible: true,
    accessibilityRole: 'header',
    ...(Platform.OS === 'ios' && { accessibilityTraits: 'header' }),
    accessibilityLabel: text,
    ...(level && { accessibilityLevel: level }),
  }),

  // Text input accessibility props
  textInput: (label, hint = null, required = false) => ({
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
    ...(required && { 
      accessibilityRequired: true,
      accessibilityLabel: `${label}, required field`
    }),
  }),

  // Link accessibility props
  link: (label, hint = null) => ({
    accessible: true,
    accessibilityRole: 'link',
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  // Image accessibility props
  image: (alt, decorative = false) => ({
    accessible: !decorative,
    ...(decorative 
      ? { accessibilityElementsHidden: true }
      : { 
          accessibilityRole: 'image',
          accessibilityLabel: alt 
        }
    ),
  }),

  // Tab accessibility props
  tab: (label, selected = false, index = null, total = null) => ({
    accessible: true,
    accessibilityRole: 'tab',
    accessibilityLabel: label,
    accessibilityState: { selected },
    ...(index !== null && total !== null && {
      accessibilityHint: `Tab ${index + 1} of ${total}`
    }),
  }),

  // List item accessibility props
  listItem: (label, hint = null, index = null, total = null) => ({
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
    ...(index !== null && total !== null && {
      accessibilityLabel: `${label}, item ${index + 1} of ${total}`
    }),
  }),

  // Search box accessibility props
  searchBox: (placeholder, hint = null) => ({
    accessible: true,
    accessibilityRole: 'search',
    accessibilityLabel: placeholder,
    ...(hint && { accessibilityHint: hint }),
  }),

  // Progress bar accessibility props
  progressBar: (current, total, label = null) => ({
    accessible: true,
    accessibilityRole: 'progressbar',
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
    },
    ...(label && { accessibilityLabel: label }),
  }),

  // Switch/Toggle accessibility props
  switch: (label, value, hint = null) => ({
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityState: { checked: value },
    ...(hint && { accessibilityHint: hint }),
  }),

  // Alert/Modal accessibility props
  alert: (title, message = null) => ({
    accessible: true,
    accessibilityRole: 'alert',
    accessibilityLabel: `${title}${message ? `. ${message}` : ''}`,
    accessibilityLiveRegion: 'assertive',
  }),
};

// Accessibility testing helpers
export const a11yHelpers = {
  // Check if element meets minimum touch target size
  meetsMinimumTouchTarget: (width, height, minimum = 44) => {
    return width >= minimum && height >= minimum;
  },

  // Generate semantic content description
  generateContentDescription: (type, title, metadata = {}) => {
    const descriptions = {
      list: `List titled ${title}`,
      listItem: `List item: ${title}`,
      profile: `Profile for ${title}`,
      post: `Post by ${title}`,
      comment: `Comment by ${title}`,
      notification: `Notification: ${title}`,
    };

    let description = descriptions[type] || title;
    
    // Add metadata to description
    if (metadata.likes) description += `, ${metadata.likes} likes`;
    if (metadata.comments) description += `, ${metadata.comments} comments`;
    if (metadata.time) description += `, ${metadata.time}`;
    
    return description;
  },

  // Create accessible navigation announcement
  announceNavigation: (screenName, context = null) => {
    return {
      accessibilityLiveRegion: 'polite',
      accessibilityLabel: `Navigated to ${screenName}${context ? `, ${context}` : ''}`,
    };
  },

  // Create loading state announcement
  announceLoading: (isLoading, content = 'content') => ({
    accessibilityLiveRegion: 'polite',
    accessibilityLabel: isLoading ? `Loading ${content}` : `${content} loaded`,
  }),

  // Create error state announcement
  announceError: (error, action = null) => ({
    accessibilityLiveRegion: 'assertive',
    accessibilityLabel: `Error: ${error}${action ? `. ${action}` : ''}`,
  }),
};

// Screen reader optimizations
export const screenReader = {
  // Hide decorative elements from screen readers
  hide: {
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  },

  // Focus management helpers
  focusHelpers: {
    // Set initial focus for screens
    setInitialFocus: (ref) => {
      if (ref?.current) {
        ref.current.focus();
      }
    },

    // Announce page changes
    announcePageChange: (title) => ({
      accessibilityLiveRegion: 'polite',
      accessibilityLabel: `${title} screen`,
    }),
  },
};

// Accessibility testing utilities (for development)
export const a11yTesting = {
  // Log accessibility tree for debugging
  logAccessibilityTree: (component) => {
    if (__DEV__) {
      console.log('Accessibility Tree:', component);
    }
  },

  // Validate accessibility requirements
  validateAccessibility: (props) => {
    if (__DEV__) {
      const warnings = [];
      
      if (props.onPress && !props.accessibilityRole) {
        warnings.push('Interactive element missing accessibilityRole');
      }
      
      if (props.onPress && !props.accessibilityLabel) {
        warnings.push('Interactive element missing accessibilityLabel');
      }
      
      if (warnings.length > 0) {
        console.warn('Accessibility warnings:', warnings);
      }
    }
  },
};

export default {
  a11yProps,
  a11yHelpers,
  screenReader,
  a11yTesting,
};