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
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  MagnifyingGlass,
  DotsThree,
  Check,
  Checks,
  Camera,
  Plus,
  PaperPlaneTilt,
} from 'phosphor-react-native';
import Header from '../components/Header';
import BottomMenu from '../components/BottomMenu';

const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('messages');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from Supabase conversations table
      const mockConversations = [
        {
          id: 'conv1',
          participant: {
            id: 'user1',
            username: 'john_doe',
            full_name: 'John Doe',
            avatar_url: 'https://via.placeholder.com/100x100',
            is_online: true,
          },
          last_message: {
            id: 'msg1',
            content: 'Hey! Just saw your movie list, great picks 🎬',
            sender_id: 'user1',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            is_read: false,
          },
          unread_count: 2,
          updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv2',
          participant: {
            id: 'user2',
            username: 'sarah_wilson',
            full_name: 'Sarah Wilson',
            avatar_url: 'https://via.placeholder.com/100x100',
            is_online: false,
            last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          last_message: {
            id: 'msg2',
            content: 'Thanks for adding me to the book list!',
            sender_id: 'current_user',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            is_read: true,
          },
          unread_count: 0,
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv3',
          participant: {
            id: 'user3',
            username: 'mike_reviews',
            full_name: 'Mike Reviews',
            avatar_url: 'https://via.placeholder.com/100x100',
            is_online: true,
          },
          last_message: {
            id: 'msg3',
            content: 'Can you recommend some sci-fi books?',
            sender_id: 'user3',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            is_read: true,
          },
          unread_count: 0,
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv4',
          participant: {
            id: 'user4',
            username: 'emma_reads',
            full_name: 'Emma Reads',
            avatar_url: 'https://via.placeholder.com/100x100',
            is_online: false,
            last_seen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          last_message: {
            id: 'msg4',
            content: 'Perfect! Let me know what you think 📚',
            sender_id: 'current_user',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            is_read: true,
          },
          unread_count: 0,
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('MessageDetail', {
      conversationId: conversation.id,
      participant: conversation.participant,
    });
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      navigation.navigate('Home');
    } else if (tabId === 'notifications') {
      navigation.navigate('Notifications');
    } else if (tabId === 'create') {
      console.log('Create pressed');
    }
  };

  const formatLastMessageTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'now';
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

  const getMessageStatusIcon = (message, isCurrentUser) => {
    if (!isCurrentUser) return null;
    
    if (message.is_read) {
      return <Checks size={14} color="#3b82f6" weight="bold" />;
    } else {
      return <Check size={14} color="#666" />;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }) => {
    const isCurrentUserSender = item.last_message.sender_id === 'current_user';
    const hasUnread = item.unread_count > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.participant.avatar_url }} 
            style={styles.avatar} 
          />
          {item.participant.is_online && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, hasUnread && styles.unreadText]}>
              {item.participant.full_name}
            </Text>
            <View style={styles.messageTime}>
              {getMessageStatusIcon(item.last_message, isCurrentUserSender)}
              <Text style={[styles.timeText, hasUnread && styles.unreadTimeText]}>
                {formatLastMessageTime(item.last_message.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.lastMessageContainer}>
            <Text 
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]} 
              numberOfLines={1}
            >
              {isCurrentUserSender ? 'You: ' : ''}{item.last_message.content}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Camera size={20} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={false}
        title="Messages"
        onMessagesPress={() => {
          // Already on messages screen, could show compose or settings
          console.log('Messages icon pressed on messages screen');
        }}
      />

      <View style={styles.searchHeader}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MagnifyingGlass size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActionsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActions}
        >
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Plus size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>New</Text>
          </TouchableOpacity>
          
          {/* Online friends quick access */}
          {conversations
            .filter(conv => conv.participant.is_online)
            .slice(0, 5)
            .map((conv) => (
              <TouchableOpacity 
                key={conv.id} 
                style={styles.quickAction}
                onPress={() => handleConversationPress(conv)}
              >
                <View style={styles.quickActionAvatarContainer}>
                  <Image 
                    source={{ uri: conv.participant.avatar_url }} 
                    style={styles.quickActionAvatar} 
                  />
                  <View style={styles.quickActionOnlineIndicator} />
                </View>
                <Text style={styles.quickActionText} numberOfLines={1}>
                  {conv.participant.username}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Conversations list */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        style={styles.conversationsList}
        contentContainerStyle={styles.conversationsContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadConversations}
            tintColor="#f97316"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <PaperPlaneTilt size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with your friends about lists
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
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  searchContainer: {
    // paddingBottom: 16, // Removed to fix spacing
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  quickActionsContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  quickActions: {
    paddingHorizontal: 16,
  },
  quickAction: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  quickActionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  quickActionOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
  },
  messageTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  unreadTimeText: {
    color: '#f97316',
    fontWeight: '600',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  moreButton: {
    padding: 8,
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

export default MessagesScreen;