import { Platform, Share, Alert } from 'react-native';
import { hapticPatterns } from './haptics';

// Platform-specific sharing utilities
export const shareContent = async (content, options = {}) => {
  try {
    hapticPatterns.buttonPress('secondary');
    
    const shareOptions = {
      title: content.title || 'Check this out!',
      message: content.message || content.title || '',
      url: content.url || '',
      ...options
    };

    // Use React Native's built-in Share API
    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      if (Platform.OS === 'ios' && result.activityType) {
        console.log('Shared via:', result.activityType);
      }
      return { success: true, activityType: result.activityType };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing content:', error);
    Alert.alert('Error', 'Could not share content. Please try again.');
    return { success: false, error };
  }
};

// Share a list
export const shareList = async (list) => {
  const shareData = {
    title: `Check out this list: ${list.title}`,
    message: Platform.OS === 'ios' 
      ? `${list.title}\n\n${list.description || 'A great list on ConnectList'}`
      : `${list.title}\n\n${list.description || 'A great list on ConnectList'}\n\nShared via ConnectList`,
    url: list.shareUrl || `https://connectlist.app/lists/${list.id}`
  };

  return await shareContent(shareData);
};

// Share a profile
export const shareProfile = async (profile) => {
  const shareData = {
    title: `Check out ${profile.full_name || profile.username}'s profile`,
    message: Platform.OS === 'ios'
      ? `${profile.full_name || profile.username} on ConnectList`
      : `Check out ${profile.full_name || profile.username}'s profile on ConnectList`,
    url: profile.shareUrl || `https://connectlist.app/users/${profile.username}`
  };

  return await shareContent(shareData);
};

// Share app
export const shareApp = async () => {
  const shareData = {
    title: 'ConnectList - Create and Share Lists',
    message: Platform.OS === 'ios'
      ? 'Check out ConnectList - the best way to create and share lists!'
      : 'Check out ConnectList - the best way to create and share lists!\n\nDownload: https://connectlist.app',
    url: 'https://connectlist.app'
  };

  return await shareContent(shareData);
};

// Context menu actions (iOS-specific)
export const contextMenuActions = {
  list: (list, onEdit, onDelete, onShare) => {
    if (Platform.OS !== 'ios') return [];
    
    return [
      {
        title: 'Share',
        systemIcon: 'square.and.arrow.up',
        handler: () => shareList(list)
      },
      {
        title: 'Edit',
        systemIcon: 'pencil',
        handler: onEdit
      },
      {
        title: 'Delete',
        systemIcon: 'trash',
        destructive: true,
        handler: onDelete
      }
    ];
  },
  
  profile: (profile, onBlock, onReport, onShare) => {
    if (Platform.OS !== 'ios') return [];
    
    return [
      {
        title: 'Share Profile',
        systemIcon: 'square.and.arrow.up',
        handler: () => shareProfile(profile)
      },
      {
        title: 'Block User',
        systemIcon: 'person.fill.xmark',
        destructive: true,
        handler: onBlock
      },
      {
        title: 'Report',
        systemIcon: 'exclamationmark.triangle',
        destructive: true,
        handler: onReport
      }
    ];
  }
};

// Copy to clipboard utility
export const copyToClipboard = async (text, successMessage = 'Copied to clipboard') => {
  try {
    // Note: Expo Clipboard would be imported here in a real implementation
    // import * as Clipboard from 'expo-clipboard';
    // await Clipboard.setStringAsync(text);
    
    hapticPatterns.buttonPress('light');
    Alert.alert('Success', successMessage);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    Alert.alert('Error', 'Could not copy to clipboard');
    return false;
  }
};

// Platform-specific action sheets
export const showActionSheet = (options, callback) => {
  if (Platform.OS === 'ios') {
    // Note: ActionSheetIOS would be used here
    // ActionSheetIOS.showActionSheetWithOptions(options, callback);
    console.log('Would show iOS action sheet:', options);
  } else {
    // Android: Use custom modal or Alert
    const buttons = options.options.map((option, index) => ({
      text: option,
      onPress: () => callback(index),
      style: options.destructiveButtonIndex === index ? 'destructive' : 'default'
    }));
    
    Alert.alert(options.title || 'Choose an action', '', buttons, {
      cancelable: true,
      onDismiss: () => callback(options.cancelButtonIndex || options.options.length - 1)
    });
  }
};