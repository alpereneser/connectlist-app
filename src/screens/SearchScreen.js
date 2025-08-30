import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import LoadingSkeleton, {
  SkeletonSearchResult,
  SkeletonCard,
} from '../components/LoadingSkeleton';
import PullToRefresh from '../components/PullToRefresh';
import { HapticPatterns } from '../utils/haptics';

const SearchScreen = ({
  onNavigate,
  user,
  onTabPress,
  refreshTrigger,
  activeTab = 'search',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [discoverContent, setDiscoverContent] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // API Keys - Updated with working YouTube Data API v3 key
  const GOOGLE_API_KEY = 'AIzaSyCEQZ1ri472vtTCiexDsriTKZTIPQoRJkY';

  const TMDB_API_KEY = '378b6eb3c69f21d0815d31c4bf5f19a4';
  const TMDB_ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNzhiNmViM2M2OWYyMWQwODE1ZDMxYzRiZjVmMTlhNCIsIm5iZiI6MTcxODY4NjkyNC41MjQ5OTk5LCJzdWIiOiI2NjcxMTRjY2Y4NDhiMmQ1NTM2YWE5YTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.4E-BfHAbJT4XgMJF9mG9OM4Rc3XdGzbd5n47acQ3tKw';
  const RAWG_API_KEY = 'd4b747af4c42469293a56cb985354e36';

  // Search categories
  const searchCategories = [
    'All',
    'Places',
    'Movies',
    'Series',
    'Musics',
    'Books',
    'People',
    'Games',
    'Videos',
  ];

  // Load discover content lazily - only load first category initially
  useEffect(() => {
    loadInitialContent();
  }, [refreshKey]);

  // Refresh content when search tab is pressed
  useEffect(() => {
    if (refreshTrigger && !isSearching) {
      setRefreshKey(prev => prev + 1);
    }
  }, [refreshTrigger, isSearching]);

  const loadInitialContent = async () => {
    setIsLoading(true);
    try {
      // Load only first 2 categories initially for faster loading
      const initialCategories = ['Movies', 'Places'];
      const content = {};

      for (const category of initialCategories) {
        content[category] = await loadCategoryContent(category, refreshKey);
      }

      setDiscoverContent(content);

      // Load remaining categories in background
      setTimeout(() => {
        loadRemainingContent();
      }, 1000);
    } catch (error) {
      console.error('Error loading initial content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback content function - defined before loadCategoryContent
  const getDiscoverFallbackContent = (category, key) => {
    if (category === 'Musics') {
      return [
        {
          id: `${key}-music-fallback-1`,
          title: 'Trending Music 2024',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Trending+Music',
          category: 'Musics',
          channelTitle: 'Music Charts',
          type: 'content',
        },
        {
          id: `${key}-music-fallback-2`,
          title: 'Popular Songs',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Popular+Songs',
          category: 'Musics',
          channelTitle: 'Hit Music',
          type: 'content',
        },
        {
          id: `${key}-music-fallback-3`,
          title: 'New Releases',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=New+Music',
          category: 'Musics',
          channelTitle: 'Fresh Hits',
          type: 'content',
        },
        {
          id: `${key}-music-fallback-4`,
          title: 'Top Hits',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Top+Hits',
          category: 'Musics',
          channelTitle: 'Chart Toppers',
          type: 'content',
        },
      ];
    } else if (category === 'Videos') {
      return [
        {
          id: `${key}-video-fallback-1`,
          title: 'Trending Videos',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Trending+Videos',
          category: 'Videos',
          channelTitle: 'Viral Content',
          type: 'content',
        },
        {
          id: `${key}-video-fallback-2`,
          title: 'Popular Content',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Popular+Videos',
          category: 'Videos',
          channelTitle: 'Top Videos',
          type: 'content',
        },
        {
          id: `${key}-video-fallback-3`,
          title: 'Entertainment Videos',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Entertainment',
          category: 'Videos',
          channelTitle: 'Fun Channel',
          type: 'content',
        },
        {
          id: `${key}-video-fallback-4`,
          title: 'Amazing Videos',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Amazing+Videos',
          category: 'Videos',
          channelTitle: 'Cool Content',
          type: 'content',
        },
      ];
    }
    return [];
  };

  const loadRemainingContent = async () => {
    try {
      const remainingCategories = [
        'Series',
        'Games',
        'Books',
        'Musics',
        'Videos',
        'People',
      ];

      for (const category of remainingCategories) {
        const items = await loadCategoryContent(category, refreshKey);
        setDiscoverContent(prev => ({
          ...prev,
          [category]: items,
        }));

        // Small delay between each category to avoid overwhelming the APIs
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error loading remaining content:', error);
    }
  };

  const getFallbackSearchContent = (category, query) => {
    // Fallback content for search results when YouTube API quota is exceeded
    const fallbackItems = [];

    if (category === 'Musics') {
      const musicFallback = [
        {
          title: `${query} - Music Search`,
          channelTitle: 'YouTube Music',
          image: 'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Music',
        },
        {
          title: `${query} Songs Playlist`,
          channelTitle: 'Music Channel',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Playlist',
        },
        {
          title: `Best of ${query}`,
          channelTitle: 'Top Hits',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Top+Hits',
        },
        {
          title: `${query} Live Performance`,
          channelTitle: 'Live Music',
          image: 'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Live',
        },
        {
          title: `${query} Official Video`,
          channelTitle: 'Official Channel',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Official',
        },
      ];

      musicFallback.forEach((item, index) => {
        fallbackItems.push({
          id: `fallback-search-music-${index}`,
          title: item.title,
          image: item.image,
          category: 'Musics',
          channelTitle: item.channelTitle,
          publishedAt: new Date().toISOString(),
          type: 'content',
          isFallback: true,
        });
      });
    } else if (category === 'Videos') {
      const videoFallback = [
        {
          title: `${query} - Video Search`,
          channelTitle: 'YouTube',
          image: 'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Video',
        },
        {
          title: `${query} Tutorial`,
          channelTitle: 'Tutorial Channel',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Tutorial',
        },
        {
          title: `${query} Review`,
          channelTitle: 'Review Channel',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Review',
        },
        {
          title: `${query} Compilation`,
          channelTitle: 'Best Videos',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Compilation',
        },
        {
          title: `${query} Documentary`,
          channelTitle: 'Documentary Channel',
          image:
            'https://via.placeholder.com/320x180/ff6b35/ffffff?text=Documentary',
        },
      ];

      videoFallback.forEach((item, index) => {
        fallbackItems.push({
          id: `fallback-search-video-${index}`,
          title: item.title,
          image: item.image,
          category: 'Videos',
          channelTitle: item.channelTitle,
          publishedAt: new Date().toISOString(),
          type: 'content',
          isFallback: true,
        });
      });
    }

    return fallbackItems;
  };

  const detectCategoryFromQuery = query => {
    const lowerQuery = query.toLowerCase();

    // Music keywords
    const musicKeywords = [
      'music',
      'song',
      'album',
      'artist',
      'band',
      'singer',
      'rap',
      'pop',
      'rock',
      'jazz',
      'classical',
      'hip hop',
      'electronic',
      'country',
      'indie',
      'metal',
      'folk',
      'blues',
      'reggae',
      'punk',
      'disco',
      'funk',
      'soul',
      'r&b',
      'edm',
      'techno',
      'house',
      'dubstep',
      'trap',
      'drill',
      'afrobeat',
    ];

    // Video keywords
    const videoKeywords = [
      'video',
      'vlog',
      'tutorial',
      'review',
      'gameplay',
      'trailer',
      'documentary',
      'interview',
      'comedy',
      'funny',
      'prank',
      'challenge',
      'reaction',
      'unboxing',
      'how to',
      'diy',
      'cooking',
      'recipe',
      'workout',
      'fitness',
      'yoga',
      'travel',
      'vlogger',
      'youtuber',
      'content',
      'channel',
    ];

    // Movie keywords
    const movieKeywords = [
      'movie',
      'film',
      'cinema',
      'hollywood',
      'bollywood',
      'action',
      'drama',
      'comedy',
      'horror',
      'thriller',
      'romance',
      'sci-fi',
      'fantasy',
      'animation',
      'adventure',
      'mystery',
      'crime',
      'war',
      'western',
      'musical',
      'biographical',
      'historical',
    ];

    // Series keywords
    const seriesKeywords = [
      'series',
      'tv show',
      'season',
      'episode',
      'netflix',
      'amazon prime',
      'hbo',
      'disney+',
      'hulu',
      'sitcom',
      'drama series',
      'miniseries',
      'web series',
      'anime',
      'cartoon',
    ];

    // Book keywords
    const bookKeywords = [
      'book',
      'novel',
      'author',
      'writer',
      'literature',
      'fiction',
      'non-fiction',
      'biography',
      'autobiography',
      'memoir',
      'poetry',
      'textbook',
      'guide',
      'manual',
      'encyclopedia',
      'dictionary',
      'cookbook',
      'self-help',
      'history',
      'science',
      'philosophy',
      'religion',
      'politics',
    ];

    // Game keywords
    const gameKeywords = [
      'game',
      'gaming',
      'video game',
      'pc game',
      'mobile game',
      'console',
      'playstation',
      'xbox',
      'nintendo',
      'steam',
      'epic games',
      'multiplayer',
      'single player',
      'rpg',
      'fps',
      'mmorpg',
      'strategy',
      'puzzle',
      'racing',
      'sports game',
      'fighting',
      'platform',
      'simulation',
      'sandbox',
    ];

    // People keywords
    const peopleKeywords = [
      'actor',
      'actress',
      'director',
      'producer',
      'celebrity',
      'star',
      'famous',
      'politician',
      'scientist',
      'athlete',
      'musician',
      'writer',
      'artist',
      'influencer',
      'youtuber',
      'tiktoker',
      'instagrammer',
      'blogger',
      'journalist',
      'entrepreneur',
      'ceo',
      'founder',
    ];

    // Place keywords
    const placeKeywords = [
      'place',
      'location',
      'city',
      'country',
      'restaurant',
      'hotel',
      'museum',
      'park',
      'beach',
      'mountain',
      'lake',
      'river',
      'building',
      'landmark',
      'monument',
      'church',
      'mosque',
      'temple',
      'castle',
      'palace',
      'bridge',
      'tower',
      'square',
      'street',
      'avenue',
      'neighborhood',
      'district',
      'region',
      'province',
      'state',
      'continent',
      'island',
      'desert',
      'forest',
      'valley',
      'canyon',
      'waterfall',
      'volcano',
      'cave',
      'zoo',
      'aquarium',
      'stadium',
      'arena',
      'theater',
      'cinema',
      'mall',
      'market',
      'shop',
      'store',
      'cafe',
      'bar',
      'club',
      'gym',
      'spa',
      'hospital',
      'school',
      'university',
      'library',
      'airport',
      'station',
      'port',
      'harbor',
    ];

    // Check for exact matches first
    for (const keyword of musicKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Musics';}
    }

    for (const keyword of videoKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Videos';}
    }

    for (const keyword of movieKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Movies';}
    }

    for (const keyword of seriesKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Series';}
    }

    for (const keyword of bookKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Books';}
    }

    for (const keyword of gameKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Games';}
    }

    for (const keyword of peopleKeywords) {
      if (lowerQuery.includes(keyword)) {return 'People';}
    }

    for (const keyword of placeKeywords) {
      if (lowerQuery.includes(keyword)) {return 'Places';}
    }

    // Default to 'All' if no specific category detected
    return 'All';
  };

  const handleSearch = text => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);

    // Haptic feedback for typing
    if (text.length > 0 && text.length !== searchQuery.length) {
      HapticPatterns.selection();
    }

    if (text.length > 2) {
      // Auto-detect category based on search query
      const detectedCategory = detectCategoryFromQuery(text);
      if (detectedCategory !== 'All') {
        setActiveCategory(detectedCategory);
        performSearch(text, detectedCategory);
      } else {
        performSearch(text, activeCategory);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleCategoryPress = category => {
    // Haptic feedback for category selection
    HapticPatterns.tabSwitch();

    setActiveCategory(category);
    if (searchQuery.length > 2) {
      performSearch(searchQuery, category);
    }
  };

  const performSearch = async (query, category) => {
    if (!query.trim()) {return;}

    setIsLoading(true);
    try {
      let results = [];

      if (category === 'All') {
        // Search in multiple categories for 'All'
        const categories = [
          'Movies',
          'Series',
          'Musics',
          'Videos',
          'Games',
          'Books',
        ];
        for (const cat of categories) {
          const categoryResults = await searchInCategory(query, cat);
          results = [...results, ...categoryResults.slice(0, 2)]; // Limit per category
        }
      } else {
        results = await searchInCategory(query, category);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchInCategory = async (query, category) => {
    try {
      let searchUrl = '';
      let headers = {};

      switch (category) {
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
        case 'Games':
          searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`;
          break;
        case 'Books':
          searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&maxResults=10`;
          break;
        case 'Musics':
          // Enhanced music search with better query parameters
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query + ' music song')}&order=relevance&videoCategoryId=10&key=${GOOGLE_API_KEY}&maxResults=15&safeSearch=moderate`;
          console.log('Searching music for:', query);
          break;
        case 'Videos':
          // Enhanced video search with better filtering
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&order=relevance&key=${GOOGLE_API_KEY}&maxResults=15&safeSearch=moderate`;
          console.log('Searching videos for:', query);
          break;
        case 'People':
          searchUrl = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          headers = {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          };
          break;
        case 'Places':
          searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
          break;
        default:
          return [];
      }

      const response = await fetch(searchUrl, { headers });

      if (!response.ok) {
        console.error(
          `HTTP Error for ${category}:`,
          response.status,
          response.statusText,
        );

        // Return fallback content for Music and Video searches when API fails
        if (category === 'Musics' || category === 'Videos') {
          console.log(
            `Using fallback content for ${category} due to HTTP error`,
          );
          return getFallbackSearchContent(category, query);
        }

        return [];
      }

      const data = await response.json();

      if (data.error) {
        console.error(`API Error for ${category}:`, data.error);

        // Return fallback content for Music and Video searches when API fails
        if (
          (data.error.code === 403 || data.error.code === 400) &&
          (category === 'Musics' || category === 'Videos')
        ) {
          console.log(
            `Using fallback content for ${category} search due to API error:`,
            data.error.message,
          );
          return getFallbackSearchContent(category, query);
        }

        return [];
      }

      let formattedResults = [];

      if (category === 'Movies') {
        formattedResults =
          data.results?.slice(0, 10).map(item => ({
            id: `movie-${item.id}`,
            title: item.title,
            image: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            category: 'Movies',
            rating: item.vote_average,
            releaseDate: item.release_date,
            type: 'content',
          })) || [];
      } else if (category === 'Series') {
        formattedResults =
          data.results?.slice(0, 10).map(item => ({
            id: `series-${item.id}`,
            title: item.name,
            image: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            category: 'Series',
            rating: item.vote_average,
            releaseDate: item.first_air_date,
            type: 'content',
          })) || [];
      } else if (category === 'Games') {
        formattedResults =
          data.results?.slice(0, 10).map(item => ({
            id: `game-${item.id}`,
            title: item.name,
            image: item.background_image,
            category: 'Games',
            rating: item.rating,
            released: item.released,
            type: 'content',
          })) || [];
      } else if (category === 'Books') {
        formattedResults =
          data.items?.slice(0, 10).map(item => ({
            id: `book-${item.id}`,
            title: item.volumeInfo.title,
            image: item.volumeInfo.imageLinks?.thumbnail,
            category: 'Books',
            authors: item.volumeInfo.authors?.join(', '),
            type: 'content',
          })) || [];
      } else if (category === 'Musics' || category === 'Videos') {
        console.log(
          `${category} search API response:`,
          data.items?.length || 0,
          'items',
        );
        formattedResults =
          data.items
            ?.slice(0, 15)
            .map(item => {
              if (!item.id?.videoId) {
                return null;
              }
              return {
                id: `${category?.toLowerCase()}-${item.id.videoId}`,
                title: item.snippet.title
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, '&'),
                image:
                  item.snippet.thumbnails.medium?.url ||
                  item.snippet.thumbnails.high?.url,
                category: category,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                description: item.snippet.description,
                videoId: item.id.videoId,
                type: 'content',
              };
            })
            .filter(Boolean) || [];
        console.log(
          `Processed ${category} search results:`,
          formattedResults.length,
        );
      } else if (category === 'People') {
        formattedResults =
          data.results?.slice(0, 10).map(item => ({
            id: `person-${item.id}`,
            title: item.name,
            image: item.profile_path
              ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
              : null,
            category: 'People',
            knownFor: item.known_for
              ?.map(work => work.title || work.name)
              .slice(0, 2)
              .join(', '),
            type: 'content',
          })) || [];
      } else if (category === 'Places') {
        formattedResults =
          data.results?.slice(0, 10).map(item => ({
            id: `place-${item.place_id}`,
            title: item.name,
            image: item.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : null,
            category: 'Places',
            location: item.formatted_address,
            rating: item.rating,
            type: 'content',
          })) || [];
      }

      return formattedResults;
    } catch (error) {
      console.error(`Search error in ${category}:`, error);

      // Return fallback content for Music and Video searches on network error
      if (category === 'Musics' || category === 'Videos') {
        console.log(
          `Using fallback content for ${category} due to network error`,
        );
        return getFallbackSearchContent(category, query);
      }

      return [];
    }
  };

  const loadMoreContent = async category => {
    try {
      const newItems = await loadCategoryContent(
        category,
        refreshKey + Math.random(),
      );
      setDiscoverContent(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), ...newItems],
      }));
    } catch (error) {
      console.error(`Error loading more ${category}:`, error);
    }
  };

  const loadCategoryContent = async (category, key) => {
    let items = [];

    try {
      switch (category) {
        case 'Movies':
          const randomMoviePage = Math.floor(Math.random() * 5) + 1;
          const moviesResponse = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US&page=${randomMoviePage}`,
            {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
            },
          );
          const moviesData = await moviesResponse.json();
          const shuffledMovies = moviesData.results
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledMovies?.map(item => ({
              id: `${key}-movie-${item.id}`,
              title: item.title,
              image: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null,
              category: 'Movies',
              rating: item.vote_average,
              type: 'content',
            })) || [];
          break;

        case 'Series':
          const randomSeriesPage = Math.floor(Math.random() * 5) + 1;
          const seriesResponse = await fetch(
            `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=en-US&page=${randomSeriesPage}`,
            {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
            },
          );
          const seriesData = await seriesResponse.json();
          const shuffledSeries = seriesData.results
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledSeries?.map(item => ({
              id: `${key}-series-${item.id}`,
              title: item.name,
              image: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null,
              category: 'Series',
              rating: item.vote_average,
              type: 'content',
            })) || [];
          break;

        case 'Games':
          const randomGamesPage = Math.floor(Math.random() * 10) + 1;
          const gamesResponse = await fetch(
            `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=2023-01-01,2024-12-31&ordering=-rating&page=${randomGamesPage}&page_size=20`,
          );
          const gamesData = await gamesResponse.json();
          const shuffledGames = gamesData.results
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledGames?.map(item => ({
              id: `${key}-game-${item.id}`,
              title: item.name,
              image: item.background_image,
              category: 'Games',
              rating: item.rating,
              type: 'content',
            })) || [];
          break;

        case 'Books':
          const bookQueries = [
            'fiction',
            'mystery',
            'romance',
            'science',
            'history',
            'biography',
            'fantasy',
            'thriller',
          ];
          const randomBookQuery =
            bookQueries[Math.floor(Math.random() * bookQueries.length)];
          const randomStartIndex = Math.floor(Math.random() * 20);
          const booksResponse = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${randomBookQuery}&orderBy=relevance&startIndex=${randomStartIndex}&maxResults=8&key=${GOOGLE_API_KEY}`,
          );
          const booksData = await booksResponse.json();
          const shuffledBooks = booksData.items
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledBooks?.map(item => ({
              id: `${key}-book-${item.id}`,
              title: item.volumeInfo.title,
              image: item.volumeInfo.imageLinks?.thumbnail,
              category: 'Books',
              authors: item.volumeInfo.authors?.join(', '),
              type: 'content',
            })) || [];
          break;

        case 'Musics':
          const musicQueries = [
            'trending music 2024',
            'popular songs',
            'top hits',
            'new music',
            'viral songs',
            'chart toppers',
            'music videos',
            'latest hits',
            'pop music',
            'rock music',
            'hip hop',
            'electronic music',
          ];
          const randomMusicQuery =
            musicQueries[Math.floor(Math.random() * musicQueries.length)];
          const musicUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(randomMusicQuery)}&order=relevance&videoCategoryId=10&maxResults=12&key=${GOOGLE_API_KEY}&safeSearch=moderate&regionCode=US`;
          console.log('Fetching music content:', randomMusicQuery);
          const musicResponse = await fetch(musicUrl);
          if (!musicResponse.ok) {
            console.error(
              'Music API HTTP Error:',
              musicResponse.status,
              musicResponse.statusText,
            );
            items = getDiscoverFallbackContent('Musics', key);
            break;
          }

          const musicData = await musicResponse.json();
          if (musicData.error) {
            console.error('Music API Error:', musicData.error);
            console.log(
              'Using fallback content for Music discover section due to:',
              musicData.error.message,
            );
            items = getDiscoverFallbackContent('Musics', key);
            break;
          }
          console.log(
            'Music API response received:',
            musicData.items?.length || 0,
            'items',
          );
          const shuffledMusic = musicData.items
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledMusic
              ?.map(item => {
                if (!item.id?.videoId) {return null;}
                return {
                  id: `${key}-music-${item.id.videoId}`,
                  title: item.snippet.title
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&amp;/g, '&'),
                  image:
                    item.snippet.thumbnails.medium?.url ||
                    item.snippet.thumbnails.high?.url,
                  category: 'Musics',
                  channelTitle: item.snippet.channelTitle,
                  videoId: item.id.videoId,
                  type: 'content',
                };
              })
              .filter(Boolean) || [];
          console.log('Processed music items:', items.length);
          break;

        case 'Videos':
          const videoQueries = [
            'trending videos',
            'viral videos',
            'popular content',
            'entertainment videos',
            'funny videos',
            'amazing videos',
            'interesting videos',
            'cool videos',
            'tech reviews',
            'tutorials',
            'vlogs',
            'comedy videos',
          ];
          const randomVideoQuery =
            videoQueries[Math.floor(Math.random() * videoQueries.length)];
          const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(randomVideoQuery)}&order=relevance&maxResults=12&key=${GOOGLE_API_KEY}&safeSearch=moderate&regionCode=US`;
          console.log('Fetching video content:', randomVideoQuery);
          const videosResponse = await fetch(videosUrl);
          if (!videosResponse.ok) {
            console.error(
              'Videos API HTTP Error:',
              videosResponse.status,
              videosResponse.statusText,
            );
            items = getDiscoverFallbackContent('Videos', key);
            break;
          }

          const videosData = await videosResponse.json();
          if (videosData.error) {
            console.error('Videos API Error:', videosData.error);
            console.log(
              'Using fallback content for Videos discover section due to:',
              videosData.error.message,
            );
            items = getDiscoverFallbackContent('Videos', key);
            break;
          }
          console.log(
            'Videos API response received:',
            videosData.items?.length || 0,
            'items',
          );
          const shuffledVideos = videosData.items
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledVideos
              ?.map(item => {
                if (!item.id?.videoId) {return null;}
                return {
                  id: `${key}-video-${item.id.videoId}`,
                  title: item.snippet.title
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&amp;/g, '&'),
                  image:
                    item.snippet.thumbnails.medium?.url ||
                    item.snippet.thumbnails.high?.url,
                  category: 'Videos',
                  channelTitle: item.snippet.channelTitle,
                  videoId: item.id.videoId,
                  type: 'content',
                };
              })
              .filter(Boolean) || [];
          console.log('Processed video items:', items.length);
          break;

        case 'People':
          const randomPeoplePage = Math.floor(Math.random() * 10) + 1;
          const peopleResponse = await fetch(
            `https://api.themoviedb.org/3/person/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${randomPeoplePage}`,
            {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
            },
          );
          const peopleData = await peopleResponse.json();
          const shuffledPeople = peopleData.results
            ?.sort(() => 0.5 - Math.random())
            .slice(0, 4);
          items =
            shuffledPeople?.map(item => ({
              id: `${key}-person-${item.id}`,
              title: item.name,
              image: item.profile_path
                ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
                : null,
              category: 'People',
              knownFor: item.known_for
                ?.map(work => work.title || work.name)
                .slice(0, 2)
                .join(', '),
              type: 'content',
            })) || [];
          break;

        case 'Places':
          const placeCollections = [
            [
              {
                title: 'Eiffel Tower',
                location: 'Paris, France',
                image:
                  'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500',
              },
              {
                title: 'Louvre Museum',
                location: 'Paris, France',
                image:
                  'https://images.unsplash.com/photo-1566139884669-4b9356b4c040?w=500',
              },
              {
                title: 'Arc de Triomphe',
                location: 'Paris, France',
                image:
                  'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=500',
              },
              {
                title: 'Notre Dame',
                location: 'Paris, France',
                image:
                  'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=500',
              },
            ],
            [
              {
                title: 'Times Square',
                location: 'New York, USA',
                image:
                  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500',
              },
              {
                title: 'Central Park',
                location: 'New York, USA',
                image:
                  'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=500',
              },
              {
                title: 'Brooklyn Bridge',
                location: 'New York, USA',
                image:
                  'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500',
              },
              {
                title: 'Statue of Liberty',
                location: 'New York, USA',
                image:
                  'https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=500',
              },
            ],
            [
              {
                title: 'Santorini',
                location: 'Greece',
                image:
                  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500',
              },
              {
                title: 'Mykonos',
                location: 'Greece',
                image:
                  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=500',
              },
              {
                title: 'Acropolis',
                location: 'Athens, Greece',
                image:
                  'https://images.unsplash.com/photo-1555993539-1732b0258235?w=500',
              },
              {
                title: 'Meteora',
                location: 'Greece',
                image:
                  'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=500',
              },
            ],
            [
              {
                title: 'Tokyo Tower',
                location: 'Tokyo, Japan',
                image:
                  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500',
              },
              {
                title: 'Mount Fuji',
                location: 'Japan',
                image:
                  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
              },
              {
                title: 'Shibuya Crossing',
                location: 'Tokyo, Japan',
                image:
                  'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=500',
              },
              {
                title: 'Fushimi Inari',
                location: 'Kyoto, Japan',
                image:
                  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500',
              },
            ],
          ];

          const randomCollection =
            placeCollections[
              Math.floor(Math.random() * placeCollections.length)
            ];
          items = randomCollection.map((place, index) => ({
            id: `${key}-place-${index}`,
            title: place.title,
            image: place.image,
            category: 'Places',
            location: place.location,
            type: 'content',
          }));
          break;

        default:
          items = [];
      }
    } catch (error) {
      console.error(`Error loading ${category}:`, error);

      // Return fallback content for Music and Video categories on network error
      if (category === 'Musics' || category === 'Videos') {
        console.log(
          `Using fallback content for ${category} discover due to network error`,
        );
        items = getDiscoverFallbackContent(category, key);
      } else {
        items = [];
      }
    }

    return items;
  };

  const renderDiscoverSection = (category, items) => {
    if (!items || items.length === 0) {return null;}

    return (
      <View key={category} style={styles.discoverSection}>
        <View style={styles.discoverSectionHeader}>
          <Text style={styles.discoverSectionTitle}>
            {category ? String(category) : 'Unknown Category'}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadMoreContent(category)}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color={Colors.orange} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoverSectionContent}
          onEndReached={() => loadMoreContent(category)}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.discoverItem}
              activeOpacity={0.7}
              onPress={() => handleItemPress(item)}
            >
              {item.image && (
                <View style={styles.discoverImageContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.discoverItemImage}
                  />
                  {(item.category === 'Musics' ||
                    item.category === 'Videos') && (
                    <View style={styles.discoverPlayIcon}>
                      <Feather name="play" size={12} color={Colors.white} />
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.discoverItemTitle} numberOfLines={2}>
                {item.title ? String(item.title) : 'No title'}
              </Text>
              {item.rating && (
                <View style={styles.discoverItemRating}>
                  <Feather name="star" size={10} color={Colors.orange} />
                  <Text style={styles.discoverItemRatingText}>
                    {item.rating.toFixed(1)}
                  </Text>
                </View>
              )}
              {item.authors && (
                <Text style={styles.discoverItemSubtitle} numberOfLines={1}>
                  {item.authors}
                </Text>
              )}
              {item.channelTitle && (
                <Text style={styles.discoverItemSubtitle} numberOfLines={1}>
                  {item.channelTitle}
                </Text>
              )}
              {item.knownFor && (
                <Text style={styles.discoverItemSubtitle} numberOfLines={1}>
                  {item.knownFor}
                </Text>
              )}
              {item.location && (
                <Text style={styles.discoverItemSubtitle} numberOfLines={1}>
                  {item.location}
                </Text>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
        />
      </View>
    );
  };

  const handleItemPress = item => {
    HapticPatterns.lightImpact();

    const categoryToScreenMap = {
      Places: 'PlaceDetails',
      Movies: 'MovieDetails',
      Series: 'SeriesDetails',
      Musics: 'MusicDetails',
      Books: 'BookDetails',
      People: 'PersonDetails',
      Games: 'GameDetails',
      Videos: 'VideoDetails',
    };

    const screenName = categoryToScreenMap[item.category];
    if (screenName && onNavigate) {
      onNavigate(screenName, { item });
    }
  };

  const renderSearchResult = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}
      >
        {item.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.searchResultImage}
            />
            {(item.category === 'Musics' || item.category === 'Videos') && (
              <View style={styles.playIconOverlay}>
                <Feather name="play" size={16} color={Colors.white} />
              </View>
            )}
          </View>
        )}
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultTitle} numberOfLines={2}>
            {item.title || 'No title'}
          </Text>
          <Text style={styles.searchResultCategory}>
            {item.category || 'Unknown'}
          </Text>

          {item.rating && (
            <View style={styles.searchResultRating}>
              <Feather name="star" size={12} color={Colors.orange} />
              <Text style={styles.searchResultRatingText}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {item.authors && (
            <Text style={styles.searchResultSubtitle} numberOfLines={1}>
              by {item.authors}
            </Text>
          )}

          {item.channelTitle && (
            <View style={styles.channelInfo}>
              <Feather name="user" size={12} color={Colors.textSecondary} />
              <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                {item.channelTitle}
              </Text>
            </View>
          )}

          {item.publishedAt && (
            <Text style={styles.searchResultSubtitle}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          )}

          {item.releaseDate && (
            <Text style={styles.searchResultSubtitle}>
              {new Date(item.releaseDate).getFullYear()}
            </Text>
          )}

          {item.released && (
            <Text style={styles.searchResultSubtitle}>{item.released}</Text>
          )}

          {item.knownFor && (
            <Text style={styles.searchResultSubtitle} numberOfLines={1}>
              Known for: {item.knownFor}
            </Text>
          )}

          {item.location && (
            <Text style={styles.searchResultSubtitle} numberOfLines={1}>
              {item.location}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout
      title="Search"
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab={activeTab}
    >
      {/* Search Input */}
      <View style={styles.searchHeaderContainer}>
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={20}
            color={Colors.orange}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, music, videos, books, places..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.length > 2) {
                performSearch(searchQuery, activeCategory);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Categories (only show when searching) */}
      {isSearching && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={searchCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  activeCategory === item && styles.activeCategoryItem,
                  index === 0 && styles.firstCategory,
                ]}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === item && styles.activeCategoryText,
                  ]}
                >
                  {item ? String(item) : 'Unknown'}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item}
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {isSearching ? (
          // Search Results
          <>
            <Text style={styles.sectionTitle}>
              {searchQuery
                ? `Results for "${searchQuery}"`
                : 'Start typing to search...'}
              {activeCategory !== 'All' &&
                activeCategory &&
                ` in ${activeCategory}`}
            </Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonSearchResult
                    key={index}
                    style={{ marginBottom: Spacing.small }}
                  />
                ))}
              </View>
            ) : (
              <FlatList
                key="search-results"
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.searchResultsContent}
                ListEmptyComponent={
                  searchQuery.length > 2 ? (
                    <View style={styles.emptyResults}>
                      <Feather
                        name="search"
                        size={48}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.emptyResultsText}>
                        No results found
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </>
        ) : (
          // Explore/Discovery Content
          <>
            {isLoading && Object.keys(discoverContent).length === 0 ? (
              <View style={styles.loadingContainer}>
                {Array.from({ length: 3 }).map((_, sectionIndex) => (
                  <View key={sectionIndex} style={styles.skeletonSection}>
                    <LoadingSkeleton
                      width={120}
                      height={20}
                      style={{ marginBottom: Spacing.small }}
                    />
                    <View style={styles.skeletonRow}>
                      {Array.from({ length: 3 }).map((_, cardIndex) => (
                        <SkeletonCard
                          key={cardIndex}
                          style={{ width: 120, marginRight: Spacing.small }}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <FlatList
                data={Object.keys(discoverContent)}
                renderItem={({ item }) =>
                  renderDiscoverSection(item, discoverContent[item])
                }
                keyExtractor={item => item}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.discoverContent}
                refreshControl={
                  <PullToRefresh
                    refreshing={isLoading}
                    onRefresh={() => {
                      HapticPatterns.pullRefresh();
                      setRefreshKey(prev => prev + 1);
                    }}
                  />
                }
              />
            )}
          </>
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeaderContainer: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 5,
    paddingHorizontal: Spacing.medium,
    height: 50,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
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
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    backgroundColor: Colors.background,
    paddingBottom: Spacing.small,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  categoryItem: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    marginRight: Spacing.small,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  activeCategoryItem: {
    backgroundColor: Colors.orange,
  },
  firstCategory: {
    marginLeft: 0,
  },
  categoryText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeCategoryText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.medium,
    paddingTop: 10, // 10px boşluk eklendi
  },
  sectionTitle: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginVertical: Spacing.medium,
  },
  // Explore Content Styles
  exploreContent: {
    paddingBottom: Spacing.large,
  },
  exploreRow: {
    justifyContent: 'space-between',
  },
  userItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    marginBottom: Spacing.small,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.medium,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userFollowers: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  followButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 6,
  },
  followingButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  followingButtonText: {
    color: Colors.textSecondary,
  },
  listItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: Spacing.medium,
    borderRadius: 12,
    overflow: 'hidden',
  },
  leftItem: {
    marginRight: '2%',
  },
  rightItem: {
    marginLeft: '2%',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.small,
  },
  listTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listAuthor: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.white,
    opacity: 0.8,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listLikes: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.white,
    marginLeft: 4,
  },
  // Search Results Styles
  searchResultsContent: {
    paddingBottom: Spacing.large,
  },
  searchUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.medium,
  },
  searchUserInfo: {
    flex: 1,
  },
  searchUserName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  searchUserUsername: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  searchUserFollowers: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  searchFollowButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 6,
  },
  searchFollowingButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchFollowButtonText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  searchFollowingButtonText: {
    color: Colors.textSecondary,
  },
  searchListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchListImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.medium,
  },
  searchListInfo: {
    flex: 1,
  },
  searchListTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  searchListAuthor: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  searchListMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchListCategory: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.orange,
  },
  searchListStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchListLikes: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  // Discover Content Styles
  discoverContent: {
    paddingBottom: Spacing.large,
  },
  discoverSection: {
    marginBottom: Spacing.large,
  },
  discoverSectionTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  discoverSectionContent: {
    paddingRight: Spacing.medium,
  },
  discoverItem: {
    width: 120,
    marginRight: Spacing.small,
  },
  discoverItemImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    marginBottom: Spacing.tiny,
  },
  discoverItemTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
    lineHeight: 16,
  },
  discoverItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  discoverItemRatingText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.medium,
    color: Colors.orange,
    marginLeft: 2,
  },
  discoverItemSubtitle: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 12,
  },
  // Search Results Styles
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchResultImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: Spacing.small,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  searchResultCategory: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.orange,
    marginBottom: 4,
  },
  searchResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultRatingText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.orange,
    marginLeft: 2,
  },
  searchResultSubtitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
    lineHeight: 14,
    marginLeft: 4,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.small,
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverImageContainer: {
    position: 'relative',
  },
  discoverPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.medium,
  },
  skeletonSection: {
    marginBottom: Spacing.large,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.large * 2,
  },
  emptyResultsText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  // Discover Header Styles
  discoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.medium,
  },
  refreshAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 6,
  },
  refreshAllText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.white,
    marginLeft: 4,
  },
  discoverSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  refreshButton: {
    padding: 4,
  },
});

export default SearchScreen;
