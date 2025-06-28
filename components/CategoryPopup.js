import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import {
  MapPin,
  FilmStrip,
  Television,
  BookOpen,
  GameController,
  VideoCamera,
  User,
  MusicNote,
  X,
} from 'phosphor-react-native';

const CategoryPopup = ({ visible, onClose, onCategorySelect }) => {
  const categories = [
    {
      id: 'place',
      name: 'Places',
      icon: MapPin,
      description: 'Restaurants, cafes, travel destinations',
      color: '#10b981',
    },
    {
      id: 'movie',
      name: 'Movies',
      icon: FilmStrip,
      description: 'Films, documentaries, cinema',
      color: '#f59e0b',
    },
    {
      id: 'tv',
      name: 'TV Shows',
      icon: Television,
      description: 'Series, episodes, streaming content',
      color: '#8b5cf6',
    },
    {
      id: 'book',
      name: 'Books',
      icon: BookOpen,
      description: 'Novels, audiobooks, reading lists',
      color: '#06b6d4',
    },
    {
      id: 'game',
      name: 'Games',
      icon: GameController,
      description: 'Video games, board games, apps',
      color: '#ef4444',
    },
    {
      id: 'video',
      name: 'Videos',
      icon: VideoCamera,
      description: 'YouTube, tutorials, content creators',
      color: '#f97316',
    },
    {
      id: 'person',
      name: 'People',
      icon: User,
      description: 'Influencers, celebrities, contacts',
      color: '#84cc16',
    },
    {
      id: 'music',
      name: 'Music',
      icon: MusicNote,
      description: 'Songs, albums, artists, playlists',
      color: '#ec4899',
    },
    {
      id: 'poetry',
      name: 'Poetry',
      icon: BookOpen,
      description: 'Poems, verses, literary works',
      color: '#6366f1',
    },
  ];

  const handleCategoryPress = (category) => {
    onCategorySelect(category);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
        pointerEvents="box-none"
      >
        <View style={styles.container} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.popup}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            pointerEvents="auto"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Choose Category</Text>
              <Text style={styles.subtitle}>
                Select a category to add content to your list
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Categories Grid */}
            <ScrollView 
              style={styles.categoriesScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.categoriesContainer}>
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryItem}
                      onPress={() => handleCategoryPress(category)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: `${category.color}15` }]}>
                        <Icon size={24} color={category.color} weight="regular" />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    width: '100%',
    maxHeight: '95%',
    minHeight: 550,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  categoryItem: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default CategoryPopup;