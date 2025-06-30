import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { MagnifyingGlass, Film, Book, GameController, MapPin, User, List, X, Clock, Camera, Sparkle, TrendingUp } from 'phosphor-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tmdbService } from '../services/tmdbService';
import { googleBooksService } from '../services/googleBooksService';
import { rawgService } from '../services/rawgService';
import { placesService } from '../services/placesService';
import { supabase } from '../lib/supabase';
import BottomMenu from '../components/BottomMenu';
import { SearchErrorBoundary } from '../components/ErrorBoundary';
import { SkeletonGrid, SkeletonSearchResults } from '../components/SkeletonLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tokens from '../utils/designTokens';
import { a11yProps } from '../utils/accessibility';
import { hapticPatterns } from '../utils/haptics';

const SearchScreen = ({ navigation }) => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  // Responsive grid calculation with proper spacing
  const getItemSize = () => {
    const screenPadding = tokens.spacing.screenPadding * 2; // Both sides
    const itemSpacing = tokens.spacing.sm * 2; // Between items
    const availableWidth = screenData.width - screenPadding - itemSpacing;
    return Math.floor(availableWidth / 3);
  };

  const itemSize = getItemSize();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef(null);
  const searchBarAnimation = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState([
    '🎬 Action Movies', '📚 Bestsellers', '🎮 Indie Games', 
    '☕ Coffee Shops', '🎭 Art Museums', '🏞️ Nature Parks'
  ]);
  
  // Discover data
  const [discoverMovies, setDiscoverMovies] = useState([]);
  const [discoverShows, setDiscoverShows] = useState([]);
  const [discoverGames, setDiscoverGames] = useState([]);
  const [discoverBooks, setDiscoverBooks] = useState([]);
  const [discoverPlaces, setDiscoverPlaces] = useState([]);
  
  // Loading states for each category
  const [loadingMore, setLoadingMore] = useState({
    places: false,
    movies: false,
    books: false,
    shows: false,
    games: false
  });
  
  // Search results
  const [searchResults, setSearchResults] = useState({
    movies: [],
    shows: [],
    people: [],
    games: [],
    books: [],
    places: [],
    users: [],
    lists: []
  });

  // Handle screen dimension changes for responsive design
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Load discover content and recent searches
  useEffect(() => {
    loadDiscoverContent();
    loadRecentSearches();
  }, []);

  // Load recent searches from AsyncStorage
  const loadRecentSearches = async () => {
    try {
      const recent = await AsyncStorage.getItem('recentSearches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Save search to recent searches
  const saveRecentSearch = async (query) => {
    try {
      const recent = await AsyncStorage.getItem('recentSearches');
      let searches = recent ? JSON.parse(recent) : [];
      
      // Remove if already exists
      searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
      
      // Add to beginning
      searches.unshift(query);
      
      // Keep only last 10
      searches = searches.slice(0, 10);
      
      await AsyncStorage.setItem('recentSearches', JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Generate search suggestions based on input
  const generateSuggestions = (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const commonQueries = [
      'action movies', 'comedy movies', 'horror movies', 'sci-fi movies',
      'bestseller books', 'fiction books', 'mystery books', 'romance books',
      'indie games', 'adventure games', 'strategy games', 'puzzle games',
      'restaurants', 'cafes', 'parks', 'museums', 'hotels'
    ];

    const filtered = commonQueries
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    setSearchSuggestions(filtered);
  };

  // Handle search input change
  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    setShowSuggestions(text.length > 0);
    
    // Animate search bar on focus
    if (text.length > 0 && !isSearching) {
      Animated.timing(searchBarAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (text.length === 0) {
      Animated.timing(searchBarAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    
    // Generate suggestions after a short delay
    setTimeout(() => {
      generateSuggestions(text);
    }, 300);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setShowSuggestions(searchQuery.length > 0);
    Animated.timing(searchBarAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (!searchQuery.length) {
        Animated.timing(searchBarAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }, 200);
  };

  const loadDiscoverContent = async () => {
    setLoading(true);
    try {
      // Random page numbers for variety
      const randomMoviePage = Math.floor(Math.random() * 5) + 1;
      const randomShowPage = Math.floor(Math.random() * 5) + 1;
      const randomGamePage = Math.floor(Math.random() * 3) + 1;
      
      // Load popular places
      const placesData = await placesService.getPopularPlaces();
      const shuffledPlaces = placesData.features?.sort(() => Math.random() - 0.5) || [];
      setDiscoverPlaces(shuffledPlaces.slice(0, 9));
      
      // Load popular movies with random page
      const moviesData = await tmdbService.getPopularMovies(randomMoviePage);
      const shuffledMovies = moviesData.results.sort(() => Math.random() - 0.5);
      setDiscoverMovies(shuffledMovies.slice(0, 9));
      
      // Load popular books with random query
      const bookQueries = ['bestseller', 'fiction', 'thriller', 'romance', 'mystery', 'science'];
      const randomBookQuery = bookQueries[Math.floor(Math.random() * bookQueries.length)];
      const booksData = await googleBooksService.searchBooks(randomBookQuery);
      const shuffledBooks = booksData.results?.sort(() => Math.random() - 0.5) || [];
      setDiscoverBooks(shuffledBooks.slice(0, 9));
      
      // Load popular TV shows with random page
      const showsData = await tmdbService.getPopularTVShows(randomShowPage);
      const shuffledShows = showsData.results.sort(() => Math.random() - 0.5);
      setDiscoverShows(shuffledShows.slice(0, 9));
      
      // Load popular games with random page
      const gamesData = await rawgService.getPopularGames(randomGamePage);
      const shuffledGames = gamesData.results.sort(() => Math.random() - 0.5);
      setDiscoverGames(shuffledGames.slice(0, 9));
      
    } catch (error) {
      console.error('Error loading discover content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    // Haptic feedback
    hapticPatterns.buttonPress('primary');
    
    // Save to recent searches
    await saveRecentSearch(trimmedQuery);
    
    setSearchQuery(trimmedQuery);
    setIsSearching(true);
    setLoading(true);
    setShowSuggestions(false);
    
    // Blur search input
    searchInputRef.current?.blur();
    
    try {
      const [movies, shows, people, games, books, places, { data: users }, { data: lists }] = await Promise.all([
        // Movies
        tmdbService.searchMovies(trimmedQuery),
        // TV Shows
        tmdbService.searchTVShows(trimmedQuery),
        // People
        tmdbService.searchPeople(trimmedQuery),
        // Games
        rawgService.searchGames(trimmedQuery),
        // Books
        googleBooksService.searchBooks(trimmedQuery),
        // Places
        placesService.searchPlaces(trimmedQuery),
        // Users
        supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${trimmedQuery}%,full_name.ilike.%${trimmedQuery}%`)
          .limit(10),
        // Lists
        supabase
          .from('lists')
          .select(`
            *,
            profiles:user_id (username, avatar_url)
          `)
          .ilike('title', `%${trimmedQuery}%`)
          .limit(10)
      ]);
      
      console.log('Search Results:', {
        movies: movies.results?.length || 0,
        shows: shows.results?.length || 0,
        places: places.features?.length || 0,
        books: books.results?.length || books.items?.length || 0
      });
      
      setSearchResults({
        movies: movies.results || [],
        shows: shows.results || [],
        people: people.results || [],
        games: games.results || [],
        books: books.results || books.items || [],
        places: places.features || [],
        users: users || [],
        lists: lists || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    hapticPatterns.buttonPress('secondary');
    setSearchQuery('');
    setIsSearching(false);
    setActiveTab('users');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem('recentSearches');
      setRecentSearches([]);
      hapticPatterns.buttonPress('secondary');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  // Load more functions for each category
  const loadMorePlaces = async () => {
    setLoadingMore(prev => ({ ...prev, places: true }));
    try {
      const placesData = await placesService.getPopularPlaces();
      const shuffledPlaces = placesData.features?.sort(() => Math.random() - 0.5) || [];
      const newPlaces = shuffledPlaces.slice(0, 6).map(place => ({
        ...place,
        id: `${place.id}_${Date.now()}_${Math.random()}`
      }));
      setDiscoverPlaces(prev => [...prev, ...newPlaces]);
    } catch (error) {
      console.error('Error loading more places:', error);
    } finally {
      setLoadingMore(prev => ({ ...prev, places: false }));
    }
  };

  const loadMoreMovies = async () => {
    setLoadingMore(prev => ({ ...prev, movies: true }));
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const moviesData = await tmdbService.getPopularMovies(randomPage);
      const shuffledMovies = moviesData.results.sort(() => Math.random() - 0.5);
      const existingIds = new Set(discoverMovies.map(m => m.id));
      const newMovies = shuffledMovies
        .filter(movie => !existingIds.has(movie.id))
        .slice(0, 6)
        .map(movie => ({
          ...movie,
          uniqueKey: `${movie.id}_${Date.now()}_${Math.random()}`
        }));
      setDiscoverMovies(prev => [...prev, ...newMovies]);
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setLoadingMore(prev => ({ ...prev, movies: false }));
    }
  };

  const loadMoreBooks = async () => {
    setLoadingMore(prev => ({ ...prev, books: true }));
    try {
      const bookQueries = ['bestseller', 'fiction', 'thriller', 'romance', 'mystery', 'science', 'fantasy', 'history'];
      const randomBookQuery = bookQueries[Math.floor(Math.random() * bookQueries.length)];
      const startIndex = Math.floor(Math.random() * 40);
      const booksData = await googleBooksService.searchBooks(randomBookQuery, startIndex);
      const shuffledBooks = booksData.results?.sort(() => Math.random() - 0.5) || [];
      const existingIds = new Set(discoverBooks.map(b => b.id));
      const newBooks = shuffledBooks
        .filter(book => !existingIds.has(book.id))
        .slice(0, 6)
        .map(book => ({
          ...book,
          uniqueKey: `${book.id}_${Date.now()}_${Math.random()}`
        }));
      setDiscoverBooks(prev => [...prev, ...newBooks]);
    } catch (error) {
      console.error('Error loading more books:', error);
    } finally {
      setLoadingMore(prev => ({ ...prev, books: false }));
    }
  };

  const loadMoreShows = async () => {
    setLoadingMore(prev => ({ ...prev, shows: true }));
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const showsData = await tmdbService.getPopularTVShows(randomPage);
      const shuffledShows = showsData.results.sort(() => Math.random() - 0.5);
      const existingIds = new Set(discoverShows.map(s => s.id));
      const newShows = shuffledShows
        .filter(show => !existingIds.has(show.id))
        .slice(0, 6)
        .map(show => ({
          ...show,
          uniqueKey: `${show.id}_${Date.now()}_${Math.random()}`
        }));
      setDiscoverShows(prev => [...prev, ...newShows]);
    } catch (error) {
      console.error('Error loading more shows:', error);
    } finally {
      setLoadingMore(prev => ({ ...prev, shows: false }));
    }
  };

  const loadMoreGames = async () => {
    setLoadingMore(prev => ({ ...prev, games: true }));
    try {
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const gamesData = await rawgService.getPopularGames(randomPage);
      const shuffledGames = gamesData.results.sort(() => Math.random() - 0.5);
      const existingIds = new Set(discoverGames.map(g => g.id));
      const newGames = shuffledGames
        .filter(game => !existingIds.has(game.id))
        .slice(0, 6)
        .map(game => ({
          ...game,
          uniqueKey: `${game.id}_${Date.now()}_${Math.random()}`
        }));
      setDiscoverGames(prev => [...prev, ...newGames]);
    } catch (error) {
      console.error('Error loading more games:', error);
    } finally {
      setLoadingMore(prev => ({ ...prev, games: false }));
    }
  };

  const renderDiscoverItem = ({ item, type }) => (
    <TouchableOpacity 
      style={styles.discoverItem}
      onPress={() => navigateToDetail(item, type)}
    >
      <Image 
        source={{ uri: getImageUrl(item, type) }}
        style={styles.discoverImage}
      />
      <Text style={styles.discoverTitle} numberOfLines={type === 'user' ? 1 : 2}>
        {getItemTitle(item, type)}
      </Text>
      {type === 'user' && item.username && (
        <Text style={styles.discoverSubtitle} numberOfLines={1}>
          @{item.username}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getImageUrl = (item, type) => {
    switch (type) {
      case 'movie':
      case 'show':
        return item.image_url || (item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/150');
      case 'person':
        return item.image_url || (item.profile_path ? `https://image.tmdb.org/t/p/w300${item.profile_path}` : 'https://via.placeholder.com/150');
      case 'game':
        return item.image_url || item.background_image || 'https://via.placeholder.com/150';
      case 'book':
        return item.image_url || item.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/150';
      case 'place':
        const coords = item.geometry?.coordinates || [28.9784, 41.0082];
        return `https://static-maps.yandex.ru/1.x/?ll=${coords[0]},${coords[1]}&size=300,200&z=14&l=map&pt=${coords[0]},${coords[1]},pm2rdm&lang=en_US`;
      case 'user':
        return item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || item.username || 'User')}&background=f97316&color=fff&size=150`;
      case 'list':
        return item.cover_image || 'https://via.placeholder.com/150';
      default:
        return 'https://via.placeholder.com/150';
    }
  };

  const getItemTitle = (item, type) => {
    switch (type) {
      case 'movie':
      case 'show':
        return item.title || item.name;
      case 'person':
        return item.name || item.title || 'Unknown Person';
      case 'game':
        return item.name || item.title || 'Unknown Game';
      case 'book':
        return item.volumeInfo?.title || item.title;
      case 'place':
        return item.properties?.name || item.name || item.title || 'Unknown Place';
      case 'user':
        return item.full_name || item.username;
      case 'list':
        return item.title;
      default:
        return '';
    }
  };

  const navigateToDetail = (item, type) => {
    // Navigation logic based on type
    console.log('Navigate to:', type, item);
  };

  const renderSearchResults = () => {
    const tabs = [
      { key: 'users', label: 'Users', icon: User },
      { key: 'lists', label: 'Lists', icon: List },
      { key: 'places', label: 'Places', icon: MapPin },
      { key: 'movies', label: 'Movies', icon: Film },
      { key: 'books', label: 'Books', icon: Book },
      { key: 'shows', label: 'TV Shows', icon: Film },
      { key: 'games', label: 'Games', icon: GameController },
      { key: 'people', label: 'People', icon: User },
    ];

    const typeMapping = {
      movies: 'movie',
      shows: 'show',
      people: 'person',
      games: 'game',
      books: 'book',
      places: 'place',
      users: 'user',
      lists: 'list'
    };

    const getFilteredResults = () => {
      const type = typeMapping[activeTab];
      return searchResults[activeTab]?.map(item => ({ ...item, type })) || [];
    };

    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.tabsWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContentContainer}
          >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              {tab.icon && <tab.icon size={16} color={activeTab === tab.key ? '#f97316' : '#6b7280'} />}
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>

        <FlatList
          data={getFilteredResults()}
          keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
          renderItem={({ item }) => renderDiscoverItem({ item, type: item.type })}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          )}
        />
      </View>
    );
  };

  // Render trending section (Instagram-style)
  const renderTrendingSection = () => (
    <View style={styles.trendingSection}>
      <View style={styles.trendingSectionHeader}>
        <TrendingUp size={20} color={tokens.colors.primary} weight="bold" />
        <Text style={styles.trendingSectionTitle}>Trending Searches</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingContainer}
      >
        {trendingSearches.map((trend, index) => (
          <TouchableOpacity
            key={index}
            style={styles.trendingItem}
            onPress={() => {
              const cleanTrend = trend.replace(/[^\w\s]/gi, '').trim();
              setSearchQuery(cleanTrend);
              handleSearch(cleanTrend);
            }}
          >
            <Text style={styles.trendingText}>{trend}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render quick actions (Instagram-style camera, etc.)
  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('CreateList')}
      >
        <View style={styles.quickActionIcon}>
          <Camera size={24} color={tokens.colors.background.primary} weight="bold" />
        </View>
        <Text style={styles.quickActionText}>Create List</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('Discover')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: tokens.colors.accent.purple }]}>
          <Sparkle size={24} color={tokens.colors.background.primary} weight="fill" />
        </View>
        <Text style={styles.quickActionText}>Discover</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDiscoverContent = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadDiscoverContent} />
      }
      contentContainerStyle={styles.discoverScrollContent}
    >
      {/* Trending Section */}
      {renderTrendingSection()}
      
      {/* Quick Actions */}
      {renderQuickActions()}
      {/* Places Section - 1st */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Places</Text>
          <TouchableOpacity 
            onPress={loadMorePlaces}
            disabled={loadingMore.places}
            style={styles.loadMoreButton}
          >
            {loadingMore.places ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Text style={styles.loadMoreText}>Discover more</Text>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={discoverPlaces}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.uniqueKey || `place-${item.id}-${index}`}
          renderItem={({ item }) => renderDiscoverItem({ item, type: 'place' })}
        />
      </View>

      {/* Movies Section - 2nd */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Movies</Text>
          <TouchableOpacity 
            onPress={loadMoreMovies}
            disabled={loadingMore.movies}
            style={styles.loadMoreButton}
          >
            {loadingMore.movies ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Text style={styles.loadMoreText}>Discover more</Text>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={discoverMovies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.uniqueKey || `movie-${item.id}-${index}`}
          renderItem={({ item }) => renderDiscoverItem({ item, type: 'movie' })}
        />
      </View>

      {/* Books Section - 3rd */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Books</Text>
          <TouchableOpacity 
            onPress={loadMoreBooks}
            disabled={loadingMore.books}
            style={styles.loadMoreButton}
          >
            {loadingMore.books ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Text style={styles.loadMoreText}>Discover more</Text>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={discoverBooks}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.uniqueKey || `book-${item.id}-${index}`}
          renderItem={({ item }) => renderDiscoverItem({ item, type: 'book' })}
        />
      </View>

      {/* TV Shows Section - 4th */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular TV Shows</Text>
          <TouchableOpacity 
            onPress={loadMoreShows}
            disabled={loadingMore.shows}
            style={styles.loadMoreButton}
          >
            {loadingMore.shows ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Text style={styles.loadMoreText}>Discover more</Text>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={discoverShows}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.uniqueKey || `show-${item.id}-${index}`}
          renderItem={({ item }) => renderDiscoverItem({ item, type: 'show' })}
        />
      </View>

      {/* Games Section - 5th */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Games</Text>
          <TouchableOpacity 
            onPress={loadMoreGames}
            disabled={loadingMore.games}
            style={styles.loadMoreButton}
          >
            {loadingMore.games ? (
              <ActivityIndicator size="small" color="#f97316" />
            ) : (
              <Text style={styles.loadMoreText}>Discover more</Text>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={discoverGames}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.uniqueKey || `game-${item.id}-${index}`}
          renderItem={({ item }) => renderDiscoverItem({ item, type: 'game' })}
        />
      </View>
    </ScrollView>
  );

  return (
    <SearchErrorBoundary onRetry={() => setLoading(false)}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={tokens.colors.background.primary} 
        />
        
        <View style={styles.header}>
          {/* Enhanced Search Bar with Animation */}
          <Animated.View style={[
            styles.searchContainer,
            {
              borderWidth: searchBarAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2],
              }),
              borderColor: searchBarAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [tokens.colors.gray[200], tokens.colors.primary],
              }),
              shadowOpacity: searchBarAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
            }
          ]}>
            <MagnifyingGlass 
              size={20} 
              color={searchQuery.length > 0 ? tokens.colors.primary : tokens.colors.gray[500]} 
              {...a11yProps.image('Search icon', false)}
            />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search everything on ConnectList..."
              placeholderTextColor={tokens.colors.gray[400]}
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              onSubmitEditing={() => handleSearch()}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              {...a11yProps.textInput('Search for content', 'Enter keywords to search')}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={clearSearch}
                {...a11yProps.button('Clear search', 'Remove search text')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearButton}
              >
                <X size={20} color={tokens.colors.gray[500]} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Search Suggestions and Recent Searches */}
          {showSuggestions && (searchSuggestions.length > 0 || recentSearches.length > 0) && (
            <View style={styles.suggestionsContainer}>
              {/* Search Suggestions */}
              {searchSuggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsSectionTitle}>Suggestions</Text>
                  {searchSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                      {...a11yProps.button(`Search for ${suggestion}`, 'Select suggestion')}
                    >
                      <MagnifyingGlass size={16} color={tokens.colors.gray[400]} />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.recentSearchesHeader}>
                    <Text style={styles.suggestionsSectionTitle}>Recent Searches</Text>
                    <TouchableOpacity
                      onPress={clearRecentSearches}
                      {...a11yProps.button('Clear recent searches', 'Remove all recent searches')}
                    >
                      <Text style={styles.clearRecentText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchQuery(search);
                        handleSearch(search);
                      }}
                      {...a11yProps.button(`Search for ${search}`, 'Select recent search')}
                    >
                      <Clock size={16} color={tokens.colors.gray[400]} />
                      <Text style={styles.suggestionText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            {isSearching ? (
              <SkeletonSearchResults />
            ) : (
              <SkeletonGrid columns={3} rows={4} />
            )}
          </View>
        ) : isSearching ? (
          renderSearchResults()
        ) : (
          renderDiscoverContent()
        )}
        
        <BottomMenu 
          activeTab="search"
          onTabPress={(tabId) => {
            if (tabId !== 'search') {
              navigation.navigate(tabId.charAt(0).toUpperCase() + tabId.slice(1));
            }
          }}
          onCategorySelect={(category) => {
            navigation.navigate('CreateList', { category });
          }}
        />
      </SafeAreaView>
    </SearchErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.gray[100],
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray[50],
    borderRadius: tokens.borderRadius.large,
    paddingHorizontal: tokens.spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: tokens.colors.gray[200],
    shadowColor: tokens.colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  clearButton: {
    padding: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.gray[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[900],
    lineHeight: tokens.typography.fontSize.md * tokens.typography.lineHeight.normal,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.borderRadius.medium,
    marginTop: tokens.spacing.xs,
    shadowColor: tokens.colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
    zIndex: 1000,
  },
  suggestionsSection: {
    paddingVertical: tokens.spacing.sm,
  },
  suggestionsSectionTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[700],
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    minHeight: tokens.touchTarget.minimum,
  },
  suggestionText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[800],
    marginLeft: tokens.spacing.md,
    flex: 1,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xs,
  },
  clearRecentText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    minHeight: tokens.touchTarget.minimum,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
  },
  loadMoreButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    minHeight: tokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  loadMoreText: {
    color: tokens.colors.primary,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  discoverItem: {
    width: itemSize,
    marginHorizontal: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  discoverImage: {
    width: itemSize - tokens.spacing.sm,
    height: itemSize * 1.5,
    borderRadius: tokens.borderRadius.medium,
    backgroundColor: tokens.colors.gray[100],
  },
  discoverTitle: {
    fontSize: tokens.typography.fontSize.xs,
    marginTop: tokens.spacing.xs,
    color: tokens.colors.gray[900],
    lineHeight: tokens.typography.fontSize.xs * tokens.typography.lineHeight.tight,
    minHeight: tokens.typography.fontSize.xs * tokens.typography.lineHeight.tight * 2,
  },
  discoverSubtitle: {
    fontSize: tokens.typography.fontSize.xs - 1,
    color: tokens.colors.gray[500],
    marginTop: tokens.spacing.xs / 2,
  },
  searchResultsContainer: {
    flex: 1,
  },
  tabsWrapper: {
    height: tokens.touchTarget.large,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.primaryLight,
  },
  tabsContainer: {
    height: tokens.touchTarget.large,
    flex: 1,
  },
  tabsContentContainer: {
    alignItems: 'center',
    height: tokens.touchTarget.large,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    marginRight: tokens.spacing.sm,
    height: tokens.touchTarget.large,
    justifyContent: 'center',
    minWidth: tokens.touchTarget.comfortable,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.primary,
    height: tokens.touchTarget.large,
  },
  tabText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.gray[500],
    fontSize: tokens.typography.fontSize.sm,
  },
  activeTabText: {
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  gridContainer: {
    padding: tokens.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl * 2,
    paddingHorizontal: tokens.spacing.lg,
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[500],
    textAlign: 'center',
    lineHeight: tokens.typography.fontSize.md * tokens.typography.lineHeight.normal,
  },
  // New Instagram-style elements
  discoverScrollContent: {
    paddingBottom: tokens.spacing.xxl,
  },
  trendingSection: {
    marginBottom: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
  },
  trendingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  trendingSectionTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
    marginLeft: tokens.spacing.sm,
  },
  trendingContainer: {
    paddingRight: tokens.spacing.lg,
  },
  trendingItem: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.full,
    marginRight: tokens.spacing.md,
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingText: {
    color: tokens.colors.background.primary,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  quickActionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xl,
    backgroundColor: tokens.colors.gray[50],
    marginHorizontal: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.large,
    marginBottom: tokens.spacing.xl,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.gray[700],
    textAlign: 'center',
  },
});

export default SearchScreen;