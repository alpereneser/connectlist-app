import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PaperPlaneRight,
  Heart,
  DotsThree,
  ArrowBendUpLeft,
  X,
} from 'phosphor-react-native';
import { AvatarImage } from './AvatarUpload';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { realtimeService } from '../services/realtimeService';
import { hapticPatterns } from '../utils/haptics';
import { a11yProps } from '../utils/accessibility';
import tokens from '../utils/designTokens';
import { handleError, useErrorHandler } from '../services/errorService';
import ErrorBoundary from './ErrorBoundary';

const CommentSection = ({ 
  listId, 
  onClose,
  visible = true,
}) => {
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const { handleAsyncError } = useErrorHandler();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible && listId) {
      loadComments();
      subscribeToComments();
    }

    return () => {
      realtimeService.unsubscribe(`list:${listId}`);
    };
  }, [listId, visible]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          comment_likes (
            user_id
          ),
          replies:comments!parent_id (
            *,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('list_id', listId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include like status
      const transformedComments = data.map(comment => ({
        ...comment,
        isLiked: comment.comment_likes?.some(like => like.user_id === user?.id) || false,
        likesCount: comment.comment_likes?.length || 0,
        repliesCount: comment.replies?.length || 0,
      }));

      setComments(transformedComments);
    } catch (error) {
      await handleAsyncError(error, {
        context: 'load_comments',
        listId,
        action: 'loadComments'
      });
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToComments = () => {
    realtimeService.subscribeToList(listId, {
      onComment: async (payload) => {
        if (payload.new) {
          // Fetch full comment data
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              profiles:user_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setComments(prev => [data, ...prev]);
            hapticPatterns.notification();
          }
        }
      },
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || isSending) return;

    const text = commentText.trim();
    
    // Input validation
    if (text.length < 1) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }
    
    if (text.length > 500) {
      Alert.alert('Error', 'Comment is too long (maximum 500 characters)');
      return;
    }

    setIsSending(true);
    Keyboard.dismiss();

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          list_id: listId,
          user_id: user.id,
          content: text,
          parent_id: replyingTo?.id || null,
        })
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (replyingTo) {
        // Add to replies of parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo.id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data],
              repliesCount: comment.repliesCount + 1,
            };
          }
          return comment;
        }));
        setReplyingTo(null);
      } else {
        // Add to main comments
        setComments(prev => [data, ...prev]);
      }

      setCommentText('');
      hapticPatterns.success();
    } catch (error) {
      await handleAsyncError(error, {
        context: 'send_comment',
        listId,
        action: 'sendComment',
        replyingTo: replyingTo?.id
      });
      Alert.alert('Error', 'Failed to send comment');
      hapticPatterns.error();
    } finally {
      setIsSending(false);
    }
  };

  const handleLikeComment = async (commentId, isLiked) => {
    hapticPatterns.likeButton(!isLiked);

    // Optimistic update
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !isLiked,
          likesCount: isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
        };
      }
      return comment;
    }));

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
      }
    } catch (error) {
      await handleAsyncError(error, {
        context: 'toggle_comment_like',
        commentId,
        isLiked,
        action: 'toggleCommentLike'
      });
      // Revert optimistic update
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: isLiked,
            likesCount: isLiked ? comment.likesCount + 1 : comment.likesCount - 1,
          };
        }
        return comment;
      }));
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
    hapticPatterns.buttonPress('light');
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

              setComments(prev => prev.filter(c => c.id !== commentId));
              hapticPatterns.success();
            } catch (error) {
              await handleAsyncError(error, {
                context: 'delete_comment',
                commentId,
                action: 'deleteComment'
              });
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const renderComment = ({ item }) => {
    const isOwnComment = item.user_id === user?.id;

    return (
      <View style={styles.commentContainer}>
        <TouchableOpacity
          onPress={() => {
            // Navigate to user profile
            hapticPatterns.buttonPress('light');
          }}
        >
          <AvatarImage
            avatarUrl={item.profiles?.avatar_url}
            fullName={item.profiles?.full_name}
            username={item.profiles?.username}
            size={36}
          />
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity
              onPress={() => {
                // Navigate to user profile
                hapticPatterns.buttonPress('light');
              }}
            >
              <Text style={styles.username}>
                {item.profiles?.username || 'Unknown'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timestamp}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>

          <Text style={styles.commentText}>{item.content}</Text>

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikeComment(item.id, item.isLiked)}
              {...a11yProps.button(
                item.isLiked ? 'Unlike comment' : 'Like comment',
                `${item.likesCount} likes`
              )}
            >
              <Heart
                size={16}
                color={item.isLiked ? tokens.colors.semantic.error : tokens.colors.gray[500]}
                weight={item.isLiked ? 'fill' : 'regular'}
              />
              <Text style={[
                styles.actionText,
                item.isLiked && styles.likedText
              ]}>
                {item.likesCount || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReply(item)}
              {...a11yProps.button('Reply to comment')}
            >
              <ArrowBendUpLeft size={16} color={tokens.colors.gray[500]} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            {isOwnComment && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteComment(item.id)}
                {...a11yProps.button('Delete comment')}
              >
                <DotsThree size={16} color={tokens.colors.gray[500]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Render replies */}
          {item.replies && item.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {item.replies.map(reply => (
                <View key={reply.id} style={styles.replyContainer}>
                  <AvatarImage
                    avatarUrl={reply.profiles?.avatar_url}
                    fullName={reply.profiles?.full_name}
                    username={reply.profiles?.username}
                    size={28}
                  />
                  <View style={styles.replyContent}>
                    <Text style={styles.replyUsername}>
                      {reply.profiles?.username}
                    </Text>
                    <Text style={styles.replyText}>{reply.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0;

  return (
    <ErrorBoundary fallbackType="inline">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comments</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          {...a11yProps.button('Close comments')}
        >
          <X size={24} color={tokens.colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadComments().then(() => setRefreshing(false));
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          )}
        />
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyingToText}>
            Replying to @{replyingTo.profiles?.username}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setReplyingTo(null);
              hapticPatterns.buttonPress('light');
            }}
            {...a11yProps.button('Cancel reply')}
          >
            <X size={16} color={tokens.colors.gray[600]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 16 }]}>
        <AvatarImage
          avatarUrl={userProfile?.avatar_url}
          fullName={userProfile?.full_name}
          username={userProfile?.username}
          size={32}
        />
        
        <View style={styles.inputTextContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyingTo ? `Reply to @${replyingTo.profiles?.username}...` : "Add a comment..."}
            placeholderTextColor={tokens.colors.gray[400]}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            {...a11yProps.textInput('Comment text', 'Write your comment here')}
          />
          {commentText.length > 0 && (
            <Text style={[
              styles.characterCount,
              commentText.length > 450 && styles.characterCountWarning,
              commentText.length >= 500 && styles.characterCountError
            ]}>
              {commentText.length}/500
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || isSending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || isSending}
          {...a11yProps.button('Send comment')}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={tokens.colors.primary} />
          ) : (
            <PaperPlaneRight
              size={20}
              color={commentText.trim() ? tokens.colors.primary : tokens.colors.gray[400]}
              weight="fill"
            />
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.gray[200],
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
  },
  closeButton: {
    position: 'absolute',
    right: tokens.spacing.lg,
    padding: tokens.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.lg,
  },
  commentContent: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  username: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
    marginRight: tokens.spacing.sm,
  },
  timestamp: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.gray[500],
  },
  commentText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[800],
    lineHeight: tokens.typography.fontSize.md * tokens.typography.lineHeight.normal,
    marginBottom: tokens.spacing.sm,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xs,
  },
  actionText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[600],
    marginLeft: tokens.spacing.xs,
  },
  likedText: {
    color: tokens.colors.semantic.error,
  },
  repliesContainer: {
    marginTop: tokens.spacing.md,
    marginLeft: tokens.spacing.sm,
    paddingLeft: tokens.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: tokens.colors.gray[200],
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.md,
  },
  replyContent: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
  replyUsername: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.gray[800],
    marginBottom: 2,
  },
  replyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[700],
    lineHeight: tokens.typography.fontSize.sm * tokens.typography.lineHeight.normal,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[500],
    textAlign: 'center',
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.gray[50],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.gray[200],
  },
  replyingToText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.gray[200],
    backgroundColor: tokens.colors.background.primary,
  },
  inputTextContainer: {
    flex: 1,
    marginHorizontal: tokens.spacing.md,
  },
  input: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.gray[100],
    borderRadius: tokens.borderRadius.large,
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[900],
    maxHeight: 100,
    minHeight: 36,
  },
  characterCount: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.gray[500],
    textAlign: 'right',
    marginTop: 4,
    marginHorizontal: tokens.spacing.md,
  },
  characterCountWarning: {
    color: tokens.colors.semantic.warning,
  },
  characterCountError: {
    color: tokens.colors.semantic.error,
  },
  sendButton: {
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentSection;