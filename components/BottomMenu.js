import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  House, 
  MagnifyingGlass, 
  Plus, 
  Bell, 
  User 
} from 'phosphor-react-native';
import CategoryPopup from './CategoryPopup';
import { hapticPatterns } from '../utils/haptics';
import { a11yProps } from '../utils/accessibility';
import tokens from '../utils/designTokens';

const BottomMenu = ({ 
  activeTab = 'home',
  onTabPress,
  showCreateButton = true,
  onCategorySelect 
}) => {
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const insets = useSafeAreaInsets();
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: House,
    },
    {
      id: 'search',
      label: 'Search',
      icon: MagnifyingGlass,
    },
    {
      id: 'create',
      label: 'Create',
      icon: Plus,
      isSpecial: true,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  const handleTabPress = (tabId) => {
    if (tabId === 'create') {
      hapticPatterns.buttonPress('primary');
      setShowCategoryPopup(true);
    } else {
      hapticPatterns.tabSelection();
      onTabPress?.(tabId);
    }
  };

  const handleCategorySelect = (category) => {
    hapticPatterns.listItemSelection();
    onCategorySelect?.(category);
    setShowCategoryPopup(false);
  };

  const handleClosePopup = () => {
    setShowCategoryPopup(false);
  };

  return (
    <View style={[
      styles.safeArea,
      { paddingBottom: insets.bottom }
    ]}>
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const isSpecial = tab.isSpecial && showCreateButton;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isSpecial && styles.specialTabItem
              ]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
              {...a11yProps.tab(
                tab.label, 
                isSelected, 
                index, 
                tabs.length
              )}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[
                styles.iconContainer,
                isSpecial && styles.specialIconContainer,
                isSelected && !isSpecial && styles.selectedIconContainer
              ]}>
                <Icon 
                  size={isSpecial ? 28 : 24} 
                  color={
                    isSpecial 
                      ? tokens.colors.background.primary 
                      : isSelected 
                        ? tokens.colors.primary 
                        : tokens.colors.gray[500]
                  } 
                  weight={isSelected && !isSpecial ? 'fill' : 'regular'}
                />
              </View>
              {!isSpecial && (
                <Text style={[
                  styles.tabLabel,
                  isSelected && styles.selectedTabLabel
                ]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <CategoryPopup
        visible={showCategoryPopup}
        onClose={handleClosePopup}
        onCategorySelect={handleCategorySelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: tokens.colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.gray[200],
    ...tokens.shadows.medium,
    elevation: 20,
    zIndex: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
    backgroundColor: tokens.colors.background.primary,
    minHeight: Platform.OS === 'ios' ? 70 : 64,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xs,
    minHeight: tokens.touchTarget.minimum,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: tokens.borderRadius.medium,
  },
  specialTabItem: {
    // Create button specific styles - elevated above other tabs
  },
  specialIconContainer: {
    backgroundColor: tokens.colors.primary,
    width: tokens.touchTarget.large,
    height: tokens.touchTarget.large,
    borderRadius: tokens.touchTarget.large / 2,
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  selectedIconContainer: {
    backgroundColor: tokens.colors.primaryLight,
  },
  tabLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.gray[500],
    marginTop: 2,
    textAlign: 'center',
  },
  selectedTabLabel: {
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});

export default BottomMenu;