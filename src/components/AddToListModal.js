import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import { supabase } from '../utils/supabase';
import { HapticPatterns } from '../utils/haptics';

const AddToListModal = ({ visible, onClose, item, itemType }) => {
  const [userLists, setUserLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (visible) {
      getCurrentUser();
      fetchUserLists();
    }
  }, [visible]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchUserLists = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to add items to lists');
        onClose();
        return;
      }

      const { data: lists, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user lists:', error);
        return;
      }

      setUserLists(lists || []);
    } catch (error) {
      console.error('Error fetching user lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToList = async listId => {
    try {
      HapticPatterns.buttonPress();

      if (!item || !currentUser) {return;}

      // Check if item already exists in the list
      const { data: existingItem } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('title', item.title || item.name)
        .single();

      if (existingItem) {
        Alert.alert('Info', 'This item is already in the selected list');
        return;
      }

      // Add item to list
      const { error } = await supabase.from('list_items').insert({
        list_id: listId,
        title: item.title || item.name,
        description: item.overview || item.description || '',
        image_url: item.poster_path || item.image || '',
        category: itemType,
        external_id: item.id?.toString() || '',
        metadata: {
          ...item,
          type: itemType,
        },
      });

      if (error) {
        console.error('Error adding item to list:', error);
        Alert.alert('Error', 'Failed to add item to list');
        return;
      }

      Alert.alert('Success', 'Item added to list successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding item to list:', error);
      Alert.alert('Error', 'Failed to add item to list');
    }
  };

  const createNewList = async () => {
    try {
      HapticPatterns.buttonPress();

      if (!newListTitle.trim()) {
        Alert.alert('Error', 'Please enter a list title');
        return;
      }

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to create lists');
        return;
      }

      // Create new list
      const { data: newList, error: listError } = await supabase
        .from('lists')
        .insert({
          title: newListTitle.trim(),
          description: newListDescription.trim(),
          user_id: currentUser.id,
          category: itemType,
          is_public: true,
        })
        .select()
        .single();

      if (listError) {
        console.error('Error creating list:', listError);
        Alert.alert('Error', 'Failed to create list');
        return;
      }

      // Add item to the new list
      await addItemToList(newList.id);

      // Reset form
      setNewListTitle('');
      setNewListDescription('');
      setShowCreateNew(false);
    } catch (error) {
      console.error('Error creating new list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
  };

  const renderListItem = ({ item: list }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => addItemToList(list.id)}
      activeOpacity={0.7}
    >
      <View style={styles.listInfo}>
        <Text style={styles.listTitle}>{list.title}</Text>
        <Text style={styles.listDescription} numberOfLines={2}>
          {list.description || 'No description'}
        </Text>
      </View>
      <Feather name="plus" size={20} color={Colors.primary} />
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
          <Text style={styles.title}>Add to List</Text>
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

        {!showCreateNew ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Lists</Text>
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => setShowCreateNew(true)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={16} color={Colors.primary} />
                <Text style={styles.createNewText}>Create New List</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={userLists}
              renderItem={renderListItem}
              keyExtractor={item => item.id}
              style={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="list" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No lists yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create your first list to get started
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <View style={styles.createForm}>
            <Text style={styles.sectionTitle}>Create New List</Text>

            <TextInput
              style={styles.input}
              placeholder="List title"
              value={newListTitle}
              onChangeText={setNewListTitle}
              placeholderTextColor={Colors.textSecondary}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newListDescription}
              onChangeText={setNewListDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textSecondary}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowCreateNew(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={createNewList}
                activeOpacity={0.7}
              >
                <Text style={styles.createButtonText}>Create & Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  sectionTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
  },
  createNewText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: Spacing.medium,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listInfo: {
    flex: 1,
    marginRight: Spacing.small,
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
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
  },
  emptyText: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptySubtext: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  createForm: {
    flex: 1,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: Spacing.medium,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginTop: Spacing.medium,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.background,
  },
});

export default AddToListModal;
