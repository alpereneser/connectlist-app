import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants';
import { AnimationUtils } from '../utils/animations';

const LoadingSkeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style = {},
  children,
}) => {
  const animatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = AnimationUtils.createSkeletonAnimation();
    animation.pulse(animatedValue).start();

    return () => {
      animatedValue.stopAnimation();
    };
  }, []);

  if (children) {
    return (
      <Animated.View style={[{ opacity: animatedValue }, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

// Preset skeleton components
export const SkeletonText = ({
  lines = 1,
  lastLineWidth = '60%',
  style = {},
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <LoadingSkeleton
        key={index}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        height={16}
        borderRadius={8}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

export const SkeletonAvatar = ({ size = 40, style = {} }) => (
  <LoadingSkeleton
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
  />
);

export const SkeletonImage = ({
  width = '100%',
  height = 200,
  borderRadius = 8,
  style = {},
}) => (
  <LoadingSkeleton
    width={width}
    height={height}
    borderRadius={borderRadius}
    style={style}
  />
);

export const SkeletonCard = ({ style = {} }) => (
  <View style={[styles.card, style]}>
    <SkeletonImage height={120} style={{ marginBottom: Spacing.small }} />
    <SkeletonText lines={2} />
    <View style={styles.cardFooter}>
      <SkeletonAvatar size={24} />
      <LoadingSkeleton
        width={80}
        height={12}
        style={{ marginLeft: Spacing.small }}
      />
    </View>
  </View>
);

export const SkeletonListItem = ({ showAvatar = true, style = {} }) => (
  <View style={[styles.listItem, style]}>
    {showAvatar && <SkeletonAvatar style={{ marginRight: Spacing.medium }} />}
    <View style={styles.listItemContent}>
      <SkeletonText lines={2} lastLineWidth="40%" />
    </View>
  </View>
);

export const SkeletonSearchResult = ({ style = {} }) => (
  <View style={[styles.searchResult, style]}>
    <SkeletonImage
      width={80}
      height={60}
      style={{ marginRight: Spacing.small }}
    />
    <View style={styles.searchResultContent}>
      <SkeletonText lines={2} lastLineWidth="70%" />
      <LoadingSkeleton
        width={60}
        height={12}
        style={{ marginTop: Spacing.tiny }}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
  },
  listItemContent: {
    flex: 1,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
  },
  searchResultContent: {
    flex: 1,
  },
});

export default LoadingSkeleton;
