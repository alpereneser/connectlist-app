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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { PrivacyPolicyContent } from '../legal/PrivacyPolicy';
import { TermsOfServiceContent } from '../legal/TermsOfService';
import tokens from '../utils/designTokens';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const { signUp, isLoading } = useAuth();

  const handleRegister = async () => {
    if (!username || !fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy to continue');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    const { data, error } = await signUp(email.trim(), password, {
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
    });

    if (error) {
      let errorMessage = 'An error occurred during registration';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('Password should be')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } else {
      Alert.alert(
        'Registration Successful!', 
        'Please check your email and click the verification link to complete your registration.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EmailVerification', { email: email.trim() })
          }
        ]
      );
    }
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
          <Text style={styles.welcomeTitle}>Create Account</Text>
          <Text style={styles.welcomeSubtitle}>
            Join ConnectList
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Enter your password (min 6 characters)"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Terms and Privacy Agreement */}
          <View style={styles.agreementContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.agreementTextContainer}>
                <Text style={styles.agreementText}>I agree to the </Text>
                <TouchableOpacity onPress={() => setShowTermsOfService(true)}>
                  <Text style={styles.linkText}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={styles.agreementText}> and </Text>
                <TouchableOpacity onPress={() => setShowPrivacyPolicy(true)}>
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPrivacyPolicy(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <PrivacyPolicyContent />
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsOfService}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTermsOfService(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <TermsOfServiceContent />
        </View>
      </Modal>
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
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  logo: {
    width: 110,
    height: 110,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
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
    marginBottom: tokens.spacing.md,
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
  registerButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.borderRadius.medium,
    paddingVertical: tokens.spacing.buttonPadding.vertical,
    paddingHorizontal: tokens.spacing.buttonPadding.horizontal,
    alignItems: 'center',
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
    minHeight: tokens.touchTarget.comfortable,
    ...tokens.shadows.medium,
  },
  registerButtonDisabled: {
    backgroundColor: tokens.colors.gray[400],
    ...tokens.shadows.small,
  },
  registerButtonText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.background.primary,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: tokens.touchTarget.minimum,
  },
  loginText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[600],
  },
  loginLink: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
  
  // Agreement styles
  agreementContainer: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: tokens.touchTarget.minimum,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: tokens.colors.gray[400],
    borderRadius: tokens.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  checkmark: {
    color: tokens.colors.background.primary,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  agreementTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  agreementText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[600],
    lineHeight: tokens.typography.fontSize.sm * tokens.typography.lineHeight.normal,
  },
  linkText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.gray[300],
    paddingTop: 50, // Account for status bar
    minHeight: tokens.touchTarget.large,
  },
  modalCloseButton: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    minHeight: tokens.touchTarget.minimum,
  },
  modalCloseText: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});

export default RegisterScreen;