import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize notifications
  async initialize(userId) {
    try {
      // Check if device can receive notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const token = await this.registerForPushNotifications();
      if (!token) return null;

      // Save token to backend
      if (userId) {
        await this.savePushToken(userId, token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return token;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // Register for push notifications
  async registerForPushNotifications() {
    try {
      // Get existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications to stay updated with your lists and followers.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Save push token to Supabase
  async savePushToken(userId, token) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: Platform.OS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also save locally
      await AsyncStorage.setItem('pushToken', token);
      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Handle in-app notification display
      const { title, body, data } = notification.request.content;
      
      // You can show a custom in-app notification here
      // For example, using a toast or custom component
    });

    // Listener for when user interacts with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
      
      const { data } = response.notification.request.content;
      this.handleNotificationClick(data);
    });
  }

  // Handle notification click
  handleNotificationClick(data) {
    if (!data) return;

    const { type, targetId } = data;

    // Navigate based on notification type
    switch (type) {
      case 'new_follower':
        // Navigate to user profile
        if (global.navigationRef?.current) {
          global.navigationRef.current.navigate('Profile', { userId: targetId });
        }
        break;
      
      case 'list_like':
      case 'list_comment':
        // Navigate to list details
        if (global.navigationRef?.current) {
          global.navigationRef.current.navigate('ListDetail', { listId: targetId });
        }
        break;
      
      case 'new_message':
        // Navigate to messages
        if (global.navigationRef?.current) {
          global.navigationRef.current.navigate('MessageDetail', { conversationId: targetId });
        }
        break;
      
      default:
        console.log('Unknown notification type:', type);
    }
  }

  // Schedule local notification
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: trigger || null, // null = immediate
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Get badge count
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Send push notification (server-side function)
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      badge: 1,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Notification types and templates
export const NotificationTypes = {
  NEW_FOLLOWER: 'new_follower',
  LIST_LIKE: 'list_like',
  LIST_COMMENT: 'list_comment',
  NEW_MESSAGE: 'new_message',
  LIST_SHARED: 'list_shared',
  MENTION: 'mention',
};

export const NotificationTemplates = {
  [NotificationTypes.NEW_FOLLOWER]: (username) => ({
    title: 'New Follower',
    body: `${username} started following you`,
  }),
  
  [NotificationTypes.LIST_LIKE]: (username, listTitle) => ({
    title: 'New Like',
    body: `${username} liked your list "${listTitle}"`,
  }),
  
  [NotificationTypes.LIST_COMMENT]: (username, listTitle) => ({
    title: 'New Comment',
    body: `${username} commented on "${listTitle}"`,
  }),
  
  [NotificationTypes.NEW_MESSAGE]: (username) => ({
    title: 'New Message',
    body: `${username} sent you a message`,
  }),
  
  [NotificationTypes.LIST_SHARED]: (username, listTitle) => ({
    title: 'List Shared',
    body: `${username} shared your list "${listTitle}"`,
  }),
  
  [NotificationTypes.MENTION]: (username) => ({
    title: 'You were mentioned',
    body: `${username} mentioned you in a comment`,
  }),
};

// Export singleton instance
export const notificationService = new NotificationService();

// Helper function to trigger notifications
export const triggerNotification = async (type, data) => {
  const template = NotificationTemplates[type];
  if (!template) return;

  const { title, body } = template(...data.params);
  
  await notificationService.scheduleLocalNotification(
    title,
    body,
    {
      type,
      targetId: data.targetId,
      ...data.extra,
    }
  );
};