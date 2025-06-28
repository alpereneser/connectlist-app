import React from 'react';
import { Text, StyleSheet } from 'react-native';
import theme from '../theme';

// Heading Components
export const H1 = ({ children, style, color, ...props }) => (
  <Text style={[styles.h1, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const H2 = ({ children, style, color, ...props }) => (
  <Text style={[styles.h2, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const H3 = ({ children, style, color, ...props }) => (
  <Text style={[styles.h3, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const H4 = ({ children, style, color, ...props }) => (
  <Text style={[styles.h4, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const H5 = ({ children, style, color, ...props }) => (
  <Text style={[styles.h5, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const H6 = ({ children, style, color, ...props }) => (
  <Text style={[styles.h6, color && { color }, style]} {...props}>
    {children}
  </Text>
);

// Body Text Components
export const BodyLarge = ({ children, style, color, ...props }) => (
  <Text style={[styles.bodyLarge, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const Body = ({ children, style, color, ...props }) => (
  <Text style={[styles.body, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const BodySmall = ({ children, style, color, ...props }) => (
  <Text style={[styles.bodySmall, color && { color }, style]} {...props}>
    {children}
  </Text>
);

// Label and Caption Components
export const Label = ({ children, style, color, ...props }) => (
  <Text style={[styles.label, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const LabelSmall = ({ children, style, color, ...props }) => (
  <Text style={[styles.labelSmall, color && { color }, style]} {...props}>
    {children}
  </Text>
);

export const Caption = ({ children, style, color, ...props }) => (
  <Text style={[styles.caption, color && { color }, style]} {...props}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  h1: {
    ...theme.typography.styles.h1,
    color: theme.colors.text.primary,
  },
  h2: {
    ...theme.typography.styles.h2,
    color: theme.colors.text.primary,
  },
  h3: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
  },
  h4: {
    ...theme.typography.styles.h4,
    color: theme.colors.text.primary,
  },
  h5: {
    ...theme.typography.styles.h5,
    color: theme.colors.text.primary,
  },
  h6: {
    ...theme.typography.styles.h6,
    color: theme.colors.text.primary,
  },
  bodyLarge: {
    ...theme.typography.styles.bodyLarge,
    color: theme.colors.text.primary,
  },
  body: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
  },
  bodySmall: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
  },
  label: {
    ...theme.typography.styles.label,
    color: theme.colors.text.primary,
  },
  labelSmall: {
    ...theme.typography.styles.labelSmall,
    color: theme.colors.text.primary,
  },
  caption: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
  },
});

export default {
  H1, H2, H3, H4, H5, H6,
  BodyLarge, Body, BodySmall,
  Label, LabelSmall, Caption,
};