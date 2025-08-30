import React, { useRef, useEffect } from 'react';
import { RefreshControl, Animated } from 'react-native';
import { Colors } from '../constants';
import { HapticPatterns } from '../utils/haptics';

const PullToRefresh = ({
  refreshing,
  onRefresh,
  tintColor = Colors.orange,
  colors = [Colors.orange],
  progressBackgroundColor = Colors.background,
  size = 'default', // default, large, small
  hapticFeedback = true,
  ...props
}) => {
  const refreshStarted = useRef(false);

  useEffect(() => {
    if (refreshing && !refreshStarted.current && hapticFeedback) {
      refreshStarted.current = true;
      HapticPatterns.pullRefresh();
    } else if (!refreshing) {
      refreshStarted.current = false;
    }
  }, [refreshing, hapticFeedback]);

  const handleRefresh = () => {
    if (hapticFeedback) {
      HapticPatterns.pullRefresh();
    }
    onRefresh && onRefresh();
  };

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={tintColor}
      colors={colors}
      progressBackgroundColor={progressBackgroundColor}
      size={size}
      {...props}
    />
  );
};

export default PullToRefresh;
