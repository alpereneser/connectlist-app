import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Camera, ImageSquare, User } from 'phosphor-react-native';
import { avatarService } from '../services/avatarService';
import { hapticPatterns } from '../utils/haptics';
import { a11yProps } from '../utils/accessibility';
import tokens from '../utils/designTokens';

const AvatarUpload = ({ 
  userId, 
  currentAvatarUrl, 
  fullName, 
  username,
  size = 120,
  onUploadSuccess,
  onUploadError,
  showUploadButton = true,
  style = {}
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);

  const handleUpload = async () => {
    if (isUploading) return;
    
    setIsUploading(true);
    hapticPatterns.buttonPress('primary');

    try {
      const result = await avatarService.updateAvatar(userId, avatarUrl);
      
      if (result.success) {
        setAvatarUrl(result.avatarUrl);
        hapticPatterns.success();
        onUploadSuccess?.(result);
        
        Alert.alert(
          'Success',
          'Profile picture updated successfully!',
          [{ text: 'OK' }]
        );
      } else {
        hapticPatterns.error();
        onUploadError?.(result.error);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      hapticPatterns.error();
      onUploadError?.(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const displayAvatarUrl = avatarService.getAvatarUrl(avatarUrl, fullName, username);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatarContainer}>
        {/* Avatar Image */}
        <View style={[styles.avatarWrapper, { width: size, height: size }]}>
          <Image
            source={{ uri: displayAvatarUrl }}
            style={[styles.avatar, { width: size, height: size }]}
            {...a11yProps.image(`${fullName || username || 'User'}'s profile picture`)}
          />
          
          {/* Upload Overlay */}
          {showUploadButton && (
            <TouchableOpacity
              style={[styles.uploadOverlay, { width: size, height: size }]}
              onPress={handleUpload}
              disabled={isUploading}
              {...a11yProps.button(
                'Change profile picture',
                'Tap to select a new profile picture from your gallery'
              )}
              activeOpacity={0.8}
            >
              <View style={styles.uploadContent}>
                {isUploading ? (
                  <ActivityIndicator 
                    size="small" 
                    color={tokens.colors.background.primary} 
                  />
                ) : (
                  <>
                    <Camera 
                      size={size > 100 ? 24 : 20} 
                      color={tokens.colors.background.primary}
                      weight="bold"
                    />
                    <Text style={[
                      styles.uploadText,
                      { fontSize: size > 100 ? 12 : 10 }
                    ]}>
                      Change
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Button (Alternative Style) */}
        {showUploadButton && size >= 120 && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isUploading}
            {...a11yProps.button(
              'Upload new profile picture',
              'Select a new photo from your gallery'
            )}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={tokens.colors.primary} />
            ) : (
              <>
                <ImageSquare size={16} color={tokens.colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Smaller avatar component for list items
export const AvatarImage = ({ 
  avatarUrl, 
  fullName, 
  username, 
  size = 48,
  style = {}
}) => {
  const displayUrl = avatarService.getAvatarUrl(avatarUrl, fullName, username);
  
  return (
    <Image
      source={{ uri: displayUrl }}
      style={[
        styles.avatarImage,
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
      {...a11yProps.image(`${fullName || username || 'User'}'s profile picture`)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    borderRadius: 1000, // Large value for perfect circle
    overflow: 'hidden',
    backgroundColor: tokens.colors.gray[200],
    borderWidth: 3,
    borderColor: tokens.colors.background.primary,
    shadowColor: tokens.colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    borderRadius: 1000,
    backgroundColor: tokens.colors.gray[200],
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1000,
    opacity: 0,
  },
  uploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadText: {
    color: tokens.colors.background.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.medium,
    marginTop: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    minHeight: tokens.touchTarget.minimum,
    gap: tokens.spacing.sm,
  },
  uploadButtonText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  avatarImage: {
    backgroundColor: tokens.colors.gray[200],
  },
});

// CSS-like hover effect for web
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .avatar-upload-overlay:hover {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

export default AvatarUpload;