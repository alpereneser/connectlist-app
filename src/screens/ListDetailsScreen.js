import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Share,
  Alert,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import { HapticPatterns } from '../utils/haptics';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';
import LikesModal from '../components/LikesModal';
import CommentsModal from '../components/CommentsModal';
import ListItemsManager from '../components/ListItemsManager';

const { width } = Dimensions.get('window');

const ListDetailsScreen = ({
  onBackPress,
  user,
  listId,
  onNavigate,
  onTabPress,
  activeTab = 'home',
  badges = {},
  showComments = false,
}) => {
  const [listData, setListData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showItemsManager, setShowItemsManager] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    fetchListDetails();
  }, [listId]);

  useEffect(() => {
    // Auto-open comments if requested
    if (showComments && listData) {
      setTimeout(() => {
        setShowCommentsModal(true);
      }, 500); // Small delay for smooth transition
    }
  }, [showComments, listData]);

  const fetchListDetails = async () => {
    try {
      setLoading(true);

      const { data: list, error } = await supabase
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
            description,
            position
          ),
          list_likes (
            user_id,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url,
              avatar
            )
          ),
          list_comments (
            id,
            text,
            created_at,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url,
              avatar
            )
          )
        `,
        )
        .eq('id', listId)
        .single();

      if (error) {
        console.error('Error fetching list details:', error);
        Alert.alert('Error', 'Failed to load list details');
        return;
      }

      // Get user avatar
      let userAvatar = null;
      if (
        list.profiles?.avatar_url &&
        /^https?:\/\//i.test(list.profiles.avatar_url)
      ) {
        userAvatar = list.profiles.avatar_url;
      } else if (list.profiles?.avatar) {
        if (/^https?:\/\//i.test(list.profiles.avatar)) {
          userAvatar = list.profiles.avatar;
        } else {
          userAvatar = getPublicUrl(list.profiles.avatar, 'avatars');
        }
      }

      if (!userAvatar) {
        userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${list.profiles?.username || 'anonymous'}`;
      }

      // Sort items by position
      const sortedItems =
        list.list_items?.sort(
          (a, b) => (a.position || 0) - (b.position || 0),
        ) || [];

      setListData({
        ...list,
        userAvatar,
        sortedItems,
      });

      setLikesCount(list.list_likes?.length || 0);
      setCommentsCount(list.list_comments?.length || 0);
      setIsLiked(
        user?.id
          ? list.list_likes?.some(like => like.user_id === user.id)
          : false,
      );
      setIsOwner(user?.id === list.user_id);
    } catch (error) {
      console.error('Error fetching list details:', error);
      Alert.alert('Error', 'Failed to load list details');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to like lists');
      return;
    }

    if (liking) {return;} // Prevent double clicks

    try {
      setLiking(true);
      HapticPatterns.buttonPress();

      // Check current like status from database to avoid race conditions
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
        const { error } = await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', listId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unliking:', error);
          return;
        }

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('list_likes')
          .insert([{ list_id: listId, user_id: user.id }]);

        if (error) {
          console.error('Error liking:', error);
          return;
        }

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      HapticPatterns.buttonPress();

      const shareOptions = [
        { title: 'Share via ConnectList', action: 'connectlist' },
        { title: 'Share to WhatsApp', action: 'whatsapp' },
        { title: 'Share to Other Apps', action: 'system' },
        { title: 'Cancel', action: 'cancel', style: 'cancel' },
      ];

      Alert.alert(
        'Share List',
        'How would you like to share this list?',
        shareOptions.map(option => ({
          text: option.title,
          style: option.style || 'default',
          onPress: () => {
            if (option.action === 'connectlist') {
              handleConnectListShare();
            } else if (option.action === 'whatsapp') {
              handleWhatsAppShare();
            } else if (option.action === 'system') {
              handleSystemShare();
            }
          },
        })),
      );
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleConnectListShare = () => {
    // Navigate to messages with pre-filled list share
    if (onNavigate) {
      onNavigate('Messages', {
        shareData: {
          type: 'list',
          listId: listId,
          title: listData?.title,
          description: listData?.description,
        },
      });
    }
  };

  const handleWhatsAppShare = async () => {
    const shareText = `Check out this list: ${listData?.title}\n\n${listData?.description || ''}\n\nShared via ConnectList`;

    try {
      await Share.share({
        message: shareText,
        title: listData?.title,
      });
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
    }
  };

  const handleSystemShare = async () => {
    const shareText = `Check out this list: ${listData?.title}\n\n${listData?.description || ''}\n\nShared via ConnectList`;

    try {
      await Share.share({
        message: shareText,
        title: listData?.title,
        url: `https://connectlist.app/list/${listId}`, // Deep link for future
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShowLikes = () => {
    HapticPatterns.selection();
    setShowLikes(true);
  };

  const handleShowComments = () => {
    HapticPatterns.selection();
    setShowCommentsModal(true);
  };

  const handleUserPress = userId => {
    if (onNavigate) {
      onNavigate('UserProfile', {
        userId: userId,
        isOwnProfile: false,
      });
    }
  };

  const handleEditList = () => {
    HapticPatterns.buttonPress();
    setShowEditModal(false);
    // Navigate to edit list screen
    if (onNavigate) {
      onNavigate('EditList', {
        listId: listId,
        listData: listData,
      });
    }
  };

  const handleDeleteList = () => {
    HapticPatterns.buttonPress();
    setShowEditModal(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteList = async () => {
    try {
      HapticPatterns.buttonPress();

      // Delete list from Supabase
      const { error } = await supabase.from('lists').delete().eq('id', listId);

      if (error) {
        console.error('Error deleting list:', error);
        Alert.alert('Error', 'Failed to delete list');
        return;
      }

      Alert.alert('Success', 'List deleted successfully');
      setShowDeleteConfirm(false);

      // Navigate back
      if (onBackPress) {
        onBackPress();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      Alert.alert('Error', 'Failed to delete list');
    }
  };

  const handleAddItems = () => {
    HapticPatterns.buttonPress();
    setShowEditModal(false);
    setShowItemsManager(true);
  };

  const handleItemsUpdated = () => {
    // Refresh list details to show updated items
    fetchListDetails();
  };

  const getItemDimensions = itemCount => {
    const containerWidth = width - Spacing.medium * 2; // Container padding

    if (itemCount === 1) {
      return {
        itemWidth: containerWidth * 0.6, // 60% of container width
        numColumns: 1,
      };
    } else if (itemCount === 2) {
      return {
        itemWidth: (containerWidth - Spacing.medium) / 2, // 2 items per row
        numColumns: 2,
      };
    } else {
      return {
        itemWidth: (containerWidth - Spacing.medium * 2) / 3, // 3 items per row
        numColumns: 3,
      };
    }
  };

  const handleDeleteItem = async (itemId, itemTitle) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${itemTitle}" from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              HapticPatterns.buttonPress();

              const { error } = await supabase
                .from('list_items')
                .delete()
                .eq('id', itemId);

              if (error) {
                console.error('Error deleting item:', error);
                Alert.alert('Error', 'Failed to delete item');
                return;
              }

              // Update local state
              setListData(prev => ({
                ...prev,
                sortedItems: prev.sortedItems.filter(
                  item => item.id !== itemId,
                ),
              }));

              Alert.alert('Success', 'Item removed from list');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ],
    );
  };

  const handleItemPress = item => {
    HapticPatterns.selection();

    const categoryToScreenMap = {
      places: 'PlaceDetails',
      movies: 'MovieDetails',
      series: 'SeriesDetails',
      musics: 'MusicDetails',
      books: 'BookDetails',
      people: 'PersonDetails',
      games: 'GameDetails',
      videos: 'VideoDetails',
    };

    const screenName =
      categoryToScreenMap[item.type?.toLowerCase()] ||
      categoryToScreenMap[listData?.category?.toLowerCase()];
    if (screenName && onNavigate) {
      onNavigate(screenName, { item });
    }
  };

  const renderListItem = ({ item, index }) => {
    const { itemWidth } = getItemDimensions(listData.sortedItems.length);

    return (
      <TouchableOpacity
        style={[styles.listItem, { width: itemWidth }]}
        activeOpacity={0.8}
        onPress={() => handleItemPress(item)}
        onLongPress={
          isOwner
            ? () => {
                HapticPatterns.selection();
                handleDeleteItem(item.id, item.title);
              }
            : undefined
        }
      >
        <Image
          source={{
            uri:
              item.image_url ||
              'https://via.placeholder.com/120x180/f0f0f0/999?text=No+Image',
          }}
          style={[
            styles.itemImage,
            { width: itemWidth, height: itemWidth * 1.5 },
          ]}
        />
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.year && <Text style={styles.itemYear}>{item.year}</Text>}
        {isOwner && (
          <View style={styles.itemDeleteIndicator}>
            <Feather name="trash-2" size={12} color={Colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

  if (loading) {
    return (
      <ScreenLayout
        title="Loading..."
        showBackButton={true}
        onBackPress={onBackPress}
        showBottomMenu
        onTabPress={onTabPress}
        activeTab={activeTab}
        badges={badges}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading list...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!listData) {
    return (
      <ScreenLayout
        title="List Not Found"
        showBackButton={true}
        onBackPress={onBackPress}
        showBottomMenu
        onTabPress={onTabPress}
        activeTab={activeTab}
        badges={badges}
      >
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>List not found</Text>
          <Text style={styles.errorDescription}>
            This list may have been deleted or made private.
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={listData?.title || 'List Details'}
      showBackButton={true}
      onBackPress={onBackPress}
      rightIconName={isOwner ? 'more-horizontal' : null}
      onRightPress={isOwner ? () => setShowEditModal(true) : null}
      showBottomMenu
      onTabPress={onTabPress}
      activeTab={activeTab}
      badges={badges}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* List Header */}
          <View style={styles.listHeader}>
            {/* User Info */}
            <TouchableOpacity
              style={styles.userInfo}
              activeOpacity={0.8}
              onPress={() => {
                HapticPatterns.selection();
                if (onNavigate) {
                  onNavigate('UserProfile', {
                    userId: listData.user_id,
                    isOwnProfile: false,
                  });
                }
              }}
            >
              <Image
                source={{ uri: listData.userAvatar }}
                style={styles.userAvatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {listData.profiles?.full_name ||
                    listData.profiles?.username ||
                    'Anonymous'}
                </Text>
                <Text style={styles.userUsername}>
                  @{listData.profiles?.username || 'anonymous'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* List Info */}
            <View style={styles.listInfo}>
              <Text style={styles.listTitle}>{listData.title}</Text>

              {listData.description && (
                <Text style={styles.listDescription}>
                  {listData.description}
                </Text>
              )}

              <View style={styles.listMeta}>
                <View style={styles.categoryContainer}>
                  <Feather name="tag" size={14} color={Colors.textSecondary} />
                  <Text style={styles.categoryText}>
                    {capitalizeCategory(listData.category)}
                  </Text>
                </View>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.timestampText}>
                  {getTimeAgo(listData.created_at)}
                </Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.itemsCountText}>
                  {listData.sortedItems.length} items
                </Text>
              </View>
            </View>
          </View>

          {/* List Items */}
          <View style={styles.itemsContainer}>
            {listData.sortedItems.length > 0 ? (
              <FlatList
                data={listData.sortedItems}
                renderItem={renderListItem}
                keyExtractor={item => item.id}
                numColumns={
                  getItemDimensions(listData.sortedItems.length).numColumns
                }
                scrollEnabled={false}
                contentContainerStyle={styles.itemsGrid}
                columnWrapperStyle={
                  getItemDimensions(listData.sortedItems.length).numColumns > 1
                    ? styles.itemsRow
                    : null
                }
              />
            ) : (
              <View style={styles.emptyItemsContainer}>
                <Feather name="inbox" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyItemsTitle}>No items yet</Text>
                <Text style={styles.emptyItemsDescription}>
                  This list is empty. Items will appear here when added.
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
              onLongPress={handleShowLikes}
              activeOpacity={0.7}
            >
              <Feather
                name="heart"
                size={20}
                color={isLiked ? Colors.error : Colors.textSecondary}
                style={{
                  opacity: isLiked ? 1 : 0.7,
                  transform: [{ scale: isLiked ? 1.1 : 1 }],
                }}
              />
              <Text style={styles.actionText} onPress={handleShowLikes}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShowComments}
              activeOpacity={0.7}
            >
              <Feather
                name="message-circle"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.actionText}>{commentsCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Feather name="share" size={20} color={Colors.textSecondary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Likes Modal */}
      <LikesModal
        visible={showLikes}
        onClose={() => setShowLikes(false)}
        listId={listId}
        onUserPress={handleUserPress}
      />

      {/* Comments Modal */}
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        listId={listId}
        user={user}
        onUserPress={handleUserPress}
      />

      {/* List Items Manager */}
      <ListItemsManager
        visible={showItemsManager}
        onClose={() => setShowItemsManager(false)}
        listId={listId}
        category={listData?.category}
        currentItems={listData?.sortedItems || []}
        onItemsUpdated={handleItemsUpdated}
      />

      {/* Edit Menu Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                HapticPatterns.buttonPress();
                setShowEditModal(false);
              }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit List</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleEditList}
              activeOpacity={0.7}
            >
              <Feather name="edit-3" size={20} color={Colors.textPrimary} />
              <Text style={styles.modalOptionText}>
                Edit Title & Description
              </Text>
              <Feather
                name="chevron-right"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleAddItems}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={20} color={Colors.textPrimary} />
              <Text style={styles.modalOptionText}>Add Items</Text>
              <Feather
                name="chevron-right"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={handleDeleteList}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={20} color={Colors.error} />
              <Text
                style={[styles.modalOptionText, styles.modalOptionDangerText]}
              >
                Delete List
              </Text>
              <Feather name="chevron-right" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Feather name="alert-triangle" size={24} color={Colors.error} />
              <Text style={styles.deleteModalTitle}>Delete List</Text>
            </View>

            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{listData?.title}"? This action
              cannot be undone.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  HapticPatterns.buttonPress();
                  setShowDeleteConfirm(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={confirmDeleteList}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  errorTitle: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  errorDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listHeader: {
    padding: Spacing.medium,
    backgroundColor: Colors.background,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.medium,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  userUsername: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listInfo: {
    marginBottom: Spacing.medium,
  },
  listTitle: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    lineHeight: 28,
  },
  listDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.medium,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  separator: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.small,
  },
  timestampText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  itemsCountText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  itemsContainer: {
    padding: Spacing.medium,
  },
  itemsTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  itemsGrid: {
    paddingBottom: Spacing.medium,
  },
  itemsRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  listItem: {
    marginBottom: Spacing.medium,
    marginRight: Spacing.medium,
  },
  itemImage: {
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.small,
  },
  itemTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    lineHeight: 16,
    marginBottom: 2,
  },
  itemYear: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  itemDeleteIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    opacity: 0.8,
  },
  emptyItemsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
  },
  emptyItemsTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptyItemsDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    marginRight: Spacing.medium,
  },
  actionText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginLeft: Spacing.small,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingTop: Spacing.medium,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionDanger: {
    backgroundColor: Colors.backgroundSecondary,
  },
  modalOptionText: {
    flex: 1,
    fontSize: FontSize.medium,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.medium,
  },
  modalOptionDangerText: {
    color: Colors.error,
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  deleteModalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.medium,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  deleteModalTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.small,
  },
  deleteModalText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.large,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.small,
    alignItems: 'center',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderRadius: 8,
    backgroundColor: Colors.error,
    marginLeft: Spacing.small,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  deleteModalConfirmText: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.medium,
    color: Colors.white,
  },
});

export default ListDetailsScreen;
