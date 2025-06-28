import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DotsThree,
  UserPlus,
  ChatCircle,
  PencilSimple,
  Heart,
  ListBullets,
  MapPin,
  FilmStrip,
  BookOpen,
  Television,
  User,
  VideoCamera,
  GameController,
  MusicNote,
  SquaresFour,
  Rows,
  Share,
} from 'phosphor-react-native';
import Header from '../components/Header';
import BottomMenu from '../components/BottomMenu';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const { user: currentUser, userProfile: currentUserProfile, supabase } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userLists, setUserLists] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // grid or list
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSection, setActiveSection] = useState('lists'); // lists, liked
  const [likedLists, setLikedLists] = useState([]);

  // Check if viewing own profile
  const isOwnProfile = !userId || userId === currentUser?.id;

  const categories = [
    { id: 'all', label: 'All', icon: ListBullets },
    { id: 'place', label: 'Places', icon: MapPin },
    { id: 'movie', label: 'Movies', icon: FilmStrip },
    { id: 'tv', label: 'TV Shows', icon: Television },
    { id: 'book', label: 'Books', icon: BookOpen },
    { id: 'game', label: 'Games', icon: GameController },
    { id: 'video', label: 'Videos', icon: VideoCamera },
    { id: 'person', label: 'People', icon: User },
    { id: 'music', label: 'Music', icon: MusicNote },
  ];

  useEffect(() => {
    loadProfile();
    loadUserLists();
    loadLikedLists();
    loadFollowData();
  }, [userId]);

  const loadProfile = async () => {
    try {
      if (isOwnProfile) {
        // Get follow counts for current user
        const followCounts = await supabase.follows.getFollowCounts(currentUser.id);
        
        setProfile({
          ...currentUserProfile,
          followers_count: followCounts.followers || 0,
          following_count: followCounts.following || 0,
          lists_count: 0, // Will be updated after loading lists
          liked_lists_count: 0, // Will be updated after loading liked lists
        });
      } else {
        // Fetch other user's profile from Supabase
        const { data: userProfile, error } = await supabase.profiles.getProfile(userId);
        
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        // Get follow counts and follow status
        const [followCounts, isFollowingResult] = await Promise.all([
          supabase.follows.getFollowCounts(userId),
          supabase.follows.checkFollowing(currentUser.id, userId)
        ]);

        setProfile({
          ...userProfile,
          followers_count: followCounts.followers || 0,
          following_count: followCounts.following || 0,
          lists_count: 0, // Will be updated after loading lists
          liked_lists_count: 0, // Will be updated after loading liked lists
        });

        setIsFollowing(isFollowingResult.data || false);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const loadUserLists = async () => {
    setIsLoading(true);
    try {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;

      // Fetch user's lists from Supabase
      const { data, error } = await supabase.lists.getUserLists(targetUserId, 0, 50);
      
      if (error) {
        console.error('Error loading user lists:', error);
        setUserLists([]);
        return;
      }

      // Transform data to match UI format
      const transformedLists = (data || []).map(list => ({
        id: list.id,
        title: list.title,
        description: list.description,
        category: list.category?.name || 'unknown',
        cover_image_url: list.cover_image_url || 'https://via.placeholder.com/300x200',
        likes_count: list.likes_count || 0,
        comments_count: list.comments_count || 0,
        shares_count: 0,
        item_count: list.item_count || 0,
        privacy: list.privacy,
        is_liked: false, // Will be checked separately
        items: (list.list_items || []).slice(0, 4).map(item => ({
          id: item.id,
          title: item.title,
          image_url: item.image_url || 'https://via.placeholder.com/100x150',
        })),
        created_at: list.created_at,
      }));

      setUserLists(transformedLists);
      
      // Update profile with lists count
      setProfile(prev => prev ? { ...prev, lists_count: transformedLists.length } : prev);
      
    } catch (error) {
      console.error('Load user lists error:', error);
      setUserLists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikedLists = async () => {
    try {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;

      // Fetch liked lists from Supabase
      const { data, error } = await supabase.lists.getLikedLists(targetUserId, 0, 50);
      
      if (error) {
        console.error('Error loading liked lists:', error);
        setLikedLists([]);
        return;
      }

      // Transform data to match UI format
      const transformedLists = (data || []).map(list => ({
        id: list.id,
        title: list.title,
        description: list.description,
        category: list.category?.name || 'unknown',
        cover_image_url: list.cover_image_url || 'https://via.placeholder.com/300x200',
        likes_count: list.likes_count || 0,
        comments_count: list.comments_count || 0,
        item_count: list.item_count || 0,
        creator: {
          username: list.creator?.username || 'unknown',
          full_name: list.creator?.full_name || 'Unknown User',
        },
      }));

      setLikedLists(transformedLists);
      
      // Update profile with liked lists count
      setProfile(prev => prev ? { ...prev, liked_lists_count: transformedLists.length } : prev);
      
    } catch (error) {
      console.error('Load liked lists error:', error);
      setLikedLists([]);
    }
  };

  const loadFollowData = async () => {
    try {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;

      // Fetch followers and following from Supabase
      const [followersResult, followingResult] = await Promise.all([
        supabase.follows.getFollowers(targetUserId),
        supabase.follows.getFollowing(targetUserId)
      ]);

      setFollowers(followersResult.data || []);
      setFollowing(followingResult.data || []);
      
    } catch (error) {
      console.error('Load follow data error:', error);
      setFollowers([]);
      setFollowing([]);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile || isOwnProfile) return;

    try {
      // Optimistic update
      setIsFollowing(!isFollowing);
      setProfile(prev => ({
        ...prev,
        followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
      }));

      // Update in Supabase
      if (isFollowing) {
        await supabase.follows.unfollowUser(currentUser.id, profile.id);
      } else {
        await supabase.follows.followUser(currentUser.id, profile.id);
      }
    } catch (error) {
      console.error('Follow error:', error);
      // Revert optimistic update on error
      setIsFollowing(isFollowing);
      setProfile(prev => ({
        ...prev,
        followers_count: isFollowing ? prev.followers_count + 1 : prev.followers_count - 1
      }));
    }
  };

  const handleMessage = () => {
    navigation.navigate('MessageDetail', {
      conversationId: `conv_${profile.id}`,
      participant: profile,
    });
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleStatsPress = (type) => {
    Alert.alert(
      type.charAt(0).toUpperCase() + type.slice(1),
      `${type} list will be implemented`
    );
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      navigation.navigate('Home');
    } else if (tabId === 'notifications') {
      navigation.navigate('Notifications');
    } else if (tabId === 'create') {
      console.log('Create pressed');
    }
  };

  const handleLike = async (listId) => {
    if (!currentUser) return;

    // Optimistic update
    setUserLists(prev => 
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
      const list = userLists.find(l => l.id === listId);
      if (list?.is_liked) {
        await supabase.likes.unlikeList(currentUser.id, listId);
      } else {
        await supabase.likes.likeList(currentUser.id, listId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setUserLists(prev => 
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

  const filteredLists = () => {
    const lists = activeSection === 'lists' ? userLists : likedLists;
    if (selectedCategory === 'all') return lists;
    return lists.filter(list => list.category === selectedCategory);
  };

  const renderListItem = ({ item, index }) => {
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
        >
          <Image source={{ uri: item.cover_image_url || 'https://via.placeholder.com/300x200' }} style={styles.gridItemImage} />
          <View style={styles.gridItemOverlay}>
            <View style={styles.gridItemStats}>
              <Heart size={14} color="#fff" weight="fill" />
              <Text style={styles.gridItemStatText}>{item.likes_count}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
        >
          <Image source={{ uri: item.cover_image_url || 'https://via.placeholder.com/300x200' }} style={styles.listItemImage} />
          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle}>{item.title}</Text>
            <Text style={styles.listItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.listItemStats}>
              <Text style={styles.listItemStat}>{item.item_count} items</Text>
              <Text style={styles.listItemStat}>•</Text>
              <Text style={styles.listItemStat}>{item.likes_count} likes</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderSocialListPost = ({ item }) => (
    <View style={styles.socialListPost}>
      {/* Post Header */}
      <View style={styles.socialPostHeader}>
        <Text style={styles.socialPostTime}>{formatTimeAgo(item.created_at)}</Text>
      </View>

      {/* List Content */}
      <TouchableOpacity
        style={styles.socialListContent}
        onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
        activeOpacity={0.9}
      >
        <Text style={styles.socialListTitle}>{item.title}</Text>
        <Text style={styles.socialListDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* List Items Horizontal Scroll */}
        <FlatList
          data={item.items}
          keyExtractor={(listItem) => listItem.id}
          renderItem={({ item: listItem }) => (
            <View style={styles.socialListItemPreview}>
              <Image source={{ uri: listItem.image_url }} style={styles.socialListItemImage} />
              <Text style={styles.socialListItemTitle} numberOfLines={2}>{listItem.title}</Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.socialListItemsContainer}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.socialPostActions}>
        <TouchableOpacity
          style={styles.socialActionButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart
            size={24}
            color={item.is_liked ? '#ef4444' : '#666'}
            weight={item.is_liked ? 'fill' : 'regular'}
          />
          <Text style={[styles.socialActionText, item.is_liked && styles.socialLikedText]}>
            {item.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialActionButton}
          onPress={() => handleComment(item.id)}
        >
          <ChatCircle size={24} color="#666" />
          <Text style={styles.socialActionText}>{item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialActionButton}
          onPress={() => handleShare(item.id)}
        >
          <Share size={24} color="#666" />
          <Text style={styles.socialActionText}>{item.shares_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <Header
          showBackButton={!isOwnProfile}
          onBackPress={() => navigation.goBack()}
          title="Profile"
          onMessagesPress={() => navigation.navigate('Messages')}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={!isOwnProfile}
        onBackPress={() => navigation.goBack()}
        title={profile.full_name}
        onMessagesPress={() => navigation.navigate('Messages')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileMainSection}>
            <View style={styles.profileImageContainer}>
              <Image source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150x150' }} style={styles.profileImage} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.username}>@{profile.username}</Text>
              
              {profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleStatsPress('followers')}
                >
                  <Text style={styles.statNumber}>{profile.followers_count}</Text>
                  <Text style={styles.statLabel}>followers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleStatsPress('following')}
                >
                  <Text style={styles.statNumber}>{profile.following_count}</Text>
                  <Text style={styles.statLabel}>following</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => setActiveSection('lists')}
                >
                  <Text style={styles.statNumber}>{profile.lists_count}</Text>
                  <Text style={styles.statLabel}>lists</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => setActiveSection('liked')}
                >
                  <Text style={styles.statNumber}>{profile.liked_lists_count || likedLists.length}</Text>
                  <Text style={styles.statLabel}>liked</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isOwnProfile && (
              <TouchableOpacity style={styles.editIconButton} onPress={handleEditProfile}>
                <PencilSimple size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
              >
                <UserPlus size={16} color={isFollowing ? '#666' : '#fff'} />
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <ChatCircle size={16} color="#1a1a1a" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>


        {/* Category Filter */}
        <View style={styles.categoryFilter}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Icon 
                    size={16} 
                    color={isSelected ? '#f97316' : '#666'} 
                    weight={isSelected ? 'fill' : 'regular'}
                  />
                  <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>

        {/* Lists Grid/List */}
        <View style={styles.listsContainer}>
          {filteredLists().length > 0 ? (
            viewMode === 'grid' ? (
              <FlatList
                data={filteredLists()}
                keyExtractor={(item) => item.id}
                renderItem={renderListItem}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.listsContent}
              />
            ) : (
              <FlatList
                key="social-list-view"
                data={filteredLists()}
                keyExtractor={(item) => item.id}
                renderItem={renderSocialListPost}
                scrollEnabled={false}
                contentContainerStyle={styles.socialListsContent}
                ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
              />
            )
          ) : (
            <View style={styles.emptyContainer}>
              <ListBullets size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No lists yet</Text>
              <Text style={styles.emptySubtitle}>
                {isOwnProfile 
                  ? 'Create your first list to get started'
                  : 'This user hasn\'t created any lists yet'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomMenu 
        activeTab={activeTab} 
        onTabPress={handleTabPress}
        onCategorySelect={(category) => {
          navigation.navigate('CreateList', { category });
        }}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileMainSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
  },
  editIconButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  bio: {
    fontSize: 17,
    color: '#1a1a1a',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  followingButtonText: {
    color: '#666',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 60,
    justifyContent: 'center',
  },
  selectedCategoryItem: {
    borderBottomColor: '#f97316',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#f97316',
    fontWeight: '600',
  },
  viewModeToggle: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  viewModeButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
  },
  activeViewModeButton: {
    backgroundColor: '#fff5f0',
  },
  listsContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  listsContent: {
    padding: 16,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    marginRight: '3.5%',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  gridItemOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 8,
  },
  gridItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridItemStatText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  listItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemStat: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  socialListsContent: {
    paddingTop: 8,
  },
  postSeparator: {
    height: 16,
  },
  socialListPost: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  socialPostHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  socialPostTime: {
    fontSize: 12,
    color: '#999',
  },
  socialListContent: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  socialListTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 28,
  },
  socialListDescription: {
    fontSize: 17,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  socialListItemsContainer: {
    paddingRight: 20,
  },
  socialListItemPreview: {
    width: 100,
    alignItems: 'center',
  },
  socialListItemImage: {
    width: 100,
    height: 130,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  socialListItemTitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  socialPostActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  socialActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    minHeight: 44,
  },
  socialActionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  socialLikedText: {
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProfileScreen;