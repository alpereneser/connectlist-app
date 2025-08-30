import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { HapticPatterns } from '../utils/haptics';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';

const LikesModal = ({ visible, onClose, listId, onUserPress }) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && listId) {
      fetchLikes();
    }
  }, [visible, listId]);

  const fetchLikes = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('list_likes')
        .select(
          `
          user_id,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          )
        `,
        )
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching likes:', error);
        return;
      }

      const transformedLikes =
        data?.map(like => {
          // Get user avatar
          let userAvatar = null;
          if (
            like.profiles?.avatar_url &&
            /^https?:\/\//i.test(like.profiles.avatar_url)
          ) {
            userAvatar = like.profiles.avatar_url;
          } else if (like.profiles?.avatar) {
            if (/^https?:\/\//i.test(like.profiles.avatar)) {
              userAvatar = like.profiles.avatar;
            } else {
              userAvatar = getPublicUrl(like.profiles.avatar, 'avatars');
            }
          }

          if (!userAvatar) {
            userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${like.profiles?.username || 'anonymous'}`;
          }

          return {
            userId: like.user_id,
            username: like.profiles?.username || 'anonymous',
            fullName:
              like.profiles?.full_name ||
              like.profiles?.username ||
              'Anonymous',
            avatar: userAvatar,
            likedAt: like.created_at,
          };
        }) || [];

      setLikes(transformedLikes);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLikeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.likeItem}
      activeOpacity={0.7}
      onPress={() => {
        HapticPatterns.selection();
        if (onUserPress) {
          onUserPress(item.userId);
        }
        onClose();
      }}
    >
      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.fullName}>{item.fullName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Feather name="heart" size={16} color={Colors.error} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              HapticPatterns.buttonPress();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Likes</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading likes...</Text>
            </View>
          ) : likes.length > 0 ? (
            <FlatList
              data={likes}
              renderItem={renderLikeItem}
              keyExtractor={item => item.userId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="heart" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptyDescription}>
                Be the first to like this list!
              </Text>
            </View>
          )}
        </View>
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
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
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
  content: {
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
    marginTop: Spacing.medium,
  },
  listContainer: {
    paddingVertical: Spacing.small,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
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
  fullName: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  username: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  emptyTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptyDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LikesModal;
