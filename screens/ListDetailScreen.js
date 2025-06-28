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
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Heart,
  ChatCircle,
  Share,
  DotsThree,
  Globe,
  Lock,
  Users,
  Plus,
  Star,
  PencilSimple,
  Check,
  X,
  Trash,
} from 'phosphor-react-native';
import Header from '../components/Header';
import BottomMenu from '../components/BottomMenu';
import { useAuth } from '../contexts/AuthContext';

const ListDetailScreen = ({ route, navigation }) => {
  const { listId, listData } = route.params || {};
  const { user, userProfile, supabase } = useAuth();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadListData();
  }, [listId, listData]);

  const loadListData = async () => {
    try {
      if (listData) {
        // New list from creation flow - use current user profile
        setList({
          id: listId,
          title: listData.title,
          description: listData.description,
          category: listData.category,
          privacy: listData.privacy,
          allow_comments: listData.allow_comments,
          allow_collaboration: listData.allow_collaboration,
          creator: {
            id: user?.id,
            username: userProfile?.username || 'current_user',
            full_name: userProfile?.full_name || 'Current User',
            avatar_url: userProfile?.avatar_url || 'https://via.placeholder.com/100x100',
          },
          created_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0,
        });
        setItems(listData.items || []);
        setLikesCount(0);
        setCommentsCount(0);
      } else {
        // Load existing list from Supabase
        if (!listId) return;
        
        const { data: listDetail, error } = await supabase.lists.getListWithItems(listId);
        
        if (error) {
          console.error('Error loading list:', error);
          Alert.alert('Error', 'Failed to load list details');
          return;
        }

        if (listDetail) {
          setList(listDetail);
          setItems(listDetail.list_items || []);
          setLikesCount(listDetail.likes_count || 0);
          setCommentsCount(listDetail.comments_count || 0);
          
          // Check if user liked this list
          if (user) {
            const { data: likeData } = await supabase.likes.checkLike(user.id, listId);
            setIsLiked(likeData || false);
          }
        }
      }
    } catch (error) {
      console.error('Load list error:', error);
      Alert.alert('Error', 'Failed to load list details');
    }
  };

  const handleLike = async () => {
    try {
      // TODO: Toggle like in Supabase
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = () => {
    // TODO: Navigate to comments screen
    Alert.alert('Comments', 'Comments feature will be implemented');
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    Alert.alert('Share', 'Share functionality will be implemented');
  };

  const handleFollow = async () => {
    try {
      // TODO: Toggle follow in Supabase
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  // Check if current user owns this list
  const isOwnList = list && user && (list.creator.id === user.id || list.creator.id === 'current-user');

  const handleEditList = () => {
    setEditTitle(list.title);
    setEditDescription(list.description);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updates = {
        title: editTitle.trim(),
        description: editDescription.trim(),
      };

      const { data, error } = await supabase.lists.updateList(list.id, updates);
      
      if (error) {
        Alert.alert('Error', 'Failed to update list');
        return;
      }

      setList(prev => ({ ...prev, ...updates }));
      setIsEditing(false);
      Alert.alert('Success', 'List updated successfully!');
    } catch (error) {
      console.error('Update list error:', error);
      Alert.alert('Error', 'Failed to update list');
    }
  };

  const handleDeleteList = () => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.lists.deleteList(list.id);
              
              if (error) {
                Alert.alert('Error', 'Failed to delete list');
                return;
              }

              Alert.alert('Success', 'List deleted successfully!', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Home')
                }
              ]);
            } catch (error) {
              console.error('Delete list error:', error);
              Alert.alert('Error', 'Failed to delete list');
            }
          }
        }
      ]
    );
  };

  const handleAddItems = () => {
    // Navigate back to create list with this list selected
    navigation.navigate('CreateList', { 
      category: { id: list.category, name: getCategoryName(list.category) },
      existingListId: list.id 
    });
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      navigation.navigate('Home');
    } else if (tabId === 'notifications') {
      navigation.navigate('Notifications');
    } else if (tabId === 'profile') {
      navigation.navigate('Profile');
    } else if (tabId === 'create') {
      // Handle create new list
      console.log('Create new list');
    }
  };

  const getCategoryName = (categoryId) => {
    const categories = {
      movie: 'Movies',
      tv: 'TV Shows',
      book: 'Books',
      game: 'Games',
      video: 'Videos',
      music: 'Music',
      place: 'Places',
      person: 'People',
    };
    return categories[categoryId] || 'Unknown';
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public':
        return <Globe size={16} color="#10b981" />;
      case 'friends':
        return <Users size={16} color="#f59e0b" />;
      case 'private':
        return <Lock size={16} color="#ef4444" />;
      default:
        return <Globe size={16} color="#10b981" />;
    }
  };

  const renderGridItem = ({ item, index }) => (
    <TouchableOpacity style={styles.gridItem} activeOpacity={0.8}>
      <View style={styles.gridItemPosition}>
        <Text style={styles.gridItemPositionText}>{index + 1}</Text>
      </View>
      <Image source={{ uri: item.image_url }} style={styles.gridItemImage} />
      <Text style={styles.gridItemTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.user_note && (
        <View style={styles.gridUserNoteContainer}>
          <Star size={12} color="#f97316" weight="fill" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <Header
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          title="List Detail"
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu 
          activeTab={activeTab} 
          onTabPress={handleTabPress}
          onCategorySelect={(category) => {
            navigation.navigate('CreateList', { category });
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        title={list.title}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* List Header */}
        <View style={styles.listPreviewHeader}>
          {isEditing ? (
            <TextInput
              style={styles.editTitleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="List title"
              multiline={false}
            />
          ) : (
            <Text style={styles.previewTitle}>{list.title}</Text>
          )}
          
          {isEditing ? (
            <TextInput
              style={styles.editDescriptionInput}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="List description"
              multiline={true}
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.previewDescription}>{list.description}</Text>
          )}
          
          <View style={styles.previewMetaContainer}>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>
                {getCategoryName(list.category)}
              </Text>
            </View>
            
            <View style={styles.privacyContainer}>
              {getPrivacyIcon(list.privacy)}
              <Text style={styles.privacyText}>
                {list.privacy.charAt(0).toUpperCase() + list.privacy.slice(1)}
              </Text>
            </View>
            
            {isOwnList && (
              <View style={styles.editButtons}>
                {isEditing ? (
                  <>
                    <TouchableOpacity style={styles.editActionButton} onPress={handleSaveEdit}>
                      <Check size={24} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editActionButton} onPress={() => setIsEditing(false)}>
                      <X size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.editActionButton} onPress={handleEditList}>
                      <PencilSimple size={24} color="#f97316" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editActionButton} onPress={handleDeleteList}>
                      <Trash size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Creator Info */}
          <View style={styles.creatorContainer}>
            <Image 
              source={{ uri: list.creator.avatar_url }} 
              style={styles.creatorAvatar} 
            />
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{list.creator.full_name}</Text>
              <Text style={styles.creatorUsername}>@{list.creator.username}</Text>
            </View>
            
            {!isOwnList && (
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
              >
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List Items Grid */}
        <View style={styles.itemsGridContainer}>
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsTitle}>
              Items ({items.length})
            </Text>
            
            {(isOwnList || list.allow_collaboration) && (
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItems}>
                <Plus size={24} color="#f97316" />
                <Text style={styles.addItemButtonText}>Add Items</Text>
              </TouchableOpacity>
            )}
          </View>

          {items.length > 0 ? (
            <FlatList
              key="grid-3-columns"
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderGridItem}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              ItemSeparatorComponent={() => <View style={styles.gridSeparator} />}
            />
          ) : (
            <View style={styles.emptyItemsContainer}>
              <Text style={styles.emptyItemsText}>No items in this list yet</Text>
              <Text style={styles.emptyItemsSubtext}>
                {list.creator.id === 'current-user' 
                  ? 'Add some items to get started'
                  : 'Check back later for updates'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Moved to bottom */}
        <View style={styles.bottomActionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={handleLike}
          >
            <Heart 
              size={24} 
              color={isLiked ? '#ef4444' : '#666'} 
              weight={isLiked ? 'fill' : 'regular'} 
            />
            <Text style={[styles.actionButtonText, isLiked && styles.likedButtonText]}>
              {likesCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <ChatCircle size={24} color="#666" />
            <Text style={styles.actionButtonText}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share size={24} color="#666" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <DotsThree size={24} color="#666" />
          </TouchableOpacity>
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
  listPreviewHeader: {
    padding: 20,
    backgroundColor: '#fff',
  },
  previewMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 34,
    marginBottom: 12,
    textAlign: 'center',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  previewDescription: {
    fontSize: 17,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  creatorUsername: {
    fontSize: 16,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
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
  },
  followingButtonText: {
    color: '#666',
  },
  bottomActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
  },
  likedButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  likedButtonText: {
    color: '#ef4444',
  },
  itemsGridContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f97316',
    minHeight: 44,
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
    marginLeft: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  gridSeparator: {
    height: 16,
  },
  gridItem: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  gridItemPosition: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  gridItemPositionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  gridItemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 18,
  },
  gridUserNoteContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff5f0',
    borderRadius: 8,
    padding: 4,
  },
  emptyItemsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyItemsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  emptyItemsSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editActionButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTitleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 12,
  },
  editDescriptionInput: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    textAlignVertical: 'top',
    minHeight: 80,
  },
});

export default ListDetailScreen;