import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { ArrowLeft, ChatCircle } from 'phosphor-react-native';

const Header = ({ 
  showBackButton = false, 
  onBackPress,
  onMessagesPress,
  title,
  customStyle 
}) => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, customStyle]}>
        <View style={styles.container}>
        {/* Left Side - Back Button */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="#6b7280" weight="regular" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {/* Center - Logo or Title */}
        <View style={styles.centerSection}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <Image 
              source={require('../assets/connectlist-beta-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Right Side - Messages */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onMessagesPress}
            activeOpacity={0.7}
          >
            <ChatCircle size={24} color="#6b7280" weight="regular" />
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: getStatusBarHeight(),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 25,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    height: 80,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 171,
    height: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});

export default Header;