import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { 
  ListBullets, 
  MapPin, 
  FilmStrip, 
  BookOpen, 
  Television, 
  User, 
  VideoCamera 
} from 'phosphor-react-native';

const SubHeader = ({ onCategoryChange, selectedCategory = 'all' }) => {
  const categories = [
    {
      id: 'all',
      label: 'All Lists',
      icon: ListBullets,
    },
    {
      id: 'place',
      label: 'Place Lists',
      icon: MapPin,
    },
    {
      id: 'movie',
      label: 'Movie Lists',
      icon: FilmStrip,
    },
    {
      id: 'book',
      label: 'Book Lists',
      icon: BookOpen,
    },
    {
      id: 'tv',
      label: 'TV Show Lists',
      icon: Television,
    },
    {
      id: 'person',
      label: 'Person Lists',
      icon: User,
    },
    {
      id: 'video',
      label: 'Video Lists',
      icon: VideoCamera,
    },
  ];

  const handleCategoryPress = (categoryId) => {
    onCategoryChange?.(categoryId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={120}
        snapToAlignment="start"
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected
              ]}
              onPress={() => handleCategoryPress(category.id)}
              activeOpacity={0.7}
            >
              <Icon 
                size={20} 
                color={isSelected ? '#f97316' : '#6b7280'} 
                weight={isSelected ? 'fill' : 'regular'}
              />
              <Text style={[
                styles.categoryText,
                isSelected && styles.categoryTextSelected
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    height: 60,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: 'transparent',
    height: 60,
    justifyContent: 'center',
  },
  categoryItemSelected: {
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    marginBottom: -1,
  },
  categoryText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#f97316',
    fontWeight: '600',
  },
});

export default SubHeader;