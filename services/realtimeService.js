import { supabase } from '../lib/supabase';
import { triggerNotification, NotificationTypes } from './notificationService';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.callbacks = new Map();
  }

  // Subscribe to list updates
  subscribeToList(listId, callbacks = {}) {
    const channelName = `list:${listId}`;
    
    if (this.subscriptions.has(channelName)) {
      console.log('Already subscribed to list:', listId);
      return this.subscriptions.get(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `id=eq.${listId}`,
        },
        (payload) => {
          console.log('List change:', payload);
          callbacks.onListUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('New list item:', payload);
          callbacks.onItemAdded?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('List item removed:', payload);
          callbacks.onItemRemoved?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'list_likes',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('New like:', payload);
          callbacks.onLike?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('New comment:', payload);
          callbacks.onComment?.(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    this.callbacks.set(channelName, callbacks);
    
    return subscription;
  }

  // Subscribe to user profile updates
  subscribeToUserProfile(userId, callbacks = {}) {
    const channelName = `user:${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Profile update:', payload);
          callbacks.onProfileUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('New follower:', payload);
          callbacks.onNewFollower?.(payload);
          
          // Trigger notification
          const follower = await this.getUserInfo(payload.new.follower_id);
          if (follower) {
            await triggerNotification(NotificationTypes.NEW_FOLLOWER, {
              params: [follower.username],
              targetId: follower.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Lost follower:', payload);
          callbacks.onUnfollow?.(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    this.callbacks.set(channelName, callbacks);
    
    return subscription;
  }

  // Subscribe to messages/conversations
  subscribeToConversation(conversationId, callbacks = {}) {
    const channelName = `conversation:${conversationId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('New message:', payload);
          callbacks.onNewMessage?.(payload);
          
          // Trigger notification
          const sender = await this.getUserInfo(payload.new.sender_id);
          if (sender) {
            await triggerNotification(NotificationTypes.NEW_MESSAGE, {
              params: [sender.username],
              targetId: conversationId,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          callbacks.onMessageUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message deleted:', payload);
          callbacks.onMessageDelete?.(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    this.callbacks.set(channelName, callbacks);
    
    return subscription;
  }

  // Subscribe to notifications
  subscribeToNotifications(userId, callbacks = {}) {
    const channelName = `notifications:${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification:', payload);
          callbacks.onNewNotification?.(payload);
          
          // Update badge count
          this.updateBadgeCount(userId);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    this.callbacks.set(channelName, callbacks);
    
    return subscription;
  }

  // Subscribe to global feed updates
  subscribeToFeed(callbacks = {}) {
    const channelName = 'feed:global';
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lists',
        },
        (payload) => {
          console.log('New list in feed:', payload);
          callbacks.onNewList?.(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    this.callbacks.set(channelName, callbacks);
    
    return subscription;
  }

  // Subscribe to presence (online users)
  subscribeToPresence(channelName, callbacks = {}) {
    if (this.subscriptions.has(`presence:${channelName}`)) {
      return this.subscriptions.get(`presence:${channelName}`);
    }

    const subscription = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        console.log('Presence state:', state);
        callbacks.onPresenceSync?.(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        callbacks.onUserJoin?.({ key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        callbacks.onUserLeave?.({ key, leftPresences });
      })
      .subscribe();

    this.subscriptions.set(`presence:${channelName}`, subscription);
    this.callbacks.set(`presence:${channelName}`, callbacks);
    
    return subscription;
  }

  // Track user presence
  async trackPresence(channelName, userInfo) {
    const channel = this.subscriptions.get(`presence:${channelName}`);
    
    if (channel) {
      await channel.track({
        online_at: new Date().toISOString(),
        ...userInfo,
      });
    }
  }

  // Untrack user presence
  async untrackPresence(channelName) {
    const channel = this.subscriptions.get(`presence:${channelName}`);
    
    if (channel) {
      await channel.untrack();
    }
  }

  // Broadcast event
  async broadcast(channelName, event, payload) {
    const channel = this.subscriptions.get(channelName);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }

  // Helper: Get user info
  async getUserInfo(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  // Helper: Update badge count
  async updateBadgeCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (!error && count !== null) {
        // Update badge in notification service
        const { notificationService } = await import('./notificationService');
        await notificationService.setBadgeCount(count);
      }
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  // Unsubscribe from channel
  unsubscribe(channelName) {
    const subscription = this.subscriptions.get(channelName);
    
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channelName);
      this.callbacks.delete(channelName);
      console.log('Unsubscribed from:', channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, channelName) => {
      subscription.unsubscribe();
      console.log('Unsubscribed from:', channelName);
    });
    
    this.subscriptions.clear();
    this.callbacks.clear();
  }

  // Get active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export helper functions
export const subscribeToList = (listId, callbacks) =>
  realtimeService.subscribeToList(listId, callbacks);

export const subscribeToUser = (userId, callbacks) =>
  realtimeService.subscribeToUserProfile(userId, callbacks);

export const subscribeToMessages = (conversationId, callbacks) =>
  realtimeService.subscribeToConversation(conversationId, callbacks);

export const unsubscribeFrom = (channelName) =>
  realtimeService.unsubscribe(channelName);

export const unsubscribeAll = () =>
  realtimeService.unsubscribeAll();