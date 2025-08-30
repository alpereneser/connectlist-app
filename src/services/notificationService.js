import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize notification service
  async initialize() {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        await this.savePushTokenToProfile(token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return token;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return null;
    }
  }

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        console.log('Expo push token:', token);
      } catch (e) {
        console.error('Error getting Expo push token:', e);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Save push token to user profile
  async savePushTokenToProfile(token) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        expo_push_token: token,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Exception saving push token:', error);
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        // Handle foreground notification
        this.handleForegroundNotification(notification);
      },
    );

    // Listener for when user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        // Handle notification tap
        this.handleNotificationResponse(response);
      });
  }

  // Handle notification received in foreground
  handleForegroundNotification(notification) {
    const { title, body, data } = notification.request.content;

    // You can customize how notifications appear in foreground
    // For now, we'll let the default behavior handle it
    console.log('Foreground notification:', { title, body, data });
  }

  // Handle notification tap/response
  handleNotificationResponse(response) {
    const { notification } = response;
    const { data } = notification.request.content;

    // Navigate based on notification type
    if (data?.type) {
      this.navigateBasedOnNotificationType(data);
    }
  }

  // Navigate based on notification type
  navigateBasedOnNotificationType(data) {
    const { type, listId, userId, conversationId } = data;

    switch (type) {
      case 'like':
      case 'comment':
        if (listId) {
          // Navigate to list details
          console.log('Navigate to list:', listId);
        }
        break;
      case 'follow':
        if (userId) {
          // Navigate to user profile
          console.log('Navigate to profile:', userId);
        }
        break;
      case 'message':
        if (conversationId) {
          // Navigate to chat
          console.log('Navigate to chat:', conversationId);
        }
        break;
      default:
        // Navigate to notifications screen
        console.log('Navigate to notifications');
    }
  }

  // Send a local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { seconds: 1 },
    });
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

  // Get current push token
  getPushToken() {
    return this.expoPushToken;
  }

  // Update push token in profile
  async updatePushToken() {
    const token = await this.registerForPushNotificationsAsync();
    if (token) {
      this.expoPushToken = token;
      await this.savePushTokenToProfile(token);
    }
    return token;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

// Export notification types for consistency
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MESSAGE: 'message',
  LIST_SHARE: 'list_share',
  GROUP_ACTIVITY: 'group_activity',
  SUGGESTION: 'suggestion',
  REMINDER: 'reminder',
};

// Export notification message generators
export const generateNotificationMessage = (type, data) => {
  const { actorName, listTitle, commentText, activityType } = data;

  switch (type) {
    case NOTIFICATION_TYPES.LIKE:
      return `${actorName} '${listTitle}' listeni beğendi`;
    case NOTIFICATION_TYPES.COMMENT:
      return `${actorName} '${listTitle}' listene yorum yaptı: "${commentText}"`;
    case NOTIFICATION_TYPES.FOLLOW:
      return `${actorName} seni takip etmeye başladı`;
    case NOTIFICATION_TYPES.MESSAGE:
      return `${actorName} sana mesaj gönderdi`;
    case NOTIFICATION_TYPES.LIST_SHARE:
      return `${actorName} seni '${listTitle}' listesine ekledi`;
    case NOTIFICATION_TYPES.GROUP_ACTIVITY:
      return `'${listTitle}' listesinde yeni aktivite var`;
    case NOTIFICATION_TYPES.SUGGESTION:
      return 'İlgilenebileceğin yeni listeler var';
    case NOTIFICATION_TYPES.REMINDER:
      return data.reminderText || 'Uzun süredir liste oluşturmadın';
    default:
      return 'Yeni bir bildirim var';
  }
};
