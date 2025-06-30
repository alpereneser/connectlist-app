import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/react-native-netinfo';
import { supabase } from '../lib/supabase';

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.listeners = new Set();
    this.pendingOperations = new Map();
    this.initializeNetworkListener();
  }

  // Initialize network status listener
  initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      console.log('Network status changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOnline: this.isOnline
      });

      // Notify listeners
      this.listeners.forEach(listener => {
        listener(this.isOnline, wasOnline);
      });

      // If we just came online, sync pending operations
      if (this.isOnline && !wasOnline) {
        this.syncPendingOperations();
      }
    });
  }

  // Add network status listener
  addNetworkListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Cache data locally
  async cacheData(key, data, expirationTime = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expirationTime,
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Get cached data
  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > cacheData.expirationTime;
      
      if (isExpired) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Queue operation for later sync
  async queueOperation(operation) {
    try {
      const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const queuedOperation = {
        id: operationId,
        ...operation,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.syncQueue.push(queuedOperation);
      this.pendingOperations.set(operationId, queuedOperation);

      // Save to persistent storage
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
      
      console.log(`Operation queued: ${operation.type}`, queuedOperation);
      return operationId;
    } catch (error) {
      console.error('Error queuing operation:', error);
      return null;
    }
  }

  // Load sync queue from storage
  async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        
        // Rebuild pending operations map
        this.pendingOperations.clear();
        this.syncQueue.forEach(op => {
          this.pendingOperations.set(op.id, op);
        });
        
        console.log(`Loaded ${this.syncQueue.length} operations from queue`);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  // Sync pending operations when online
  async syncPendingOperations() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log(`Syncing ${this.syncQueue.length} pending operations...`);
    const operationsToSync = [...this.syncQueue];
    
    for (const operation of operationsToSync) {
      try {
        await this.executeOperation(operation);
        
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
        this.pendingOperations.delete(operation.id);
        
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        // Remove if too many retries
        if (operation.retryCount > 3) {
          console.log(`Removing operation ${operation.id} after ${operation.retryCount} failed attempts`);
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          this.pendingOperations.delete(operation.id);
        }
      }
    }

    // Save updated queue
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    console.log(`Sync completed. ${this.syncQueue.length} operations remaining.`);
  }

  // Execute a queued operation
  async executeOperation(operation) {
    switch (operation.type) {
      case 'send_message':
        return await this.syncSendMessage(operation);
      case 'mark_read':
        return await this.syncMarkRead(operation);
      case 'create_conversation':
        return await this.syncCreateConversation(operation);
      case 'upload_image':
        return await this.syncUploadImage(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Sync message sending
  async syncSendMessage(operation) {
    const { conversationId, senderId, content, messageType } = operation.data;
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType || 'text',
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return data;
  }

  // Sync mark as read
  async syncMarkRead(operation) {
    const { conversationId, userId } = operation.data;
    
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Sync conversation creation
  async syncCreateConversation(operation) {
    const { userId, otherUserId } = operation.data;
    
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: userId },
        { conversation_id: conversation.id, user_id: otherUserId },
      ]);

    if (participantsError) throw participantsError;

    return conversation;
  }

  // Cache messages for offline viewing
  async cacheMessages(conversationId, messages) {
    await this.cacheData(`messages_${conversationId}`, messages, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Get cached messages
  async getCachedMessages(conversationId) {
    return await this.getCachedData(`messages_${conversationId}`);
  }

  // Cache conversations for offline viewing
  async cacheConversations(conversations) {
    await this.cacheData('conversations', conversations, 2 * 60 * 60 * 1000); // 2 hours
  }

  // Get cached conversations
  async getCachedConversations() {
    return await this.getCachedData('conversations');
  }

  // Save message locally for offline viewing
  async saveMessageLocally(conversationId, message) {
    try {
      const localMessages = await this.getCachedMessages(conversationId) || [];
      
      // Add new message if not already present
      if (!localMessages.find(m => m.id === message.id)) {
        localMessages.push({
          ...message,
          isLocal: !this.isOnline, // Mark as local if offline
        });
        
        await this.cacheMessages(conversationId, localMessages);
      }
    } catch (error) {
      console.error('Error saving message locally:', error);
    }
  }

  // Send message with offline support
  async sendMessageOffline(conversationId, senderId, content, messageType = 'text') {
    // Create temporary message for immediate display
    const tempMessage = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      isLocal: true,
      isPending: true,
    };

    // Save locally for immediate display
    await this.saveMessageLocally(conversationId, tempMessage);

    if (this.isOnline) {
      // Send immediately if online
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

        // Replace temp message with real one
        const localMessages = await this.getCachedMessages(conversationId) || [];
        const updatedMessages = localMessages.map(m => 
          m.id === tempMessage.id ? { ...data, isLocal: false, isPending: false } : m
        );
        await this.cacheMessages(conversationId, updatedMessages);

        return data;
      } catch (error) {
        // Queue for later if immediate send fails
        await this.queueOperation({
          type: 'send_message',
          data: { conversationId, senderId, content, messageType },
          tempMessageId: tempMessage.id,
        });
        throw error;
      }
    } else {
      // Queue for when online
      await this.queueOperation({
        type: 'send_message',
        data: { conversationId, senderId, content, messageType },
        tempMessageId: tempMessage.id,
      });
      
      return tempMessage;
    }
  }

  // Mark messages as read with offline support
  async markAsReadOffline(conversationId, userId) {
    if (this.isOnline) {
      try {
        const { error } = await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);

        if (error) throw error;
      } catch (error) {
        // Queue for later
        await this.queueOperation({
          type: 'mark_read',
          data: { conversationId, userId },
        });
        throw error;
      }
    } else {
      // Queue for when online
      await this.queueOperation({
        type: 'mark_read',
        data: { conversationId, userId },
      });
    }
  }

  // Clear expired cache
  async clearExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          const isExpired = Date.now() - cacheData.timestamp > cacheData.expirationTime;
          
          if (isExpired) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Get cache size and stats
  async getCacheStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      let totalSize = 0;
      let itemCount = 0;
      
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          itemCount++;
        }
      }
      
      return {
        itemCount,
        totalSize,
        queueSize: this.syncQueue.length,
        isOnline: this.isOnline,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { itemCount: 0, totalSize: 0, queueSize: 0, isOnline: this.isOnline };
    }
  }

  // Clear all cache
  async clearAllCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      
      console.log(`Cleared ${cacheKeys.length} cache items`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Initialize offline service
  async initialize() {
    await this.loadSyncQueue();
    await this.clearExpiredCache();
    
    // Try to sync if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

export default offlineService;