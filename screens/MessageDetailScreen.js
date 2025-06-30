import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  PaperPlaneTilt,
  Camera,
  Microphone,
  Heart,
  DotsThree,
  Phone,
  VideoCamera,
  Plus,
  Image as ImageIcon,
  Smiley,
} from 'phosphor-react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/messageService';
import { supabase } from '../lib/supabase';
import { SkeletonMessages, SkeletonMessageInput } from '../components/SkeletonLoader';
import tokens from '../utils/designTokens';

const MessageDetailScreen = ({ route, navigation }) => {
  const { conversationId, participant } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (conversationId && user?.id) {
      loadMessages();
      subscribeToMessages();
      subscribeToTyping();
      subscribeToPresence();
      markMessagesAsRead();
    }

    return () => {
      messageService.unsubscribeAll();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user]);

  const loadMessages = async (reset = true) => {
    if (reset) {
      setIsLoading(true);
      setMessages([]);
    }
    
    try {
      const data = await messageService.getMessages(conversationId, 50);
      
      if (reset) {
        setMessages(data);
        setHasOlderMessages(data.length === 50); // If we got full page, assume there might be more
      } else {
        setMessages(prev => [...data, ...prev]);
        setHasOlderMessages(data.length === 30); // For load more
      }
      
      // Scroll to bottom after initial loading
      if (reset) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to mock messages for demo
      const mockMessages = [
        {
          id: 'msg1',
          conversation_id: conversationId,
          sender_id: participant.id,
          content: 'Hey! Just saw your movie list, great picks 🎬',
          message_type: 'text',
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          is_read: true,
        },
        {
          id: 'msg2',
          conversation_id: conversationId,
          sender_id: 'current_user',
          content: 'Thanks! I love discovering new movies. What\'s your favorite genre?',
          message_type: 'text',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          is_read: true,
        },
        {
          id: 'msg3',
          conversation_id: conversationId,
          sender_id: participant.id,
          content: 'I\'m really into sci-fi and thrillers. Have you seen Blade Runner 2049?',
          message_type: 'text',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          is_read: true,
        },
        {
          id: 'msg4',
          conversation_id: conversationId,
          sender_id: 'current_user',
          content: 'Yes! It\'s amazing. The cinematography is incredible. Denis Villeneuve is one of my favorite directors.',
          message_type: 'text',
          created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          is_read: true,
        },
        {
          id: 'msg5',
          conversation_id: conversationId,
          sender_id: participant.id,
          content: 'Totally agree! You should check out Arrival if you haven\'t already.',
          message_type: 'text',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          is_read: true,
        },
        {
          id: 'msg6',
          conversation_id: conversationId,
          sender_id: 'current_user',
          content: 'Already on my watchlist! 📝',
          message_type: 'text',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          is_read: false,
        },
      ];

      setMessages(mockMessages);
    } finally {
      if (reset) {
        setIsLoading(false);
      }
    }
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlder || !hasOlderMessages || messages.length === 0) return;
    
    setIsLoadingOlder(true);
    try {
      const oldestMessage = messages[0];
      const olderMessages = await messageService.getOlderMessages(
        conversationId, 
        oldestMessage.id, 
        30
      );
      
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasOlderMessages(olderMessages.length === 30);
      } else {
        setHasOlderMessages(false);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const subscribeToMessages = () => {
    messageService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Mark as read if conversation is open
      if (newMessage.sender_id !== user?.id) {
        markMessagesAsRead();
      }
    });
  };

  const subscribeToTyping = () => {
    messageService.subscribeToTyping(conversationId, (users) => {
      setTypingUsers(users.filter(u => u.user_id !== user?.id));
    });
  };

  const subscribeToPresence = () => {
    const channel = supabase.channel(`presence:${participant.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsOnline(Object.keys(state).length > 0);
      })
      .subscribe();
  };

  const markMessagesAsRead = async () => {
    try {
      await messageService.markAsRead(conversationId, user?.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      await messageService.sendMessage(conversationId, user?.id, messageText);
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        messageService.sendTypingIndicator(conversationId, user?.id, false);
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (text) => {
    setNewMessage(text);
    
    // Send typing indicator
    if (text.length > 0) {
      messageService.sendTypingIndicator(conversationId, user?.id, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        messageService.sendTypingIndicator(conversationId, user?.id, false);
      }, 3000);
    }
  };

  const getAutoResponse = (message) => {
    const responses = [
      'That sounds great!',
      'I totally agree 👍',
      'Interesting perspective!',
      'Thanks for sharing that',
      'I\'ll check it out for sure',
      'Good point!',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLikeMessage = (messageId) => {
    // TODO: Implement message reactions
    console.log('Like message:', messageId);
  };


  const handleCameraPress = async () => {
    try {
      setIsSending(true);
      await messageService.sendImageMessage(conversationId, user?.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setIsSending(false);
    }
  };

  const handleGalleryPress = async () => {
    try {
      setIsSending(true);
      await messageService.sendImageMessage(conversationId, user?.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      console.log('Stop voice recording');
      Alert.alert('Voice Message', 'Voice message recorded successfully!');
    } else {
      // Start recording
      setIsRecording(true);
      console.log('Start voice recording');
      
      // Simulate recording for 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        Alert.alert('Voice Message', 'Voice message recorded!');
      }, 3000);
    }
  };

  const handleEmojiPress = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.sender_id === user?.id;
    const nextMessage = messages[index + 1];
    const isLastInGroup = !nextMessage || nextMessage.sender_id !== item.sender_id;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && isLastInGroup && (
          <Image 
            source={{ 
              uri: item.sender?.avatar_url || participant?.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  participant?.full_name || 'User'
                )}&background=f97316&color=fff&size=150`
            }} 
            style={styles.messageAvatar} 
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          !isCurrentUser && !isLastInGroup && styles.messageWithoutAvatar,
          item.message_type === 'image' && styles.imageBubble
        ]}>
          {item.message_type === 'image' ? (
            <TouchableOpacity 
              onPress={() => {
                // TODO: Open image viewer
                const imageData = JSON.parse(item.content);
                console.log('Open image:', imageData.url);
              }}
            >
              {(() => {
                try {
                  const imageData = JSON.parse(item.content);
                  return (
                    <Image 
                      source={{ uri: imageData.thumbnailUrl || imageData.url }} 
                      style={[
                        styles.messageImage,
                        {
                          width: Math.min(imageData.width || 200, 200),
                          height: Math.min(imageData.height || 200, 200),
                        }
                      ]}
                      resizeMode="cover"
                      onLoad={() => {
                        // Load full resolution image after thumbnail
                        if (imageData.thumbnailUrl && imageData.url !== imageData.thumbnailUrl) {
                          // This would trigger loading of full image in a real implementation
                        }
                      }}
                    />
                  );
                } catch (e) {
                  // Fallback for old format
                  return (
                    <Image 
                      source={{ uri: item.content }} 
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  );
                }
              })()}
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.content}
            </Text>
          )}
          
          {isLastInGroup && (
            <Text style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
              item.message_type === 'image' && styles.imageMessageTime
            ]}>
              {formatMessageTime(item.created_at)}
              {item.is_edited && ' (edited)'}
            </Text>
          )}
        </View>

        {isCurrentUser && isLastInGroup && (
          <TouchableOpacity 
            style={styles.messageReaction}
            onPress={() => handleLikeMessage(item.id)}
          >
            <Heart size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={[styles.messageContainer, styles.otherUserMessage]}>
        <Image 
          source={{ 
            uri: participant?.avatar_url || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                participant?.full_name || 'User'
              )}&background=f97316&color=fff&size=150`
          }} 
          style={styles.messageAvatar} 
        />
        <View style={[styles.messageBubble, styles.otherUserBubble, styles.typingBubble]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        title={participant.full_name}
        onMessagesPress={() => navigation.navigate('Messages')}
      />

      {/* User Status Bar */}
      <View style={styles.userStatusBar}>
        <Image 
          source={{ 
            uri: participant?.avatar_url || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                participant?.full_name || 'User'
              )}&background=f97316&color=fff&size=150`
          }} 
          style={styles.statusAvatar} 
        />
        <Text style={styles.userStatus}>
          {typingUsers.length > 0 ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <VideoCamera size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <DotsThree size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <SkeletonMessages />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
          ListHeaderComponent={() => (
            isLoadingOlder ? (
              <View style={styles.loadingOlderContainer}>
                <ActivityIndicator size="small" color={tokens.colors.primary} />
                <Text style={styles.loadingOlderText}>Loading older messages...</Text>
              </View>
            ) : null
          )}
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.1}
          inverted={true} // This makes the list start from bottom and scroll up for older messages
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />
      )}

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputAction} onPress={handleCameraPress}>
            <Camera size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              value={newMessage}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
              placeholderTextColor="#999"
              editable={!isSending}
            />
            
            {newMessage.trim() === '' && (
              <View style={styles.inputActions}>
                <TouchableOpacity 
                  style={[styles.inputActionSmall, isRecording && styles.recordingButton]}
                  onPress={handleVoicePress}
                >
                  <Microphone 
                    size={20} 
                    color={isRecording ? '#ef4444' : '#666'} 
                    weight={isRecording ? 'fill' : 'regular'}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputActionSmall} onPress={handleGalleryPress}>
                  <ImageIcon size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputActionSmall} onPress={handleEmojiPress}>
                  <Smiley 
                    size={20} 
                    color={showEmojiPicker ? '#f97316' : '#666'} 
                    weight={showEmojiPicker ? 'fill' : 'regular'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.sendButton,
              (newMessage.trim() && !isSending) ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#999" />
            ) : (
              <PaperPlaneTilt 
                size={20} 
                color={newMessage.trim() ? '#fff' : '#999'} 
                weight="fill" 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <View style={styles.emojiPicker}>
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Frequently Used</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Text style={styles.emojiClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emojiGrid}>
              {['😀', '😂', '😍', '🥰', '😘', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏', '🙏'].map((emoji, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.emojiButton}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  statusAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  userStatus: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 2,
  },
  currentUserBubble: {
    backgroundColor: '#f97316',
    borderBottomRightRadius: 6,
  },
  otherUserBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 6,
  },
  messageWithoutAvatar: {
    marginLeft: 36,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherUserTime: {
    color: '#999',
  },
  messageReaction: {
    alignSelf: 'flex-end',
    marginLeft: 8,
    marginBottom: 8,
    padding: 4,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    minHeight: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#1a1a1a',
    maxHeight: 60,
    minHeight: 20,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  inputActionSmall: {
    padding: 6,
    marginLeft: 6,
    borderRadius: 15,
  },
  recordingButton: {
    backgroundColor: '#fef2f2',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#f97316',
  },
  sendButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
  emojiPicker: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    maxHeight: 200,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  emojiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emojiClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 22,
  },
  emojiText: {
    fontSize: 24,
  },
  // Image message styles
  imageBubble: {
    padding: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageMessageTime: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  loadingOlderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingOlderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default MessageDetailScreen;