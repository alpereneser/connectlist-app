import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { 
  House, 
  MagnifyingGlass, 
  Plus, 
  Bell, 
  User 
} from 'phosphor-react-native';
import CategoryPopup from './CategoryPopup';

const BottomMenu = ({ 
  activeTab = 'home',
  onTabPress,
  showCreateButton = true,
  onCategorySelect 
}) => {
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
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
      setShowCategoryPopup(true);
    } else {
      onTabPress?.(tabId);
    }
  };

  const handleCategorySelect = (category) => {
    onCategorySelect?.(category);
    setShowCategoryPopup(false);
  };

  const handleClosePopup = () => {
    setShowCategoryPopup(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
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
                      ? '#fff' 
                      : isSelected 
                        ? '#f97316' 
                        : '#6b7280'
                  } 
                  weight={isSelected && !isSpecial ? 'fill' : 'regular'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <CategoryPopup
        visible={showCategoryPopup}
        onClose={handleClosePopup}
        onCategorySelect={handleCategorySelect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    elevation: 20,
    zIndex: 20,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    minHeight: 70,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  specialTabItem: {
    // Create button özel stilleri
  },
  specialIconContainer: {
    backgroundColor: '#f97316',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedIconContainer: {
    backgroundColor: '#fff5f0',
  },
});

export default BottomMenu;