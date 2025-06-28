import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Heart,
  ChatCircle,
  UserPlus,
  Star,
  Share,
  Bell,
  CheckCircle,
  Clock,
  Users,
} from 'phosphor-react-native';
import Header from '../components/Header';
import BottomMenu from '../components/BottomMenu';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('notifications');

  const filters = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'likes', label: 'Likes', count: 0 },
    { id: 'comments', label: 'Comments', count: 0 },
    { id: 'follows', label: 'Follows', count: 0 },
    { id: 'mentions', label: 'Mentions', count: 0 },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from Supabase notifications table
      const mockNotifications = [
        {
          id: '1',
          type: 'like',
          title: 'john_doe liked your list',
          message: '"Best Movies of 2024"',
          sender: {
            id: 'user1',
            username: 'john_doe',
            full_name: 'John Doe',
            avatar_url: 'https://via.placeholder.com/100x100',
          },
          target_list: {
            id: 'list1',
            title: 'Best Movies of 2024',
            cover_image: 'https://via.placeholder.com/300x200',
          },
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          is_read: false,
        },
        {
          id: '2',
          type: 'comment',
          title: 'sarah_wilson commented on your list',
          message: 'Great selection! I love The Godfather too.',
          sender: {
            id: 'user2',
            username: 'sarah_wilson',
            full_name: 'Sarah Wilson',
            avatar_url: 'https://via.placeholder.com/100x100',
          },
          target_list: {
            id: 'list2',
            title: 'Classic Movies Collection',
            cover_image: 'https://via.placeholder.com/300x200',
          },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          is_read: false,
        },
        {
          id: '3',
          type: 'follow',
          title: 'mike_reviews started following you',
          message: '',
          sender: {
            id: 'user3',
            username: 'mike_reviews',
            full_name: 'Mike Reviews',
            avatar_url: 'https://via.placeholder.com/100x100',
          },
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          is_read: true,
        },
        {
          id: '4',
          type: 'list_collaboration',
          title: 'emma_reads invited you to collaborate',
          message: '"Must Read Books 2024"',
          sender: {
            id: 'user4',
            username: 'emma_reads',
            full_name: 'Emma Reads',
            avatar_url: 'https://via.placeholder.com/100x100',
          },
          target_list: {
            id: 'list3',
            title: 'Must Read Books 2024',
            cover_image: 'https://via.placeholder.com/300x200',
          },
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          is_read: true,
        },
        {
          id: '5',
          type: 'mention',
          title: 'alex_gaming mentioned you',
          message: 'in "Top Gaming Setup Items"',
          sender: {
            id: 'user5',
            username: 'alex_gaming',
            full_name: 'Alex Gaming',
            avatar_url: 'https://via.placeholder.com/100x100',
          },
          target_list: {
            id: 'list4',
            title: 'Top Gaming Setup Items',
            cover_image: 'https://via.placeholder.com/300x200',
          },
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          is_read: true,
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // TODO: Update notification in Supabase
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Update all notifications in Supabase
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.target_list) {
      navigation.navigate('ListDetail', {
        listId: notification.target_list.id,
      });
    } else if (notification.type === 'follow') {
      // TODO: Navigate to user profile
      console.log('Navigate to user profile:', notification.sender.username);
    }
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      navigation.navigate('Home');
    } else if (tabId === 'profile') {
      navigation.navigate('Profile');
    } else if (tabId === 'create') {
      // Handle create
      console.log('Create pressed');
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { size: 20, weight: 'fill' };
    
    switch (type) {
      case 'like':
        return <Heart {...iconProps} color="#ef4444" />;
      case 'comment':
        return <ChatCircle {...iconProps} color="#3b82f6" />;
      case 'follow':
        return <UserPlus {...iconProps} color="#10b981" />;
      case 'list_collaboration':
        return <Users {...iconProps} color="#f59e0b" />;
      case 'mention':
        return <Bell {...iconProps} color="#8b5cf6" />;
      default:
        return <Bell {...iconProps} color="#666" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w`;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'likes') return notif.type === 'like';
    if (selectedFilter === 'comments') return notif.type === 'comment';
    if (selectedFilter === 'follows') return notif.type === 'follow';
    if (selectedFilter === 'mentions') return notif.type === 'mention';
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {/* Avatar with notification type icon */}
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.sender.avatar_url }} style={styles.avatar} />
          <View style={styles.notificationTypeIcon}>
            {getNotificationIcon(item.type)}
          </View>
        </View>

        {/* Notification text */}
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>
            <Text style={styles.username}>{item.sender.username}</Text>
            <Text style={styles.action}> {item.title.replace(item.sender.username, '').trim()}</Text>
          </Text>
          
          {item.message && (
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
          )}

          <View style={styles.notificationMeta}>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        </View>

        {/* Target content preview */}
        {item.target_list && (
          <View style={styles.targetPreview}>
            <Image 
              source={{ uri: item.target_list.cover_image }} 
              style={styles.targetImage} 
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={false}
        title="Notifications"
        onMessagesPress={() => navigation.navigate('Messages')}
      />

      {/* Filter tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.id && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
            <CheckCircle size={16} color="#f97316" />
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications list */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadNotifications}
            tintColor="#f97316"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Bell size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When someone likes your lists or follows you, you'll see it here
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      <BottomMenu 
        activeTab={activeTab} 
        onTabPress={handleTabPress}
        onCategorySelect={(category) => {
          navigation.navigate('CreateList', { category });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersContent: {
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeFilterTab: {
    backgroundColor: '#f97316',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  markAllReadText: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
    marginLeft: 4,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  unreadNotification: {
    backgroundColor: '#fefbf3',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  action: {
    fontWeight: '400',
    color: '#1a1a1a',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f97316',
  },
  targetPreview: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;