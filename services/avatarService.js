import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

class AvatarService {
  constructor() {
    this.bucketName = 'avatars';
    this.maxSizeBytes = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  }

  // Request permissions
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload photos!',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }

  // Pick image from gallery
  async pickImage() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }

  // Compress and resize image
  async processImage(imageUri) {
    try {
      // Resize to max 500x500 pixels to save storage
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipulatedImage;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  }

  // Generate unique filename
  generateFileName(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}_${timestamp}_${random}.jpg`;
  }

  // Upload avatar to Supabase Storage
  async uploadAvatar(userId, imageUri) {
    try {
      console.log('Starting avatar upload for user:', userId);

      // Process image
      const processedImage = await this.processImage(imageUri);
      if (!processedImage) {
        throw new Error('Failed to process image');
      }

      // Generate filename
      const fileName = this.generateFileName(userId);
      const filePath = `${userId}/${fileName}`;

      // Convert to blob for upload
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();

      // Check file size
      if (blob.size > this.maxSizeBytes) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      console.log('Avatar uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Update user profile with new avatar URL
  async updateUserAvatar(userId, avatarUrl) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log('Profile updated with new avatar:', data);
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete old avatar from storage
  async deleteOldAvatar(userId, oldAvatarPath) {
    try {
      // Extract path from URL if needed
      const path = oldAvatarPath.includes(this.bucketName) 
        ? oldAvatarPath.split(`${this.bucketName}/`)[1]
        : oldAvatarPath;

      if (!path || path === 'null' || path === 'undefined') {
        return;
      }

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Error deleting old avatar:', error);
        // Don't throw, just log the error
      } else {
        console.log('Old avatar deleted successfully');
      }
    } catch (error) {
      console.error('Error in deleteOldAvatar:', error);
    }
  }

  // Complete avatar update flow
  async updateAvatar(userId, currentAvatarUrl = null) {
    try {
      // Pick image
      const image = await this.pickImage();
      if (!image) return null;

      // Upload new avatar
      const uploadResult = await this.uploadAvatar(userId, image.uri);

      // Update user profile
      const updatedProfile = await this.updateUserAvatar(userId, uploadResult.url);

      // Delete old avatar if exists
      if (currentAvatarUrl && !currentAvatarUrl.includes('ui-avatars.com')) {
        await this.deleteOldAvatar(userId, currentAvatarUrl);
      }

      return {
        success: true,
        avatarUrl: uploadResult.url,
        profile: updatedProfile
      };
    } catch (error) {
      console.error('Avatar update failed:', error);
      
      let errorMessage = 'Failed to update avatar';
      if (error.message.includes('size')) {
        errorMessage = 'Image size must be less than 5MB';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Camera roll permission required';
      }

      Alert.alert('Error', errorMessage);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get avatar URL with fallback
  getAvatarUrl(avatarUrl, fullName = '', username = '') {
    if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined') {
      return avatarUrl;
    }

    // Generate fallback avatar
    const name = fullName || username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff&size=200`;
  }

  // Check if avatar exists in storage
  async checkAvatarExists(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/')[0], {
          limit: 100,
          search: filePath.split('/')[1]
        });

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking avatar existence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const avatarService = new AvatarService();

// Export functions for backward compatibility
export const updateUserAvatar = (userId, currentAvatarUrl) => 
  avatarService.updateAvatar(userId, currentAvatarUrl);

export const getAvatarUrl = (avatarUrl, fullName, username) =>
  avatarService.getAvatarUrl(avatarUrl, fullName, username);