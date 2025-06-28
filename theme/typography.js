// Typography system using Inter font (Airbnb-style)
export const typography = {
  // Font Families
  fontFamily: {
    primary: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },

  // Pre-defined text styles (Airbnb-inspired)
  styles: {
    // Headings
    h1: {
      fontFamily: 'Inter_700Bold',
      fontSize: 36,
      lineHeight: 1.25,
      letterSpacing: -0.025,
    },
    h2: {
      fontFamily: 'Inter_700Bold',
      fontSize: 30,
      lineHeight: 1.25,
      letterSpacing: -0.025,
    },
    h3: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
      lineHeight: 1.375,
      letterSpacing: -0.025,
    },
    h4: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      lineHeight: 1.375,
    },
    h5: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      lineHeight: 1.375,
    },
    h6: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      lineHeight: 1.375,
    },

    // Body Text
    bodyLarge: {
      fontFamily: 'Inter_400Regular',
      fontSize: 18,
      lineHeight: 1.5,
    },
    body: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 1.5,
    },

    // Labels and UI Text
    label: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      lineHeight: 1.375,
    },
    labelSmall: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      lineHeight: 1.375,
    },
    caption: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 1.375,
    },

    // Button Text
    buttonLarge: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      lineHeight: 1.25,
    },
    button: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      lineHeight: 1.25,
    },
    buttonSmall: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 1.25,
    },
  },
};

export default typography;