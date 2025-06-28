// Spacing system (8pt grid system like Airbnb)
export const spacing = {
  // Base unit: 4px (following 8pt grid)
  xs: 4,     // 4px
  sm: 8,     // 8px
  md: 12,    // 12px
  lg: 16,    // 16px
  xl: 20,    // 20px
  '2xl': 24, // 24px
  '3xl': 32, // 32px
  '4xl': 40, // 40px
  '5xl': 48, // 48px
  '6xl': 64, // 64px
  '7xl': 80, // 80px
  '8xl': 96, // 96px
};

// Border radius system
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadow system (elevation)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Component sizes
export const sizes = {
  button: {
    small: {
      height: 32,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    medium: {
      height: 40,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    large: {
      height: 48,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
  },
  input: {
    small: {
      height: 32,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    medium: {
      height: 40,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    large: {
      height: 48,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
  },
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  },
};

export default { spacing, borderRadius, shadows, sizes };