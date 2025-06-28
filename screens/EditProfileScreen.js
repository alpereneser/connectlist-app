import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Camera,
  Lock,
  Bell,
  Eye,
  EyeSlash,
  Users,
  Heart,
  ChatCircle,
  Trash,
  SignOut,
} from 'phosphor-react-native';
import Header from '../components/Header';
import BottomMenu from '../components/BottomMenu';
import { useAuth } from '../contexts/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    email: '',
  });
  const [settings, setSettings] = useState({
    isPrivate: false,
    allowNotifications: true,
    allowComments: true,
    allowCollaboration: false,
    showLikedLists: true,
    allowMessagesFromStrangers: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || '',
        email: user?.email || '',
      });
    }
  }, [userProfile, user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
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
    if (!formData.full_name.trim() || !formData.username.trim()) {
      Alert.alert('Error', 'Full name and username are required');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Update profile in Supabase
      console.log('Saving profile:', formData);
      console.log('Saving settings:', settings);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Change Avatar', 'Avatar change will be implemented');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Account deletion will be implemented');
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      navigation.navigate('Home');
    } else if (tabId === 'notifications') {
      navigation.navigate('Notifications');
    } else if (tabId === 'profile') {
      navigation.navigate('Profile');
    } else if (tabId === 'create') {
      console.log('Create pressed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        title="Edit Profile"
        onMessagesPress={() => navigation.navigate('Messages')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: formData.avatar_url || 'https://via.placeholder.com/120x120' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handleChangeAvatar}>
              <Camera size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleChangeAvatar}>
            <Text style={styles.changeAvatarText}>Change Profile Picture</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.full_name}
              onChangeText={(value) => handleInputChange('full_name', value)}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Lock size={20} color="#666" />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Private Account</Text>
                <Text style={styles.settingDescription}>Only followers can see your lists</Text>
              </View>
            </View>
            <Switch
              value={settings.isPrivate}
              onValueChange={(value) => handleSettingChange('isPrivate', value)}
              trackColor={{ false: '#e5e5e5', true: '#f97316' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Eye size={20} color="#666" />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Show Liked Lists</Text>
                <Text style={styles.settingDescription}>Let others see lists you've liked</Text>
              </View>
            </View>
            <Switch
              value={settings.showLikedLists}
              onValueChange={(value) => handleSettingChange('showLikedLists', value)}
              trackColor={{ false: '#e5e5e5', true: '#f97316' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ChatCircle size={20} color="#666" />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Messages from Strangers</Text>
                <Text style={styles.settingDescription}>Allow non-followers to message you</Text>
              </View>
            </View>
            <Switch
              value={settings.allowMessagesFromStrangers}
              onValueChange={(value) => handleSettingChange('allowMessagesFromStrangers', value)}
              trackColor={{ false: '#e5e5e5', true: '#f97316' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Content Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Heart size={20} color="#666" />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Allow Comments</Text>
                <Text style={styles.settingDescription}>Let others comment on your lists</Text>
              </View>
            </View>
            <Switch
              value={settings.allowComments}
              onValueChange={(value) => handleSettingChange('allowComments', value)}
              trackColor={{ false: '#e5e5e5', true: '#f97316' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Users size={20} color="#666" />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Allow Collaboration</Text>
                <Text style={styles.settingDescription}>Let others add items to your lists</Text>
              </View>
            </View>
            <Switch
              value={settings.allowCollaboration}
              onValueChange={(value) => handleSettingChange('allowCollaboration', value)}
              trackColor={{ false: '#e5e5e5', true: '#f97316' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#666" />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications about activity</Text>
              </View>
            </View>
            <Switch
              value={settings.allowNotifications}
              onValueChange={(value) => handleSettingChange('allowNotifications', value)}
              trackColor={{ false: '#e5e5e5', true: '#f97316' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { paddingBottom: 100 }]}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <SignOut size={20} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Trash size={20} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#f97316',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f97316',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changeAvatarText: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '600',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTexts: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveSection: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  dangerSection: {
    padding: 20,
    paddingBottom: 40,
  },
  dangerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fef2f2',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});

export default EditProfileScreen;