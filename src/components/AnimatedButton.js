import React, { useRef } from 'react';
import { TouchableOpacity, Animated, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { AnimationUtils } from '../utils/animations';
import { HapticPatterns } from '../utils/haptics';

const AnimatedButton = ({
  title,
  onPress,
  style = {},
  textStyle = {},
  disabled = false,
  loading = false,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left', // left, right
  hapticFeedback = true,
  animationType = 'scale', // scale, fade, none
  children,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled || loading) {return;}

    if (hapticFeedback) {
      HapticPatterns.buttonPress();
    }

    if (animationType === 'scale') {
      const scaleAnimation = AnimationUtils.createScaleAnimation(0.95, 100);
      scaleAnimation.scaleDown(scaleAnim).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) {return;}

    if (animationType === 'scale') {
      const scaleAnimation = AnimationUtils.createScaleAnimation();
      scaleAnimation.scaleUp(scaleAnim).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (disabled || loading) {return;}

    // Success haptic feedback
    if (hapticFeedback) {
      setTimeout(() => HapticPatterns.actionSuccess(), 50);
    }

    onPress && onPress();
  };

  // Loading animation
  React.useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [loading]);

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      default:
        baseStyle.push(styles.primary);
    }

    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }

    if (disabled) {
      baseStyle.push(styles.disabledText);
    }

    return baseStyle;
  };

  const renderIcon = () => {
    if (loading) {
      const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Feather
            name="loader"
            size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
            color={getTextStyle().find(s => s.color)?.color || Colors.white}
          />
        </Animated.View>
      );
    }

    if (icon) {
      return (
        <Feather
          name={icon}
          size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
          color={getTextStyle().find(s => s.color)?.color || Colors.white}
        />
      );
    }

    return null;
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1}
      {...props}
    >
      <Animated.View style={[getButtonStyle(), animatedStyle, style]}>
        {iconPosition === 'left' && renderIcon()}

        {children ||
          (title && (
            <Text
              style={[
                getTextStyle(),
                textStyle,
                iconPosition === 'left' && (icon || loading)
                  ? { marginLeft: Spacing.tiny }
                  : {},
                iconPosition === 'right' && (icon || loading)
                  ? { marginRight: Spacing.tiny }
                  : {},
              ]}
            >
              {title}
            </Text>
          ))}

        {iconPosition === 'right' && renderIcon()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Sizes
  small: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.small,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium + 2,
    minHeight: 52,
  },

  // Variants
  primary: {
    backgroundColor: Colors.orange,
  },
  secondary: {
    backgroundColor: Colors.backgroundSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.orange,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: Colors.backgroundSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Text styles
  text: {
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
  },
  smallText: {
    fontSize: FontSize.small,
  },
  mediumText: {
    fontSize: FontSize.regular,
  },
  largeText: {
    fontSize: FontSize.medium,
  },

  // Text colors
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.orange,
  },
  ghostText: {
    color: Colors.orange,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
});

export default AnimatedButton;
