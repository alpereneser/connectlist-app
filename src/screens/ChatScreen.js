import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import SwipeableScreen from '../components/SwipeableScreen';
import { supabase } from '../utils/supabase';
import { HapticPatterns } from '../utils/haptics';
import { getPublicUrl } from '../services/storageService';

const ChatScreen = ({ onBackPress, contact, userId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [contactInfo, setContactInfo] = useState(contact);
  const flatListRef = useRef(null);
  const messagesSubscription = useRef(null);

  // Keyboard handling
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    initializeChat();

    // Keyboard listeners
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      event => {
        setIsKeyboardVisible(true);
        Animated.timing(keyboardHeight, {
          toValue: event.endCoordinates.height,
          duration: Platform.OS === 'ios' ? event.duration : 250,
          useNativeDriver: false,
        }).start();

        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      event => {
        setIsKeyboardVisible(false);
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration : 250,
          useNativeDriver: false,
        }).start();
      },
    );

    return () => {
      // Cleanup subscription
      if (messagesSubscription.current) {
        messagesSubscription.current.unsubscribe();
      }

      // Remove keyboard listeners
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [contact?.id, userId]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to send messages');
        onBackPress();
        return;
      }

      setCurrentUser(user);

      // If we have userId but no contact info, fetch it
      let targetUserId = contact?.id || userId;
      if (userId && !contact) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', userId)
          .single();

        if (profileError || !userProfile) {
          Alert.alert('Error', 'User not found');
          onBackPress();
          return;
        }

        // Avatar URL'sini resolve et
        let resolvedAvatar = null;
        if (
          userProfile.avatar_url &&
          /^https?:\/\//i.test(userProfile.avatar_url)
        ) {
          resolvedAvatar = userProfile.avatar_url;
        } else if (userProfile.avatar) {
          resolvedAvatar = getPublicUrl(userProfile.avatar, 'avatars');
        } else {
          resolvedAvatar = 'https://api.dicebear.com/7.x/avataaars/svg';
        }

        setContactInfo({
          id: userProfile.id,
          username: userProfile.username,
          name: userProfile.full_name || userProfile.username,
          avatar: resolvedAvatar,
        });

        targetUserId = userProfile.id;
      }

      if (!targetUserId) {
        Alert.alert('Error', 'Invalid user');
        onBackPress();
        return;
      }

      // Check if users follow each other
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .or(
          `and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`,
        )
        .limit(1);

      // Geçici olarak follow kontrolünü kaldırıyoruz
      // if (!followData || followData.length === 0) {
      //   Alert.alert('Error', 'You can only message users you follow or who follow you');
      //   onBackPress();
      //   return;
      // }

      // Find or create conversation
      const convId = await findOrCreateConversation(user.id, targetUserId);

      setConversationId(convId);

      // Load messages
      await loadMessages(convId);

      // Subscribe to new messages
      subscribeToMessages(convId);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const findOrCreateConversation = async (userId1, userId2) => {
    try {
      console.log('Finding conversation between:', userId1, 'and', userId2);

      // Get all conversations for user1
      const { data: user1Conversations, error: searchError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId1);

      if (searchError) {
        console.error('Error searching conversations:', searchError);
        return null;
      }

      if (!user1Conversations || user1Conversations.length === 0) {
        console.log('No conversations found for user1');
        // Create new conversation since user1 has no conversations
      } else {
        // Check each conversation to see if user2 is also a participant
        for (const conv of user1Conversations) {
          const { data: user2InConv, error: checkError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', userId2)
            .single();

          if (!checkError && user2InConv) {
            console.log('Found existing conversation:', conv.conversation_id);
            return conv.conversation_id;
          }
        }
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert([
          {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: userId1 },
          { conversation_id: newConversation.id, user_id: userId2 },
        ]);

      if (participantsError) {
        throw participantsError;
      }

      return newConversation.id;
    } catch (error) {
      console.error('Error finding/creating conversation:', error);
      throw error;
    }
  };

  const markMessagesAsRead = async convId => {
    try {
      if (!currentUser?.id) {return;}

      // Mark all unread messages in this conversation as read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUser.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadMessages = async convId => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(
          `
          id,
          text,
          sender_id,
          created_at,
          is_read,
          profiles:sender_id (
            id,
            full_name,
            username,
            avatar_url,
            avatar
          )
        `,
        )
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        throw error;
      }

      const formattedMessages =
        messagesData?.map(msg => ({
          id: msg.id,
          text: msg.text,
          time: formatTime(msg.created_at),
          isMe: msg.sender_id === currentUser?.id,
          senderId: msg.sender_id,
          createdAt: msg.created_at,
          isRead: msg.is_read,
          sender: msg.profiles,
        })) || [];

      setMessages(formattedMessages);

      // Mark messages as read
      if (formattedMessages.length > 0) {
        await markMessagesAsRead(convId);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = convId => {
    messagesSubscription.current = supabase
      .channel(`messages:${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        async payload => {
          const newMessage = payload.new;

          // Get sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, avatar')
            .eq('id', newMessage.sender_id)
            .single();

          const formattedMessage = {
            id: newMessage.id,
            text: newMessage.text,
            time: formatTime(newMessage.created_at),
            isMe: newMessage.sender_id === currentUser?.id,
            senderId: newMessage.sender_id,
            createdAt: newMessage.created_at,
            isRead: newMessage.is_read,
            sender: senderProfile,
          };

          setMessages(prev => [...prev, formattedMessage]);

          // Mark message as read if it's not from current user
          if (newMessage.sender_id !== currentUser?.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
      )
      .subscribe();
  };

  const formatTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || !currentUser) {return;}

    try {
      HapticPatterns.buttonPress();

      const messageText = message.trim();
      setMessage(''); // Clear input immediately for better UX

      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          sender_id: currentUser.id,
          text: messageText,
          created_at: new Date().toISOString(),
          is_read: false,
        },
      ]);

      if (error) {
        throw error;
      }

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          last_message_text: messageText,
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessage(messageText); // Restore message on error
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isMe ? styles.myBubble : styles.theirBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isMe ? styles.myMessageText : styles.theirMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
      <Text
        style={[
          styles.messageTime,
          item.isMe ? styles.myMessageTime : styles.theirMessageTime,
        ]}
      >
        {item.time}
      </Text>
    </View>
  );

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

          <View style={styles.contactInfo}>
            <Image
              source={{ uri: contactInfo?.avatar || contact?.avatar }}
              style={styles.contactAvatar}
            />
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>
                {contactInfo?.name || contact?.name}
              </Text>
              <Text style={styles.contactStatus}>
                {contactInfo?.online || contact?.online
                  ? 'Active now'
                  : 'Last seen recently'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <Feather
              name="more-vertical"
              size={24}
              color={Colors.iconPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              inverted={false}
              onContentSizeChange={() => {
                // Auto scroll to bottom when new messages arrive
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
          )}
        </View>

        {/* Message Input - Fixed at bottom with keyboard handling */}
        <Animated.View
          style={[
            styles.inputContainer,
            {
              paddingBottom:
                Platform.OS === 'ios'
                  ? Animated.add(
                      keyboardHeight,
                      new Animated.Value(Spacing.small),
                    )
                  : isKeyboardVisible
                    ? Animated.add(
                        keyboardHeight,
                        new Animated.Value(Spacing.small),
                      )
                    : new Animated.Value(Spacing.small),
            },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
              <Feather name="plus" size={20} color={Colors.iconSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor={Colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />

            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
              <Feather name="camera" size={20} color={Colors.iconSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              message.trim() && styles.sendButtonActive,
            ]}
            onPress={handleSendMessage}
            activeOpacity={0.7}
          >
            <Feather
              name="send"
              size={18}
              color={message.trim() ? Colors.white : Colors.iconSecondary}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    marginRight: Spacing.small,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.small,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  contactStatus: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  messagesContainer: {
    flex: 1,
    paddingBottom: 80, // Space for input container
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.medium,
    paddingBottom: Spacing.large, // Extra padding at bottom
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: Spacing.medium,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 18,
    marginBottom: 4,
  },
  myBubble: {
    backgroundColor: Colors.orange,
  },
  theirBubble: {
    backgroundColor: Colors.backgroundSecondary,
  },
  messageText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.white,
  },
  theirMessageText: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
  },
  myMessageTime: {
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  theirMessageTime: {
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small + 5,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 60,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 25,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    marginRight: Spacing.small,
    height: 44,
  },
  attachButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: Spacing.small,
    height: 32,
    textAlignVertical: 'center',
  },
  cameraButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
  },
  sendButtonActive: {
    backgroundColor: Colors.orange,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});

export default ChatScreen;
