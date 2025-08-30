import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
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

const SearchContentScreen = ({
  onTabPress,
  category,
  onItemsSelected,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
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

      switch (category.name) {
        case 'Musics':
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=20`;
          break;
        case 'Videos':
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=20`;
          break;
        case 'Movies':
          searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'Series':
          searchUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'People':
          searchUrl = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'Games':
          searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20`;
          break;
        case 'Books':
          searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=20`;
          break;
        case 'Places':
          searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
          break;
        default:
          return;
      }

      const response = await fetch(searchUrl, { headers });
      const data = await response.json();

      let formattedResults = [];

      if (category.name === 'Musics' || category.name === 'Videos') {
        formattedResults =
          data.items?.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url,
            channelTitle: item.snippet.channelTitle,
            type: category.name === 'Musics' ? 'music' : 'video',
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          })) || [];
      } else if (category.name === 'Movies') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id,
            title: item.title,
            description: item.overview,
            thumbnail: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            releaseDate: item.release_date,
            rating: item.vote_average,
            type: 'movie',
          })) || [];
      } else if (category.name === 'Series') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id,
            title: item.name,
            description: item.overview,
            thumbnail: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            releaseDate: item.first_air_date,
            rating: item.vote_average,
            type: 'series',
          })) || [];
      } else if (category.name === 'People') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id,
            title: item.name,
            description: item.known_for_department,
            thumbnail: item.profile_path
              ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
              : null,
            knownFor: item.known_for
              ?.map(work => work.title || work.name)
              .join(', '),
            type: 'person',
          })) || [];
      } else if (category.name === 'Games') {
        formattedResults =
          data.results?.map(item => ({
            id: item.id,
            title: item.name,
            description: item.genres?.map(g => g.name).join(', '),
            thumbnail: item.background_image,
            rating: item.rating,
            released: item.released,
            platforms: item.platforms?.map(p => p.platform.name).join(', '),
            type: 'game',
          })) || [];
      } else if (category.name === 'Books') {
        formattedResults =
          data.items?.map(item => ({
            id: item.id,
            title: item.volumeInfo.title,
            description: item.volumeInfo.description,
            thumbnail: item.volumeInfo.imageLinks?.thumbnail,
            authors: item.volumeInfo.authors?.join(', '),
            type: 'book',
          })) || [];
      } else if (category.name === 'Places') {
        formattedResults =
          data.results?.map(item => ({
            id: item.place_id,
            title: item.name,
            description: item.formatted_address,
            thumbnail: item.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : null,
            rating: item.rating,
            type: 'place',
          })) || [];
      }

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    searchContent(searchQuery);
  };

  const toggleItemSelection = item => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isSelected = selectedItems.find(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(
        selectedItems.filter(selected => selected.id !== item.id),
      );
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleAddSelected = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (selectedItems.length > 0 && onItemsSelected) {
      onItemsSelected(selectedItems);
    }
  };

  const handleItemPress = item => {
    if (!item || !item.type) {return;}

    const itemType = item.type.toLowerCase();
    const itemId = item.id;

    switch (itemType) {
      case 'movie':
        onNavigate('MovieDetails', { movieId: itemId });
        break;
      case 'series':
      case 'tv':
        onNavigate('SeriesDetails', { seriesId: itemId });
        break;
      case 'book':
        onNavigate('BookDetails', { bookId: itemId });
        break;
      case 'game':
        onNavigate('GameDetails', { gameId: itemId });
        break;
      case 'person':
        onNavigate('PersonDetails', { personId: itemId });
        break;
      case 'place':
        onNavigate('PlaceDetails', { placeId: itemId });
        break;
      case 'music':
      case 'video':
        onNavigate('VideoDetails', { videoId: itemId });
        break;
      default:
        console.log('Unknown item type:', itemType);
        break;
    }
  };

  const extractYouTubeVideoId = url => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleYouTubeLinkAdd = async () => {
    if (!youtubeLink.trim()) {return;}

    const videoId = extractYouTubeVideoId(youtubeLink);
    if (!videoId) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        const newItem = {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.medium?.url,
          channelTitle: video.snippet.channelTitle,
          type: 'video',
          url: youtubeLink,
        };

        // Check if already selected
        const isAlreadySelected = selectedItems.find(
          item => item.id === newItem.id,
        );
        if (!isAlreadySelected) {
          setSelectedItems([...selectedItems, newItem]);
        }
        setYoutubeLink('');
      } else {
        alert('Video not found or invalid URL');
      }
    } catch (error) {
      console.error('YouTube link error:', error);
      alert('Error adding YouTube video');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchResult = ({ item }) => {
    const isSelected = selectedItems.find(selected => selected.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.resultItem, isSelected && styles.selectedResultItem]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => toggleItemSelection(item)}
        activeOpacity={0.6}
      >
        {item.thumbnail && (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        )}

        <View style={styles.resultContent}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title || 'Untitled'}
          </Text>

          {item.channelTitle && (
            <Text style={styles.resultSubtitle}>{item.channelTitle}</Text>
          )}

          {item.authors && (
            <Text style={styles.resultSubtitle}>{item.authors}</Text>
          )}

          {item.knownFor && (
            <Text style={styles.resultSubtitle}>{item.knownFor}</Text>
          )}

          {item.releaseDate && (
            <Text style={styles.resultSubtitle}>
              {new Date(item.releaseDate).getFullYear()}
            </Text>
          )}

          {item.released && (
            <Text style={styles.resultSubtitle}>Released: {item.released}</Text>
          )}

          {item.platforms && (
            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {item.platforms}
            </Text>
          )}

          {item.rating && (
            <View style={styles.ratingContainer}>
              <Feather name="star" size={12} color={Colors.orange} />
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
          )}

          {item.description && (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={styles.selectionIndicator}>
          {isSelected && (
            <Feather name="check-circle" size={20} color={Colors.orange} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout
      title="Search Content"
      showBackButton={true}
      rightIconName="message-circle"
      onRightPress={() => onNavigate && onNavigate('messages')}
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab="search"
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
          <Text style={styles.title}>Add {category.name}</Text>
          <Text style={styles.subtitle}>
            Search and select items for your list
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather
              name="search"
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${category?.name?.toLowerCase()}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.6}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {category.name === 'Videos' && (
          <View style={styles.linkContainer}>
            <Text style={styles.linkLabel}>Or paste YouTube link:</Text>
            <View style={styles.linkInputContainer}>
              <TextInput
                style={styles.linkInput}
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeLink}
                onChangeText={setYoutubeLink}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.addLinkButton}
                onPress={handleYouTubeLinkAdd}
                activeOpacity={0.6}
              >
                <Feather name="plus" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedItems.length > 0 && (
          <View style={styles.selectedCounter}>
            <Text style={styles.selectedText}>
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
              selected
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.6}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
              <Feather name="search" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {isLoading
                  ? 'Searching...'
                  : 'Search for content to add to your list'}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {selectedItems.length > 0 && (
        <View style={styles.selectedItemsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedItemsScroll}
          >
            {selectedItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.selectedItemCard}
                onPress={() => toggleItemSelection(item)}
                activeOpacity={0.6}
              >
                {item.thumbnail && (
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.selectedItemThumbnail}
                  />
                )}
                <Text style={styles.selectedItemTitle} numberOfLines={2}>
                  {item.title || 'Untitled'}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleItemSelection(item)}
                >
                  <Feather name="x" size={12} color={Colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.bottomContinueButton}
            onPress={handleContinue}
            activeOpacity={0.6}
          >
            <Text style={styles.bottomContinueText}>
              Continue with {selectedItems.length} item
              {selectedItems.length > 1 ? 's' : ''}
            </Text>
            <Feather name="arrow-right" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing.medium,
  },
  headerSection: {
    marginBottom: Spacing.medium,
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
    borderRadius: 16,
    paddingHorizontal: Spacing.medium,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: Spacing.small,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: Spacing.small,
  },
  searchButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 16,
    justifyContent: 'center',
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
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
    borderRadius: 16,
    marginBottom: Spacing.medium,
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.white,
  },
  continueButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
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
    borderRadius: 16,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedResultItem: {
    backgroundColor: Colors.orange + '15',
    transform: [{ scale: 1.02 }],
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: Spacing.small,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rating: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.orange,
    marginLeft: 2,
  },
  resultDescription: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  selectionIndicator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  selectedItemsContainer: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.medium,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedItemsScroll: {
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.small,
  },
  selectedItemCard: {
    width: 80,
    marginRight: Spacing.small,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.tiny,
    position: 'relative',
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedItemThumbnail: {
    width: '100%',
    height: 60,
    borderRadius: 6,
    marginBottom: Spacing.tiny,
  },
  selectedItemTitle: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContinueButton: {
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    paddingVertical: Spacing.small,
    borderRadius: 12,
    gap: Spacing.small,
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomContinueText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  linkContainer: {
    marginBottom: Spacing.medium,
  },
  linkLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  linkInputContainer: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  linkInput: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addLinkButton: {
    backgroundColor: Colors.orange,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchContentScreen;
