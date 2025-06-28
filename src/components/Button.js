import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import theme from '../theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  style,
  textStyle,
  ...props 
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary[500],
  },
  secondary: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.dark,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    ...theme.sizes.button.small,
  },
  medium: {
    ...theme.sizes.button.medium,
  },
  large: {
    ...theme.sizes.button.large,
  },

  // Disabled state
  disabled: {
    backgroundColor: theme.colors.neutral[200],
    borderColor: theme.colors.neutral[200],
  },

  // Text styles
  text: {
    textAlign: 'center',
  },
  primaryText: {
    color: theme.colors.text.inverse,
    ...theme.typography.styles.button,
  },
  secondaryText: {
    color: theme.colors.text.primary,
    ...theme.typography.styles.button,
  },
  outlineText: {
    color: theme.colors.primary[500],
    ...theme.typography.styles.button,
  },
  ghostText: {
    color: theme.colors.primary[500],
    ...theme.typography.styles.button,
  },

  // Size text styles
  smallText: {
    ...theme.typography.styles.buttonSmall,
  },
  mediumText: {
    ...theme.typography.styles.button,
  },
  largeText: {
    ...theme.typography.styles.buttonLarge,
  },

  disabledText: {
    color: theme.colors.neutral[400],
  },
});

export default Button;