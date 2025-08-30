import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { HapticPatterns } from '../utils/haptics';

const SwipeableRow = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  hapticFeedback = true,
  style = {},
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowRef = useRef(null);
  const swipeActivated = useRef(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false },
  );

  const onHandlerStateChange = event => {
    const { state, translationX } = event.nativeEvent;

    if (state === State.END) {
      const shouldSwipeLeft = translationX > swipeThreshold;
      const shouldSwipeRight = translationX < -swipeThreshold;

      if (shouldSwipeLeft && onSwipeLeft) {
        if (hapticFeedback) {HapticPatterns.swipeAction();}
        onSwipeLeft();
        // Animate to full swipe
        Animated.timing(translateX, {
          toValue: 300,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else if (shouldSwipeRight && onSwipeRight) {
        if (hapticFeedback) {HapticPatterns.swipeAction();}
        onSwipeRight();
        // Animate to full swipe
        Animated.timing(translateX, {
          toValue: -300,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else {
        // Snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }

      swipeActivated.current = false;
    } else if (state === State.ACTIVE) {
      // Haptic feedback when threshold is reached
      if (
        !swipeActivated.current &&
        Math.abs(translationX) > swipeThreshold &&
        hapticFeedback
      ) {
        swipeActivated.current = true;
        HapticPatterns.selection();
      }
    }
  };

  const renderLeftActions = () => {
    if (!leftActions.length) {return null;}

    const actionWidth = 80;
    const totalWidth = leftActions.length * actionWidth;

    return (
      <View
        style={[
          styles.actionsContainer,
          styles.leftActions,
          { width: totalWidth },
        ]}
      >
        {leftActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor || Colors.success,
                width: actionWidth,
              },
            ]}
            onPress={() => {
              if (hapticFeedback) {HapticPatterns.buttonPress();}
              action.onPress && action.onPress();
            }}
          >
            <Feather
              name={action?.icon || 'circle'}
              size={20}
              color={action.color || Colors.white}
            />
            {action.text && (
              <Text
                style={[
                  styles.actionText,
                  { color: action.color || Colors.white },
                ]}
              >
                {action.text}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRightActions = () => {
    if (!rightActions.length) {return null;}

    const actionWidth = 80;
    const totalWidth = rightActions.length * actionWidth;

    return (
      <View
        style={[
          styles.actionsContainer,
          styles.rightActions,
          { width: totalWidth },
        ]}
      >
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor || Colors.error,
                width: actionWidth,
              },
            ]}
            onPress={() => {
              if (hapticFeedback) {HapticPatterns.buttonPress();}
              action.onPress && action.onPress();
            }}
          >
            <Feather
              name={action?.icon || 'circle'}
              size={20}
              color={action.color || Colors.white}
            />
            {action.text && (
              <Text
                style={[
                  styles.actionText,
                  { color: action.color || Colors.white },
                ]}
              >
                {action.text}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderLeftActions()}
      {renderRightActions()}

      <PanGestureHandler
        ref={rowRef}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.row,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  row: {
    backgroundColor: Colors.background,
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.medium,
  },
  actionText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
});

export default SwipeableRow;
