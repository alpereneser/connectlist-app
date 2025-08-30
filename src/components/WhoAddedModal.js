import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { supabase } from '../utils/supabase';
import { HapticPatterns } from '../utils/haptics';

const WhoAddedModal = ({
  visible,
  onClose,
  item,
  itemType,
  onNavigateToList,
}) => {
  const [listsWithUsers, setListsWithUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && item) {
      fetchWhoAdded();
    }
  }, [visible, item]);

  const fetchWhoAdded = async () => {
    try {
      setLoading(true);

      if (!item) {return;}

      // Search for lists containing this item
      const { data: listItems, error: itemsError } = await supabase
        .from('list_items')
        .select(
          `
          *,
          lists!inner (
            id,
            title,
            description,
            user_id,
            is_public,
            created_at,
            profiles!lists_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `,
        )
        .eq('title', item.title || item.name)
        .eq('category', itemType)
        .eq('lists.is_public', true);

      if (itemsError) {
        console.error('Error fetching who added:', itemsError);
        return;
      }

      // Group by list and include user info
      const groupedData =
        listItems?.map(listItem => ({
          listId: listItem.lists.id,
          listTitle: listItem.lists.title,
          listDescription: listItem.lists.description,
          createdAt: listItem.lists.created_at,
          user: {
            id: listItem.lists.profiles?.id,
            username: listItem.lists.profiles?.username,
            fullName: listItem.lists.profiles?.full_name,
            avatarUrl: listItem.lists.profiles?.avatar_url,
          },
        })) || [];

      setListsWithUsers(groupedData);
    } catch (error) {
      console.error('Error fetching who added:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleListPress = listId => {
    HapticPatterns.buttonPress();
    onClose();
    if (onNavigateToList) {
      onNavigateToList(listId);
    }
  };

  const renderListItem = ({ item: listData }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleListPress(listData.listId)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        {listData.user?.avatarUrl ? (
          <Image
            source={{ uri: listData.user.avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Feather name="user" size={20} color={Colors.textSecondary} />
          </View>
        )}

        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {listData.user?.fullName ||
              listData.user?.username ||
              'Unknown User'}
          </Text>
          {listData.user?.username && listData.user?.fullName && (
            <Text style={styles.userHandle}>@{listData.user.username}</Text>
          )}
        </View>
      </View>

      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {listData.listTitle}
        </Text>
        <Text style={styles.listDescription} numberOfLines={2}>
          {listData.listDescription || 'No description'}
        </Text>
        <Text style={styles.addedDate}>
          Added {new Date(listData.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Who Added This</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {item && (
          <View style={styles.itemPreview}>
            <Text style={styles.itemTitle}>{item.title || item.name}</Text>
            <Text style={styles.itemType}>{itemType}</Text>
          </View>
        )}

        <FlatList
          data={listsWithUsers}
          renderItem={renderListItem}
          keyExtractor={item => `${item.listId}-${item.user?.id}`}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No public lists found</Text>
              <Text style={styles.emptySubtext}>
                This item hasn't been added to any public lists yet
              </Text>
            </View>
          }
          ListHeaderComponent={
            listsWithUsers.length > 0 && (
              <Text style={styles.resultsCount}>
                Found in {listsWithUsers.length} public list
                {listsWithUsers.length !== 1 ? 's' : ''}
              </Text>
            )
          }
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.small,
  },
  itemPreview: {
    padding: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: Spacing.medium,
    marginVertical: Spacing.small,
    borderRadius: 12,
  },
  itemTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemType: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  resultsCount: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.large,
  },
  listItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.small,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  userHandle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listInfo: {
    flex: 1,
    marginLeft: Spacing.small,
  },
  listTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  listDescription: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  addedDate: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
    paddingHorizontal: Spacing.medium,
  },
  emptyText: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default WhoAddedModal;
