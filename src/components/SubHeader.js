import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Haptics,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import LoadingSkeleton from './LoadingSkeleton';

const SubHeader = forwardRef(
  (
    {
      onCategoryChange,
      activeCategory: externalActiveCategory,
      isLoading = false,
    },
    ref,
  ) => {
    const [activeCategory, setActiveCategory] = useState(
      externalActiveCategory || 'All Lists',
    );
    const [isTransitioning, setIsTransitioning] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const categories = [
      { name: 'All Lists', icon: 'list' },
      { name: 'Places', icon: 'map-pin' },
      { name: 'Movies', icon: 'film' },
      { name: 'Series', icon: 'tv' },
      { name: 'Musics', icon: 'music' },
      { name: 'Books', icon: 'book' },
      { name: 'People', icon: 'users' },
      { name: 'Games', icon: 'play' },
      { name: 'Videos', icon: 'video' },
    ];

    // Expose method to parent component
    useImperativeHandle(ref, () => ({
      setActiveCategory: category => {
        setActiveCategory(category);
      },
    }));

    // Update internal state when external prop changes
    useEffect(() => {
      if (externalActiveCategory && externalActiveCategory !== activeCategory) {
        setActiveCategory(externalActiveCategory);
      }
    }, [externalActiveCategory, activeCategory]);

    const handleCategoryPress = async categoryName => {
      if (isTransitioning || categoryName === activeCategory) {return;}

      // Haptic feedback for native feel
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available on all platforms
      }

      setIsTransitioning(true);

      // Smooth transition animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setActiveCategory(categoryName);

      if (onCategoryChange) {
        await onCategoryChange(categoryName);
      }

      // Restore animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTransitioning(false);
      });
    };

    const renderIcon = (category, isActive) => {
      const iconColor = isActive ? Colors.orange : Colors.textSecondary;

      return (
        <Feather
          name={category?.icon || 'list'}
          size={16}
          color={iconColor}
          style={styles.categoryIcon}
        />
      );
    };

    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={100}
          snapToAlignment="start"
        >
          {categories.map((category, index) => {
            const isActive = activeCategory === category.name;
            return (
              <Animated.View
                key={index}
                style={{
                  opacity: isTransitioning ? fadeAnim : 1,
                  transform: [{ scale: isTransitioning ? scaleAnim : 1 }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    index === 0 && styles.firstItem,
                    index === categories.length - 1 && styles.lastItem,
                    isActive && styles.activeCategoryItem,
                    isTransitioning && styles.transitioningItem,
                  ]}
                  onPress={() => handleCategoryPress(category.name)}
                  activeOpacity={0.6}
                  disabled={isTransitioning}
                  underlayColor={Colors.backgroundSecondary}
                >
                  {isLoading && isActive ? (
                    <LoadingSkeleton
                      width={16}
                      height={16}
                      borderRadius={8}
                      style={styles.categoryIcon}
                    />
                  ) : (
                    renderIcon(category, isActive)
                  )}
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.activeCategoryText,
                      isTransitioning && styles.transitioningText,
                    ]}
                  >
                    {category.name}
                  </Text>
                  {isActive && !isLoading && (
                    <Animated.View
                      style={[
                        styles.activeIndicator,
                        { opacity: isTransitioning ? 0.5 : 1 },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Loading overlay for smooth transition */}
        {isTransitioning && (
          <View style={styles.loadingOverlay}>
            <LoadingSkeleton width={20} height={20} borderRadius={10} />
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scrollContent: {
    paddingLeft: Spacing.medium,
    paddingRight: Spacing.medium,
  },
  categoryItem: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.medium,
    marginRight: Spacing.medium,
    position: 'relative',
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 60,
    backgroundColor: 'transparent',
  },
  activeCategoryItem: {
    backgroundColor: Colors.backgroundSecondary,
    transform: [{ scale: 1.05 }],
  },
  transitioningItem: {
    opacity: 0.7,
  },
  transitioningText: {
    opacity: 0.6,
  },
  categoryIcon: {
    marginBottom: Spacing.tiny,
  },
  firstItem: {
    marginLeft: 0,
  },
  lastItem: {
    marginRight: Spacing.medium,
  },
  categoryText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeCategoryText: {
    color: Colors.orange,
    fontFamily: FontFamily.semiBold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.orange,
    borderRadius: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: Spacing.medium,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: Spacing.small,
    borderRadius: 12,
  },
});

export default SubHeader;
