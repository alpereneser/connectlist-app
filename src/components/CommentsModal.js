import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { HapticPatterns } from '../utils/haptics';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';

const CommentsModal = ({ visible, onClose, listId, user, onUserPress }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const textInputRef = useRef(null);

  useEffect(() => {
    if (visible && listId) {
      fetchComments();
    }
  }, [visible, listId]);

  const fetchComments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('list_comments')
        .select(
          `
          id,
          text,
          created_at,
          user_id,
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
        console.error('Error fetching comments:', error);
        return;
      }

      const transformedComments =
        data?.map(comment => {
          // Get user avatar
          let userAvatar = null;
          if (
            comment.profiles?.avatar_url &&
            /^https?:\/\//i.test(comment.profiles.avatar_url)
          ) {
            userAvatar = comment.profiles.avatar_url;
          } else if (comment.profiles?.avatar) {
            if (/^https?:\/\//i.test(comment.profiles.avatar)) {
              userAvatar = comment.profiles.avatar;
            } else {
              userAvatar = getPublicUrl(comment.profiles.avatar, 'avatars');
            }
          }

          if (!userAvatar) {
            userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username || 'anonymous'}`;
          }

          return {
            id: comment.id,
            text: comment.text,
            userId: comment.user_id,
            username: comment.profiles?.username || 'anonymous',
            fullName:
              comment.profiles?.full_name ||
              comment.profiles?.username ||
              'Anonymous',
            avatar: userAvatar,
            createdAt: comment.created_at,
          };
        }) || [];

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {return;}
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to post comments');
      return;
    }

    try {
      setPosting(true);
      HapticPatterns.buttonPress();

      const { data, error } = await supabase
        .from('list_comments')
        .insert([
          {
            list_id: listId,
            user_id: user.id,
            text: newComment.trim(),
          },
        ])
        .select(
          `
          id,
          text,
          created_at,
          user_id,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          )
        `,
        )
        .single();

      if (error) {
        console.error('Error posting comment:', error);
        Alert.alert('Error', 'Failed to post comment');
        return;
      }

      // Get user avatar for new comment
      let userAvatar = null;
      if (
        data.profiles?.avatar_url &&
        /^https?:\/\//i.test(data.profiles.avatar_url)
      ) {
        userAvatar = data.profiles.avatar_url;
      } else if (data.profiles?.avatar) {
        if (/^https?:\/\//i.test(data.profiles.avatar)) {
          userAvatar = data.profiles.avatar;
        } else {
          userAvatar = getPublicUrl(data.profiles.avatar, 'avatars');
        }
      }

      if (!userAvatar) {
        userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.profiles?.username || 'anonymous'}`;
      }

      const newCommentData = {
        id: data.id,
        text: data.text,
        userId: data.user_id,
        username: data.profiles?.username || 'anonymous',
        fullName:
          data.profiles?.full_name || data.profiles?.username || 'Anonymous',
        avatar: userAvatar,
        createdAt: data.created_at,
      };

      // Add new comment to the top of the list
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      textInputRef.current?.blur();
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const getTimeAgo = dateString => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {return `${diffInSeconds}s`;}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m`;}
    if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)}h`;}
    if (diffInSeconds < 2592000) {return `${Math.floor(diffInSeconds / 86400)}d`;}
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <TouchableOpacity
        onPress={() => {
          HapticPatterns.selection();
          if (onUserPress) {
            onUserPress(item.userId);
          }
          onClose();
        }}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      </TouchableOpacity>

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            onPress={() => {
              HapticPatterns.selection();
              if (onUserPress) {
                onUserPress(item.userId);
              }
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.username}>{item.username}</Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{getTimeAgo(item.createdAt)}</Text>
        </View>

        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
          <Text style={styles.title}>Comments</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather
                name="message-circle"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptyDescription}>
                Be the first to share your thoughts!
              </Text>
            </View>
          )}
        </View>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              editable={!posting}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || posting) && styles.sendButtonDisabled,
              ]}
              onPress={handlePostComment}
              disabled={!newComment.trim() || posting}
              activeOpacity={0.7}
            >
              {posting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Feather name="send" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.medium,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.tiny,
  },
  username: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginRight: Spacing.small,
  },
  timestamp: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  commentText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: 20,
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
  inputContainer: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: Spacing.small,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.small,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
});

export default CommentsModal;
