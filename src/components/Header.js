import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';

const Header = ({ onMessagesPress }) => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/connectlist-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          fadeDuration={0}
          blurRadius={0}
        />
      </View>

      {/* Messages Icon */}
      <TouchableOpacity
        style={styles.messagesButton}
        onPress={onMessagesPress}
        activeOpacity={0.7}
      >
        <Feather name="message-circle" size={20} color={Colors.iconPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    height: 30.4,
    width: 114,
    tintColor: undefined, // Prevents any color filtering
  },
  messagesButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});

export default Header;
