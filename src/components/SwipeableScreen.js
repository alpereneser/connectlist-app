import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { SafeAreaView as SafeArea } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width

const SwipeableScreen = ({ children, onSwipeBack, enabled = true }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastGestureState = useRef(null);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes from the left edge
      return (
        enabled &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        gestureState.dx > 0 &&
        evt.nativeEvent.pageX < 50 // Start from left edge
      );
    },

    onPanResponderGrant: () => {
      translateX.setOffset(translateX._value);
      translateX.setValue(0);
    },

    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx > 0) {
        // Only allow positive movement (right direction)
        translateX.setValue(Math.min(gestureState.dx, SCREEN_WIDTH * 0.8));
      }
    },

    onPanResponderRelease: (evt, gestureState) => {
      translateX.flattenOffset();

      if (gestureState.dx > SWIPE_THRESHOLD && gestureState.vx > 0.3) {
        // Complete the swipe back
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeBack && onSwipeBack();
          translateX.setValue(0);
        });
      } else {
        // Snap back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
  });

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <Animated.View
        style={[
          { flex: 1 },
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </SafeArea>
  );
};

export default SwipeableScreen;
