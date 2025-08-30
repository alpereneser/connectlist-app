import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
// Haptics import with fallback
let Haptics;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Fallback if expo-haptics is not available
  Haptics = {
    impactAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  };
}
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';

const SelectCategoryScreen = ({
  onTabPress,
  onCategorySelect,
  activeTab = 'add',
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const categories = [
    {
      name: 'Places',
      icon: 'map-pin',
      description: 'Restaurants, travel destinations, local spots',
    },
    {
      name: 'Movies',
      icon: 'film',
      description: 'Must-watch films, favorites, recommendations',
    },
    {
      name: 'Series',
      icon: 'tv',
      description: 'TV shows, series, documentaries',
    },
    {
      name: 'Musics',
      icon: 'music',
      description: 'Playlists, favorite songs, artists',
    },
    {
      name: 'Books',
      icon: 'book',
      description: 'Reading lists, recommendations, reviews',
    },
    {
      name: 'People',
      icon: 'users',
      description: 'Contacts, influencers, team members',
    },
    {
      name: 'Games',
      icon: 'cpu',
      description: 'Gaming lists, favorites, recommendations',
    },
    {
      name: 'Videos',
      icon: 'video',
      description: 'YouTube videos, tutorials, entertainment',
    },
  ];

  const handleCategoryPress = category => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedCategory(category.name);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <ScreenLayout
      title="Select Category"
      showBackButton={false}
      rightIconName="message-circle"
      onRightPress={() => onNavigate && onNavigate('messages')}
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab={activeTab}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>Select Category</Text>
            <Text style={styles.subtitle}>
              Choose a category for your new list
            </Text>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.selectedCategoryCard,
                  ]}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.selectedIconContainer,
                    ]}
                  >
                    <Feather
                      name={category?.icon || 'list'}
                      size={24}
                      color={isSelected ? Colors.orange : Colors.white}
                    />
                  </View>

                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && styles.selectedCategoryName,
                    ]}
                  >
                    {category.name}
                  </Text>

                  <Text
                    style={[
                      styles.categoryDescription,
                      isSelected && styles.selectedCategoryDescription,
                    ]}
                  >
                    {category.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.medium,
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: Spacing.large,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  subtitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: Spacing.medium,
    alignItems: 'center',
    marginBottom: Spacing.medium,
    minHeight: 140,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedCategoryCard: {
    backgroundColor: Colors.orange,
    transform: [{ scale: 1.03 }],
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.small,
  },
  selectedIconContainer: {
    backgroundColor: Colors.white,
  },
  categoryName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: Colors.white,
  },
  categoryDescription: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    minHeight: 36,
  },
  selectedCategoryDescription: {
    color: Colors.white,
  },
});

export default SelectCategoryScreen;
