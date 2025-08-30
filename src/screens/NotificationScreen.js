import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';
import {
  sendTestNotification,
  getNotificationStats,
  markAllNotificationsAsRead,
} from '../utils/notificationHelpers';
import { NOTIFICATION_TYPES } from '../services/notificationService';

const NotificationScreen = ({ onTabPress, activeTab = 'notification' }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['All', 'Likes', 'Comments', 'Follows'];
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [notificationStats, setNotificationStats] = useState(null);

  useEffect(() => {
    fetchNotifications();
    loadNotificationStats();
  }, []);

  const loadNotificationStats = async () => {
    const stats = await getNotificationStats();
    setNotificationStats(stats);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      // Fetch notifications with user profile data
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select(
          `
          *,
          profiles!notifications_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Fetch notifications error:', error);
        return;
      }

      // Process notifications data
      const processedNotifications = await Promise.all(
        notificationsData.map(async notification => {
          const data = notification.data || {};
          let actorProfile = null;

          // Get actor profile if actor_id exists in data
          if (data.actor_id) {
            const { data: actorData } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', data.actor_id)
              .single();

            actorProfile = actorData;
          }

          // Resolve avatar URL
          let avatarUrl = null;
          if (
            actorProfile?.avatar_url &&
            /^https?:\/\//i.test(actorProfile.avatar_url)
          ) {
            avatarUrl = actorProfile.avatar_url;
          } else if (actorProfile?.avatar_url) {
            avatarUrl = getPublicUrl(actorProfile.avatar_url, 'avatars');
          }

          return {
            id: notification.id,
            type: notification.type,
            user: {
              id: actorProfile?.id,
              name: actorProfile?.full_name || 'Unknown User',
              username: actorProfile?.username || '',
              avatar: avatarUrl,
            },
            message: generateNotificationMessage(notification.type, data),
            time: formatTimeAgo(notification.created_at),
            isNew: !notification.is_read,
            data: data,
            listImage: data.list_image_url,
            actionButton: notification.type === 'follow' ? 'Follow Back' : null,
          };
        }),
      );

      setNotifications(processedNotifications);
    } catch (error) {
      console.error('Fetch notifications exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotificationMessage = (type, data) => {
    switch (type) {
      case 'like':
        return `liked your list "${data.list_title || 'your list'}"`;
      case 'comment':
        const commentText = data.comment_text || 'Great list!';
        const truncatedComment =
          commentText.length > 30
            ? commentText.substring(0, 30) + '...'
            : commentText;
        return `commented on your list: "${truncatedComment}"`;
      case 'follow':
        return 'started following you';
      case 'message':
        return 'sent you a message';
      case 'list_share':
        return `added you to '${data.list_title || 'a list'}'`;
      case 'group_activity':
        return `new activity in '${data.list_title || 'a list'}'`;
      case 'suggestion':
        return 'new lists you might be interested in';
      case 'reminder':
        return data.reminder_text || "you haven't created a list in a while";
      default:
        return 'interacted with your content';
    }
  };

  const formatTimeAgo = dateString => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {return `${diffInSeconds}s`;}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m`;}
    if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)}h`;}
    if (diffInSeconds < 604800) {return `${Math.floor(diffInSeconds / 86400)}d`;}
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    await loadNotificationStats();
    setRefreshing(false);
  };

  const handleTestNotification = async type => {
    const success = await sendTestNotification(type);
    if (success) {
      Alert.alert('Test Bildirimi', `${type} bildirimi gönderildi!`);
      setTimeout(() => {
        fetchNotifications();
        loadNotificationStats();
      }, 1000);
    } else {
      Alert.alert('Hata', 'Test bildirimi gönderilemedi.');
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      Alert.alert('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi.');
      fetchNotifications();
      loadNotificationStats();
    } else {
      Alert.alert('Hata', 'Bildirimler güncellenemedi.');
    }
  };

  const markAsRead = async notificationId => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isNew: false } : notif,
        ),
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleFollowBack = async userId => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth?.user?.id;

      if (!currentUserId) {return;}

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        Alert.alert('Info', 'You are already following this user');
        return;
      }

      // Create follow relationship
      const { error } = await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: userId,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'You are now following this user');
    } catch (error) {
      console.error('Follow back error:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'All') {return true;}
    if (activeFilter === 'Likes') {return notification.type === 'like';}
    if (activeFilter === 'Comments') {return notification.type === 'comment';}
    if (activeFilter === 'Follows') {return notification.type === 'follow';}
    return true;
  });

  const getNotificationIcon = type => {
    switch (type) {
      case 'follow':
        return 'user-plus';
      case 'like':
        return 'heart';
      case 'comment':
        return 'message-circle';
      case 'message':
        return 'mail';
      case 'list_share':
        return 'share';
      case 'group_activity':
        return 'users';
      case 'suggestion':
        return 'lightbulb';
      case 'reminder':
        return 'clock';
      case 'mention':
        return 'at-sign';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = type => {
    switch (type) {
      case 'follow':
        return Colors.orange;
      case 'like':
        return '#FF6B6B';
      case 'comment':
        return '#4ECDC4';
      case 'message':
        return '#45B7D1';
      case 'list_share':
        return '#9B59B6';
      case 'group_activity':
        return '#E67E22';
      case 'suggestion':
        return '#F39C12';
      case 'reminder':
        return '#34495E';
      default:
        return Colors.textSecondary;
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.isNew && styles.unreadNotification]}
      activeOpacity={0.7}
      onPress={() => {
        if (item.isNew) {
          markAsRead(item.id);
        }
      }}
    >
      <View style={styles.notificationContent}>
        {/* User Avatar with notification icon */}
        <View style={styles.avatarContainer}>
          {item.user.avatar ? (
            <Image
              source={{ uri: item.user.avatar }}
              style={styles.avatar}
              onError={() => {
                // Handle avatar load error
                console.log('Avatar load error for notification');
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Feather name="user" size={20} color={Colors.textSecondary} />
            </View>
          )}
          <View
            style={[
              styles.notificationIconBadge,
              { backgroundColor: getNotificationColor(item.type) },
            ]}
          >
            <Feather
              name={getNotificationIcon(item.type)}
              size={10}
              color={Colors.white}
            />
          </View>
        </View>

        {/* Notification Text */}
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.user.name}</Text>
            <Text style={styles.message}> {item.message}</Text>
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        {/* Right side content */}
        <View style={styles.rightContent}>
          {item.listImage && (
            <Image
              source={{ uri: item.listImage }}
              style={styles.listThumbnail}
            />
          )}
          {item.actionButton && (
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => handleFollowBack(item.user.id)}
            >
              <Text style={styles.actionButtonText}>{item.actionButton}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* New notification indicator */}
      {item.isNew && <View style={styles.newIndicator} />}
    </TouchableOpacity>
  );

  if (loading && notifications.length === 0) {
    return (
      <ScreenLayout
        title="Notifications"
        rightIconName="settings"
        onRightPress={() => {}}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showBottomMenu
        onTabPress={onTabPress}
        activeTab={activeTab}
      >
        <View style={styles.loadingContainer}>
          <Feather name="bell" size={48} color={Colors.textSecondary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </ScreenLayout>
    );
  }

  const createTestNotification = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {return;}

      // Create a test notification
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'like',
        data: {
          actor_id: userId, // Using same user for demo
          list_title: 'My Awesome List',
          list_id: 'test-list-id',
        },
        is_read: false,
      });

      if (error) {
        console.error('Create test notification error:', error);
      } else {
        fetchNotifications(); // Refresh notifications
      }
    } catch (error) {
      console.error('Create test notification exception:', error);
    }
  };

  return (
    <ScreenLayout
      title="Notifications"
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      showBottomMenu
      onTabPress={onTabPress}
      activeTab={activeTab}
      headerButtons={
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => setShowTestPanel(!showTestPanel)}
          >
            <Feather name="zap" size={20} color={Colors.orange} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleMarkAllAsRead}
          >
            <Feather name="check-circle" size={20} color={Colors.gray} />
          </TouchableOpacity>
        </View>
      }
    >
      {showTestPanel && (
        <View style={styles.testPanel}>
          <Text style={styles.testPanelTitle}>Test Bildirimleri</Text>
          {notificationStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                Toplam: {notificationStats.total} | Okunmamış:{' '}
                {notificationStats.unread}
              </Text>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.testButtonsContainer}>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() => handleTestNotification(NOTIFICATION_TYPES.LIKE)}
              >
                <Text style={styles.testButtonText}>Beğeni</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.COMMENT)
                }
              >
                <Text style={styles.testButtonText}>Yorum</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.FOLLOW)
                }
              >
                <Text style={styles.testButtonText}>Takip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.MESSAGE)
                }
              >
                <Text style={styles.testButtonText}>Mesaj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.LIST_SHARE)
                }
              >
                <Text style={styles.testButtonText}>Liste</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.GROUP_ACTIVITY)
                }
              >
                <Text style={styles.testButtonText}>Grup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.SUGGESTION)
                }
              >
                <Text style={styles.testButtonText}>Öneri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={() =>
                  handleTestNotification(NOTIFICATION_TYPES.REMINDER)
                }
              >
                <Text style={styles.testButtonText}>Hatırlatma</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.notificationsList}
        contentContainerStyle={[
          styles.notificationsContent,
          filteredNotifications.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.orange}
            colors={[Colors.orange]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When someone likes your lists or follows you, you'll see it here
            </Text>
          </View>
        }
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingVertical: Spacing.small,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  loadingText: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.extraLarge,
  },
  emptyTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationItem: {
    position: 'relative',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '20',
  },
  unreadNotification: {
    backgroundColor: Colors.orange + '08',
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.medium,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.small,
  },
  notificationText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  username: {
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  message: {
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  timeText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginBottom: Spacing.small,
  },
  actionButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  newIndicator: {
    position: 'absolute',
    left: Spacing.small,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
    transform: [{ translateY: -4 }],
  },
  testPanel: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testPanelTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  statsContainer: {
    marginBottom: Spacing.small,
  },
  statsText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  testNotificationButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 8,
    marginRight: Spacing.small,
  },
  testButtonText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.white,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  testButton: {
    padding: Spacing.small,
  },
  settingsButton: {
    padding: Spacing.small,
  },
});

export default NotificationScreen;
