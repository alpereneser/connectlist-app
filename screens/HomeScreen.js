import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, FlatList, Image, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Heart, ChatCircle, Share } from 'phosphor-react-native';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import BottomMenu from '../components/BottomMenu';
import { hapticPatterns } from '../utils/haptics';
import { a11yProps, a11yHelpers } from '../utils/accessibility';
import { shareList } from '../utils/platformSharing';
import tokens from '../utils/designTokens';

const HomeScreen = ({ navigation }) => {
  const { user, userProfile, signOut, supabase } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('home');
  const [feedLists, setFeedLists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeedLists();
  }, [selectedCategory]);

  const loadFeedLists = async (isRefresh = false) => {
    if (!user) {
      setFeedLists([]);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch real lists from Supabase
      const { data, error } = await supabase.lists.getFeedLists(user.id, 0, 20);
      
      if (error) {
        console.error('Error loading feed lists:', error);
        // Fall back to mock data on error
        const mockFeedLists = [
        {
          id: '1',
          title: 'Best Movies of 2024',
          description: 'These are the films that absolutely blew me away this year. Each one brings something unique to the table and deserves a spot on everyone\'s watchlist.',
          category: 'movie',
          creator: {
            id: 'user1',
            username: 'movie_lover',
            full_name: 'John Doe',
            avatar_url: 'https://via.placeholder.com/50x50',
          },
          items: [
            { id: '1', title: 'Dune: Part Two', image_url: 'https://via.placeholder.com/100x150' },
            { id: '2', title: 'Oppenheimer', image_url: 'https://via.placeholder.com/100x150' },
            { id: '3', title: 'Poor Things', image_url: 'https://via.placeholder.com/100x150' },
            { id: '4', title: 'The Zone of Interest', image_url: 'https://via.placeholder.com/100x150' },
            { id: '5', title: 'Past Lives', image_url: 'https://via.placeholder.com/100x150' },
          ],
          likes_count: 234,
          comments_count: 45,
          shares_count: 12,
          created_at: '2024-01-15T10:30:00Z',
          is_liked: false,
        },
        {
          id: '2',
          title: 'Must-Read Books This Year',
          description: 'Life-changing books that have shaped my perspective. Perfect mix of fiction and non-fiction that will expand your mind.',
          category: 'book',
          creator: {
            id: 'user2',
            username: 'book_worm',
            full_name: 'Sarah Wilson',
            avatar_url: 'https://via.placeholder.com/50x50',
          },
          items: [
            { id: '6', title: 'Tomorrow, and Tomorrow, and Tomorrow', image_url: 'https://via.placeholder.com/100x150' },
            { id: '7', title: 'Klara and the Sun', image_url: 'https://via.placeholder.com/100x150' },
            { id: '8', title: 'The Seven Husbands of Evelyn Hugo', image_url: 'https://via.placeholder.com/100x150' },
          ],
          likes_count: 189,
          comments_count: 32,
          shares_count: 8,
          created_at: '2024-01-14T15:20:00Z',
          is_liked: true,
        },
      ];
        setFeedLists(mockFeedLists);
        return;
      }

      // Filter by category if needed
      let filteredData = data || [];
      if (selectedCategory !== 'all') {
        filteredData = filteredData.filter(list => 
          list.category?.name === selectedCategory
        );
      }

      // Transform Supabase data to match UI format
      const transformedLists = filteredData.map(list => ({
        id: list.id,
        title: list.title,
        description: list.description,
        category: list.category?.name || 'unknown',
        creator: {
          id: list.creator.id,
          username: list.creator.username,
          full_name: list.creator.full_name,
          avatar_url: list.creator.avatar_url || 'https://via.placeholder.com/50x50',
        },
        items: (list.list_items || []).slice(0, 6).map(item => ({
          id: item.id,
          title: item.title,
          image_url: item.image_url || 'https://via.placeholder.com/100x150',
        })),
        likes_count: list.likes_count || 0,
        comments_count: list.comments_count || 0,
        shares_count: 0, // Not implemented yet
        created_at: list.created_at,
        is_liked: false, // Will be checked separately
      }));

      setFeedLists(transformedLists);

    } catch (error) {
      console.error('Load feed lists error:', error);
      setFeedLists([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleBackPress = () => {
    // Back button functionality
    console.log('Back pressed');
  };

  const handleMessagesPress = () => {
    navigation.navigate('Messages');
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    console.log('Category changed to:', categoryId);
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    console.log('Tab pressed:', tabId);
    
    if (tabId === 'notifications') {
      navigation.navigate('Notifications');
    } else if (tabId === 'profile') {
      navigation.navigate('Profile');
    } else if (tabId === 'search') {
      navigation.navigate('Search');
    }
  };

  const handleCategorySelect = (category) => {
    console.log('Category selected:', category);
    navigation.navigate('CreateList', { category });
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleLike = useCallback(async (listId) => {
    if (!user) return;

    const currentList = feedLists.find(l => l.id === listId);
    const wasLiked = currentList?.is_liked;
    
    // Haptic feedback
    hapticPatterns.likeButton(!wasLiked);

    // Optimistic update
    setFeedLists(prev => 
      prev.map(list => 
        list.id === listId 
          ? { 
              ...list, 
              is_liked: !list.is_liked,
              likes_count: list.is_liked ? list.likes_count - 1 : list.likes_count + 1
            }
          : list
      )
    );

    try {
      if (wasLiked) {
        await supabase.likes.unlikeList(user.id, listId);
      } else {
        await supabase.likes.likeList(user.id, listId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setFeedLists(prev => 
        prev.map(list => 
          list.id === listId 
            ? { 
                ...list, 
                is_liked: wasLiked,
                likes_count: wasLiked ? list.likes_count + 1 : list.likes_count - 1
              }
            : list
        )
      );
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  }, [user, feedLists, supabase]);

  const handleComment = useCallback((listId) => {
    hapticPatterns.buttonPress('secondary');
    console.log('Comment on list:', listId);
    // TODO: Navigate to comments screen
  }, []);

  const handleShare = useCallback(async (listId) => {
    const listToShare = feedLists.find(l => l.id === listId);
    if (!listToShare) return;

    try {
      const result = await shareList({
        id: listToShare.id,
        title: listToShare.title,
        description: listToShare.description,
        shareUrl: `https://connectlist.app/lists/${listToShare.id}`
      });

      if (result.success) {
        console.log('List shared successfully');
      }
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  }, [feedLists]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const renderListPost = useCallback(({ item, index }) => {
    const contentDescription = a11yHelpers.generateContentDescription(
      'post',
      `${item.title} by ${item.creator.full_name}`,
      {
        likes: item.likes_count,
        comments: item.comments_count,
        time: formatTimeAgo(item.created_at)
      }
    );

    return (
      <View 
        style={styles.listPost}
        {...a11yProps.listItem(
          contentDescription,
          'Tap to view full list',
          index,
          feedLists.length
        )}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.creatorInfo}
            onPress={() => navigation.navigate('Profile', { userId: item.creator.id })}
            {...a11yProps.button(
              `Profile of ${item.creator.full_name}`,
              'View profile and other lists'
            )}
          >
            <Image 
              source={{ uri: item.creator.avatar_url }} 
              style={styles.creatorAvatar}
              {...a11yProps.image(`${item.creator.full_name}'s profile picture`)}
            />
            <View style={styles.creatorTexts}>
              <Text style={styles.creatorName}>{item.creator.full_name}</Text>
              <Text style={styles.creatorUsername}>
                @{item.creator.username} • {formatTimeAgo(item.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        <TouchableOpacity
          style={styles.listContent}
          onPress={() => {
            hapticPatterns.listItemSelection();
            navigation.navigate('ListDetail', { listId: item.id });
          }}
          activeOpacity={0.9}
          {...a11yProps.button(
            `Open list: ${item.title}`,
            'View full list details and items'
          )}
        >
          <Text style={styles.listTitle}>{item.title}</Text>
          <Text style={styles.listDescription} numberOfLines={3}>
            {item.description}
          </Text>

          {/* List Items Horizontal Scroll */}
          <FlatList
            data={item.items}
            keyExtractor={(listItem) => `${item.id}-${listItem.id}`}
            renderItem={({ item: listItem, index: itemIndex }) => (
              <View 
                style={styles.listItemPreview}
                {...a11yProps.image(
                  `${listItem.title}, item ${itemIndex + 1} of ${item.items.length}`,
                  false
                )}
              >
                <Image 
                  source={{ uri: listItem.image_url }} 
                  style={styles.listItemImage}
                  accessibilityIgnoresInvertColors={true}
                />
                <Text style={styles.listItemTitle} numberOfLines={2}>
                  {listItem.title}
                </Text>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listItemsContainer}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            accessible={false}
            removeClippedSubviews={true}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={8}
          />
        </TouchableOpacity>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
            {...a11yProps.button(
              `${item.is_liked ? 'Unlike' : 'Like'} this list`,
              `Currently ${item.likes_count} likes`
            )}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={20}
              color={item.is_liked ? tokens.colors.semantic.error : tokens.colors.gray[500]}
              weight={item.is_liked ? 'fill' : 'regular'}
            />
            <Text style={[
              styles.actionText, 
              item.is_liked && styles.likedText
            ]}>
              {item.likes_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleComment(item.id)}
            {...a11yProps.button(
              'View comments',
              `${item.comments_count} comments`
            )}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChatCircle size={20} color={tokens.colors.gray[500]} />
            <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item.id)}
            {...a11yProps.button(
              'Share this list',
              'Share with others'
            )}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share size={20} color={tokens.colors.gray[500]} />
            <Text style={styles.actionText}>{item.shares_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [feedLists.length, navigation, handleLike, handleComment, handleShare]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <Header
        showBackButton={false} // Index sayfasında back button yok
        onBackPress={handleBackPress}
        onMessagesPress={handleMessagesPress}
      />

      {/* SubHeader */}
      <SubHeader
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Main Content */}
      <FlatList
        data={feedLists}
        keyExtractor={(item) => item.id}
        renderItem={renderListPost}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              hapticPatterns.pullToRefresh();
              loadFeedLists(true);
            }}
            colors={[tokens.colors.primary]}
            tintColor={tokens.colors.primary}
            title="Pull to refresh"
            titleColor={tokens.colors.gray[600]}
          />
        }
        ListHeaderComponent={() => (
          selectedCategory !== 'all' ? (
            <View style={styles.categoryInfo}>
              <Text 
                style={styles.categoryInfoText}
                {...a11yProps.header(2, `Showing ${selectedCategory.toUpperCase()} lists`)}
              >
                Showing: {selectedCategory.toUpperCase()} lists
              </Text>
            </View>
          ) : null
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text 
              style={styles.emptyText}
              {...a11yProps.header(2, isLoading ? 'Loading content' : 'No lists found')}
            >
              {isLoading ? 'Loading...' : 'No lists found. Create your first list!'}
            </Text>
          </View>
        )}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={3}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 300, // Approximate item height
          offset: 300 * index,
          index,
        })}
      />

      {/* Bottom Menu */}
      <BottomMenu
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onCategorySelect={handleCategorySelect}
        showCreateButton={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: tokens.layout.tabBarHeight + tokens.spacing.lg,
  },
  categoryInfo: {
    backgroundColor: tokens.colors.primaryLight,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.medium,
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.primary,
  },
  categoryInfoText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  postSeparator: {
    height: tokens.spacing.md + 1,
    backgroundColor: tokens.colors.background.secondary,
  },
  listPost: {
    backgroundColor: tokens.colors.background.primary,
    paddingVertical: tokens.spacing.lg,
  },
  postHeader: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md + 1,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: tokens.touchTarget.minimum,
  },
  creatorAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: tokens.spacing.md + 1,
  },
  creatorTexts: {
    flex: 1,
  },
  creatorName: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
    marginBottom: 2,
  },
  creatorUsername: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[500],
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md + 1,
  },
  listTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
    marginBottom: tokens.spacing.sm + 2,
    lineHeight: tokens.typography.fontSize.xl * tokens.typography.lineHeight.tight,
  },
  listDescription: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.gray[700],
    lineHeight: tokens.typography.fontSize.lg * tokens.typography.lineHeight.normal,
    marginBottom: tokens.spacing.lg - 5,
  },
  listItemsContainer: {
    paddingRight: tokens.spacing.lg,
  },
  listItemPreview: {
    width: 115,
    alignItems: 'center',
  },
  listItemImage: {
    width: 115,
    height: 144,
    borderRadius: tokens.borderRadius.medium,
    marginBottom: tokens.spacing.sm,
    backgroundColor: tokens.colors.gray[100],
  },
  listItemTitle: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[600],
    textAlign: 'center',
    lineHeight: tokens.typography.fontSize.md * tokens.typography.lineHeight.tight,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.gray[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: tokens.spacing.xs + 1,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm + 2,
    borderRadius: tokens.borderRadius.medium,
    minHeight: tokens.touchTarget.large,
    minWidth: tokens.touchTarget.comfortable,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: tokens.typography.fontSize.lg + 2,
    color: tokens.colors.gray[600],
    marginLeft: tokens.spacing.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  likedText: {
    color: tokens.colors.semantic.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl * 2.5,
    paddingHorizontal: tokens.spacing.xl,
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[600],
    textAlign: 'center',
    lineHeight: tokens.typography.fontSize.md * tokens.typography.lineHeight.relaxed,
  },
});

export default HomeScreen;