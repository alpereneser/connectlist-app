import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import { View, Text, StyleSheet } from 'react-native';

// Import services
import { notificationService } from './services/notificationService';
import { deepLinkingService } from './services/deepLinkingService';
import { realtimeService } from './services/realtimeService';
import { setupGlobalErrorHandler, handleError } from './services/errorService';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigationRef = useRef();

  // Initialize services when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initializeServices();
    }

    return () => {
      // Cleanup services
      notificationService.cleanup();
      realtimeService.unsubscribeAll();
    };
  }, [isAuthenticated, user]);

  // Initialize all services
  const initializeServices = async () => {
    try {
      // Initialize notifications
      await notificationService.initialize(user.id);
      
      // Set navigation reference for deep linking
      deepLinkingService.setNavigationRef(navigationRef);
      
      // Subscribe to user-specific notifications
      realtimeService.subscribeToNotifications(user.id, {
        onNewNotification: (payload) => {
          console.log('New notification received:', payload);
        },
      });

      // Subscribe to user profile updates
      realtimeService.subscribeToUserProfile(user.id, {
        onProfileUpdate: (payload) => {
          console.log('Profile updated:', payload);
        },
        onNewFollower: (payload) => {
          console.log('New follower:', payload);
        },
      });

    } catch (error) {
      await handleError(error, {
        context: 'service_initialization',
        userId: user.id,
        action: 'initializeServices'
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={deepLinkingService.getLinkingConfiguration()}
    >
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  // Setup global error handler on app start
  React.useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
