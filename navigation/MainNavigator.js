import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CreateListScreen from '../screens/CreateListScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import MessageDetailScreen from '../screens/MessageDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SearchScreen from '../screens/SearchScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'ConnectList' }}
      />
      <Stack.Screen 
        name="CreateList" 
        component={CreateListScreen} 
        options={{ title: 'Create List' }}
      />
      <Stack.Screen 
        name="ListDetail" 
        component={ListDetailScreen} 
        options={{ title: 'List Detail' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{ title: 'Messages' }}
      />
      <Stack.Screen 
        name="MessageDetail" 
        component={MessageDetailScreen} 
        options={{ title: 'Message' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Search' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;