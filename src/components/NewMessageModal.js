import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NewMessageModal = ({ visible, onClose, onSelectUser, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (visible) {
      loadFollowingUsers();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setSearchQuery('');
      setUsers([]);
      setFilteredUsers([]);
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const resolveAvatar = profile => {
    // Avatar zaten tam URL ise direkt kullan
    if (profile.avatar && /^https?:\/\//i.test(profile.avatar)) {
      return profile.avatar;
    }
    // Database'deki avatar_url'i kontrol et
    if (profile.avatar_url && /^https?:\/\//i.test(profile.avatar_url)) {
      return profile.avatar_url;
    }
    // Storage key olarak kullan
    if (profile.avatar_url) {
      return getPublicUrl(profile.avatar_url, 'avatars');
    }
    if (profile.avatar) {
      return getPublicUrl(profile.avatar, 'avatars');
    }

    // Fallback avatar
    return (
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
      (profile.username || profile.id)
    );
  };

  const loadFollowingUsers = async () => {
    try {
      setLoading(true);

      // Get users that current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(
          `
          following_id,
          profiles!follows_following_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            avatar
          )
        `,
        )
        .eq('follower_id', currentUserId);

      if (followingError) {
        console.error('Error loading following users:', followingError);
        return;
      }

      const followingUsers =
        followingData?.map(follow => {
          const profile = follow.profiles;

          return {
            id: profile.id,
            username: profile.username,
            name: profile.full_name || profile.username,
            avatar: resolveAvatar(profile),
          };
        }) || [];

      setUsers(followingUsers);
      setFilteredUsers(followingUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async query => {
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    try {
      setLoading(true);

      // Search in all users (not just following)
      const { data: searchData, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, avatar')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(20);

      if (searchError) {
        console.error('Error searching users:', searchError);
        return;
      }

      const searchResults =
        searchData?.map(profile => {
          return {
            id: profile.id,
            username: profile.username,
            name: profile.full_name || profile.username,
            avatar: resolveAvatar(profile),
          };
        }) || [];

      setFilteredUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        onSelectUser(item);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.avatar }}
        style={styles.userAvatar}
        onError={error => {
          console.log('Avatar load error for user:', item.name, error);
        }}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <Feather name="message-circle" size={20} color={Colors.iconSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Feather name="x" size={24} color={Colors.iconPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Message</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Feather name="search" size={20} color={Colors.iconSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="x-circle"
                    size={20}
                    color={Colors.iconSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Users List */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.instagramBlue} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="users" size={48} color={Colors.iconSecondary} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No users found' : 'No following users'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try searching with a different username'
                    : 'Start following users to message them'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.8,
    paddingTop: Spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 25,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    gap: Spacing.small,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: Spacing.tiny,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.large,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.medium,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.extraLarge,
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.extraLarge,
  },
  emptyTitle: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptySubtitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NewMessageModal;
