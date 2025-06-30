import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import tokens from '../utils/designTokens';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const { data, error } = await signIn(email.trim(), password);

    if (error) {
      let errorMessage = 'An error occurred while signing in';
      
      if (error.code === 'EMAIL_NOT_VERIFIED' || error.needsVerification) {
        Alert.alert(
          'Email Verification Required',
          'Please verify your email address before signing in. Check your inbox for the verification link.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Email',
              onPress: () => navigation.navigate('EmailVerification', { email: error.email || email })
            }
          ]
        );
        return;
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please try again later';
      }
      
      Alert.alert('Login Failed', errorMessage);
    }
    // Success is handled by AuthContext and App.js routing
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/connectlist-beta-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to ConnectList
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: tokens.spacing.screenPadding,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  logo: {
    width: 130,
    height: 130,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxl,
  },
  welcomeTitle: {
    fontSize: tokens.typography.fontSize.xxl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
    marginBottom: tokens.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[600],
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: tokens.spacing.lg,
  },
  inputLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[800],
    marginBottom: tokens.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    borderRadius: tokens.borderRadius.medium,
    paddingHorizontal: tokens.spacing.inputPadding,
    paddingVertical: tokens.spacing.md,
    fontSize: tokens.typography.fontSize.md,
    backgroundColor: tokens.colors.gray[50],
    minHeight: tokens.touchTarget.comfortable,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: tokens.spacing.xl,
  },
  forgotText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.medium,
    minHeight: tokens.touchTarget.minimum,
    lineHeight: tokens.touchTarget.minimum,
  },
  loginButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.borderRadius.medium,
    paddingVertical: tokens.spacing.buttonPadding.vertical,
    paddingHorizontal: tokens.spacing.buttonPadding.horizontal,
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    minHeight: tokens.touchTarget.comfortable,
    ...tokens.shadows.medium,
  },
  loginButtonDisabled: {
    backgroundColor: tokens.colors.gray[400],
    ...tokens.shadows.small,
  },
  loginButtonText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.background.primary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: tokens.touchTarget.minimum,
  },
  registerText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  registerLink: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
});

export default LoginScreen;