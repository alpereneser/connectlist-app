import { supabase } from './supabase';
import notificationService, {
  NOTIFICATION_TYPES,
  generateNotificationMessage,
} from '../services/notificationService';

/**
 * Helper functions for creating and sending notifications
 */

// Create a notification in the database
export const createNotification = async ({
  userId,
  type,
  actorId,
  targetId = null,
  data = {},
}) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Don't send notification to yourself
    if (userId === user.id) {
      return null;
    }

    // Generate message based on type and data
    const message = generateNotificationMessage(type, {
      actorName: data.actorName || 'Birisi',
      listTitle: data.listTitle,
      commentText: data.commentText,
      reminderText: data.reminderText,
    });

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        actor_id: actorId || user.id,
        target_id: targetId,
        message,
        data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    console.log('Notification created:', notification);
    return notification;
  } catch (error) {
    console.error('Exception creating notification:', error);
    return null;
  }
};

// Send a like notification
export const sendLikeNotification = async (listOwnerId, listTitle) => {
  return await createNotification({
    userId: listOwnerId,
    type: NOTIFICATION_TYPES.LIKE,
    data: { listTitle },
  });
};

// Send a comment notification
export const sendCommentNotification = async (
  listOwnerId,
  listTitle,
  commentText,
) => {
  return await createNotification({
    userId: listOwnerId,
    type: NOTIFICATION_TYPES.COMMENT,
    data: { listTitle, commentText },
  });
};

// Send a follow notification
export const sendFollowNotification = async followedUserId => {
  return await createNotification({
    userId: followedUserId,
    type: NOTIFICATION_TYPES.FOLLOW,
    data: {},
  });
};

// Send a message notification
export const sendMessageNotification = async recipientId => {
  return await createNotification({
    userId: recipientId,
    type: NOTIFICATION_TYPES.MESSAGE,
    data: {},
  });
};

// Send a list share notification
export const sendListShareNotification = async (userId, listTitle) => {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.LIST_SHARE,
    data: { listTitle },
  });
};

// Send a group activity notification
export const sendGroupActivityNotification = async (
  userIds,
  listTitle,
  activityType,
) => {
  const notifications = [];

  for (const userId of userIds) {
    const notification = await createNotification({
      userId,
      type: NOTIFICATION_TYPES.GROUP_ACTIVITY,
      data: { listTitle, activityType },
    });
    if (notification) {
      notifications.push(notification);
    }
  }

  return notifications;
};

// Send a suggestion notification
export const sendSuggestionNotification = async userId => {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.SUGGESTION,
    data: {},
  });
};

// Send a reminder notification
export const sendReminderNotification = async (userId, reminderText) => {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.REMINDER,
    data: { reminderText },
  });
};

// Send local test notification
export const sendTestNotification = async (type = 'like') => {
  try {
    const testData = {
      [NOTIFICATION_TYPES.LIKE]: {
        title: 'Test Beğeni',
        body: 'Test kullanıcısı listeni beğendi',
        data: { type: 'like', listId: 'test-list-1' },
      },
      [NOTIFICATION_TYPES.COMMENT]: {
        title: 'Test Yorum',
        body: 'Test kullanıcısı listene yorum yaptı: "Harika liste!"',
        data: { type: 'comment', listId: 'test-list-1' },
      },
      [NOTIFICATION_TYPES.FOLLOW]: {
        title: 'Yeni Takipçi',
        body: 'Test kullanıcısı seni takip etmeye başladı',
        data: { type: 'follow', userId: 'test-user-1' },
      },
      [NOTIFICATION_TYPES.MESSAGE]: {
        title: 'Yeni Mesaj',
        body: 'Test kullanıcısı sana mesaj gönderdi',
        data: { type: 'message', conversationId: 'test-conv-1' },
      },
      [NOTIFICATION_TYPES.LIST_SHARE]: {
        title: 'Liste Paylaşımı',
        body: 'Test kullanıcısı seni "Test Listesi" listesine ekledi',
        data: { type: 'list_share', listId: 'test-list-1' },
      },
      [NOTIFICATION_TYPES.GROUP_ACTIVITY]: {
        title: 'Grup Aktivitesi',
        body: '"Test Listesi" listesinde yeni aktivite var',
        data: { type: 'group_activity', listId: 'test-list-1' },
      },
      [NOTIFICATION_TYPES.SUGGESTION]: {
        title: 'Öneri',
        body: 'İlgilenebileceğin yeni listeler var',
        data: { type: 'suggestion' },
      },
      [NOTIFICATION_TYPES.REMINDER]: {
        title: 'Hatırlatma',
        body: 'Uzun süredir liste oluşturmadın',
        data: { type: 'reminder' },
      },
    };

    const notification = testData[type] || testData[NOTIFICATION_TYPES.LIKE];

    await notificationService.sendLocalNotification(
      notification.title,
      notification.body,
      notification.data,
    );

    console.log('Test notification sent:', type);
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// Get notification statistics
export const getNotificationStats = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return null;}

    const { data, error } = await supabase
      .from('notifications')
      .select('type, is_read')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching notification stats:', error);
      return null;
    }

    const stats = {
      total: data.length,
      unread: data.filter(n => !n.is_read).length,
      byType: {},
    };

    // Count by type
    data.forEach(notification => {
      if (!stats.byType[notification.type]) {
        stats.byType[notification.type] = { total: 0, unread: 0 };
      }
      stats.byType[notification.type].total++;
      if (!notification.is_read) {
        stats.byType[notification.type].unread++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Exception fetching notification stats:', error);
    return null;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return false;}

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception marking notifications as read:', error);
    return false;
  }
};

// Delete old notifications (older than 30 days)
export const cleanupOldNotifications = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return false;}

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception cleaning up old notifications:', error);
    return false;
  }
};
