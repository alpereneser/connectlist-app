import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import { supabase } from '../utils/supabase';
import { getPublicUrl } from '../services/storageService';

const EditProfileScreen = ({
  onBackPress,
  onNavigate,
  onLogout,
  user,
  onTabPress,
}) => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    bio: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    title: '',
    company: '',
    avatar: 'https://i.pravatar.cc/150?img=1',
  });

  const [settings, setSettings] = useState({
    privateAccount: false,
    showActivity: true,
    allowComments: true,
    allowTags: true,
    pushNotifications: true,
    emailNotifications: false,
    darkMode: false,
    autoSave: true,
  });

  const [activeSection, setActiveSection] = useState('settings');
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const loadProfile = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) {return;}

        const { data: row, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.log('Load profile error:', error);
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
              email: authUser.user.email || '',
              bio: '',
              phone: '',
              website: '',
              location: '',
              title: '',
              company: '',
            }));
          }
          return;
        }

        // Avatar URL'sini resolve et - ProfileScreen ile aynı logic
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

        setProfileData(prev => ({
          ...prev,
          fullName: row.full_name || row.name || 'User',
          username: row.username || '',
          bio: row.bio || '',
          email: row.email || '',
          phone: row.phone || '',
          website: row.website || '',
          location: row.location || '',
          title: row.title || '',
          company: row.company || '',
          avatar: resolvedAvatar,
        }));
      } catch (e) {
        console.log('Load profile exception:', e);
      }
    };
    loadProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {return;}

      const updatesFull = {
        full_name: profileData.fullName?.trim() || null,
        username: profileData.username?.trim() || null,
        email: profileData.email?.trim() || null,
        bio: profileData.bio?.trim() || null,
        phone: profileData.phone?.trim() || null,
        website: profileData.website?.trim() || null,
        location: profileData.location?.trim() || null,
        title: profileData.title?.trim() || null,
        company: profileData.company?.trim() || null,
        avatar_url: profileData.avatar || null,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase
        .from('profiles')
        .update(updatesFull)
        .eq('id', userId);

      if (error && error?.code === '42703') {
        const updatesMinimal = {
          full_name: updatesFull.full_name,
          username: updatesFull.username,
          email: updatesFull.email,
          updated_at: updatesFull.updated_at,
        };
        const retry = await supabase
          .from('profiles')
          .update(updatesMinimal)
          .eq('id', userId);
        if (retry.error) {throw retry.error;}
      } else if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully!');
      setActiveSection('settings');
    } catch (err) {
      console.error('Update profile error:', err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      { text: 'Camera', onPress: () => pickImage('camera') },
      { text: 'Photo Library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async source => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Camera permission is required to take photos',
          );
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Photo library permission is required to select photos',
          );
          return;
        }
      }

      // Launch image picker
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadAvatar = async imageAsset => {
    try {
      setSaving(true);

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Create file name
      const fileExt = imageAsset.uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Convert to blob for upload
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatar: avatarUrl,
      }));

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile photo');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            if (onLogout) {onLogout();}
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleMenuPress = action => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (action) {
      case 'editProfile':
        setActiveSection('profile');
        break;
      case 'about':
        if (onNavigate) {onNavigate('about');}
        break;
      case 'privacyPolicy':
        if (onNavigate) {onNavigate('PrivacyPolicy');}
        break;
      case 'termsOfService':
        if (onNavigate) {onNavigate('TermsOfService');}
        break;
      case 'signOut':
        handleSignOut();
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon!');
    }
  };

  const renderProfileSection = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            {profileData.avatar ? (
              <Image
                source={{ uri: profileData.avatar }}
                style={styles.profilePhoto}
                onError={error => {
                  console.log('Avatar load error:', error);
                  setProfileData(prev => ({ ...prev, avatar: null }));
                }}
              />
            ) : (
              <View style={[styles.profilePhoto, styles.avatarPlaceholder]}>
                <Feather name="user" size={32} color={Colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleChangePhoto}
              activeOpacity={0.7}
            >
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.fullName}
                onChangeText={text => handleInputChange('fullName', text)}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.username}
                onChangeText={text => handleInputChange('username', text)}
                placeholder="Enter username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={profileData.bio}
                onChangeText={text => handleInputChange('bio', text)}
                placeholder="Tell people about yourself..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.email}
                onChangeText={text => handleInputChange('email', text)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.phone}
                onChangeText={text => handleInputChange('phone', text)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.website}
                onChangeText={text => handleInputChange('website', text)}
                placeholder="Enter website URL"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Professional Info */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Professional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.title}
                onChangeText={text => handleInputChange('title', text)}
                placeholder="Enter job title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.company}
                onChangeText={text => handleInputChange('company', text)}
                placeholder="Enter company name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.location}
                onChangeText={text => handleInputChange('location', text)}
                placeholder="Enter location"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.6}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderSettingsSection = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Profile Preview */}
        <View style={styles.profilePreview}>
          {profileData.avatar ? (
            <Image
              source={{ uri: profileData.avatar }}
              style={styles.previewAvatar}
              onError={error => {
                console.log('Preview avatar load error:', error);
                setProfileData(prev => ({ ...prev, avatar: null }));
              }}
            />
          ) : (
            <View
              style={[styles.previewAvatar, styles.previewAvatarPlaceholder]}
            >
              <Feather name="user" size={20} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{profileData.fullName}</Text>
            <Text style={styles.previewUsername}>@{profileData.username}</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress('editProfile')}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="edit-3" size={20} color={Colors.orange} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Private Account</Text>
              <Text style={styles.settingDescription}>
                Only followers can see your lists
              </Text>
            </View>
            <Switch
              value={settings.privateAccount}
              onValueChange={value =>
                handleSettingChange('privateAccount', value)
              }
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.privateAccount ? Colors.orange : Colors.textSecondary
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Show Activity Status</Text>
              <Text style={styles.settingDescription}>
                Let others see when you're active
              </Text>
            </View>
            <Switch
              value={settings.showActivity}
              onValueChange={value =>
                handleSettingChange('showActivity', value)
              }
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.showActivity ? Colors.orange : Colors.textSecondary
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Allow Comments</Text>
              <Text style={styles.settingDescription}>
                Let people comment on your lists
              </Text>
            </View>
            <Switch
              value={settings.allowComments}
              onValueChange={value =>
                handleSettingChange('allowComments', value)
              }
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.allowComments ? Colors.orange : Colors.textSecondary
              }
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={value =>
                handleSettingChange('pushNotifications', value)
              }
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.pushNotifications
                  ? Colors.orange
                  : Colors.textSecondary
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={value =>
                handleSettingChange('emailNotifications', value)
              }
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.emailNotifications
                  ? Colors.orange
                  : Colors.textSecondary
              }
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={value => handleSettingChange('darkMode', value)}
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.darkMode ? Colors.orange : Colors.textSecondary
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto Save Lists</Text>
              <Text style={styles.settingDescription}>
                Automatically save your lists
              </Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={value => handleSettingChange('autoSave', value)}
              trackColor={{ false: Colors.border, true: Colors.orangeLight }}
              thumbColor={
                settings.autoSave ? Colors.orange : Colors.textSecondary
              }
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress('help')}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Feather
                name="help-circle"
                size={20}
                color={Colors.textSecondary}
              />
            </View>
            <Text style={styles.menuText}>Help Center</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress('privacyPolicy')}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="shield" size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress('termsOfService')}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="file-text" size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress('about')}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="info" size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.menuText}>About ConnectList</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[styles.menuItem, styles.dangerMenuItem]}
            onPress={() => handleMenuPress('signOut')}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Feather name="log-out" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.menuText, styles.dangerText]}>Sign Out</Text>
            <Feather name="chevron-right" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );

  return (
    <ScreenLayout
      title={activeSection === 'profile' ? 'Edit Profile' : 'Settings'}
      showBackButton={true}
      onBackPress={
        activeSection === 'profile'
          ? () => setActiveSection('settings')
          : onBackPress
      }
      rightIconName={activeSection === 'profile' ? 'check' : null}
      onRightPress={activeSection === 'profile' ? handleSave : null}
      showBottomMenu={true}
      onTabPress={onTabPress}
      activeTab="profile"
    >
      {activeSection === 'profile'
        ? renderProfileSection()
        : renderSettingsSection()}
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
  section: {
    padding: Spacing.medium,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: Spacing.medium,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.medium,
  },
  previewAvatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  previewUsername: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  menuSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: Spacing.medium,
    paddingVertical: Spacing.small,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginLeft: Spacing.medium,
    marginBottom: Spacing.small,
    marginTop: Spacing.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.medium,
  },
  menuText: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  dangerMenuItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: Colors.error,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.medium,
  },
  settingTitle: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.medium,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  changePhotoButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.orange,
  },
  inputSection: {
    marginBottom: Spacing.large,
  },
  inputGroup: {
    marginBottom: Spacing.medium,
  },
  inputLabel: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.medium,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.medium,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: Spacing.medium,
    alignItems: 'center',
    marginTop: Spacing.medium,
    shadowColor: Colors.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;
