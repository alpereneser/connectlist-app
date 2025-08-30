import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Vibration,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import SwipeableScreen from '../components/SwipeableScreen';
import CustomModal from '../components/CustomModal';
import NewMessageModal from '../components/NewMessageModal';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';

const MessagesScreen = ({ onBackPress, onChatPress }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [muteModalVisible, setMuteModalVisible] = useState(false);
  const [moreOptionsModalVisible, setMoreOptionsModalVisible] = useState(false);
  const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, []);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  // Setup real-time subscription for new messages
  const setupRealtimeSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    // Listen for new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        payload => {
          console.log('New message received:', payload);
          // Refresh conversations when new message arrives
          loadConversations();
        },
      )
      .subscribe();

    // Listen for conversation updates
    const conversationsSubscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        payload => {
          console.log('Conversation updated:', payload);
          // Refresh conversations when conversation is updated
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      conversationsSubscription.unsubscribe();
    };
  };

  const loadConversations = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view messages');
        onBackPress();
        return;
      }

      setCurrentUser(user);
      console.log('Current user ID:', user.id);

      // Get conversations where current user is a participant
      const { data: conversationData, error: conversationError } =
        await supabase
          .from('conversation_participants')
          .select(
            `
          conversation_id,
          conversations!inner(
            id,
            last_message_at,
            last_message_text,
            updated_at
          )
        `,
          )
          .eq('user_id', user.id);

      console.log('Conversation data:', conversationData);
      console.log('Conversation error:', conversationError);

      if (conversationError) {
        console.error('Error loading conversations:', conversationError);
        return;
      }

      if (!conversationData || conversationData.length === 0) {
        console.log('No conversations found for user:', user.id);
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get other participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        conversationData.map(async conv => {
          // Get the other participant (not current user)
          const { data: otherParticipant, error: participantError } =
            await supabase
              .from('conversation_participants')
              .select(
                `
              user_id,
              profiles!inner(
                id,
                username,
                full_name,
                avatar_url,
                avatar
              )
            `,
              )
              .eq('conversation_id', conv.conversation_id)
              .neq('user_id', user.id)
              .single();

          if (participantError || !otherParticipant) {
            console.log(
              'Participant error or not found:',
              participantError,
              otherParticipant,
            );
            return null;
          }

          console.log(
            'Found other participant:',
            otherParticipant.profiles.full_name ||
              otherParticipant.profiles.username,
          );

          // Follow kontrolünü tamamen kaldırıyoruz - tüm konuşmaları göster

          // Count unread messages
          const { count: unreadCount, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.conversation_id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          if (countError) {
            console.error('Error counting unread messages:', countError);
          }

          // Avatar URL'sini resolve et
          let resolvedAvatar = null;

          // Log'da görüldüğü gibi Tuna'nın avatar'ı zaten tam URL
          if (
            otherParticipant.profiles.avatar &&
            /^https?:\/\//i.test(otherParticipant.profiles.avatar)
          ) {
            resolvedAvatar = otherParticipant.profiles.avatar;
          }
          // Database'deki avatar_url'i kontrol et
          else if (
            otherParticipant.profiles.avatar_url &&
            /^https?:\/\//i.test(otherParticipant.profiles.avatar_url)
          ) {
            resolvedAvatar = otherParticipant.profiles.avatar_url;
          }
          // Storage key olarak kullan
          else if (otherParticipant.profiles.avatar_url) {
            resolvedAvatar = getPublicUrl(
              otherParticipant.profiles.avatar_url,
              'avatars',
            );
          } else if (otherParticipant.profiles.avatar) {
            resolvedAvatar = getPublicUrl(
              otherParticipant.profiles.avatar,
              'avatars',
            );
          }

          // Eğer hala avatar yoksa, fallback avatar kullan
          if (!resolvedAvatar) {
            resolvedAvatar =
              'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
              (otherParticipant.profiles.username || otherParticipant.user_id);
          }

          return {
            id: conv.conversation_id,
            userId: otherParticipant.user_id,
            name:
              otherParticipant.profiles.full_name ||
              otherParticipant.profiles.username,
            username: otherParticipant.profiles.username,
            lastMessage:
              conv.conversations.last_message_text || 'No messages yet',
            time: formatTime(
              conv.conversations.last_message_at ||
                conv.conversations.updated_at,
            ),
            lastMessageTime:
              conv.conversations.last_message_at ||
              conv.conversations.updated_at,
            unread: unreadCount || 0,
            avatar: resolvedAvatar,
            online: false, // We can implement online status later
          };
        }),
      );

      // Filter out null values
      const validConversations = conversationsWithParticipants.filter(
        conv => conv !== null,
      );

      // Group conversations by user ID and keep only the latest one for each user
      const conversationsByUser = {};

      validConversations.forEach(conv => {
        const userId = conv.userId;
        const existingConv = conversationsByUser[userId];

        // If no existing conversation for this user, or this one is more recent, use this one
        if (
          !existingConv ||
          new Date(conv.lastMessageTime) >
            new Date(existingConv.lastMessageTime)
        ) {
          conversationsByUser[userId] = conv;
        }
      });

      // Convert back to array and sort by last message time
      const uniqueConversations = Object.values(conversationsByUser).sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
      );

      console.log(
        'Unique conversations:',
        uniqueConversations.length,
        'from',
        validConversations.length,
        'total',
      );

      setConversations(uniqueConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = timestamp => {
    if (!timestamp) {return '';}

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) {return 'now';}
    if (diffInMinutes < 60) {return `${diffInMinutes}m`;}

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {return `${diffInHours}h`;}

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {return `${diffInDays}d`;}

    return messageTime.toLocaleDateString();
  };

  const deleteConversation = async conversationId => {
    try {
      // Delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        Alert.alert('Error', 'Failed to delete conversation');
        return;
      }

      // Delete conversation participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);

      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
        Alert.alert('Error', 'Failed to delete conversation');
        return;
      }

      // Delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        Alert.alert('Error', 'Failed to delete conversation');
        return;
      }

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation');
    }
  };

  const confirmDeleteConversation = item => {
    // Haptic feedback for destructive action
    Vibration.vibrate([0, 100, 50, 100]);

    setSelectedItem(item);
    setDeleteModalVisible(true);
  };

  const muteConversation = async item => {
    try {
      // Haptic feedback
      Vibration.vibrate(50);

      setSelectedItem(item);
      setMuteModalVisible(true);
    } catch (error) {
      console.error('Error muting conversation:', error);
    }
  };

  const showMoreOptions = item => {
    setSelectedItem(item);
    setMoreOptionsModalVisible(true);
  };

  const handleNewMessage = user => {
    // Navigate to chat with selected user
    const contact = {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    };
    onChatPress(contact);
  };

  const renderRightActions = (item, progress, dragX) => {
    // Instagram tarzı animasyonlu butonlar
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.muteButton,
            { transform: [{ scale }], opacity },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonInner}
            onPress={() => muteConversation(item)}
            activeOpacity={0.8}
          >
            <Feather name="bell-off" size={22} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteButton,
            { transform: [{ scale }], opacity },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonInner}
            onPress={() => confirmDeleteConversation(item)}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={22} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderConversation = ({ item }) => {
    let swipeableRef = null;

    return (
      <Swipeable
        ref={ref => (swipeableRef = ref)}
        renderRightActions={(progress, dragX) =>
          renderRightActions(item, progress, dragX)
        }
        rightThreshold={40}
        friction={2}
        overshootRight={false}
        overshootFriction={8}
      >
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => {
            // Eğer swipe açıksa önce kapat
            if (swipeableRef) {
              swipeableRef.close();
            }

            const contact = {
              id: item.userId,
              username: item.username,
              name: item.name,
              avatar: item.avatar,
            };
            onChatPress(contact);
          }}
          onLongPress={() => showMoreOptions(item)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
              onError={error => {
                console.log('Avatar load error for user:', item.name, error);
                // Fallback'i güncelle
                setConversations(prev =>
                  prev.map(conv =>
                    conv.id === item.id
                      ? {
                          ...conv,
                          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username || item.userId}`,
                        }
                      : conv,
                  ),
                );
              }}
            />
            {item.online && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <View style={styles.messageRow}>
              <Text
                style={[
                  styles.lastMessage,
                  item.unread > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unread}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <SwipeableScreen onSwipeBack={onBackPress}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color={Colors.iconPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.newMessageButton} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        </View>
      </SwipeableScreen>
    );
  }

  return (
    <SwipeableScreen onSwipeBack={onBackPress}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={Colors.iconPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.newMessageButton}
              onPress={() => setNewMessageModalVisible(true)}
              activeOpacity={0.7}
            >
              <Feather name="edit" size={24} color={Colors.iconPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={Colors.iconSecondary} />
            <Text style={styles.searchPlaceholder}>Search messages</Text>
          </View>
        </View>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather
              name="message-circle"
              size={64}
              color={Colors.iconSecondary}
            />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start following users to begin messaging them
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.conversationsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.orange}
                colors={[Colors.orange]}
              />
            }
          />
        )}
      </View>

      {/* Custom Modals */}
      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        type="destructive"
        title="Delete Conversation"
        subtitle={
          selectedItem
            ? `Are you sure you want to delete your conversation with ${selectedItem.name}? This action cannot be undone.`
            : ''
        }
        actions={[
          {
            text: 'Cancel',
            onPress: () => {},
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (selectedItem) {
                Vibration.vibrate(200);
                deleteConversation(selectedItem.id);
              }
            },
          },
        ]}
      />

      <CustomModal
        visible={muteModalVisible}
        onClose={() => setMuteModalVisible(false)}
        type="default"
        title="Mute Notifications"
        subtitle={
          selectedItem
            ? `You won't receive notifications from ${selectedItem.name} anymore.`
            : ''
        }
        actions={[
          {
            text: 'Cancel',
            onPress: () => {},
          },
          {
            text: 'Mute',
            style: 'primary',
            onPress: () => {
              // TODO: Implement actual mute functionality
              console.log('Muted:', selectedItem?.name);
            },
          },
        ]}
      />

      <CustomModal
        visible={moreOptionsModalVisible}
        onClose={() => setMoreOptionsModalVisible(false)}
        type="default"
        title={selectedItem?.name || 'Options'}
        subtitle="Choose an action"
        actions={[
          {
            text: 'Mute Notifications',
            onPress: () => {
              setMoreOptionsModalVisible(false);
              setTimeout(() => muteConversation(selectedItem), 100);
            },
          },
          {
            text: 'Mark as Unread',
            onPress: () => {
              // TODO: Implement mark as unread
              console.log('Marked as unread:', selectedItem?.name);
            },
          },
          {
            text: 'Delete Conversation',
            style: 'destructive',
            onPress: () => {
              setMoreOptionsModalVisible(false);
              setTimeout(() => confirmDeleteConversation(selectedItem), 100);
            },
          },
          {
            text: 'Cancel',
            onPress: () => {},
          },
        ]}
      />

      <NewMessageModal
        visible={newMessageModalVisible}
        onClose={() => setNewMessageModalVisible(false)}
        onSelectUser={handleNewMessage}
        currentUserId={currentUser?.id}
      />
    </SwipeableScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },

  newMessageButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    gap: Spacing.small,
  },
  searchPlaceholder: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.medium,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  timeText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  unreadMessage: {
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.small,
  },
  unreadCount: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.large,
  },
  emptyTitle: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptySubtitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 10,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
  },
  muteButton: {
    backgroundColor: Colors.instagramOrange,
  },
  deleteButton: {
    backgroundColor: Colors.instagramRed,
  },
});

export default MessagesScreen;
