import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
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

const CreateListScreen = ({
  onTabPress,
  category,
  selectedItems,
  onListCreated,
  onNavigate,
}) => {
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
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

  const handleCreateList = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!listName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    const newList = {
      id: Date.now().toString(),
      name: listName.trim(),
      description: listDescription.trim(),
      category: category.name,
      items: selectedItems,
      createdAt: new Date().toISOString(),
      itemCount: selectedItems.length,
    };

    if (onListCreated) {
      onListCreated(newList);
    }
  };

  const getCategoryIcon = () => {
    return category?.icon || 'list';
  };

  return (
    <ScreenLayout
      title="Create List"
      showBackButton={false}
      rightIconName="message-circle"
      onRightPress={() => onNavigate && onNavigate('messages')}
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab="add"
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
          <View style={styles.headerSection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconContainer}>
                <Feather
                  name={getCategoryIcon()}
                  size={24}
                  color={Colors.white}
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>

            <Text style={styles.title}>Create Your List</Text>
            <Text style={styles.subtitle}>
              Add a name and description for your{' '}
              {category?.name?.toLowerCase()} list
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>List Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder={`My ${category.name} List`}
                value={listName}
                onChangeText={setListName}
                maxLength={50}
              />
              <Text style={styles.characterCount}>{listName.length}/50</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tell others what this list is about..."
                value={listDescription}
                onChangeText={setListDescription}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {listDescription.length}/200
              </Text>
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.listPreview}>
              <View style={styles.previewHeader}>
                <View style={styles.previewIconContainer}>
                  <Feather
                    name={getCategoryIcon()}
                    size={16}
                    color={Colors.white}
                  />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewListName}>
                    {listName || `My ${category.name} List`}
                  </Text>
                  <Text style={styles.previewItemCount}>
                    {selectedItems.length} items
                  </Text>
                </View>
              </View>

              {listDescription && (
                <Text style={styles.previewDescription}>{listDescription}</Text>
              )}

              {selectedItems.length > 0 && (
                <View style={styles.previewItemsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.previewItemsScroll}
                  >
                    {selectedItems.slice(0, 4).map((item, index) => (
                      <View key={item.id} style={styles.previewItemCard}>
                        {item.thumbnail && (
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={styles.previewItemThumbnail}
                          />
                        )}
                        <Text style={styles.previewItemTitle} numberOfLines={2}>
                          {item.title || 'Untitled'}
                        </Text>
                      </View>
                    ))}
                    {selectedItems.length > 4 && (
                      <View style={styles.moreItemsIndicator}>
                        <Text style={styles.moreItemsText}>
                          +{selectedItems.length - 4}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateList}
              activeOpacity={0.6}
            >
              <Feather
                name="plus"
                size={20}
                color={Colors.white}
                style={styles.buttonIcon}
              />
              <Text style={styles.createButtonText}>Create List</Text>
            </TouchableOpacity>
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
    padding: Spacing.medium,
  },
  headerSection: {
    marginBottom: Spacing.large,
    alignItems: 'center',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.small,
  },
  categoryName: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
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

  formSection: {
    marginBottom: Spacing.large,
  },
  inputGroup: {
    marginBottom: Spacing.medium,
  },
  inputLabel: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.medium,
  },
  characterCount: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.tiny,
  },
  previewSection: {
    marginBottom: Spacing.large,
  },
  previewTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  listPreview: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  previewIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.small,
  },
  previewInfo: {
    flex: 1,
  },
  previewListName: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  previewItemCount: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  previewDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: Spacing.medium,
  },
  createButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.medium,
    borderRadius: 12,
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: Spacing.small,
  },
  createButtonText: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  previewItemCard: {
    width: 80,
    marginRight: Spacing.medium,
    alignItems: 'center',
  },
  previewItemThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: Spacing.small,
  },
  previewItemTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  previewItemsContainer: {
    marginTop: Spacing.small,
    paddingTop: Spacing.small,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
  },
  previewItemsScroll: {
    paddingHorizontal: Spacing.small,
  },
  moreItemsIndicator: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  moreItemsText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
  },
});

export default CreateListScreen;
