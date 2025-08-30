import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from './src/utils/supabase';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ErrorBoundary from './src/components/ErrorBoundary';
import notificationService from './src/services/notificationService';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SelectCategoryScreen from './src/screens/SelectCategoryScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import CreateListScreen from './src/screens/CreateListScreen';
import SearchContentScreen from './src/screens/SearchContentScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ListDetailsScreen from './src/screens/ListDetailsScreen';
import ChatScreen from './src/screens/ChatScreen';
import AboutScreen from './src/screens/AboutScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState({
    notification: 3, // Example: 3 unread notifications
    home: 0,
    search: 0,
    add: 0,
    profile: 0,
  });

  useEffect(() => {
    // Test Supabase connection only in development
    const testConnection = async () => {
      if (__DEV__) {
        try {
          console.log('Testing Supabase connection...');
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
          if (error) {
            console.error('Supabase connection error:', error);
          } else {
            console.log('Supabase connection successful');
          }
        } catch (err) {
          console.error('Connection test failed:', err);
        }
      }
    };

    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        console.log('Initializing notification service...');
        const token = await notificationService.initialize();
        if (token) {
          console.log('Notification service initialized successfully');
        } else {
          console.log(
            'Notification service initialization failed or not supported'
          );
        }
      } catch (error) {
        console.error('Error initializing notification service:', error);
      }
    };

    // Check user session
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Initialize notifications after user is authenticated
        if (session?.user) {
          await initializeNotifications();
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      // Initialize notifications when user logs in
      if (session?.user) {
        await initializeNotifications();
      } else {
        // Clean up notification service when user logs out
        notificationService.cleanup();
      }
    });

    return () => {
      subscription.unsubscribe();
      notificationService.cleanup();
    };
  }, []);

  // Tab Navigator with custom tab bar (BottomMenu)
  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar, use custom BottomMenu
      }}
    >
      <Tab.Screen name='Home'>
        {({ navigation }) => (
          <HomeScreen
            onNavigate={(screen, params) => {
              if (screen === 'Messages') navigation.navigate('Messages');
              if (screen === 'UserProfile')
                navigation.navigate('UserProfile', params);
              if (screen === 'ListDetails')
                navigation.navigate('ListDetails', params);
            }}
            user={user}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate(tabMap[tab] || 'Home');
            }}
            activeTab='home'
            badges={badges}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name='Search'>
        {({ navigation }) => (
          <SearchScreen
            onNavigate={screen => {
              if (screen === 'Messages') navigation.navigate('Messages');
            }}
            user={user}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate(tabMap[tab] || 'Search');
            }}
            activeTab='search'
          />
        )}
      </Tab.Screen>

      <Tab.Screen name='Add'>
        {({ navigation }) => (
          <SelectCategoryScreen
            onNavigate={screen => {
              if (screen === 'Messages') navigation.navigate('Messages');
            }}
            user={user}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate(tabMap[tab] || 'Add');
            }}
            activeTab='add'
            onCategorySelect={category => {
              navigation.navigate('SearchContent', { category });
            }}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name='Notifications'>
        {({ navigation }) => (
          <NotificationScreen
            onNavigate={screen => {
              if (screen === 'Messages') navigation.navigate('Messages');
            }}
            user={user}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate(tabMap[tab] || 'Notifications');
            }}
            activeTab='notification'
          />
        )}
      </Tab.Screen>

      <Tab.Screen name='Profile'>
        {({ navigation }) => (
          <ProfileScreen
            onNavigate={(screen, params) => {
              if (screen === 'Messages') navigation.navigate('Messages');
              if (screen === 'ListDetails')
                navigation.navigate('ListDetails', params);
              if (screen === 'UserProfile')
                navigation.navigate('UserProfile', params);
            }}
            user={user}
            isOwnProfile={true}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate(tabMap[tab] || 'Profile');
            }}
            activeTab='profile'
            onEditProfile={() => navigation.navigate('EditProfile')}
            onMessagesPress={() => navigation.navigate('Messages')}
            onBackPress={() => navigation.goBack()}
            onLogout={() => {
              // User will be automatically redirected to auth stack when session ends
              setUser(null);
            }}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );

  // Auth Stack
  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Login'>
        {({ navigation }) => (
          <LoginScreen
            onNavigate={screen => {
              if (screen === 'register') navigation.navigate('Register');
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name='Register'>
        {({ navigation }) => (
          <RegisterScreen
            onNavigate={screen => {
              if (screen === 'login') navigation.navigate('Login');
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );

  // Main App Stack
  const AppStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='MainTabs' component={MainTabs} />

      <Stack.Screen name='Messages'>
        {({ navigation }) => (
          <MessagesScreen
            onBackPress={() => navigation.goBack()}
            onChatPress={contact => {
              navigation.navigate('Chat', { contact });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='Chat'>
        {({ navigation, route }) => (
          <ChatScreen
            onBackPress={() => navigation.goBack()}
            contact={route.params?.contact}
            userId={route.params?.userId}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='SearchContent'>
        {({ navigation, route }) => (
          <SearchContentScreen
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate('MainTabs', {
                screen: tabMap[tab] || 'Home',
              });
            }}
            category={route.params?.category}
            onItemsSelected={items => {
              navigation.navigate('CreateList', {
                category: route.params?.category,
                selectedItems: items,
              });
            }}
            onNavigate={screen => {
              if (screen === 'home') {
                navigation.navigate('MainTabs', { screen: 'Home' });
              } else {
                navigation.goBack();
              }
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='CreateList'>
        {({ navigation, route }) => (
          <CreateListScreen
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate('MainTabs', {
                screen: tabMap[tab] || 'Home',
              });
            }}
            category={route.params?.category}
            selectedItems={route.params?.selectedItems}
            onListCreated={() =>
              navigation.navigate('MainTabs', { screen: 'Home' })
            }
            onNavigate={screen => {
              if (screen === 'home') {
                navigation.navigate('MainTabs', { screen: 'Home' });
              } else {
                navigation.goBack();
              }
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='EditProfile'>
        {({ navigation }) => (
          <EditProfileScreen
            onBackPress={() => navigation.goBack()}
            user={user}
            onNavigate={screen => {
              if (screen === 'about') {
                navigation.navigate('About');
              } else if (screen === 'PrivacyPolicy') {
                navigation.navigate('PrivacyPolicy');
              } else if (screen === 'TermsOfService') {
                navigation.navigate('TermsOfService');
              }
            }}
            onLogout={() => {
              setUser(null);
            }}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate('MainTabs', {
                screen: tabMap[tab] || 'Profile',
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='About'>
        {({ navigation }) => (
          <AboutScreen onBackPress={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen name='PrivacyPolicy'>
        {({ navigation }) => (
          <PrivacyPolicyScreen
            onBackPress={() => navigation.goBack()}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate('MainTabs', {
                screen: tabMap[tab] || 'Profile',
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='TermsOfService'>
        {({ navigation }) => (
          <TermsOfServiceScreen
            onBackPress={() => navigation.goBack()}
            onTabPress={tab => {
              const tabMap = {
                home: 'Home',
                search: 'Search',
                add: 'Add',
                notification: 'Notifications',
                profile: 'Profile',
              };
              navigation.navigate('MainTabs', {
                screen: tabMap[tab] || 'Profile',
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='UserProfile'>
        {({ navigation, route }) => (
          <ProfileScreen
            onBackPress={() => navigation.goBack()}
            onMessagesPress={() => {
              // Create contact object for the user we're viewing
              const contact = {
                id: route.params?.userId,
                username: route.params?.username || 'User',
                avatar:
                  route.params?.avatar ||
                  'https://api.dicebear.com/7.x/avataaars/svg',
              };
              navigation.navigate('Chat', { contact });
            }}
            user={user}
            userId={route.params?.userId}
            isOwnProfile={route.params?.isOwnProfile || false}
            onEditProfile={() => navigation.navigate('EditProfile')}
            onNavigate={(screen, params) => {
              if (screen === 'ListDetails')
                navigation.navigate('ListDetails', params);
              if (screen === 'UserProfile')
                navigation.navigate('UserProfile', params);
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name='ListDetails'>
        {({ navigation, route }) => (
          <ListDetailsScreen
            onBackPress={() => navigation.goBack()}
            user={user}
            listId={route.params?.listId}
            showComments={route.params?.showComments}
            onNavigate={(screen, params) => {
              if (screen === 'UserProfile')
                navigation.navigate('UserProfile', params);
              if (screen === 'Messages')
                navigation.navigate('Messages', params);
              if (screen === 'EditList')
                navigation.navigate('CreateList', {
                  ...params,
                  isEditing: true,
                });
              if (screen === 'AddListItems')
                navigation.navigate('SearchContent', {
                  ...params,
                  isAddingItems: true,
                });
            }}
            onTabPress={tab => {
              // Navigate back to MainTabs and then to the specific tab
              if (tab === 'home') {
                navigation.navigate('MainTabs', { screen: 'Home' });
              } else if (tab === 'search') {
                navigation.navigate('MainTabs', { screen: 'Search' });
              } else if (tab === 'add') {
                navigation.navigate('MainTabs', { screen: 'Add' });
              } else if (tab === 'notification') {
                navigation.navigate('MainTabs', { screen: 'Notifications' });
              } else if (tab === 'profile') {
                navigation.navigate('MainTabs', { screen: 'Profile' });
              } else {
                console.warn('Unknown tab:', tab);
              }
            }}
            activeTab='home'
            badges={badges}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </ErrorBoundary>
  );
}
