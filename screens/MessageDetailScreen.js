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

const MessageDetailScreen = ({ route, navigation }) => {
  const { conversationId, participant } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Simulate typing indicator
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 3000);

    return () => clearTimeout(typingTimer);
  }, [conversationId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from Supabase messages table
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
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: 'current_user',
        content: messageText,
        message_type: 'text',
        created_at: new Date().toISOString(),
        is_read: false,
      };

      setMessages(prev => [...prev, tempMessage]);

      // TODO: Send to Supabase
      // For now, just simulate a response
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          const responseMessage = {
            id: `response-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: participant.id,
            content: getAutoResponse(messageText),
            message_type: 'text',
            created_at: new Date().toISOString(),
            is_read: true,
          };
          setMessages(prev => [...prev, responseMessage]);
          setIsTyping(false);
        }, 2000);
      }, 500);

    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
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


  const handleCameraPress = () => {
    Alert.alert(
      'Camera',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => console.log('Take photo') },
        { text: 'Record Video', onPress: () => console.log('Record video') },
      ]
    );
  };

  const handleGalleryPress = () => {
    Alert.alert(
      'Gallery',
      'Choose media type',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Photo', onPress: () => console.log('Select photo from gallery') },
        { text: 'Video', onPress: () => console.log('Select video from gallery') },
      ]
    );
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
    const isCurrentUser = item.sender_id === 'current_user';
    const nextMessage = messages[index + 1];
    const isLastInGroup = !nextMessage || nextMessage.sender_id !== item.sender_id;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && isLastInGroup && (
          <Image 
            source={{ uri: participant.avatar_url }} 
            style={styles.messageAvatar} 
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          !isCurrentUser && !isLastInGroup && styles.messageWithoutAvatar
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
          
          {isLastInGroup && (
            <Text style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime
            ]}>
              {formatMessageTime(item.created_at)}
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
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.otherUserMessage]}>
        <Image 
          source={{ uri: participant.avatar_url }} 
          style={styles.messageAvatar} 
        />
        <View style={[styles.messageBubble, styles.otherUserBubble, styles.typingBubble]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, { animationDelay: 0 }]} />
            <View style={[styles.typingDot, { animationDelay: 0.2 }]} />
            <View style={[styles.typingDot, { animationDelay: 0.4 }]} />
          </View>
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
          source={{ uri: participant.avatar_url }} 
          style={styles.statusAvatar} 
        />
        <Text style={styles.userStatus}>
          {participant.is_online ? 'Online' : 'Active 30m ago'}
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

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
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              placeholderTextColor="#999"
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
              newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <PaperPlaneTilt 
              size={20} 
              color={newMessage.trim() ? '#fff' : '#999'} 
              weight="fill" 
            />
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
});

export default MessageDetailScreen;