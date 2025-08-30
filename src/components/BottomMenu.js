import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize } from '../constants';
import { HapticPatterns } from '../utils/haptics';
import { AnimationUtils } from '../utils/animations';

const BottomMenu = ({ onTabPress, activeTab = 'home', badges = {} }) => {
  const scaleAnims = useRef({}).current;

  const handleTabPress = tabName => {
    // Haptic feedback
    HapticPatterns.tabSwitch();

    // Scale animation
    if (!scaleAnims[tabName]) {
      scaleAnims[tabName] = new Animated.Value(1);
    }

    const microInteraction = AnimationUtils.createMicroInteraction;
    microInteraction.heartBeat(scaleAnims[tabName]).start();

    onTabPress && onTabPress(tabName);
  };

  const tabs = [
    { name: 'home', icon: 'home' },
    { name: 'search', icon: 'search' },
    { name: 'add', icon: 'plus' },
    { name: 'notification', icon: 'bell' },
    { name: 'profile', icon: 'user' },
  ];

  const renderBadge = tabName => {
    const badgeCount = badges[tabName];
    if (!badgeCount || badgeCount === 0) {return null;}

    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {badgeCount > 99 ? '99+' : badgeCount.toString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        if (!scaleAnims[tab.name]) {
          scaleAnims[tab.name] = new Animated.Value(1);
        }

        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabButton, tab.name === 'add' && styles.addButton]}
            onPress={() => handleTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.tabIconContainer,
                { transform: [{ scale: scaleAnims[tab.name] }] },
              ]}
            >
              <Feather
                name={tab?.icon || 'circle'}
                size={tab.name === 'add' ? 24 : 20}
                color={
                  tab.name === 'add'
                    ? Colors.white
                    : activeTab === tab.name
                      ? Colors.orange
                      : Colors.iconSecondary
                }
              />
              {renderBadge(tab.name)}
            </Animated.View>

            {/* Active tab indicator */}
            {activeTab === tab.name && tab.name !== 'add' && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.small,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.small,
    position: 'relative',
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: Colors.orange,
    borderRadius: 20,
    width: 40,
    height: 40,
    flex: 0,
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.orange,
  },
});

export default BottomMenu;
