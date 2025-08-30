import { Animated, Easing } from 'react-native';

// Animation utilities for consistent animations across the app
export const AnimationUtils = {
  // Page transition animations
  createFadeTransition: (duration = 300) => ({
    fadeIn: animatedValue =>
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    fadeOut: animatedValue =>
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration * 0.7,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
  }),

  // Scale animations for buttons and interactions
  createScaleAnimation: (scale = 0.95, duration = 150) => ({
    scaleDown: animatedValue =>
      Animated.timing(animatedValue, {
        toValue: scale,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    scaleUp: animatedValue =>
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
  }),

  // Slide animations
  createSlideAnimation: (distance = 50, duration = 300) => ({
    slideInFromRight: animatedValue =>
      Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    slideOutToLeft: animatedValue =>
      Animated.timing(animatedValue, {
        toValue: -distance,
        duration: duration * 0.7,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
  }),

  // Loading skeleton animation
  createSkeletonAnimation: (duration = 1500) => ({
    pulse: animatedValue =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
  }),

  // Spring animations for natural feel
  createSpringAnimation: (tension = 100, friction = 8) => ({
    spring: (animatedValue, toValue) =>
      Animated.spring(animatedValue, {
        toValue,
        tension,
        friction,
        useNativeDriver: true,
      }),
  }),

  // Stagger animations for lists
  createStaggerAnimation: (animations, staggerDelay = 100) =>
    Animated.stagger(staggerDelay, animations),

  // Entrance animations
  createEntranceAnimation: (duration = 600) => ({
    slideUpFade: (translateY, opacity) =>
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration * 0.8,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
  }),

  // Micro-interactions
  createMicroInteraction: {
    heartBeat: animatedValue =>
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.2,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

    wiggle: animatedValue =>
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]),
  },
};

// Preset animation configurations
export const AnimationPresets = {
  // Button press animation
  buttonPress: {
    scale: 0.95,
    duration: 150,
  },

  // Page transition
  pageTransition: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },

  // Loading skeleton
  skeleton: {
    duration: 1500,
    minOpacity: 0.3,
    maxOpacity: 1,
  },

  // List item entrance
  listItemEntrance: {
    duration: 400,
    staggerDelay: 100,
    translateY: 30,
  },
};
