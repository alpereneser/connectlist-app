import React from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '../theme';

const Card = ({ 
  children, 
  variant = 'default', 
  padding = 'md',
  style,
  ...props 
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },

  // Variants
  default: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  elevated: {
    ...theme.shadows.lg,
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    ...theme.shadows.none,
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.lg,
  },
  paddingLg: {
    padding: theme.spacing['2xl'],
  },
  paddingXl: {
    padding: theme.spacing['3xl'],
  },
});

export default Card;