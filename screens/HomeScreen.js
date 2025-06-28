import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView, FlatList, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Heart, ChatCircle, Star, Share } from 'phosphor-react-native';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import BottomMenu from '../components/BottomMenu';

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

  const handleLike = async (listId) => {
    if (!user) return;

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
      const list = feedLists.find(l => l.id === listId);
      if (list?.is_liked) {
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
                is_liked: !list.is_liked,
                likes_count: list.is_liked ? list.likes_count - 1 : list.likes_count + 1
              }
            : list
        )
      );
    }
  };

  const handleComment = (listId) => {
    console.log('Comment on list:', listId);
    // TODO: Navigate to comments screen
  };

  const handleShare = (listId) => {
    console.log('Share list:', listId);
    // TODO: Implement share functionality
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const renderListPost = ({ item }) => (
    <View style={styles.listPost}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.creatorInfo}>
          <Image source={{ uri: item.creator.avatar_url }} style={styles.creatorAvatar} />
          <View style={styles.creatorTexts}>
            <Text style={styles.creatorName}>{item.creator.full_name}</Text>
            <Text style={styles.creatorUsername}>@{item.creator.username} • {formatTimeAgo(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* List Content */}
      <TouchableOpacity
        style={styles.listContent}
        onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
        activeOpacity={0.9}
      >
        <Text style={styles.listTitle}>{item.title}</Text>
        <Text style={styles.listDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* List Items Horizontal Scroll */}
        <FlatList
          data={item.items}
          keyExtractor={(listItem) => listItem.id}
          renderItem={({ item: listItem }) => (
            <View style={styles.listItemPreview}>
              <Image source={{ uri: listItem.image_url }} style={styles.listItemImage} />
              <Text style={styles.listItemTitle} numberOfLines={2}>{listItem.title}</Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listItemsContainer}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart
            size={20}
            color={item.is_liked ? '#ef4444' : '#666'}
            weight={item.is_liked ? 'fill' : 'regular'}
          />
          <Text style={[styles.actionText, item.is_liked && styles.likedText]}>
            {item.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComment(item.id)}
        >
          <ChatCircle size={20} color="#666" />
          <Text style={styles.actionText}>{item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item.id)}
        >
          <Share size={20} color="#666" />
          <Text style={styles.actionText}>{item.shares_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        refreshing={refreshing}
        onRefresh={() => loadFeedLists(true)}
        ListHeaderComponent={() => (
          selectedCategory !== 'all' ? (
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryInfoText}>
                Showing: {selectedCategory.toUpperCase()} lists
              </Text>
            </View>
          ) : null
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No lists found. Create your first list!'}
            </Text>
          </View>
        )}
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120, // Bottom menu için boşluk
  },
  categoryInfo: {
    backgroundColor: '#fff5f0',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  categoryInfoText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  postSeparator: {
    height: 17,
    backgroundColor: '#f8f9fa',
  },
  listPost: {
    backgroundColor: '#fff',
    paddingVertical: 23,
  },
  postHeader: {
    paddingHorizontal: 23,
    marginBottom: 17,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 17,
  },
  creatorTexts: {
    flex: 1,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  creatorUsername: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 23,
    marginBottom: 17,
  },
  listTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 27,
  },
  listDescription: {
    fontSize: 18,
    color: '#333',
    lineHeight: 23,
    marginBottom: 18,
  },
  listItemsContainer: {
    paddingRight: 23,
  },
  listItemPreview: {
    width: 115,
    alignItems: 'center',
  },
  listItemImage: {
    width: 115,
    height: 144,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  listItemTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 23,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    minHeight: 52,
  },
  actionText: {
    fontSize: 20,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  likedText: {
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;