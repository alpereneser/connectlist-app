import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

// Deep linking configuration
const prefix = Linking.createURL('/');

class DeepLinkingService {
  constructor() {
    this.navigationRef = null;
  }

  // Set navigation reference
  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  // Get linking configuration
  getLinkingConfiguration() {
    return {
      prefixes: [prefix, 'connectlist://', 'https://connectlist.app'],
      config: {
        screens: {
          // Auth screens
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password',
          
          // Main screens
          Home: '',
          Profile: 'profile/:userId',
          ListDetail: 'list/:listId',
          Search: 'search',
          
          // List creation
          CreateList: {
            path: 'create/:category?',
            parse: {
              category: (category) => category || 'all',
            },
          },
          
          // Messages
          Messages: 'messages',
          MessageDetail: 'messages/:conversationId',
          
          // Notifications
          Notifications: 'notifications',
          
          // Content details
          MovieDetail: 'movie/:movieId',
          BookDetail: 'book/:bookId',
          GameDetail: 'game/:gameId',
          PlaceDetail: 'place/:placeId',
          PersonDetail: 'person/:personId',
          
          // Settings
          Settings: 'settings',
          EditProfile: 'settings/profile',
          NotificationSettings: 'settings/notifications',
          PrivacySettings: 'settings/privacy',
          
          // Other
          Followers: 'followers/:userId',
          Following: 'following/:userId',
          UserLists: 'users/:userId/lists',
          CategoryLists: 'category/:category',
          
          // Special routes
          Discover: 'discover',
          Trending: 'trending',
          Popular: 'popular/:category?',
        },
      },
      
      // Handle deep link
      async getInitialURL() {
        // Check if app was opened by a deep link
        const url = await Linking.getInitialURL();
        if (url) {
          console.log('App opened with URL:', url);
        }
        return url;
      },
      
      // Subscribe to URL changes
      subscribe(listener) {
        const subscription = Linking.addEventListener('url', ({ url }) => {
          console.log('URL changed to:', url);
          listener(url);
        });
        
        return () => subscription.remove();
      },
    };
  }

  // Parse deep link URL
  parseURL(url) {
    try {
      const { hostname, path, queryParams } = Linking.parse(url);
      
      return {
        hostname,
        path,
        queryParams,
      };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  // Handle incoming URL
  async handleDeepLink(url) {
    if (!url) return;
    
    const parsed = this.parseURL(url);
    if (!parsed) return;
    
    console.log('Handling deep link:', parsed);
    
    // Handle special URLs
    if (parsed.path.includes('verify-email')) {
      this.handleEmailVerification(parsed.queryParams);
    } else if (parsed.path.includes('reset-password')) {
      this.handlePasswordReset(parsed.queryParams);
    } else if (parsed.path.includes('oauth-callback')) {
      this.handleOAuthCallback(parsed.queryParams);
    }
    
    // Navigation will be handled automatically by React Navigation
  }

  // Handle email verification
  handleEmailVerification(params) {
    if (params.token) {
      // Navigate to email verification screen with token
      if (this.navigationRef?.current) {
        this.navigationRef.current.navigate('EmailVerification', {
          token: params.token,
        });
      }
    }
  }

  // Handle password reset
  handlePasswordReset(params) {
    if (params.token) {
      // Navigate to password reset screen with token
      if (this.navigationRef?.current) {
        this.navigationRef.current.navigate('ResetPassword', {
          token: params.token,
        });
      }
    }
  }

  // Handle OAuth callback
  handleOAuthCallback(params) {
    if (params.access_token) {
      // Handle OAuth success
      console.log('OAuth callback received');
    } else if (params.error) {
      // Handle OAuth error
      Alert.alert('Authentication Error', params.error_description || 'Failed to authenticate');
    }
  }

  // Generate shareable links
  generateShareableLink(type, id, params = {}) {
    let path = '';
    
    switch (type) {
      case 'profile':
        path = `profile/${id}`;
        break;
      case 'list':
        path = `list/${id}`;
        break;
      case 'category':
        path = `category/${id}`;
        break;
      default:
        path = '';
    }
    
    // Add query parameters if any
    const queryString = Object.keys(params).length > 0
      ? '?' + Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
      : '';
    
    return `https://connectlist.app/${path}${queryString}`;
  }

  // Open external URL
  async openURL(url) {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Can't open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  }

  // Make phone call
  async makePhoneCall(phoneNumber) {
    const url = `tel:${phoneNumber}`;
    await this.openURL(url);
  }

  // Send email
  async sendEmail(email, subject = '', body = '') {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await this.openURL(url);
  }

  // Open map with coordinates
  async openMap(latitude, longitude, label = '') {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    
    const url = Platform.select({
      ios: `${scheme}${latitude},${longitude}?q=${label}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });
    
    await this.openURL(url);
  }

  // Open social media profiles
  async openSocialMedia(platform, username) {
    const urls = {
      twitter: `https://twitter.com/${username}`,
      instagram: `https://instagram.com/${username}`,
      facebook: `https://facebook.com/${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
      youtube: `https://youtube.com/@${username}`,
    };
    
    const url = urls[platform];
    if (url) {
      await this.openURL(url);
    }
  }
}

// Export singleton instance
export const deepLinkingService = new DeepLinkingService();

// Export helper functions
export const generateShareLink = (type, id, params) => 
  deepLinkingService.generateShareableLink(type, id, params);

export const openExternalURL = (url) => 
  deepLinkingService.openURL(url);

export const openMap = (lat, lng, label) => 
  deepLinkingService.openMap(lat, lng, label);

export const contactEmail = (email, subject, body) => 
  deepLinkingService.sendEmail(email, subject, body);

export const callPhone = (number) => 
  deepLinkingService.makePhoneCall(number);