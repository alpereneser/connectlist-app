import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import SubHeader from '../components/SubHeader';
import LoadingSkeleton, {
  SkeletonCard,
  SkeletonListItem,
} from '../components/LoadingSkeleton';
import PullToRefresh from '../components/PullToRefresh';
import AnimatedButton from '../components/AnimatedButton';
import { HapticPatterns } from '../utils/haptics';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';
import LikesModal from '../components/LikesModal';

const HomeScreen = ({
  onNavigate,
  user,
  onTabPress,
  activeTab = 'home',
  badges = {},
}) => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Lists');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [likingItems, setLikingItems] = useState(new Set());
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFeedData(0, activeCategory, false);
  }, []);

  const loadFeedData = async (
    page = 0,
    category = 'All Lists',
    append = false,
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const pageSize = 10;
      const offset = page * pageSize;

      // Build query based on category
      let query = supabase
        .from('lists')
        .select(
          `
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          ),
          list_items (
            id,
            title,
            image_url,
            type,
            year,
            description
          ),
          list_likes (
            user_id
          ),
          list_comments (
            id
          )
        `,
        )
        .eq('is_public', true);

      // Apply category filter
      if (category !== 'All Lists') {
        const categoryMap = {
          Places: 'places',
          Movies: 'movies',
          Series: 'series',
          Musics: 'books', // Note: Musics might be stored as books in your schema
          Books: 'books',
          People: 'people',
          Games: 'games',
          Videos: 'videos',
        };
        const dbCategory = categoryMap[category];
        if (dbCategory) {
          query = query.eq('category', dbCategory);
        }
      }

      // Apply pagination and ordering
      const { data: lists, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('Error fetching lists:', error);
        // Fallback to mock data if Supabase fails
        if (!append) {
          setFeedData(getMockFeedData());
        }
        setHasMoreData(false);
        return;
      }

      // Check if we have more data
      setHasMoreData(lists && lists.length === pageSize);

      // Transform Supabase data to feed format
      const transformedFeed =
        lists?.map(list => {
          const timeAgo = getTimeAgo(list.created_at);
          const likesCount = list.list_likes?.length || 0;
          const commentsCount = list.list_comments?.length || 0;
          const itemsCount = list.list_items?.length || 0;

          // Check if current user liked this list
          const isLiked = user?.id
            ? list.list_likes?.some(like => like.user_id === user.id)
            : false;

          // Get first few items for preview images
          const previewItems = list.list_items?.slice(0, 3) || [];

          // Get user avatar using available fields
          let userAvatar = null;

          // Önce database'deki avatar_url'i kontrol et
          if (
            list.profiles?.avatar_url &&
            /^https?:\/\//i.test(list.profiles.avatar_url)
          ) {
            userAvatar = list.profiles.avatar_url;
          }
          // Sonra avatar field'ını kontrol et (storage key olabilir)
          else if (list.profiles?.avatar) {
            // Eğer avatar field'ı URL değilse, storage key olarak kullan
            if (/^https?:\/\//i.test(list.profiles.avatar)) {
              userAvatar = list.profiles.avatar;
            } else {
              userAvatar = getPublicUrl(list.profiles.avatar, 'avatars');
            }
          }

          // Fallback to generated avatar
          if (!userAvatar) {
            userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${list.profiles?.username || 'anonymous'}`;
          }

          return {
            id: list.id,
            type: 'user_list',
            title: list.title,
            description: list.description || `${itemsCount} items in this list`,
            author:
              list.profiles?.full_name ||
              list.profiles?.username ||
              'Anonymous',
            authorUsername: list.profiles?.username || 'anonymous',
            authorAvatar: userAvatar,
            category: capitalizeCategory(list.category) || 'General',
            likes: likesCount,
            comments: commentsCount,
            timestamp: timeAgo,
            previewItems: previewItems,
            itemsCount: itemsCount,
            isPublic: list.is_public,
            isLiked: isLiked,
            createdAt: list.created_at,
            // Add user information for navigation
            user_id: list.user_id,
            profiles: list.profiles,
          };
        }) || [];

      if (append) {
        setFeedData(prev => {
          // Prevent duplicate items by filtering out existing IDs
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = transformedFeed.filter(
            item => !existingIds.has(item.id),
          );
          return [...prev, ...newItems];
        });
      } else {
        setFeedData(transformedFeed);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      // Fallback to mock data on error
      if (!append) {
        setFeedData(getMockFeedData());
      }
      setHasMoreData(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getMockFeedData = () => [
    {
      id: 'mock-1',
      type: 'user_list',
      title: 'İslam ile Sosyal Hayat',
      description:
        'İslam dininin sosyal hayattaki yeri ve önemi hakkında kitaplar',
      author: 'Alperen Eser',
      authorUsername: 'alpereneser',
      authorAvatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=alpereneser',
      category: 'Books',
      likes: 43,
      comments: 12,
      timestamp: '5 min ago',
      isLiked: false,
      previewItems: [
        {
          title: 'Moneyball',
          image_url:
            'https://images-na.ssl-images-amazon.com/images/P/0393324818.01.L.jpg',
          year: '2003',
          type: 'book',
        },
        {
          title: 'Yeşil Yol',
          image_url:
            'https://images-na.ssl-images-amazon.com/images/P/0451933028.01.L.jpg',
          year: '1996',
          type: 'book',
        },
        {
          title: 'Hustle',
          image_url:
            'https://images-na.ssl-images-amazon.com/images/P/0062316117.01.L.jpg',
          year: '2019',
          type: 'book',
        },
      ],
      itemsCount: 15,
      user_id: 'mock-user-1',
    },
    {
      id: 'mock-2',
      type: 'user_list',
      title: 'En İyi Aksiyon Filmleri',
      description: 'Tüm zamanların en iyi aksiyon filmlerinin listesi',
      author: 'Film Severler',
      authorUsername: 'filmseverler',
      authorAvatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=filmseverler',
      category: 'Movies',
      likes: 156,
      comments: 28,
      timestamp: '2h ago',
      isLiked: false,
      previewItems: [
        {
          title: 'Mad Max: Fury Road',
          image_url:
            'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
          year: '2015',
          type: 'movie',
        },
        {
          title: 'John Wick',
          image_url:
            'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg',
          year: '2014',
          type: 'movie',
        },
        {
          title: 'The Dark Knight',
          image_url:
            'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          year: '2008',
          type: 'movie',
        },
      ],
      itemsCount: 25,
      user_id: 'mock-user-2',
    },
  ];

  const getTimeAgo = dateString => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {return `${diffInSeconds}s ago`;}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m ago`;}
    if (diffInSeconds < 86400)
      {return `${Math.floor(diffInSeconds / 3600)}h ago`;}
    if (diffInSeconds < 2592000)
      {return `${Math.floor(diffInSeconds / 86400)}d ago`;}
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const capitalizeCategory = category => {
    if (!category) {return 'General';}
    const categoryMap = {
      movies: 'Movies',
      series: 'Series',
      books: 'Books',
      games: 'Games',
      people: 'People',
      videos: 'Videos',
      places: 'Places',
    };
    return categoryMap[category?.toLowerCase()] || category;
  };

  const handleItemPress = item => {
    if (!item || !onNavigate) {return;}

    const { type } = item;

    switch (type) {
      case 'place':
        onNavigate('PlaceDetails', { item });
        break;
      case 'movie':
        onNavigate('MovieDetails', { item });
        break;
      case 'series':
        onNavigate('SeriesDetails', { item });
        break;
      case 'music':
        onNavigate('MusicDetails', { item });
        break;
      case 'book':
        onNavigate('BookDetails', { item });
        break;
      case 'person':
        onNavigate('PersonDetails', { item });
        break;
      case 'game':
        onNavigate('GameDetails', { item });
        break;
      case 'video':
        onNavigate('VideoDetails', { item });
        break;
      default:
        console.log('Unknown item type:', type);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    HapticPatterns.pullRefresh();
    setCurrentPage(0);
    setHasMoreData(true);
    await loadFeedData(0, activeCategory, false);
    setRefreshing(false);
  };

  const handleCategoryChange = async category => {
    setCategoryLoading(true);

    // Fade out current content
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setActiveCategory(category);
    setCurrentPage(0);
    setHasMoreData(true);

    // Add a small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 150));

    await loadFeedData(0, category, false);

    // Fade in new content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setCategoryLoading(false);
  };

  const handleLoadMore = async () => {
    if (!loadingMore && !loading && hasMoreData && feedData.length > 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await loadFeedData(nextPage, activeCategory, true);
    }
  };

  const handleLike = async listId => {
    HapticPatterns.buttonPress();

    if (!user?.id) {
      // User not logged in, show login prompt or handle accordingly
      console.log('User not logged in');
      return;
    }

    if (likingItems.has(listId)) {return;} // Prevent double clicks

    try {
      setLikingItems(prev => new Set([...prev, listId]));

      // Check if user already liked this list
      const { data: existingLike, error: checkError } = await supabase
        .from('list_likes')
        .select('*')
        .eq('list_id', listId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking like:', checkError);
        return;
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', listId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error removing like:', deleteError);
          return;
        }

        // Update local state
        setFeedData(prev =>
          prev.map(item =>
            item.id === listId
              ? { ...item, likes: Math.max(0, item.likes - 1), isLiked: false }
              : item,
          ),
        );
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('list_likes')
          .insert([{ list_id: listId, user_id: user.id }]);

        if (insertError) {
          console.error('Error adding like:', insertError);
          return;
        }

        // Update local state
        setFeedData(prev =>
          prev.map(item =>
            item.id === listId
              ? { ...item, likes: item.likes + 1, isLiked: true }
              : item,
          ),
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
      // Fallback to local state update only
      setFeedData(prev =>
        prev.map(item =>
          item.id === listId
            ? {
                ...item,
                likes: item.likes + (item.isLiked ? -1 : 1),
                isLiked: !item.isLiked,
              }
            : item,
        ),
      );
    } finally {
      setLikingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(listId);
        return newSet;
      });
    }
  };

  const getCategoryIcon = category => {
    if (!category) {return 'list';}
    const icons = {
      Movies: 'film',
      Places: 'map-pin',
      Books: 'book',
      Music: 'music',
      Games: 'gamepad-2',
      Videos: 'video',
      Series: 'tv',
      People: 'users',
    };
    return icons[category] || 'list';
  };

  const renderFeedItem = ({ item }) => (
    <View style={styles.feedItemContainer}>
      <TouchableOpacity
        style={styles.feedItem}
        activeOpacity={0.9}
        onPress={() => {
          HapticPatterns.buttonPress();
          // Navigate to list detail
          if (onNavigate) {
            onNavigate('ListDetails', {
              listId: item.id,
            });
          }
        }}
      >
        {/* Header with user info */}
        <View style={styles.feedHeader}>
          <TouchableOpacity
            onPress={() => {
              HapticPatterns.selection();
              // Navigate to user profile
              if (onNavigate) {
                onNavigate('UserProfile', {
                  userId: item.user_id,
                  username: item.authorUsername,
                  isOwnProfile: false,
                });
              }
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.authorAvatar }}
              style={styles.authorAvatar}
            />
          </TouchableOpacity>
          <View style={styles.feedHeaderText}>
            <View style={styles.userInfoContainer}>
              <TouchableOpacity
                style={styles.userNameContainer}
                onPress={() => {
                  HapticPatterns.selection();
                  // Navigate to user profile
                  if (onNavigate) {
                    onNavigate('UserProfile', {
                      userId: item.user_id,
                      username: item.authorUsername,
                      isOwnProfile: false,
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.authorName}>{item.author}</Text>
                <Text style={styles.usernameText}>@{item.authorUsername}</Text>
              </TouchableOpacity>
              <View style={styles.metaInfo}>
                <Feather
                  name={getCategoryIcon(item.category)}
                  size={12}
                  color={Colors.textSecondary}
                />
                <Text style={styles.categoryText}>{item.category}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.timestampText}>{item.timestamp}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* List Title and Description */}
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.listDescription} numberOfLines={3}>
              {item.description.length > 350
                ? `${item.description.substring(0, 350)}...`
                : item.description}
            </Text>
          )}
        </View>

        {/* List Items Preview */}
        {item.previewItems && item.previewItems.length > 0 && (
          <View style={styles.listPreview}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewContainer}
              pagingEnabled={false}
              decelerationRate="fast"
              snapToInterval={130}
              snapToAlignment="start"
              bounces={true}
              bouncesZoom={false}
              scrollEventThrottle={16}
            >
              {item.previewItems.map((listItem, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.previewItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    HapticPatterns.selection();
                    handleItemPress(listItem);
                  }}
                >
                  <Image
                    source={{
                      uri:
                        listItem.image_url ||
                        'https://via.placeholder.com/120x180/f0f0f0/999?text=No+Image',
                    }}
                    style={styles.previewImage}
                  />
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {listItem.title}
                  </Text>
                  <Text style={styles.previewAuthor} numberOfLines={1}>
                    {listItem.year ||
                      listItem.description ||
                      capitalizeCategory(listItem.type)}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Show more indicator if there are more items */}
              {item.itemsCount > item.previewItems.length && (
                <TouchableOpacity
                  style={styles.showMoreItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    HapticPatterns.buttonPress();
                    // Navigate to full list
                  }}
                >
                  <View style={styles.showMoreContent}>
                    <Feather
                      name="plus"
                      size={24}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.showMoreText}>
                      +{item.itemsCount - item.previewItems.length} more
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={styles.feedActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              HapticPatterns.buttonPress();
              // Navigate to list details to show comments
              if (onNavigate) {
                onNavigate('ListDetails', {
                  listId: item.id,
                  showComments: true,
                });
              }
            }}
          >
            <Feather
              name="message-circle"
              size={18}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Feather
              name="heart"
              size={18}
              color={item.isLiked ? Colors.error : Colors.textSecondary}
              style={{
                opacity: item.isLiked ? 1 : 0.7,
                transform: [{ scale: item.isLiked ? 1.1 : 1 }],
              }}
            />
            <TouchableOpacity
              onPress={() => {
                HapticPatterns.selection();
                setSelectedListId(item.id);
                setShowLikesModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <SubHeader
        onCategoryChange={handleCategoryChange}
        activeCategory={activeCategory}
        isLoading={categoryLoading}
      />
    </View>
  );

  if (loading && feedData.length === 0) {
    return (
      <ScreenLayout
        logoSource={require('../../assets/connectlist-logo.png')}
        rightIconName="message-circle"
        onRightPress={() => onNavigate('Messages')}
        showBottomMenu
        onTabPress={onTabPress}
        activeTab={activeTab}
        badges={badges}
      >
        <View style={styles.loadingContainer}>
          {renderHeader()}
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.skeletonFeedItem}>
              <View style={styles.skeletonHeader}>
                <LoadingSkeleton width={40} height={40} borderRadius={20} />
                <View style={styles.skeletonHeaderText}>
                  <LoadingSkeleton width="90%" height={16} />
                  <LoadingSkeleton
                    width="60%"
                    height={12}
                    style={{ marginTop: 4 }}
                  />
                </View>
              </View>

              {/* Skeleton for list preview */}
              <View style={styles.skeletonPreview}>
                {Array.from({ length: 3 }).map((_, itemIndex) => (
                  <View key={itemIndex} style={styles.skeletonPreviewItem}>
                    <LoadingSkeleton
                      width={120}
                      height={180}
                      borderRadius={8}
                    />
                    <LoadingSkeleton
                      width={100}
                      height={12}
                      style={{ marginTop: 8 }}
                    />
                    <LoadingSkeleton
                      width={80}
                      height={10}
                      style={{ marginTop: 4 }}
                    />
                  </View>
                ))}
              </View>

              {/* Skeleton for actions */}
              <View style={styles.skeletonActions}>
                <LoadingSkeleton width={40} height={16} />
                <LoadingSkeleton width={40} height={16} />
                <LoadingSkeleton width={40} height={16} />
              </View>
            </View>
          ))}
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      logoSource={require('../../assets/connectlist-logo.png')}
      rightIconName="message-circle"
      onRightPress={() => onNavigate('Messages')}
      showBottomMenu
      onTabPress={onTabPress}
      activeTab={activeTab}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={feedData}
          renderItem={renderFeedItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          refreshControl={
            <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      </Animated.View>

      {/* Likes Modal */}
      <LikesModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        listId={selectedListId}
        onUserPress={userId => {
          if (onNavigate) {
            onNavigate('UserProfile', {
              userId: userId,
              isOwnProfile: false,
            });
          }
          setShowLikesModal(false);
        }}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    paddingBottom: Spacing.large,
  },
  feedItemContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerSection: {
    paddingBottom: Spacing.small,
  },
  feedItem: {
    backgroundColor: 'rgb(250, 250, 250)',
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    borderRadius: 12,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.medium,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.small,
  },
  feedHeaderText: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userNameContainer: {
    flex: 1,
  },
  authorName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  usernameText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  separator: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  categoryText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  timestampText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },

  listContent: {
    marginBottom: Spacing.medium,
  },
  listTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    lineHeight: 22,
  },
  listDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  listPreview: {
    marginBottom: Spacing.medium,
  },
  previewContainer: {
    paddingHorizontal: 0,
    paddingRight: Spacing.medium,
  },
  previewItem: {
    width: 120,
    marginRight: Spacing.small,
  },
  showMoreItem: {
    width: 120,
    marginRight: Spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreContent: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.tiny,
    textAlign: 'center',
  },
  previewImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.small,
  },
  previewTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
    lineHeight: 16,
  },
  previewAuthor: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: 0,
    marginRight: Spacing.large,
  },
  actionText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  loadingContainer: {
    flex: 1,
  },
  skeletonFeedItem: {
    backgroundColor: 'rgb(250, 250, 250)',
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    borderRadius: 12,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: Spacing.small,
  },
  skeletonPreview: {
    flexDirection: 'row',
    marginBottom: Spacing.medium,
  },
  skeletonPreviewItem: {
    marginRight: Spacing.small,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  loadingMore: {
    padding: Spacing.medium,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});

export default HomeScreen;
