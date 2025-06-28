import { supabase } from '../lib/supabase';

export const supabaseService = {
  // Auth functions
  auth: {
    signUp: async (email, password, userData) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      return { data, error };
    },

    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },

    getCurrentUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    },

    onAuthStateChange: (callback) => {
      return supabase.auth.onAuthStateChange(callback);
    }
  },

  // User Profile functions
  profiles: {
    getProfile: async (userId) => {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },

    updateProfile: async (userId, updates) => {
      const { data, error } = await supabase
        .from('users_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      return { data, error };
    },

    createProfile: async (profileData) => {
      const { data, error } = await supabase
        .from('users_profiles')
        .insert(profileData)
        .select()
        .single();
      return { data, error };
    },

    getProfileByUsername: async (username) => {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('username', username)
        .single();
      return { data, error };
    },

    searchProfiles: async (query) => {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);
      return { data, error };
    }
  },

  // Categories functions
  categories: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      return { data, error };
    },

    getByName: async (name) => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .single();
      return { data, error };
    }
  },

  // Lists functions
  lists: {
    // Get all public lists and user's friends' lists
    getFeedLists: async (userId, offset = 0, limit = 20) => {
      // First get the user's following list
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      const followingIds = followingData ? followingData.map(f => f.following_id) : [];
      
      // Then get lists: either public or from people user follows
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          creator:users_profiles!creator_id(id, username, full_name, avatar_url),
          category:categories!category_id(name, display_name),
          list_items(id, title, image_url, position),
          _count:list_likes(count)
        `)
        .or(`privacy.eq.public${followingIds.length > 0 ? `,and(privacy.eq.friends,creator_id.in.(${followingIds.join(',')}))` : ''}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      return { data, error };
    },

    // Get user's own lists
    getUserLists: async (userId, offset = 0, limit = 20) => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          creator:users_profiles!creator_id(id, username, full_name, avatar_url),
          category:categories!category_id(name, display_name),
          list_items(id, title, image_url, position),
          _count:list_likes(count)
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      return { data, error };
    },

    // Get user's liked lists
    getLikedLists: async (userId, offset = 0, limit = 20) => {
      const { data, error } = await supabase
        .from('list_likes')
        .select(`
          list:lists(
            *,
            creator:users_profiles!creator_id(id, username, full_name, avatar_url),
            category:categories!category_id(name, display_name),
            list_items(id, title, image_url, position),
            _count:list_likes(count)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      return { data: data?.map(item => item.list), error };
    },

    // Create new list
    createList: async (listData) => {
      const { data, error } = await supabase
        .from('lists')
        .insert(listData)
        .select(`
          *,
          creator:users_profiles!creator_id(id, username, full_name, avatar_url),
          category:categories!category_id(name, display_name)
        `)
        .single();
      
      return { data, error };
    },

    // Update list
    updateList: async (listId, updates) => {
      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)
        .select(`
          *,
          creator:users_profiles!creator_id(id, username, full_name, avatar_url),
          category:categories!category_id(name, display_name)
        `)
        .single();
      
      return { data, error };
    },

    // Delete list
    deleteList: async (listId) => {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);
      
      return { error };
    },

    // Get single list with items
    getListWithItems: async (listId) => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          creator:users_profiles!creator_id(id, username, full_name, avatar_url),
          category:categories!category_id(name, display_name),
          list_items(*)
        `)
        .eq('id', listId)
        .single();
      
      return { data, error };
    }
  },

  // List Items functions
  listItems: {
    // Add items to list
    addItems: async (listId, items) => {
      const itemsWithListId = items.map((item, index) => ({
        ...item,
        list_id: listId,
        position: index + 1
      }));

      const { data, error } = await supabase
        .from('list_items')
        .insert(itemsWithListId)
        .select();
      
      return { data, error };
    },

    // Update item position
    updateItemPosition: async (itemId, position) => {
      const { data, error } = await supabase
        .from('list_items')
        .update({ position })
        .eq('id', itemId)
        .select()
        .single();
      
      return { data, error };
    },

    // Delete item
    deleteItem: async (itemId) => {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId);
      
      return { error };
    }
  },

  // List Likes functions
  likes: {
    // Like a list
    likeList: async (userId, listId) => {
      const { data, error } = await supabase
        .from('list_likes')
        .insert({ user_id: userId, list_id: listId })
        .select()
        .single();
      
      return { data, error };
    },

    // Unlike a list
    unlikeList: async (userId, listId) => {
      const { error } = await supabase
        .from('list_likes')
        .delete()
        .eq('user_id', userId)
        .eq('list_id', listId);
      
      return { error };
    },

    // Check if user liked a list
    checkLike: async (userId, listId) => {
      const { data, error } = await supabase
        .from('list_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('list_id', listId)
        .single();
      
      return { data: !!data, error };
    }
  },

  // Comments functions
  comments: {
    // Get list comments
    getListComments: async (listId, offset = 0, limit = 50) => {
      const { data, error } = await supabase
        .from('list_comments')
        .select(`
          *,
          user:users_profiles!user_id(id, username, full_name, avatar_url)
        `)
        .eq('list_id', listId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      
      return { data, error };
    },

    // Add comment
    addComment: async (userId, listId, content) => {
      const { data, error } = await supabase
        .from('list_comments')
        .insert({ user_id: userId, list_id: listId, content })
        .select(`
          *,
          user:users_profiles!user_id(id, username, full_name, avatar_url)
        `)
        .single();
      
      return { data, error };
    },

    // Delete comment
    deleteComment: async (commentId) => {
      const { error } = await supabase
        .from('list_comments')
        .delete()
        .eq('id', commentId);
      
      return { error };
    }
  },

  // Follow functions
  follows: {
    // Follow user
    followUser: async (followerId, followingId) => {
      const { data, error } = await supabase
        .from('user_follows')
        .insert({ follower_id: followerId, following_id: followingId })
        .select()
        .single();
      
      return { data, error };
    },

    // Unfollow user
    unfollowUser: async (followerId, followingId) => {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      
      return { error };
    },

    // Check if following
    checkFollowing: async (followerId, followingId) => {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();
      
      return { data: !!data, error };
    },

    // Get followers
    getFollowers: async (userId) => {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower:users_profiles!follower_id(id, username, full_name, avatar_url)
        `)
        .eq('following_id', userId);
      
      return { data: data?.map(item => item.follower), error };
    },

    // Get following
    getFollowing: async (userId) => {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following:users_profiles!following_id(id, username, full_name, avatar_url)
        `)
        .eq('follower_id', userId);
      
      return { data: data?.map(item => item.following), error };
    },

    // Get follow counts
    getFollowCounts: async (userId) => {
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact' })
          .eq('following_id', userId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact' })
          .eq('follower_id', userId)
      ]);

      return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0
      };
    }
  },

  // Notifications functions
  notifications: {
    // Get user notifications
    getUserNotifications: async (userId, offset = 0, limit = 50) => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:users_profiles!sender_id(id, username, full_name, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      return { data, error };
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
      
      return { data, error };
    },

    // Mark all notifications as read
    markAllAsRead: async (userId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      return { error };
    },

    // Get unread count
    getUnreadCount: async (userId) => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      return { count, error };
    }
  }
};