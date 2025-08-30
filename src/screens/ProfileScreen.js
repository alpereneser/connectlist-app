import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Haptics,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';
import { HapticPatterns } from '../utils/haptics';

const ProfileScreen = ({
  onTabPress,
  onEditProfile,
  onBackPress,
  onMessagesPress,
  onLogout,
  activeTab = 'profile',
  user,
  userId,
  isOwnProfile,
  onNavigate,
}) => {
  const [activeProfileTab, setActiveProfileTab] = useState('All Lists');
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    avatar: null,
    bio: '',
    location: '',
    title: '',
    company: '',
    stats: {
      lists: 0,
      likedLists: 0,
      followers: 0,
      following: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [likedLists, setLikedLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [likedListsLoading, setLikedListsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showLikedLists, setShowLikedLists] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Determine if this is own profile - if userId is provided and different from current user, it's not own profile
  const isViewingOwnProfile = userId
    ? userId === user?.id
    : isOwnProfile !== false;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const targetUserId =
          userId || user?.id || (await supabase.auth.getUser()).data.user?.id;
        if (!targetUserId) {
          setLoading(false);
          return;
        }

        const { data: row, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (error) {
          console.log('Fetch profile error:', error);
          // Eğer profil bulunamazsa, temel kullanıcı bilgilerini al
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user) {
            const fallbackAvatar =
              authUser.user.user_metadata?.avatar_url ||
              authUser.user.user_metadata?.picture ||
              null;

            setProfileData(prev => ({
              ...prev,
              fullName:
                authUser.user.user_metadata?.full_name ||
                authUser.user.user_metadata?.name ||
                authUser.user.email?.split('@')[0] ||
                'User',
              username: authUser.user.email?.split('@')[0] || '',
              avatar: fallbackAvatar,
              bio: '',
              location: '',
              title: '',
              company: '',
            }));
          }
          setLoading(false);
          return;
        }

        // Avatar URL'sini resolve et
        let resolvedAvatar = null;

        // Önce database'deki avatar_url'i kontrol et
        if (row.avatar_url && /^https?:\/\//i.test(row.avatar_url)) {
          resolvedAvatar = row.avatar_url;
        }
        // Sonra storage key'lerini kontrol et
        else if (
          row.avatar ||
          row.avatar_path ||
          row.avatarKey ||
          row.avatar_key
        ) {
          const avatarKey =
            row.avatar || row.avatar_path || row.avatarKey || row.avatar_key;
          resolvedAvatar = getPublicUrl(avatarKey, 'avatars');
        }
        // Son olarak auth metadata'yı kontrol et
        else {
          const { data: authUser } = await supabase.auth.getUser();
          resolvedAvatar =
            authUser?.user?.user_metadata?.avatar_url ||
            authUser?.user?.user_metadata?.picture ||
            authUser?.user?.user_metadata?.avatar ||
            null;
        }

        // Eğer hala avatar yoksa, Gravatar veya başka bir fallback deneyelim
        if (!resolvedAvatar) {
          const { data: authUser } = await supabase.auth.getUser();
          const email = authUser?.user?.email;
          if (email) {
            // Basit bir Gravatar URL'i oluştur (opsiyonel)
            // const gravatarHash = btoa(email.toLowerCase().trim());
            // resolvedAvatar = `https://www.gravatar.com/avatar/${gravatarHash}?d=mp&s=200`;
          }
        }

        setProfileData(prev => ({
          ...prev,
          fullName: row.full_name || row.name || 'User',
          username: row.username ? `@${row.username}` : '',
          bio: row.bio || '',
          location: row.location || '',
          title: row.title || '',
          company: row.company || '',
          avatar: resolvedAvatar,
          stats: {
            lists: row.lists_count || 0,
            likedLists: row.liked_lists_count || 0,
            followers: row.followers_count || 0,
            following: row.following_count || 0,
          },
        }));

        // Fetch user lists
        await fetchUserLists(targetUserId);

        // Fetch liked lists if viewing own profile
        if (isViewingOwnProfile && user?.id) {
          await fetchLikedLists(user.id);
        }

        // Check follow status if viewing another user's profile
        if (!isViewingOwnProfile && user?.id) {
          await checkFollowStatus(targetUserId, user.id);
        }
      } catch (err) {
        console.log('Fetch profile exception:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id, userId]);

  const fetchUserLists = async targetUserId => {
    try {
      setListsLoading(true);
      const { data: lists, error } = await supabase
        .from('lists')
        .select(
          `
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          ),
          list_items (
            id,
            title,
            image_url,
            type,
            year,
            description
          ),
          list_likes (
            user_id
          ),
          list_comments (
            id
          )
        `,
        )
        .eq('user_id', targetUserId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching user lists:', error);
        return;
      }

      // Transform lists to feed format
      const transformedLists =
        lists?.map(list => {
          const timeAgo = getTimeAgo(list.created_at);
          const likesCount = list.list_likes?.length || 0;
          const commentsCount = list.list_comments?.length || 0;
          const itemsCount = list.list_items?.length || 0;
          const previewItems = list.list_items?.slice(0, 3) || [];

          return {
            id: list.id,
            type: 'user_list',
            title: list.title,
            description: list.description || `${itemsCount} items in this list`,
            category: capitalizeCategory(list.category) || 'General',
            likes: likesCount,
            comments: commentsCount,
            timestamp: timeAgo,
            previewItems: previewItems,
            itemsCount: itemsCount,
            isPublic: list.is_public,
            createdAt: list.created_at,
          };
        }) || [];

      setUserLists(transformedLists);
    } catch (error) {
      console.error('Error fetching user lists:', error);
    } finally {
      setListsLoading(false);
    }
  };

  const fetchLikedLists = async userId => {
    try {
      setLikedListsLoading(true);
      const { data: likedListsData, error } = await supabase
        .from('list_likes')
        .select(
          `
          lists (
            *,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url,
              avatar
            ),
            list_items (
              id,
              title,
              image_url,
              type,
              year,
              description
            ),
            list_likes (
              user_id
            ),
            list_comments (
              id
            )
          )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching liked lists:', error);
        return;
      }

      // Transform liked lists to feed format
      const transformedLikedLists =
        likedListsData
          ?.map(item => {
            const list = item.lists;
            if (!list) {return null;}

            const timeAgo = getTimeAgo(list.created_at);
            const likesCount = list.list_likes?.length || 0;
            const commentsCount = list.list_comments?.length || 0;
            const itemsCount = list.list_items?.length || 0;
            const previewItems = list.list_items?.slice(0, 3) || [];

            return {
              id: list.id,
              type: 'liked_list',
              title: list.title,
              description:
                list.description || `${itemsCount} items in this list`,
              category: capitalizeCategory(list.category) || 'General',
              likes: likesCount,
              comments: commentsCount,
              timestamp: timeAgo,
              previewItems: previewItems,
              itemsCount: itemsCount,
              isPublic: list.is_public,
              createdAt: list.created_at,
              author: list.profiles,
            };
          })
          .filter(Boolean) || [];

      setLikedLists(transformedLikedLists);
    } catch (error) {
      console.error('Error fetching liked lists:', error);
    } finally {
      setLikedListsLoading(false);
    }
  };

  const checkFollowStatus = async (targetUserId, currentUserId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user?.id || !userId) {return;}

    try {
      setFollowLoading(true);
      HapticPatterns.buttonPress();

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }

        setIsFollowing(false);
        setProfileData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: Math.max(0, prev.stats.followers - 1),
          },
        }));
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: userId }]);

        if (error) {
          console.error('Error following:', error);
          return;
        }

        setIsFollowing(true);
        setProfileData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: prev.stats.followers + 1,
          },
        }));
      }
    } catch (error) {
      console.error('Error handling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleItemPress = item => {
    if (!item || !item.type) {return;}

    const itemType = item.type.toLowerCase();
    const itemId = item.id;

    switch (itemType) {
      case 'movie':
        onNavigate('MovieDetails', { movieId: itemId });
        break;
      case 'series':
      case 'tv':
        onNavigate('SeriesDetails', { seriesId: itemId });
        break;
      case 'book':
        onNavigate('BookDetails', { bookId: itemId });
        break;
      case 'game':
        onNavigate('GameDetails', { gameId: itemId });
        break;
      case 'person':
        onNavigate('PersonDetails', { personId: itemId });
        break;
      case 'place':
        onNavigate('PlaceDetails', { placeId: itemId });
        break;
      case 'music':
        onNavigate('MusicDetails', { musicId: itemId });
        break;
      case 'video':
        onNavigate('VideoDetails', { videoId: itemId });
        break;
      default:
        console.log('Unknown item type:', itemType);
        break;
    }
  };

  const getTimeAgo = dateString => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {return `${diffInSeconds}s ago`;}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m ago`;}
    if (diffInSeconds < 86400)
      {return `${Math.floor(diffInSeconds / 3600)}h ago`;}
    if (diffInSeconds < 2592000)
      {return `${Math.floor(diffInSeconds / 86400)}d ago`;}
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const capitalizeCategory = category => {
    if (!category) {return 'General';}
    const categoryMap = {
      movies: 'Movies',
      series: 'Series',
      books: 'Books',
      games: 'Games',
      people: 'People',
      videos: 'Videos',
      places: 'Places',
    };
    return categoryMap[category?.toLowerCase()] || category;
  };

  const profileTabs = [
    { name: 'All Lists', icon: 'list' },
    { name: 'Places', icon: 'map-pin' },
    { name: 'Movies', icon: 'film' },
    { name: 'Series', icon: 'tv' },
    { name: 'Musics', icon: 'music' },
    { name: 'Books', icon: 'book' },
    { name: 'People', icon: 'users' },
    { name: 'Games', icon: 'play' },
    { name: 'Videos', icon: 'video' },
  ];

  const handleTabChange = tabName => {
    // Haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }

    setActiveProfileTab(tabName);
    setShowLikedLists(false);

    // Fetch category-specific lists if not "All Lists"
    if (tabName !== 'All Lists' && tabName !== 'Liked Lists') {
      fetchCategoryLists(tabName);
    }
  };

  const fetchCategoryLists = async category => {
    try {
      setListsLoading(true);
      const targetUserId = userId || user?.id;

      const { data: lists, error } = await supabase
        .from('lists')
        .select(
          `
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          ),
          list_items (
            id,
            title,
            image_url,
            type,
            year,
            description
          ),
          list_likes (
            user_id
          ),
          list_comments (
            id
          )
        `,
        )
        .eq('user_id', targetUserId)
        .eq('is_public', true)
        .eq('category', category.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching category lists:', error);
        return;
      }

      // Transform lists to feed format
      const transformedLists =
        lists?.map(list => {
          const timeAgo = getTimeAgo(list.created_at);
          const likesCount = list.list_likes?.length || 0;
          const commentsCount = list.list_comments?.length || 0;
          const itemsCount = list.list_items?.length || 0;
          const previewItems = list.list_items?.slice(0, 3) || [];

          return {
            id: list.id,
            type: 'user_list',
            title: list.title,
            description: list.description || `${itemsCount} items in this list`,
            category: capitalizeCategory(list.category) || 'General',
            likes: likesCount,
            comments: commentsCount,
            timestamp: timeAgo,
            previewItems: previewItems,
            itemsCount: itemsCount,
            isPublic: list.is_public,
            createdAt: list.created_at,
          };
        }) || [];

      setUserLists(transformedLists);
    } catch (error) {
      console.error('Error fetching category lists:', error);
    } finally {
      setListsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setFollowersLoading(true);
      const targetUserId = userId || user?.id;

      const { data: followersData, error } = await supabase
        .from('follows')
        .select(
          `
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          )
        `,
        )
        .eq('following_id', targetUserId);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      const transformedFollowers =
        followersData?.map(item => {
          const profile = item.profiles;
          let resolvedAvatar = null;

          // Avatar URL'sini resolve et
          if (profile.avatar_url && /^https?:\/\//i.test(profile.avatar_url)) {
            resolvedAvatar = profile.avatar_url;
          } else if (profile.avatar) {
            resolvedAvatar = getPublicUrl(profile.avatar, 'avatars');
          }

          return {
            id: profile.id,
            username: profile.username,
            fullName: profile.full_name,
            avatar: resolvedAvatar,
          };
        }) || [];

      setFollowers(transformedFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setFollowingLoading(true);
      const targetUserId = userId || user?.id;

      const { data: followingData, error } = await supabase
        .from('follows')
        .select(
          `
          following_id,
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            avatar
          )
        `,
        )
        .eq('follower_id', targetUserId);

      if (error) {
        console.error('Error fetching following:', error);
        return;
      }

      const transformedFollowing =
        followingData?.map(item => {
          const profile = item.profiles;
          let resolvedAvatar = null;

          // Avatar URL'sini resolve et
          if (profile.avatar_url && /^https?:\/\//i.test(profile.avatar_url)) {
            resolvedAvatar = profile.avatar_url;
          } else if (profile.avatar) {
            resolvedAvatar = getPublicUrl(profile.avatar, 'avatars');
          }

          return {
            id: profile.id,
            username: profile.username,
            fullName: profile.full_name,
            avatar: resolvedAvatar,
          };
        }) || [];

      setFollowing(transformedFollowing);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleButtonPress = callback => {
    // Haptic feedback for buttons
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available
    }

    if (callback) {callback();}
  };

  const handleLogout = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            // Navigation will be handled by App.js auth state change
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <ScreenLayout
      title={profileData.username || 'Profile'}
      showBackButton={!isViewingOwnProfile}
      onBackPress={onBackPress}
      rightIconName="message-circle"
      onRightPress={() => {
        if (onMessagesPress) {
          if (isViewingOwnProfile) {
            // Kendi profilimizden Messages screen'e git
            onMessagesPress();
          } else {
            // Başka kullanıcının profilinden o kullanıcıyla chat'e git
            onMessagesPress(userId);
          }
        }
      }}
      showBottomMenu={isViewingOwnProfile}
      onTabPress={onTabPress}
      activeTab={activeTab}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleButtonPress()}
            >
              {profileData.avatar ? (
                <Image
                  source={{ uri: profileData.avatar }}
                  style={styles.avatar}
                  onLoadStart={() => setAvatarLoading(true)}
                  onLoadEnd={() => setAvatarLoading(false)}
                  onError={error => {
                    console.log('Avatar load error:', error);
                    setAvatarLoading(false);
                    setProfileData(prev => ({ ...prev, avatar: null }));
                  }}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  {avatarLoading ? (
                    <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                      <Feather
                        name="loader"
                        size={24}
                        color={Colors.textSecondary}
                      />
                    </Animated.View>
                  ) : (
                    <Feather
                      name="user"
                      size={32}
                      color={Colors.textSecondary}
                    />
                  )}
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>
                {profileData.fullName || 'User'}
              </Text>
              {profileData.username && (
                <Text style={styles.username}>{profileData.username}</Text>
              )}

              {/* Stats Section - moved here for compact layout */}
              <View style={styles.compactStatsContainer}>
                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    handleButtonPress();
                    setShowLikedLists(false);
                    setActiveProfileTab('All Lists');
                  }}
                >
                  <Text style={styles.compactStatNumber}>
                    {userLists.length}
                  </Text>
                  <Text style={styles.compactStatLabel}>Lists</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    handleButtonPress();
                    if (isViewingOwnProfile) {
                      setShowLikedLists(true);
                      setActiveProfileTab('Liked Lists');
                    }
                  }}
                >
                  <Text style={styles.compactStatNumber}>
                    {likedLists.length}
                  </Text>
                  <Text style={styles.compactStatLabel}>Liked</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    handleButtonPress();
                    fetchFollowers();
                    setShowFollowersModal(true);
                  }}
                >
                  <Text style={styles.compactStatNumber}>
                    {profileData.stats.followers}
                  </Text>
                  <Text style={styles.compactStatLabel}>Followers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.compactStatItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    handleButtonPress();
                    fetchFollowing();
                    setShowFollowingModal(true);
                  }}
                >
                  <Text style={styles.compactStatNumber}>
                    {profileData.stats.following}
                  </Text>
                  <Text style={styles.compactStatLabel}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bio and Info Section */}
        <View style={styles.bioSection}>
          {profileData.bio ? (
            <Text style={styles.bioText}>{profileData.bio}</Text>
          ) : null}

          {profileData.title || profileData.company ? (
            <View style={styles.infoRow}>
              <Feather
                name="briefcase"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.infoText}>
                {profileData.title && profileData.company
                  ? `${profileData.title} at ${profileData.company}`
                  : profileData.title || profileData.company}
              </Text>
            </View>
          ) : null}

          {profileData.location ? (
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{profileData.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isViewingOwnProfile ? (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleButtonPress(onEditProfile)}
                activeOpacity={0.6}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                activeOpacity={0.6}
                onPress={() => handleButtonPress()}
              >
                <Feather name="share" size={16} color={Colors.iconPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  handleButtonPress();
                  // Logout confirmation
                  Alert.alert(
                    'Çıkış Yap',
                    'Oturumu kapatmak istediğinizden emin misiniz?',
                    [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Çıkış Yap',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await supabase.auth.signOut();
                            if (onLogout) {onLogout();}
                          } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Hata', 'Çıkış yapılamadı');
                          }
                        },
                      },
                    ],
                  );
                }}
                activeOpacity={0.6}
              >
                <Feather name="log-out" size={16} color={Colors.iconPrimary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollow}
                disabled={followLoading}
                activeOpacity={0.6}
              >
                {followLoading ? (
                  <Feather name="loader" size={16} color={Colors.white} />
                ) : (
                  <>
                    <Feather
                      name={isFollowing ? 'user-check' : 'user-plus'}
                      size={16}
                      color={Colors.white}
                    />
                    <Text style={styles.followButtonText}>
                      {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageButton}
                activeOpacity={0.6}
                onPress={() => {
                  handleButtonPress();
                  // Navigate to chat with this user
                  if (onNavigate) {
                    const contact = {
                      id: userId,
                      name: profileData.fullName || 'User',
                      username: profileData.username,
                      avatar:
                        profileData.avatar ||
                        'https://via.placeholder.com/50x50/f0f0f0/999?text=User',
                      online: true, // Varsayılan olarak online göster
                    };
                    onNavigate('Chat', { contact });
                  }
                }}
              >
                <Feather
                  name="message-circle"
                  size={16}
                  color={Colors.iconPrimary}
                />
                <Text style={styles.messageButtonText}>Mesaj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                activeOpacity={0.6}
                onPress={() => handleButtonPress()}
              >
                <Feather name="share" size={16} color={Colors.iconPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Profile Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {profileTabs.map((tab, index) => {
              const isActive = activeProfileTab === tab.name;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tabItem,
                    index === 0 && styles.firstTab,
                    index === profileTabs.length - 1 && styles.lastTab,
                  ]}
                  onPress={() => handleTabChange(tab.name)}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={tab?.icon || 'circle'}
                    size={16}
                    color={isActive ? Colors.orange : Colors.textSecondary}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[styles.tabText, isActive && styles.activeTabText]}
                  >
                    {tab.name}
                  </Text>
                  {isActive && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {(activeProfileTab === 'All Lists' ||
            (activeProfileTab !== 'Liked Lists' && !showLikedLists)) &&
          !showLikedLists ? (
            listsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading lists...</Text>
              </View>
            ) : userLists.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {userLists.map((list, index) => (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.listItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      HapticPatterns.selection();
                      // Navigate to list details
                      if (onNavigate) {
                        onNavigate('ListDetails', {
                          listId: list.id,
                        });
                      }
                    }}
                  >
                    <View style={styles.listHeader}>
                      <Text style={styles.listTitle}>{list.title}</Text>
                      <Text style={styles.listTimestamp}>{list.timestamp}</Text>
                    </View>

                    {list.description && (
                      <Text style={styles.listDescription} numberOfLines={2}>
                        {list.description}
                      </Text>
                    )}

                    {list.previewItems && list.previewItems.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.listPreview}
                        contentContainerStyle={styles.previewContainer}
                      >
                        {list.previewItems.map((item, itemIndex) => (
                          <TouchableOpacity
                            key={itemIndex}
                            style={styles.previewItem}
                            activeOpacity={0.8}
                            onPress={() => {
                              HapticPatterns.selection();
                              handleItemPress(item);
                            }}
                          >
                            <Image
                              source={{
                                uri:
                                  item.image_url ||
                                  'https://via.placeholder.com/80x120/f0f0f0/999?text=No+Image',
                              }}
                              style={styles.previewImage}
                            />
                            <Text style={styles.previewTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        {list.itemsCount > list.previewItems.length && (
                          <View style={styles.showMorePreview}>
                            <View style={styles.showMoreContent}>
                              <Feather
                                name="plus"
                                size={16}
                                color={Colors.textSecondary}
                              />
                              <Text style={styles.showMoreText}>
                                +{list.itemsCount - list.previewItems.length}
                              </Text>
                            </View>
                          </View>
                        )}
                      </ScrollView>
                    )}

                    <View style={styles.listStats}>
                      <View style={styles.statItem}>
                        <Feather
                          name="heart"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.statText}>{list.likes}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Feather
                          name="message-circle"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.statText}>{list.comments}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Feather
                          name="list"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.statText}>
                          {list.itemsCount} items
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="list" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>
                  {isViewingOwnProfile ? 'No lists yet' : 'No public lists'}
                </Text>
                <Text style={styles.emptyDescription}>
                  {isViewingOwnProfile
                    ? 'Create your first list to get started'
                    : "This user hasn't created any public lists yet"}
                </Text>
              </View>
            )
          ) : activeProfileTab === 'Liked Lists' && showLikedLists ? (
            likedListsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading liked lists...</Text>
              </View>
            ) : likedLists.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {likedLists.map((list, index) => (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.listItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      HapticPatterns.selection();
                      // Navigate to list details
                      if (onNavigate) {
                        onNavigate('ListDetails', {
                          listId: list.id,
                        });
                      }
                    }}
                  >
                    <View style={styles.listHeader}>
                      <Text style={styles.listTitle}>{list.title}</Text>
                      <Text style={styles.listTimestamp}>{list.timestamp}</Text>
                    </View>

                    {list.author && (
                      <View style={styles.authorInfo}>
                        <Feather
                          name="user"
                          size={12}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.authorText}>
                          by{' '}
                          {list.author.full_name ||
                            list.author.username ||
                            'Unknown'}
                        </Text>
                      </View>
                    )}

                    {list.description && (
                      <Text style={styles.listDescription} numberOfLines={2}>
                        {list.description}
                      </Text>
                    )}

                    {list.previewItems && list.previewItems.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.listPreview}
                        contentContainerStyle={styles.previewContainer}
                      >
                        {list.previewItems.map((item, itemIndex) => (
                          <TouchableOpacity
                            key={itemIndex}
                            style={styles.previewItem}
                            activeOpacity={0.8}
                            onPress={() => {
                              HapticPatterns.selection();
                              handleItemPress(item);
                            }}
                          >
                            <Image
                              source={{
                                uri:
                                  item.image_url ||
                                  'https://via.placeholder.com/80x120/f0f0f0/999?text=No+Image',
                              }}
                              style={styles.previewImage}
                            />
                            <Text style={styles.previewTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        {list.itemsCount > list.previewItems.length && (
                          <View style={styles.showMorePreview}>
                            <View style={styles.showMoreContent}>
                              <Feather
                                name="plus"
                                size={16}
                                color={Colors.textSecondary}
                              />
                              <Text style={styles.showMoreText}>
                                +{list.itemsCount - list.previewItems.length}
                              </Text>
                            </View>
                          </View>
                        )}
                      </ScrollView>
                    )}

                    <View style={styles.listStats}>
                      <View style={styles.statItem}>
                        <Feather name="heart" size={14} color={Colors.orange} />
                        <Text style={styles.statText}>{list.likes}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Feather
                          name="message-circle"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.statText}>{list.comments}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Feather
                          name="list"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.statText}>
                          {list.itemsCount} items
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="heart" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No liked lists yet</Text>
                <Text style={styles.emptyDescription}>
                  Lists you like will appear here
                </Text>
              </View>
            )
          ) : (
            <View style={styles.comingSoonContainer}>
              <Feather name="clock" size={48} color={Colors.textSecondary} />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonDescription}>
                {activeProfileTab} content will be available soon
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Followers Modal */}
      <Modal
        visible={showFollowersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFollowersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFollowersModal(false)}
            >
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Followers</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {followersLoading ? (
              <View style={styles.modalLoadingContainer}>
                <Text style={styles.modalLoadingText}>
                  Loading followers...
                </Text>
              </View>
            ) : followers.length > 0 ? (
              followers.map((follower, index) => (
                <TouchableOpacity
                  key={follower.id}
                  style={styles.userItem}
                  onPress={() => {
                    setShowFollowersModal(false);
                    if (onNavigate) {
                      onNavigate('UserProfile', {
                        userId: follower.id,
                        isOwnProfile: false,
                      });
                    }
                  }}
                >
                  <Image
                    source={{
                      uri:
                        follower.avatar ||
                        'https://via.placeholder.com/50x50/f0f0f0/999?text=User',
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userFullName}>
                      {follower.fullName || 'User'}
                    </Text>
                    {follower.username && (
                      <Text style={styles.userUsername}>
                        @{follower.username}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.modalEmptyContainer}>
                <Feather name="users" size={48} color={Colors.textSecondary} />
                <Text style={styles.modalEmptyTitle}>No followers yet</Text>
                <Text style={styles.modalEmptyDescription}>
                  Followers will appear here when people follow this profile
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Following Modal */}
      <Modal
        visible={showFollowingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFollowingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFollowingModal(false)}
            >
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Following</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {followingLoading ? (
              <View style={styles.modalLoadingContainer}>
                <Text style={styles.modalLoadingText}>
                  Loading following...
                </Text>
              </View>
            ) : following.length > 0 ? (
              following.map((followingUser, index) => (
                <TouchableOpacity
                  key={followingUser.id}
                  style={styles.userItem}
                  onPress={() => {
                    setShowFollowingModal(false);
                    if (onNavigate) {
                      onNavigate('UserProfile', {
                        userId: followingUser.id,
                        isOwnProfile: false,
                      });
                    }
                  }}
                >
                  <Image
                    source={{
                      uri:
                        followingUser.avatar ||
                        'https://via.placeholder.com/50x50/f0f0f0/999?text=User',
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userFullName}>
                      {followingUser.fullName || 'User'}
                    </Text>
                    {followingUser.username && (
                      <Text style={styles.userUsername}>
                        @{followingUser.username}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.modalEmptyContainer}>
                <Feather
                  name="user-plus"
                  size={48}
                  color={Colors.textSecondary}
                />
                <Text style={styles.modalEmptyTitle}>
                  Not following anyone yet
                </Text>
                <Text style={styles.modalEmptyDescription}>
                  People you follow will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenLayout>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingHorizontal: Spacing.medium,
    paddingTop: Spacing.medium,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Spacing.medium,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  compactStatsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.small,
    gap: Spacing.medium,
  },
  compactStatItem: {
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.small,
    borderRadius: 8,
    minWidth: 50,
  },
  compactStatNumber: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  bioSection: {
    paddingHorizontal: Spacing.medium,
    paddingTop: Spacing.small,
    paddingBottom: Spacing.medium,
  },
  bioText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  infoText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: Spacing.small,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.medium,
    gap: Spacing.small,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: Spacing.small + 2,
    paddingHorizontal: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  shareButton: {
    width: 44,
    height: 40,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  logoutButton: {
    width: 44,
    height: 40,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabsContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsScrollContent: {
    paddingLeft: Spacing.medium,
    paddingRight: Spacing.medium,
  },
  tabItem: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.medium,
    marginRight: Spacing.medium,
    position: 'relative',
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 60,
  },
  tabIcon: {
    marginBottom: Spacing.tiny,
  },
  firstTab: {
    marginLeft: 0,
  },
  lastTab: {
    marginRight: Spacing.medium,
  },
  tabText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.orange,
    fontFamily: FontFamily.semiBold,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.orange,
    borderRadius: 1,
  },
  contentArea: {
    flex: 1,
    padding: Spacing.medium,
    minHeight: 200,
  },
  contentPlaceholder: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.large,
  },
  followButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.small + 2,
    paddingHorizontal: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: Colors.success,
  },
  followButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    marginLeft: Spacing.tiny,
  },
  messageButton: {
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: Spacing.small + 2,
    paddingHorizontal: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: Spacing.small,
  },
  messageButtonText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginLeft: Spacing.tiny,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.large,
  },
  loadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  listItem: {
    backgroundColor: 'rgb(250, 250, 250)',
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.small,
  },
  listTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.small,
  },
  listTimestamp: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  listDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.medium,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  authorText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  listPreview: {
    marginBottom: Spacing.medium,
  },
  previewContainer: {
    paddingRight: Spacing.medium,
  },
  previewItem: {
    width: 80,
    marginRight: Spacing.small,
  },
  previewImage: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.tiny,
  },
  previewTitle: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  showMorePreview: {
    width: 80,
    marginRight: Spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreContent: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: FontSize.tiny,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  statText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
  },
  emptyTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptyDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
  },
  comingSoonTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  comingSoonDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.medium,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.large * 2,
  },
  modalLoadingText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
  },
  userInfo: {
    flex: 1,
  },
  userFullName: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.large * 3,
  },
  modalEmptyTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  modalEmptyDescription: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProfileScreen;
