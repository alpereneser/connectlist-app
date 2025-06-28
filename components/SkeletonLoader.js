import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import tokens from '../utils/designTokens';

// Individual skeleton components
export const SkeletonBox = ({ 
  width, 
  height, 
  borderRadius = tokens.borderRadius.medium,
  style = {},
  animated = true 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue, animated]);

  const opacity = animated 
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      })
    : 0.3;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonText = ({ 
  width = '100%', 
  height = 16, 
  style = {},
  animated = true 
}) => (
  <SkeletonBox
    width={width}
    height={height}
    borderRadius={height / 2}
    style={style}
    animated={animated}
  />
);

export const SkeletonAvatar = ({ 
  size = 48, 
  style = {},
  animated = true 
}) => (
  <SkeletonBox
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
    animated={animated}
  />
);

// Complex skeleton patterns
export const SkeletonListPost = ({ animated = true }) => (
  <View style={styles.listPostSkeleton}>
    {/* Header */}
    <View style={styles.postHeaderSkeleton}>
      <SkeletonAvatar size={58} animated={animated} />
      <View style={styles.creatorInfoSkeleton}>
        <SkeletonText width={120} height={18} animated={animated} />
        <SkeletonText width={160} height={14} style={{ marginTop: 4 }} animated={animated} />
      </View>
    </View>

    {/* Content */}
    <View style={styles.postContentSkeleton}>
      <SkeletonText width="85%" height={22} animated={animated} />
      <SkeletonText width="95%" height={18} style={{ marginTop: 8 }} animated={animated} />
      <SkeletonText width="70%" height={18} style={{ marginTop: 4 }} animated={animated} />
      
      {/* List items */}
      <View style={styles.listItemsSkeleton}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.listItemSkeleton}>
            <SkeletonBox width={115} height={144} animated={animated} />
            <SkeletonText width={100} height={14} style={{ marginTop: 8 }} animated={animated} />
          </View>
        ))}
      </View>
    </View>

    {/* Actions */}
    <View style={styles.postActionsSkeleton}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.actionButtonSkeleton}>
          <SkeletonBox width={20} height={20} animated={animated} />
          <SkeletonText width={30} height={14} style={{ marginLeft: 8 }} animated={animated} />
        </View>
      ))}
    </View>
  </View>
);

export const SkeletonProfile = ({ animated = true }) => (
  <View style={styles.profileSkeleton}>
    {/* Profile header */}
    <View style={styles.profileHeaderSkeleton}>
      <SkeletonAvatar size={80} animated={animated} />
      <View style={styles.profileInfoSkeleton}>
        <SkeletonText width={150} height={20} animated={animated} />
        <SkeletonText width={200} height={16} style={{ marginTop: 8 }} animated={animated} />
        
        {/* Stats */}
        <View style={styles.statsSkeleton}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.statItemSkeleton}>
              <SkeletonText width={30} height={18} animated={animated} />
              <SkeletonText width={50} height={14} style={{ marginTop: 2 }} animated={animated} />
            </View>
          ))}
        </View>
      </View>
    </View>

    {/* Category tabs */}
    <View style={styles.categoryTabsSkeleton}>
      {[1, 2, 3, 4, 5].map(i => (
        <SkeletonBox 
          key={i} 
          width={60} 
          height={32} 
          style={{ marginRight: 12 }} 
          animated={animated} 
        />
      ))}
    </View>
  </View>
);

export const SkeletonSearchResults = ({ animated = true }) => (
  <View style={styles.searchResultsSkeleton}>
    {[1, 2, 3, 4, 5].map(i => (
      <View key={i} style={styles.searchResultSkeleton}>
        <SkeletonBox width={80} height={80} animated={animated} />
        <View style={styles.searchResultContentSkeleton}>
          <SkeletonText width="80%" height={16} animated={animated} />
          <SkeletonText width="60%" height={14} style={{ marginTop: 6 }} animated={animated} />
          <SkeletonText width="40%" height={12} style={{ marginTop: 4 }} animated={animated} />
        </View>
      </View>
    ))}
  </View>
);

export const SkeletonGrid = ({ columns = 3, rows = 3, animated = true }) => (
  <View style={styles.gridSkeleton}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonBox
            key={colIndex}
            width={`${100 / columns - 2}%`}
            height={120}
            style={{ marginHorizontal: '1%' }}
            animated={animated}
          />
        ))}
      </View>
    ))}
  </View>
);

// Loading state wrapper
export const SkeletonLoader = ({ 
  loading, 
  children, 
  skeleton,
  style = {} 
}) => {
  if (loading) {
    return (
      <View style={[styles.loaderContainer, style]}>
        {skeleton}
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: tokens.colors.gray[200],
  },
  loaderContainer: {
    flex: 1,
  },
  
  // List post skeleton
  listPostSkeleton: {
    backgroundColor: tokens.colors.background.primary,
    paddingVertical: tokens.spacing.lg,
  },
  postHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  creatorInfoSkeleton: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  postContentSkeleton: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  listItemsSkeleton: {
    flexDirection: 'row',
    marginTop: tokens.spacing.lg,
  },
  listItemSkeleton: {
    marginRight: tokens.spacing.md,
    alignItems: 'center',
  },
  postActionsSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.gray[200],
  },
  actionButtonSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: tokens.spacing.xl,
  },

  // Profile skeleton
  profileSkeleton: {
    padding: tokens.spacing.lg,
  },
  profileHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.lg,
  },
  profileInfoSkeleton: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  statsSkeleton: {
    flexDirection: 'row',
    marginTop: tokens.spacing.md,
  },
  statItemSkeleton: {
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  categoryTabsSkeleton: {
    flexDirection: 'row',
    paddingVertical: tokens.spacing.md,
  },

  // Search results skeleton
  searchResultsSkeleton: {
    padding: tokens.spacing.lg,
  },
  searchResultSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.medium,
  },
  searchResultContentSkeleton: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },

  // Grid skeleton
  gridSkeleton: {
    padding: tokens.spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
});

export default SkeletonLoader;