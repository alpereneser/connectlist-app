import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors, Spacing } from '../constants';
import { AnimationUtils } from '../utils/animations';
import { HapticPatterns } from '../utils/haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedModal = ({
  visible,
  onClose,
  children,
  animationType = 'slide', // slide, fade, scale
  position = 'bottom', // bottom, center, top
  closeOnBackdrop = true,
  showCloseButton = false,
  backdropOpacity = 0.5,
  hapticFeedback = true,
  style = {},
  contentStyle = {},
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      if (hapticFeedback) {
        HapticPatterns.medium();
      }

      // Show animations
      const animations = [];

      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      );

      if (animationType === 'slide') {
        slideAnim.setValue(position === 'top' ? -screenHeight : screenHeight);
        animations.push(
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        );
      } else if (animationType === 'scale') {
        scaleAnim.setValue(0.8);
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        );
      }

      Animated.parallel(animations).start();
    } else {
      // Hide animations
      const animations = [];

      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      );

      if (animationType === 'slide') {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: position === 'top' ? -screenHeight : screenHeight,
            duration: 200,
            useNativeDriver: true,
          }),
        );
      } else if (animationType === 'scale') {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        );
      }

      Animated.parallel(animations).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (hapticFeedback) {
      HapticPatterns.light();
    }
    onClose && onClose();
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      handleClose();
    }
  };

  const getContentStyle = () => {
    const baseStyle = [styles.content];

    if (position === 'bottom') {
      baseStyle.push(styles.bottomContent);
    } else if (position === 'center') {
      baseStyle.push(styles.centerContent);
    } else if (position === 'top') {
      baseStyle.push(styles.topContent);
    }

    // Animation transforms
    const transforms = [];

    if (animationType === 'slide') {
      transforms.push({ translateY: slideAnim });
    } else if (animationType === 'scale') {
      transforms.push({ scale: scaleAnim });
    }

    if (transforms.length > 0) {
      baseStyle.push({ transform: transforms });
    }

    return baseStyle;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
      {...props}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, backdropOpacity],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Content */}
        <Animated.View style={[getContentStyle(), contentStyle, style]}>
          {/* Close button */}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <View style={styles.closeButtonInner} />
            </TouchableOpacity>
          )}

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.black,
  },
  content: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.large,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomContent: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: Platform.OS === 'ios' ? Spacing.large + 20 : Spacing.large,
  },
  centerContent: {
    marginHorizontal: Spacing.large,
    marginVertical: 'auto',
    borderRadius: 20,
  },
  topContent: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop:
      Platform.OS === 'ios'
        ? Spacing.large + StatusBar.currentHeight
        : Spacing.large,
  },
  closeButton: {
    alignSelf: 'center',
    marginBottom: Spacing.medium,
    padding: Spacing.small,
  },
  closeButtonInner: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textSecondary,
    borderRadius: 2,
    opacity: 0.3,
  },
});

export default AnimatedModal;
