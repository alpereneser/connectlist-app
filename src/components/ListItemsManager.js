import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { supabase } from '../utils/supabase';
import { HapticPatterns } from '../utils/haptics';

const ListItemsManager = ({
  visible,
  onClose,
  listId,
  category,
  currentItems = [],
  onItemsUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'current'

  // API Keys
  const GOOGLE_API_KEY = 'AIzaSyCEQZ1ri472vtTCiexDsriTKZTIPQoRJkY';
  const TMDB_API_KEY = '378b6eb3c69f21d0815d31c4bf5f19a4';
  const TMDB_ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNzhiNmViM2M2OWYyMWQwODE1ZDMxYzRiZjVmMTlhNCIsIm5iZiI6MTcxODY4NjkyNC41MjQ5OTk5LCJzdWIiOiI2NjcxMTRjY2Y4NDhiMmQ1NTM2YWE5YTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.4E-BfHAbJT4XgMJF9mG9OM4Rc3XdGzbd5n47acQ3tKw';
  const RAWG_API_KEY = 'd4b747af4c42469293a56cb985354e36';

  const searchContent = async query => {
    if (!query.trim()) {return;}

    setIsLoading(true);
    try {
      let searchUrl = '';
      let headers = {};

      switch (category?.toLowerCase()) {
        case 'musics':
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=20`;
          break;
        case 'videos':
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=20`;
          break;
        case 'movies':
          searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'series':
          searchUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'people':
          searchUrl = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'games':
          searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20`;
          break;
        case 'books':
          searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=20`;
          break;
        case 'places':
          searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
          break;
        default:
          return;
      }

      const response = await fetch(searchUrl, { headers });
      const data = await response.json();

      let formattedResults = [];

      // Map category to valid database type
      const getValidType = category => {
        const categoryLower = category?.toLowerCase();
        switch (categoryLower) {
          case 'musics':
            return 'video'; // Map musics to video type (YouTube content)
          case 'videos':
            return 'video';
          case 'movies':
            return 'movie';
          case 'series':
            return 'series';
          case 'games':
            return 'game';
          case 'books':
            return 'book';
          case 'people':
            return 'person';
          case 'places':
            return 'place';
          default:
            return 'video'; // fallback
        }
      };

      if (
        category?.toLowerCase() === 'musics' ||
        category?.toLowerCase() === 'videos'
      ) {
        formattedResults =
          data.items?.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            image_url: item.snippet.thumbnails.medium?.url,
            type: 'video', // Always use 'video' for YouTube content
            year: new Date(item.snippet.publishedAt).getFullYear(),
          })) || [];
      } else if (category?.toLowerCase() === 'movies') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id.toString(),
            title: item.title,
            description: item.overview,
            image_url: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            type: 'movie',
            year: item.release_date
              ? new Date(item.release_date).getFullYear()
              : null,
          })) || [];
      } else if (category?.toLowerCase() === 'series') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id.toString(),
            title: item.name,
            description: item.overview,
            image_url: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            type: 'series',
            year: item.first_air_date
              ? new Date(item.first_air_date).getFullYear()
              : null,
          })) || [];
      } else if (category?.toLowerCase() === 'people') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id.toString(),
            title: item.name,
            description: item.known_for_department,
            image_url: item.profile_path
              ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
              : null,
            type: 'person',
            year: null,
          })) || [];
      } else if (category?.toLowerCase() === 'games') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id.toString(),
            title: item.name,
            description: item.genres?.map(g => g.name).join(', '),
            image_url: item.background_image,
            type: 'game',
            year: item.released ? new Date(item.released).getFullYear() : null,
          })) || [];
      } else if (category?.toLowerCase() === 'books') {
        formattedResults =
          data.items?.map(item => ({
            id: item.id,
            title: item.volumeInfo.title,
            description: item.volumeInfo.authors?.join(', '),
            image_url: item.volumeInfo.imageLinks?.thumbnail,
            type: 'book',
            year: item.volumeInfo.publishedDate
              ? new Date(item.volumeInfo.publishedDate).getFullYear()
              : null,
          })) || [];
      } else if (category?.toLowerCase() === 'places') {
        formattedResults =
          data.results?.map(item => ({
            id: item.place_id,
            title: item.name,
            description: item.formatted_address,
            image_url: item.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : null,
            type: 'place',
            year: null,
          })) || [];
      }

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    HapticPatterns.buttonPress();
    searchContent(searchQuery);
  };

  const toggleItemSelection = item => {
    HapticPatterns.selection();
    const isSelected = selectedItems.find(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(
        selectedItems.filter(selected => selected.id !== item.id),
      );
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const addSelectedItems = async () => {
    if (selectedItems.length === 0) {return;}

    try {
      HapticPatterns.buttonPress();
      setIsLoading(true);

      // Check for existing items to prevent duplicates
      const { data: existingItems } = await supabase
        .from('list_items')
        .select('external_id, position')
        .eq('list_id', listId);

      const existingExternalIds =
        existingItems?.map(item => item.external_id) || [];
      const maxPosition =
        existingItems?.reduce((max, item) => Math.max(max, item.position), 0) ||
        0;

      // Filter out items that already exist
      const newItems = selectedItems.filter(
        item => !existingExternalIds.includes(item.id),
      );

      if (newItems.length === 0) {
        Alert.alert('Info', 'All selected items are already in the list');
        setSelectedItems([]);
        return;
      }

      if (newItems.length < selectedItems.length) {
        const duplicateCount = selectedItems.length - newItems.length;
        Alert.alert(
          'Info',
          `${duplicateCount} item(s) already exist in the list. Adding ${newItems.length} new item(s).`,
        );
      }

      // Prepare items for insertion
      const itemsToInsert = newItems.map((item, index) => ({
        list_id: listId,
        external_id: item.id, // Map API id to external_id
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        type: item.type,
        year: item.year?.toString() || null, // Convert year to string as per schema
        position: maxPosition + index + 1,
      }));

      // Debug logging
      console.log('Category:', category);
      console.log('Items to insert:', itemsToInsert);
      console.log('First item type:', itemsToInsert[0]?.type);

      const { error } = await supabase.from('list_items').insert(itemsToInsert);

      if (error) {
        console.error('Error adding items:', error);
        Alert.alert('Error', 'Failed to add items to list');
        return;
      }

      Alert.alert('Success', `Added ${newItems.length} item(s) to list`);
      setSelectedItems([]);
      setSearchResults([]);
      setSearchQuery('');

      if (onItemsUpdated) {
        onItemsUpdated();
      }
    } catch (error) {
      console.error('Error adding items:', error);
      Alert.alert('Error', 'Failed to add items to list');
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async itemId => {
    try {
      HapticPatterns.buttonPress();

      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing item:', error);
        Alert.alert('Error', 'Failed to remove item');
        return;
      }

      if (onItemsUpdated) {
        onItemsUpdated();
      }
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const renderSearchResult = ({ item }) => {
    const isSelected = selectedItems.find(selected => selected.id === item.id);
    const isInList = currentItems.find(
      current => current.external_id === item.id,
    );

    return (
      <TouchableOpacity
        style={[
          styles.resultItem,
          isSelected && styles.selectedResultItem,
          isInList && styles.alreadyInListItem,
        ]}
        onPress={() => !isInList && toggleItemSelection(item)}
        activeOpacity={isInList ? 0.5 : 0.7}
        disabled={isInList}
      >
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
        )}

        <View style={styles.resultContent}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.description && (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {item.year && <Text style={styles.resultYear}>{item.year}</Text>}

          {isInList && (
            <Text style={styles.alreadyInListText}>Already in list</Text>
          )}
        </View>

        <View style={styles.selectionIndicator}>
          {isInList ? (
            <Feather name="check" size={20} color={Colors.success} />
          ) : isSelected ? (
            <Feather name="check-circle" size={20} color={Colors.orange} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCurrentItem = ({ item }) => (
    <View style={styles.currentItem}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
      )}

      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.description && (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.year && <Text style={styles.resultYear}>{item.year}</Text>}
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => {
          Alert.alert('Remove Item', `Remove "${item.title}" from list?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => removeItem(item.id),
            },
          ]);
        }}
        activeOpacity={0.7}
      >
        <Feather name="trash-2" size={16} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Items</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'search' && styles.activeTabText,
              ]}
            >
              Add Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'current' && styles.activeTab]}
            onPress={() => setActiveTab('current')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'current' && styles.activeTabText,
              ]}
            >
              Current Items ({currentItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'search' ? (
          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Feather name="search" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${category?.toLowerCase()}...`}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            {selectedItems.length > 0 && (
              <View style={styles.selectedCounter}>
                <Text style={styles.selectedText}>
                  {selectedItems.length} item(s) selected
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addSelectedItems}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.addButtonText}>Add to List</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather
                    name="search"
                    size={48}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    {isLoading ? 'Searching...' : 'Search for content to add'}
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          <View style={styles.content}>
            <FlatList
              data={currentItems}
              renderItem={renderCurrentItem}
              keyExtractor={item => item.id}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather
                    name="inbox"
                    size={48}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    No items in this list yet
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    margin: Spacing.medium,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.small,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.orange,
  },
  tabText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.medium,
    gap: Spacing.small,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: Spacing.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: Spacing.small,
    marginLeft: Spacing.small,
  },
  searchButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  selectedCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.orangeLight,
    padding: Spacing.medium,
    borderRadius: 12,
    marginBottom: Spacing.medium,
  },
  selectedText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.white,
  },
  addButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.orange,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
  },
  selectedResultItem: {
    backgroundColor: Colors.orange + '15',
    borderWidth: 1,
    borderColor: Colors.orange,
  },
  alreadyInListItem: {
    backgroundColor: Colors.success + '10',
    opacity: 0.7,
  },
  currentItem: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.medium,
    backgroundColor: Colors.border,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  resultYear: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  alreadyInListText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.success,
    marginTop: 4,
  },
  selectionIndicator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.large * 2,
  },
  emptyText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.medium,
  },
});

export default ListItemsManager;
