import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CustomModal = ({
  visible,
  onClose,
  title,
  subtitle,
  actions = [],
  type = 'default', // 'default', 'destructive', 'success'
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconForType = () => {
    switch (type) {
      case 'destructive':
        return { name: 'trash-2', color: Colors.instagramRed };
      case 'success':
        return { name: 'check-circle', color: Colors.success };
      default:
        return { name: 'info', color: Colors.instagramBlue };
    }
  };

  const icon = getIconForType();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${icon.color}15` },
            ]}
          >
            <Feather name={icon.name} size={32} color={icon.color} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  action.style === 'destructive' && styles.destructiveButton,
                  action.style === 'primary' && styles.primaryButton,
                  index === 0 && actions.length > 1 && styles.firstButton,
                ]}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.style === 'destructive' && styles.destructiveText,
                    action.style === 'primary' && styles.primaryText,
                  ]}
                >
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.large,
    marginHorizontal: Spacing.large,
    maxWidth: screenWidth - Spacing.large * 2,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.medium,
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  title: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    gap: Spacing.small,
  },
  actionButton: {
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
  },
  firstButton: {
    marginBottom: Spacing.tiny,
  },
  primaryButton: {
    backgroundColor: Colors.instagramBlue,
  },
  destructiveButton: {
    backgroundColor: Colors.instagramRed,
  },
  actionText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  primaryText: {
    color: Colors.white,
  },
  destructiveText: {
    color: Colors.white,
  },
});

export default CustomModal;
