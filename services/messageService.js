import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { optimizeImageForUpload, createThumbnail } from '../utils/imageOptimization';

class MessageService {
  constructor() {
    this.activeSubscriptions = new Map();
    this.typingTimeouts = new Map();
  }

  // Get all conversations for a user
  async getConversations(userId) {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            created_at,
            updated_at,
            last_message_at,
            messages (
              id,
              content,
              sender_id,
              created_at,
              message_type,
              is_edited
            )
          )
        `)
        .eq('user_id', userId)
        .order('conversations.last_message_at', { ascending: false });

      if (error) throw error;

      // Get participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        data.map(async (item) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              last_read_at,
              users_profiles!inner (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', item.conversation_id)
            .neq('user_id', userId);

          const otherParticipant = participants?.[0]?.users_profiles;
          const lastMessage = item.conversations.messages?.[0];

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', item.conversation_id)
            .neq('sender_id', userId)
            .gt('created_at', participants?.[0]?.last_read_at || '1900-01-01');

          return {
            id: item.conversation_id,
            participant: otherParticipant,
            last_message: lastMessage,
            unread_count: unreadCount || 0,
            updated_at: item.conversations.last_message_at,
          };
        })
      );

      return conversationsWithParticipants.filter(conv => conv.participant);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation with pagination
  async getMessages(conversationId, limit = 50, beforeMessageId = null) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users_profiles!sender_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // For pagination: get messages before a specific message
      if (beforeMessageId) {
        const { data: beforeMessage } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', beforeMessageId)
          .single();
        
        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Return in ascending order for display (oldest first)
      return data.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Get older messages (for infinite scroll)
  async getOlderMessages(conversationId, oldestMessageId, limit = 30) {
    return this.getMessages(conversationId, limit, oldestMessageId);
  }

  // Send a text message
  async sendMessage(conversationId, senderId, content, messageType = 'text') {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload and send image message
  async sendImageMessage(conversationId, senderId) {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera roll permissions are required');
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0, // We'll optimize ourselves
      });

      if (result.canceled) return null;

      const { uri } = result.assets[0];

      // Optimize image for messaging
      const optimizedResult = await optimizeImageForUpload(uri, 'message');
      
      // Create thumbnail for fast loading
      const thumbnailUri = await createThumbnail(optimizedResult.uri, 150);

      // Read optimized image as base64
      const base64 = await FileSystem.readAsStringAsync(optimizedResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Read thumbnail as base64
      const thumbnailBase64 = await FileSystem.readAsStringAsync(thumbnailUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload main image to Supabase Storage
      const fileName = `messages/${conversationId}/${Date.now()}.jpg`;
      const thumbnailFileName = `messages/${conversationId}/${Date.now()}_thumb.jpg`;
      
      const [uploadResult, thumbnailUploadResult] = await Promise.all([
        supabase.storage
          .from('message-attachments')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
          }),
        supabase.storage
          .from('message-attachments')
          .upload(thumbnailFileName, decode(thumbnailBase64), {
            contentType: 'image/jpeg',
          })
      ]);

      if (uploadResult.error) throw uploadResult.error;
      if (thumbnailUploadResult.error) throw thumbnailUploadResult.error;

      // Get public URLs
      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);
      
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(thumbnailFileName);

      // Create image metadata
      const imageData = {
        url: publicUrl,
        thumbnailUrl: thumbnailUrl,
        width: optimizedResult.width,
        height: optimizedResult.height,
        size: optimizedResult.optimizedSize,
        originalSize: optimizedResult.originalSize,
      };

      // Send message with image data
      return await this.sendMessage(conversationId, senderId, JSON.stringify(imageData), 'image');
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      // Update last_read_at for the user in this conversation
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Create or get existing conversation
  async createOrGetConversation(userId, otherUserId) {
    try {
      // Check if conversation already exists
      const { data: existingConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (existingConversations) {
        for (const conv of existingConversations) {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id);

          const participantIds = participants?.map(p => p.user_id) || [];
          if (participantIds.includes(otherUserId) && participantIds.length === 2) {
            return conv.conversation_id;
          }
        }
      }

      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: userId },
          { conversation_id: newConversation.id, user_id: otherUserId },
        ]);

      if (participantsError) throw participantsError;

      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Subscribe to real-time messages
  subscribeToMessages(conversationId, onMessage) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users_profiles!sender_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(data);
          }
        }
      )
      .subscribe();

    this.activeSubscriptions.set(conversationId, subscription);
    return subscription;
  }

  // Subscribe to conversation updates
  subscribeToConversations(userId, onUpdate) {
    const subscription = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Check if this message is in a conversation the user is part of
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId)
            .eq('conversation_id', payload.new?.conversation_id || payload.old?.conversation_id)
            .single();

          if (participant) {
            onUpdate(payload);
          }
        }
      )
      .subscribe();

    this.activeSubscriptions.set(`conversations:${userId}`, subscription);
    return subscription;
  }

  // Send typing indicator
  async sendTypingIndicator(conversationId, userId, isTyping) {
    const channel = supabase.channel(`typing:${conversationId}`);
    
    if (isTyping) {
      await channel.track({
        user_id: userId,
        typing: true,
        timestamp: new Date().toISOString(),
      });

      // Auto-stop typing after 3 seconds
      if (this.typingTimeouts.has(conversationId)) {
        clearTimeout(this.typingTimeouts.get(conversationId));
      }

      const timeout = setTimeout(() => {
        this.sendTypingIndicator(conversationId, userId, false);
      }, 3000);

      this.typingTimeouts.set(conversationId, timeout);
    } else {
      await channel.untrack();
      
      if (this.typingTimeouts.has(conversationId)) {
        clearTimeout(this.typingTimeouts.get(conversationId));
        this.typingTimeouts.delete(conversationId);
      }
    }
  }

  // Subscribe to typing indicators
  subscribeToTyping(conversationId, onTypingUpdate) {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state)
          .flat()
          .filter(presence => presence.typing);
        onTypingUpdate(typingUsers);
      })
      .subscribe();

    this.activeSubscriptions.set(`typing:${conversationId}`, channel);
    return channel;
  }

  // Delete message
  async deleteMessage(messageId, userId) {
    try {
      // First check if user is the sender
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      if (message.sender_id !== userId) {
        throw new Error('You can only delete your own messages');
      }

      // Soft delete by updating content
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: 'This message was deleted',
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Edit message
  async editMessage(messageId, userId, newContent) {
    try {
      // First check if user is the sender
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      if (message.sender_id !== userId) {
        throw new Error('You can only edit your own messages');
      }

      const { data, error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.activeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.activeSubscriptions.clear();
    
    this.typingTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.typingTimeouts.clear();
  }
}

export const messageService = new MessageService();